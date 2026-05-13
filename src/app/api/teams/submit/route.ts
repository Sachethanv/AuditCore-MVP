import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { event_id, name, description, github_url, demo_url, members, submission_notes } = body;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        event_id,
        name,
        description,
        github_url,
        demo_url,
        members,
        submission_notes,
      })
      .select()
      .single();

    if (teamError) throw teamError;

    // Trigger AI analysis asynchronously
    // In a real app, this would call the internal trigger-analysis API or the Edge Function directly
    // Here we'll try to invoke the Edge Function if available, or just return success
    try {
      await fetch(`${new URL(req.url).origin}/api/teams/${team.id}/trigger-analysis`, {
        method: 'POST',
      });
    } catch (e) {
      console.error('Failed to trigger analysis:', e);
    }

    return NextResponse.json({ team_id: team.id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
