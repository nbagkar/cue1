import { NextResponse } from 'next/server';
import { getSemanticSearchQuery } from '@/lib/openai';
import { fetchSoundsWithSemanticSearch, supabase } from '@/lib/supabase';

// Store logs in an array
const logs: string[] = [];

export async function POST(request: Request) {
  try {
    logs.length = 0; // Clear previous logs
    logs.push('🔍 ====== START SEMANTIC SEARCH API ====== 🔍');
    
    // Get user from session
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id || null;
    
    logs.push('🔍 User session:', JSON.stringify({
      userId,
      hasSession: !!session
    }));
    
    // Get query from request body
    const body = await request.json();
    const { query, tags = [] } = body;
    
    logs.push('🔍 Search request:', JSON.stringify({
      query,
      tags,
      body
    }));
    
    // Validate query
    if (!query && (!tags || tags.length === 0)) {
      logs.push('🔍 No query or tags provided');
      return NextResponse.json({ 
        error: 'No query or tags provided',
        logs 
      }, { status: 400 });
    }
    
    // Fetch sounds using semantic search
    logs.push('🔍 Calling fetchSoundsWithSemanticSearch with:', JSON.stringify({
      userId,
      query,
      tags
    }));
    
    const sounds = await fetchSoundsWithSemanticSearch(userId, query, tags);
    
    logs.push('🔍 Search results:', JSON.stringify({
      count: sounds.length,
      sounds: sounds.map(s => ({
        id: s.id,
        name: s.name,
        tags: s.tags
      }))
    }));
    
    logs.push('🔍 ====== END SEMANTIC SEARCH API ====== 🔍');
    
    // Return sounds and logs
    return NextResponse.json({ 
      sounds,
      logs 
    });
  } catch (error) {
    logs.push('🔍 Error in semantic search API:', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ 
      error: 'Error processing request',
      logs 
    }, { status: 500 });
  }
} 