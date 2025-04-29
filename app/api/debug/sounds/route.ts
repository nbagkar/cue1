import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Debug endpoint to check the sounds table structure and contents
export async function GET(request: Request) {
  try {
    console.log('[API] Debug endpoint called to check sounds table');
    
    // Try to get some records to check the table structure
    const { data: soundRecords, error: recordsError } = await supabase
      .from('sounds')
      .select('*')
      .limit(5);
      
    if (recordsError) {
      console.error('[DEBUG] Error fetching sound records:', recordsError);
      return NextResponse.json({
        success: false,
        message: `Database error: ${recordsError.message} (Code: ${recordsError.code})`
      }, { status: 500 });
    }
    
    if (!soundRecords || soundRecords.length === 0) {
      // If no records, check if the table exists by getting column info
      const { count, error: countError } = await supabase
        .from('sounds')
        .select('*', { count: 'exact', head: true });
        
      if (countError) {
        console.error('[DEBUG] Error counting sounds:', countError);
        return NextResponse.json({
          success: false,
          message: `Database error on count: ${countError.message}`
        }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        message: 'Sounds table exists but has no records',
        count: count || 0
      });
    }
    
    // Extract schema from first record
    const schema = Object.keys(soundRecords[0]).map(key => {
      return { 
        column: key, 
        sample: soundRecords[0][key],
        type: typeof soundRecords[0][key]
      };
    });
    
    return NextResponse.json({
      success: true,
      message: 'Fetched sound records',
      count: soundRecords.length,
      records: soundRecords,
      schema
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[API] Error checking sounds table:', error);
    return NextResponse.json({
      success: false,
      message: `Error: ${errorMessage}`
    }, { status: 500 });
  }
} 