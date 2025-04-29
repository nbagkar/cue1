import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface SoundRecord {
  id: string;
  name: string;
  url: string | null;
}

// Endpoint to show sample URLs from the database
export async function GET(request: Request) {
  try {
    console.log('[API] Show URLs endpoint called');
    
    // Get all sounds with URLs
    const { data: sounds, error: fetchError } = await supabase
      .from('sounds')
      .select('id, name, url')
      .not('url', 'is', null)
      .limit(20);
      
    if (fetchError) {
      console.error('[API] Error fetching sounds:', fetchError);
      return NextResponse.json({
        success: false,
        message: `Error fetching sounds: ${fetchError.message}`
      }, { status: 500 });
    }
    
    if (!sounds || sounds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No sounds with URLs found in database',
        count: 0
      });
    }
    
    // Count patterns
    let withDoubleSlash = 0;
    let withSingleSlash = 0;
    let withAudioPath = 0;
    let other = 0;
    
    // Process URLs to categorize them
    const urlSamples = sounds.map((sound: SoundRecord) => {
      const url = sound.url || '';
      let pattern = 'unknown';
      
      if (url.includes('/audio//')) {
        withDoubleSlash++;
        pattern = 'double_slash';
      } else if (url.includes('/audio/') && !url.includes('/audio//')) {
        withSingleSlash++;
        pattern = 'single_slash';
      } else if (url.includes('/audio')) {
        withAudioPath++;
        pattern = 'audio_path';
      } else {
        other++;
        pattern = 'other';
      }
      
      return {
        id: sound.id,
        name: sound.name,
        url,
        pattern
      };
    });
    
    // Now run a broader query to get statistics
    const { count: totalCount } = await supabase
      .from('sounds')
      .select('*', { count: 'exact', head: true });
      
    const { count: withUrlCount } = await supabase
      .from('sounds')
      .select('*', { count: 'exact', head: true })
      .not('url', 'is', null);
    
    return NextResponse.json({
      success: true,
      totalSounds: totalCount,
      soundsWithUrls: withUrlCount,
      samples: urlSamples,
      stats: {
        withDoubleSlash,
        withSingleSlash,
        withAudioPath,
        other
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[API] Error analyzing URLs:', error);
    return NextResponse.json({
      success: false,
      message: `Error: ${errorMessage}`
    }, { status: 500 });
  }
} 