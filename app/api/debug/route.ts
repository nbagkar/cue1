import { NextResponse } from 'next/server';
import { insertTestPianoSound } from '@/lib/supabase';

// A debug endpoint to insert test data
export async function GET(request: Request) {
  try {
    console.log('[API] Debug endpoint called to insert test piano sound');
    
    const result = await insertTestPianoSound();
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: result.message
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: result.message
      }, { status: 500 });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[API] Error in debug endpoint:', error);
    return NextResponse.json({ 
      success: false, 
      error: `Error processing request: ${errorMessage}`
    }, { status: 500 });
  }
} 