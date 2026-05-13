'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, Loader2, UserPlus } from 'lucide-react';

export default function TeamListPage() {
  const params = useParams();
  const { orgSlug, eventSlug } = params;
  const [teams, setTeams] = useState<any[]>([]);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [orgSlug, eventSlug]);

  const fetchData = async () => {
    const { data: eventData } = await supabase
      .from('events')
      .select('*, organisations!inner(*)')
      .eq('slug', eventSlug)
      .eq('organisations.slug', orgSlug)
      .single();

    if (eventData) {
      setEvent(eventData);
      const { data: teamsData } = await supabase
        .from('teams')
        .select(`
          *,
          assignments(judge_id)
        `)
        .eq('event_id', eventData.id);
      setTeams(teamsData || []);
    }
    setLoading(false);
  };

  const autoAssignJudges = async () => {
    if (!event) return;
    const { data: judges } = await supabase.from('judges').select('id').eq('event_id', event.id);
    if (!judges || judges.length === 0) {
      alert('No judges found to assign!');
      return;
    }

    const assignments = teams.flatMap((team, i) => {
      const judge = judges[i % judges.length];
      return {
        team_id: team.id,
        judge_id: judge.id,
        event_id: event.id,
      };
    });

    const { error } = await supabase.from('assignments').upsert(assignments);
    if (error) alert(error.message);
    else {
      alert('Judges assigned successfully!');
      fetchData();
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="container py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{event?.name} - Teams</h1>
          <p className="text-gray-500">Manage submissions and judge assignments.</p>
        </div>
        <Button onClick={autoAssignJudges}>
          <UserPlus className="w-4 h-4 mr-2" /> Auto-assign Judges
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team Name</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>AI Status</TableHead>
              <TableHead>Assigned Judge(s)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.map((team) => (
              <TableRow key={team.id}>
                <TableCell className="font-medium">{team.name}</TableCell>
                <TableCell>{new Date(team.submitted_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  {team.ai_analysis_status === 'done' && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Done
                    </Badge>
                  )}
                  {team.ai_analysis_status === 'processing' && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Processing
                    </Badge>
                  )}
                  {team.ai_analysis_status === 'pending' && (
                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                      Pending
                    </Badge>
                  )}
                  {team.ai_analysis_status === 'failed' && (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      <AlertCircle className="w-3 h-3 mr-1" /> Failed
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {team.assignments?.length || 0} judges
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" asChild>
                    <Link href={`/${orgSlug}/${eventSlug}/teams/${team.id}`}>View Details</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
