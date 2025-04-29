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
  originalUrl: string | null;
  fixedUrl: string;
  success: boolean;
  error?: string;
}

// Endpoint to ensure double slashes in sound URLs (required format)
export async function GET(request: Request) {
  try {
    console.log('[API] Ensure double slash endpoint called');
    
    // Get all sounds
    const { data: sounds, error: fetchError } = await supabase
      .from('sounds')
      .select('id, name, url');
      
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
        message: 'No sounds found in database',
        count: 0
      });
    }
    
    console.log(`[API] Found ${sounds.length} sounds to check`);
    
    // Filter to only get those that need fixing
    const soundsToFix = sounds.filter((sound: SoundRecord) => {
      // Skip sounds with no URL
      if (!sound.url) return false;
      
      // We want to fix URLs that have single slash but not double slash
      // These are URLs that include '/audio/' but do not include '/audio//'
      return sound.url.includes('/audio/') && !sound.url.includes('/audio//');
    });
    
    console.log(`[API] Found ${soundsToFix.length} sounds that need URL formatting`);
    
    // Fix each URL to ensure proper double slash format
    const fixResults: FixResult[] = [];
    
    for (const sound of soundsToFix) {
      if (!sound.url) continue;
      
      const originalUrl = sound.url;
      let fixedUrl = sound.url;
      
      // Convert single slash to double slash
      if (fixedUrl.includes('/audio/') && !fixedUrl.includes('/audio//')) {
        fixedUrl = fixedUrl.replace('/audio/', '/audio//');
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
      message: `Updated URLs for ${fixResults.filter(r => r.success).length} sounds`,
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