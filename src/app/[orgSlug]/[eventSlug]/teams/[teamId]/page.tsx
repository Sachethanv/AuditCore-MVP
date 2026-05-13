'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { GitBranch, ExternalLink, TriangleAlert, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function TeamDetailPage() {
  const params = useParams();
  const { teamId } = params;
  const [team, setTeam] = useState<any>(null);
  const [scores, setScores] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [teamId]);

  const fetchData = async () => {
    const { data: teamData } = await supabase
      .from('teams')
      .select('*, events(*)')
      .eq('id', teamId)
      .single();

    if (teamData) {
      setTeam(teamData);

      const { data: scoresData } = await supabase
        .from('scores')
        .select('*, judges(*), rubric_criteria(*)')
        .eq('team_id', teamId);
      setScores(scoresData || []);

      const { data: feedbackData } = await supabase
        .from('feedback')
        .select('*, judges(*)')
        .eq('team_id', teamId);
      setFeedback(feedbackData || []);
    }
    setLoading(false);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin" /></div>;
  if (!team) return <div>Team not found</div>;

  return (
    <div className="container py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{team.name}</h1>
        <p className="text-xl text-gray-600 mb-4">{team.description}</p>
        <div className="flex gap-4">
          {team.github_url && (
            <Button variant="outline" asChild>
              <a href={team.github_url} target="_blank" rel="noreferrer">
                <GitBranch className="w-4 h-4 mr-2" /> GitHub Repo
              </a>
            </Button>
          )}
          {team.demo_url && (
            <Button variant="outline" asChild>
              <a href={team.demo_url} target="_blank" rel="noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" /> Demo Video
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                AI Codebase Analysis
                <Badge variant={team.ai_analysis_status === 'done' ? 'default' : 'secondary'}>
                  {team.ai_analysis_status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              {team.ai_summary ? (
                <ReactMarkdown>{team.ai_summary}</ReactMarkdown>
              ) : (
                <p className="text-gray-500 italic">Analysis summary not yet available.</p>
              )}

              {team.ai_flags && team.ai_flags.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {team.ai_flags.map((flag: string, i: number) => (
                    <Badge key={i} variant="destructive" className="bg-red-100 text-red-800 border-red-200">
                      <TriangleAlert className="w-3 h-3 mr-1" /> {flag}
                    </Badge>
                  ))}
                </div>
              )}

              {team.ai_scores && (
                <div className="mt-8">
                  <h4 className="font-bold mb-4 text-lg">AI Generated Scores</h4>
                  <div className="space-y-4">
                    {Object.entries(team.ai_scores).map(([label, score]: [string, any]) => (
                      <div key={label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{label}</span>
                          <span className="font-bold">{score}/10</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 transition-all"
                            style={{ width: `${(score / 10) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Judge Scores</CardTitle>
              <CardDescription>Human scores from invited judges.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {scores.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Judge</TableHead>
                        <TableHead>Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scores.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{s.judges?.name}</TableCell>
                          <TableCell>
                            <span className="font-bold">{s.score}</span>
                            <span className="text-gray-400 text-xs"> / {s.rubric_criteria?.max_score}</span>
                            <div className="text-xs text-gray-500">{s.rubric_criteria?.label}</div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-gray-500 py-4">No scores yet.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Judge Feedback</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {feedback.length > 0 ? (
                feedback.map((f) => (
                  <div key={f.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-bold mb-1">{f.judges?.name}</p>
                    <p className="text-sm text-gray-700 italic">"{f.text}"</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">No feedback yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
