import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { team_id } = await req.json();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Mark as processing
  await supabase.from('teams').update({ ai_analysis_status: 'processing' }).eq('id', team_id);

  try {
    // Fetch team and event rubric
    const { data: team } = await supabase.from('teams').select('*, events(*)').eq('id', team_id).single();
    const { data: criteria } = await supabase.from('rubric_criteria').select('*').eq('event_id', team.event_id);

    if (!team.github_url) {
      await supabase.from('teams').update({
        ai_analysis_status: 'failed',
        ai_flags: ['No GitHub URL provided']
      }).eq('id', team_id);
      return new Response('no github url', { status: 200 });
    }

    // Run analysis (import from shared lib)
    const { analyseRepo } = await import('../_shared/analyseRepo.ts');
    const result = await analyseRepo(team.github_url, criteria);

    // Store results
    await supabase.from('teams').update({
      ai_analysis_status: 'done',
      ai_summary: result.summary,
      ai_scores: result.scores,
      ai_flags: result.flags,
    }).eq('id', team_id);

  } catch (error) {
    await supabase.from('teams').update({
      ai_analysis_status: 'failed',
      ai_flags: [`Analysis failed: ${error.message}`]
    }).eq('id', team_id);
  }

  return new Response('ok', { status: 200 });
});
