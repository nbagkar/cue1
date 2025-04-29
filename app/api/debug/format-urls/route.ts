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

// Base URL for Supabase storage
const SUPABASE_STORAGE_URL = "https://rnmmonnvfrqhfcunpyvt.supabase.co/storage/v1/object/public/audio//";

// Endpoint to format all URLs with the proper Supabase format
export async function GET(request: Request) {
  try {
    console.log('[API] Format URLs endpoint called');
    
    // Get all sounds with URLs that need formatting
    const { data: sounds, error: fetchError } = await supabase
      .from('sounds')
      .select('id, name, url')
      .not('url', 'is', null);
      
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
    
    // Filter to only get those that need fixing - URLs that don't start with the storage URL
    const soundsToFix = sounds.filter((sound: SoundRecord) => {
      if (!sound.url) return false;
      
      // URL needs fixing if it's just the filename or doesn't have our storage URL pattern
      return !sound.url.startsWith('http') && 
             !sound.url.includes('supabase.co/storage') &&
             !sound.url.includes('/audio//');
    });
    
    console.log(`[API] Found ${soundsToFix.length} sounds that need URL formatting`);
    
    // Fix each URL to ensure proper format
    const fixResults: FixResult[] = [];
    
    for (const sound of soundsToFix) {
      if (!sound.url) continue;
      
      const originalUrl = sound.url;
      
      // Format: extract just the filename if there's a path, then add to the base URL
      let filename = originalUrl;
      // Remove any path if present, keeping just the filename
      if (filename.includes('/')) {
        filename = filename.split('/').pop() || filename;
      }
      
      // Create the properly formatted URL 
      const fixedUrl = `${SUPABASE_STORAGE_URL}${filename}`;
      
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
      results: fixResults.slice(0, 20) // Only return first 20 to avoid huge response
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