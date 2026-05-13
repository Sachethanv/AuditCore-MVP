'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle2, Loader2, PlayCircle } from 'lucide-react';

export default function JudgeDashboard() {
  const { inviteToken } = useParams();
  const [judge, setJudge] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [inviteToken]);

  const fetchData = async () => {
    const { data: judgeData } = await supabase
      .from('judges')
      .select('*, events(*)')
      .eq('invite_token', inviteToken)
      .single();

    if (judgeData) {
      setJudge(judgeData);
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select(`
          *,
          teams (
            *,
            scores (
              id,
              judge_id
            )
          )
        `)
        .eq('judge_id', judgeData.id);
      setAssignments(assignmentsData || []);
    }
    setLoading(false);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin" /></div>;
  if (!judge) return <div>Invalid or expired invite token.</div>;

  const completedCount = assignments.filter(a =>
    a.teams?.scores?.some((s: any) => s.judge_id === judge.id)
  ).length;

  return (
    <div className="container py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome, {judge.name}</h1>
        <p className="text-gray-500">You are judging <strong>{judge.events?.name}</strong>.</p>

        <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20 flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-primary">Your Progress</p>
            <p className="text-2xl font-bold">{completedCount} / {assignments.length} teams reviewed</p>
          </div>
          <div className="w-48 h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${(completedCount / assignments.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">Assigned Teams</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignments.map((assignment) => {
          const team = assignment.teams;
          const isDone = team.scores?.some((s: any) => s.judge_id === judge.id);

          return (
            <Card key={team.id} className={isDone ? 'opacity-75' : ''}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center text-lg">
                  {team.name}
                  {isDone ? (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-none">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Done
                    </Badge>
                  ) : (
                    team.ai_analysis_status === 'done' && (
                      <Badge variant="secondary">Ready to judge</Badge>
                    )
                  )}
                </CardTitle>
                <CardDescription className="line-clamp-2">{team.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" asChild variant={isDone ? 'outline' : 'default'}>
                  <Link href={`/judge/${inviteToken}/score/${team.id}`}>
                    {isDone ? 'Edit Score' : 'Start Scoring'}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
