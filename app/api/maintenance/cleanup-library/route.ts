import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

// This endpoint is for maintenance purposes only.
// It should be removed or protected once the database is cleaned up.

export async function GET() {
  // Initialize Supabase client
  const supabase = createRouteHandlerClient({ cookies })
  
  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  console.log(`Running library cleanup for user ${user.id}`)
  
  // Step 1: Check all user_sounds
  const { data: allUserSounds, error: checkError } = await supabase
    .from("user_sounds")
    .select('*')
    .limit(50);
    
  if (checkError) {
    console.error("Error checking user_sounds table:", checkError);
    return NextResponse.json({ error: "Database check failed" }, { status: 500 });
  }
  
  console.log(`Found ${allUserSounds.length} total records in user_sounds before cleanup. Sample:`, allUserSounds[0]);
  
  // Step 2: Run a direct fix query to migrate any user_id values to profile_id
  const { error: migrationError } = await supabase.rpc('migrate_user_id_to_profile_id');
  
  if (migrationError) {
    console.error("Migration error:", migrationError);
  } else {
    console.log("Successfully ran migration from user_id to profile_id (if applicable)");
  }
  
  // Step 3: Count records with NULL profile_id
  const { count: nullCount, error: countError } = await supabase
    .from("user_sounds")
    .select('*', { count: 'exact', head: true })
    .is('profile_id', null);
    
  if (countError) {
    console.error("Error counting NULL profile_id records:", countError);
  } else {
    console.log(`Found ${nullCount} records with NULL profile_id`);
  }
  
  // Step 4: Delete records with NULL profile_id
  let deleteResult = null;
  let deleteError = null;
  
  try {
    const { data, error } = await supabase
      .from("user_sounds")
      .delete()
      .is('profile_id', null)
      .select();
      
    deleteResult = data;
    deleteError = error;
    
    if (error) {
      console.error("Error deleting NULL profile_id records:", error);
    } else {
      console.log(`Deleted ${data?.length || 0} records with NULL profile_id`);
    }
  } catch (err) {
    console.error("Exception during deletion:", err);
    deleteError = err;
  }
  
  // Step 5: Count records for current user
  const { count: userCount, error: userCountError } = await supabase
    .from("user_sounds")
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', user.id);
  
  if (userCountError) {
    console.error("Error counting user records:", userCountError);
  } else {
    console.log(`User ${user.id} has ${userCount} sounds in library`);
  }
  
  // Step 6: Verify database structure
  const { data: tableInfo, error: tableError } = await supabase.rpc('get_column_info', {
    table_name: 'user_sounds'
  });
  
  if (tableError) {
    console.error("Error getting table info:", tableError);
  } else {
    console.log("Table structure:", tableInfo);
  }
  
  return NextResponse.json({
    message: "Library cleanup completed",
    userId: user.id,
    beforeCleanup: {
      totalRecords: allUserSounds.length,
      sampleRecords: allUserSounds,
    },
    migration: {
      success: !migrationError,
      error: migrationError ? String(migrationError) : null
    },
    nullRecords: {
      count: nullCount || 0,
    },
    cleanupResults: {
      success: !deleteError,
      error: deleteError ? String(deleteError) : null,
      deleted: deleteResult
    },
    afterCleanup: {
      userSoundCount: userCount || 0
    },
    tableStructure: tableInfo || null
  })
} 