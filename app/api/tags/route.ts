import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

// API endpoint to list all available tags in the database
export async function GET() {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get the list of tags using our helper function
    const { data, error } = await supabase.rpc('list_all_tags');

    if (error) {
      console.error('Error fetching tags:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tags' },
        { status: 500 }
      );
    }

    // Log the number of tags found
    console.log(`Found ${data?.length || 0} tags in database`);
    
    // Log some of the tags for debugging
    if (data && data.length > 0) {
      console.log('Sample tags:', data.slice(0, 5));
    }

    // Return the list of tags
    return NextResponse.json({ tags: data || [] });
  } catch (error: any) {
    console.error('Error in tags GET handler:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tags' },
      { status: 500 }
    );
  }
} 