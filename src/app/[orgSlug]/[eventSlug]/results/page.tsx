'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Trophy } from 'lucide-react';

export default function LeaderboardPage() {
  const params = useParams();
  const { orgSlug, eventSlug } = params;
  const [results, setResults] = useState<any[]>([]);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();

    // Set up real-time subscription for scores
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scores' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
      const { data: summaryData } = await supabase
        .from('team_scores_summary')
        .select('*')
        .eq('event_id', eventData.id)
        .order('weighted_avg', { ascending: false });
      setResults(summaryData || []);
    }
    setLoading(false);
  };

  const exportCSV = () => {
    if (results.length === 0) return;

    const headers = ['Rank', 'Team Name', 'Avg Score', 'Judge Count'];
    // Add criteria columns dynamically from the first result if available
    const criteriaKeys = results[0].avg_by_criterion ? Object.keys(results[0].avg_by_criterion) : [];
    const allHeaders = [...headers, ...criteriaKeys];

    const csvRows = [
      allHeaders.join(','),
      ...results.map((row, index) => {
        const baseData = [
          index + 1,
          `"${row.team_name}"`,
          row.weighted_avg,
          row.judge_count,
        ];
        const criteriaData = criteriaKeys.map(k => row.avg_by_criterion[k] || 0);
        return [...baseData, ...criteriaData].join(',');
      })
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${eventSlug}-results.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="container py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="text-yellow-500" /> Live Leaderboard
          </h1>
          <p className="text-gray-500">{event?.name}</p>
        </div>
        <Button variant="outline" onClick={exportCSV}>
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>

      <div className="border rounded-xl overflow-hidden shadow-sm bg-white">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-16">Rank</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Avg Score</TableHead>
              <TableHead>Judges</TableHead>
              <TableHead className="text-right">Breakdown</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((row, index) => (
              <TableRow key={row.team_id} className={index < 3 ? 'bg-yellow-50/30' : ''}>
                <TableCell className="font-bold">
                  {index === 0 && '🥇'}
                  {index === 1 && '🥈'}
                  {index === 2 && '🥉'}
                  {index > 2 && index + 1}
                </TableCell>
                <TableCell className="font-bold">{row.team_name}</TableCell>
                <TableCell>
                  <span className="text-lg font-bold text-primary">{row.weighted_avg || 0}</span>
                </TableCell>
                <TableCell>{row.judge_count}</TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    {row.avg_by_criterion && Object.entries(row.avg_by_criterion).map(([label, avg]: [string, any]) => (
                      <div key={label} className="text-[10px] bg-gray-100 px-2 py-1 rounded">
                        <span className="text-gray-500 uppercase mr-1">{label}:</span>
                        <span className="font-bold">{(avg || 0).toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
