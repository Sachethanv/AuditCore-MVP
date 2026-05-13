import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const team_id = params.id;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Update status to pending
    await supabase.from('teams').update({ ai_analysis_status: 'pending' }).eq('id', team_id);

    // Invoke the Supabase Edge Function
    // NOTE: In a real environment, you'd use supabase.functions.invoke()
    // For this mock, we'll simulate the call.
    try {
      await supabase.functions.invoke('analyse-team', {
        body: { team_id },
      });
    } catch (e) {
      console.error('Failed to invoke edge function:', e);
      // We don't want to fail the API call if the edge function invocation fails here,
      // but in a real app you'd handle this more robustly.
    }

    return new NextResponse(null, { status: 202 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
