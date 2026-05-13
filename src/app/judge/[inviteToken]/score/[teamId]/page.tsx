'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { GitBranch, ExternalLink, TriangleAlert, Loader2, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function ScoringForm() {
  const { inviteToken, teamId } = useParams();
  const router = useRouter();
  const [judge, setJudge] = useState<any>(null);
  const [team, setTeam] = useState<any>(null);
  const [rubric, setRubric] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [inviteToken, teamId]);

  const fetchData = async () => {
    const { data: judgeData } = await supabase
      .from('judges')
      .select('*, events(*)')
      .eq('invite_token', inviteToken)
      .single();

    const { data: teamData } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();

    if (judgeData && teamData) {
      setJudge(judgeData);
      setTeam(teamData);

      const { data: rubricData } = await supabase
        .from('rubric_criteria')
        .select('*')
        .eq('event_id', judgeData.event_id)
        .order('sort_order', { ascending: true });

      setRubric(rubricData || []);

      // Pre-fill with AI scores for ai_assessed criteria if not already scored by human
      const initialScores: Record<string, number> = {};

      // Load existing human scores if any
      const { data: existingScores } = await supabase
        .from('scores')
        .select('*')
        .eq('judge_id', judgeData.id)
        .eq('team_id', teamId);

      existingScores?.forEach(s => {
        initialScores[s.criterion_id] = s.score;
      });

      rubricData?.forEach(c => {
        if (initialScores[c.id] === undefined && c.ai_assessed && teamData.ai_scores?.[c.label]) {
          initialScores[c.id] = teamData.ai_scores[c.label];
        } else if (initialScores[c.id] === undefined) {
          initialScores[c.id] = 5; // Default middle
        }
      });
      setScores(initialScores);

      const { data: existingFeedback } = await supabase
        .from('feedback')
        .select('*')
        .eq('judge_id', judgeData.id)
        .eq('team_id', teamId)
        .single();
      if (existingFeedback) setFeedback(existingFeedback.text);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const scoreRows = Object.entries(scores).map(([criterion_id, score]) => ({
        judge_id: judge.id,
        team_id: team.id,
        criterion_id,
        score,
      }));

      const { error: scoreError } = await supabase.from('scores').upsert(scoreRows, { onConflict: 'judge_id,team_id,criterion_id' });
      if (scoreError) throw scoreError;

      if (feedback.trim()) {
        const { error: feedbackError } = await supabase.from('feedback').upsert({
          judge_id: judge.id,
          team_id: team.id,
          event_id: judge.event_id,
          text: feedback,
        }, { onConflict: 'judge_id,team_id' });
        if (feedbackError) throw feedbackError;
      }

      router.push(`/judge/${inviteToken}/dashboard`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin" /></div>;
  if (!judge || !team) return <div>Data not found.</div>;

  return (
    <div className="container max-w-4xl py-12">
      <div className="mb-8">
        <Button variant="ghost" className="mb-4" onClick={() => router.push(`/judge/${inviteToken}/dashboard`)}>
          ← Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold mb-2">{team.name}</h1>
        <p className="text-gray-600 mb-6">{team.description}</p>
        <div className="flex gap-4">
          {team.github_url && (
            <Button variant="outline" asChild size="sm">
              <a href={team.github_url} target="_blank" rel="noreferrer">
                <GitBranch className="w-4 h-4 mr-2" /> GitHub Repo
              </a>
            </Button>
          )}
          {team.demo_url && (
            <Button variant="outline" asChild size="sm">
              <a href={team.demo_url} target="_blank" rel="noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" /> Demo Link
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Codebase Briefing</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              {team.ai_summary ? (
                <ReactMarkdown>{team.ai_summary}</ReactMarkdown>
              ) : (
                <p className="text-gray-500 italic">AI analysis in progress...</p>
              )}

              {team.ai_flags && team.ai_flags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {team.ai_flags.map((flag: string, i: number) => (
                    <Badge key={i} variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                      <TriangleAlert className="w-3 h-3 mr-1" /> {flag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Scoring Form</CardTitle>
              <CardDescription>Slide to score (0-10)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {rubric.map((criterion) => (
                <div key={criterion.id} className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-base font-bold">{criterion.label}</Label>
                    <span className="text-xl font-bold text-primary">{scores[criterion.id] || 0}</span>
                  </div>
                  <Slider
                    value={[scores[criterion.id] || 0]}
                    max={criterion.max_score}
                    step={1}
                    onValueChange={([val]) => setScores({ ...scores, [criterion.id]: val })}
                  />
                  <p className="text-sm text-gray-500 italic">{criterion.description}</p>
                </div>
              ))}

              <div className="space-y-2">
                <Label className="text-base font-bold">Overall Feedback</Label>
                <Textarea
                  placeholder="What stood out to you? Any advice for the team?"
                  className="h-32"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" size="lg" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save & Back to Dashboard'}
                {!saving && <ChevronRight className="w-4 h-4 ml-2" />}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
