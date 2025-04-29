import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface SoundRecord {
  id: string;
  name: string;
  url: string | null;
}

interface FixResult {
  id: string;
  name: string;
  originalUrl: string;
  fixedUrl: string;
  success: boolean;
  error?: string;
}

// Endpoint to fix double slashes in sound URLs
export async function GET(request: Request) {
  try {
    console.log('[API] Fix URLs endpoint called');
    
    // First, get all sounds that have URLs with double slashes
    const { data: sounds, error: fetchError } = await supabase
      .from('sounds')
      .select('id, name, url')
      .ilike('url', '%//%');
      
    if (fetchError) {
      console.error('[API] Error fetching sounds with double slashes:', fetchError);
      return NextResponse.json({
        success: false,
        message: `Error fetching sounds: ${fetchError.message}`
      }, { status: 500 });
    }
    
    if (!sounds || sounds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No sounds with double slashes found',
        count: 0
      });
    }
    
    console.log(`[API] Found ${sounds.length} sounds with potential double slashes`);
    
    // Filter to only get those with actual double slashes in the path
    const soundsToFix = sounds.filter((sound: SoundRecord) => 
      sound.url && 
      (sound.url.includes('/audio//') || 
       sound.url.includes('/public//') || 
       sound.url.includes('/object//'))
    );
    
    console.log(`[API] Found ${soundsToFix.length} sounds that need URL fixing`);
    
    // Fix each URL by replacing double slashes
    const fixResults: FixResult[] = [];
    
    for (const sound of soundsToFix) {
      if (!sound.url) continue;
      
      // Fix the URL by replacing double slashes in the path
      // Be careful not to replace the double slash in http://
      const originalUrl = sound.url;
      let fixedUrl = sound.url;
      
      // Replace double slashes after the domain
      if (fixedUrl.includes('/audio//')) {
        fixedUrl = fixedUrl.replace('/audio//', '/audio/');
      }
      if (fixedUrl.includes('/public//')) {
        fixedUrl = fixedUrl.replace('/public//', '/public/');
      }
      if (fixedUrl.includes('/object//')) {
        fixedUrl = fixedUrl.replace('/object//', '/object/');
      }
      
      // Only update if something changed
      if (fixedUrl !== originalUrl) {
        const { error: updateError } = await supabase
          .from('sounds')
          .update({ url: fixedUrl })
          .eq('id', sound.id);
          
        if (updateError) {
          console.error(`[API] Error updating sound ${sound.id}:`, updateError);
          fixResults.push({
            id: sound.id,
            name: sound.name,
            originalUrl,
            fixedUrl,
            success: false,
            error: updateError.message
          });
        } else {
          console.log(`[API] Fixed URL for sound ${sound.id}: ${sound.name}`);
          fixResults.push({
            id: sound.id,
            name: sound.name,
            originalUrl,
            fixedUrl,
            success: true
          });
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Fixed URLs for ${fixResults.filter(r => r.success).length} sounds`,
      totalFound: soundsToFix.length,
      totalFixed: fixResults.filter(r => r.success).length,
      results: fixResults
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[API] Error fixing URLs:', error);
    return NextResponse.json({
      success: false,
      message: `Error: ${errorMessage}`
    }, { status: 500 });
  }
} 