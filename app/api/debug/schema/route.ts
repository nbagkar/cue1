import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Debug endpoint to check table schema directly from Postgres information_schema
export async function GET(request: Request) {
  try {
    console.log('[API] Debug schema endpoint called');
    
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table') || 'sounds';
    
    // Use raw SQL to query the information_schema
    const { data, error } = await supabase.rpc('get_table_columns', { table_name: table });
    
    if (error) {
      console.error(`[DEBUG] Error fetching schema for ${table}:`, error);
      
      // Fallback to a simpler approach
      const { data: columns, error: columnsError } = await supabase
        .from(table)
        .select('*')
        .limit(1);
        
      if (columnsError) {
        console.error(`[DEBUG] Error fetching ${table} record:`, columnsError);
        return NextResponse.json({
          success: false,
          message: `Error: ${columnsError.message}`
        }, { status: 500 });
      }
      
      // If no data exists, we can't infer schema
      if (!columns || columns.length === 0) {
        return NextResponse.json({
          success: true,
          message: `Table ${table} exists but has no records`,
          columns: columns ? Object.keys(columns[0]) : []
        });
      }
      
      // Infer schema from first record
      const schema = Object.keys(columns[0]).map(key => ({
        column: key,
        type: typeof columns[0][key],
        sample: columns[0][key]
      }));
      
      return NextResponse.json({
        success: true,
        message: `Inferred schema from first record in ${table}`,
        schema
      });
    }
    
    return NextResponse.json({
      success: true,
      table,
      columns: data
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[API] Error in schema endpoint:', error);
    return NextResponse.json({
      success: false,
      message: `Error: ${errorMessage}`
    }, { status: 500 });
  }
} 