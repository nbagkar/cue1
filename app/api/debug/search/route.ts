import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Debug endpoint to test search directly
export async function GET(request: Request) {
  try {
    console.log('[API] Debug search endpoint called');
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || 'piano';
    
    console.log(`[API] Debug searching for: "${query}"`);
    
    // First try a simple search with tags column
    const { data: tagResults, error: tagError } = await supabase
      .from('sounds')
      .select('*')
      .ilike('tags', `%${query}%`);
      
    if (tagError) {
      console.error('[DEBUG] Error searching by tags:', tagError);
      return NextResponse.json({
        success: false,
        message: `Error searching by tags: ${tagError.message}`
      }, { status: 500 });
    }
    
    // Also try searching by name
    const { data: nameResults, error: nameError } = await supabase
      .from('sounds')
      .select('*')
      .ilike('name', `%${query}%`);
      
    if (nameError) {
      console.error('[DEBUG] Error searching by name:', nameError);
    }
    
    // Try getting all sounds
    const { data: allSounds, error: allError } = await supabase
      .from('sounds')
      .select('*')
      .limit(5);
      
    if (allError) {
      console.error('[DEBUG] Error getting all sounds:', allError);
    }
    
    return NextResponse.json({
      success: true,
      query,
      tagResults: tagResults || [],
      tagCount: tagResults?.length || 0,
      nameResults: nameResults || [],
      nameCount: nameResults?.length || 0,
      allSounds: allSounds || [],
      allCount: allSounds?.length || 0
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[API] Error in debug search:', error);
    return NextResponse.json({
      success: false,
      message: `Error: ${errorMessage}`
    }, { status: 500 });
  }
} 