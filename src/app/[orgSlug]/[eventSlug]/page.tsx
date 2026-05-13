'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Users, ClipboardList, Trophy, Settings, LayoutDashboard, Loader2 } from 'lucide-react';

export default function EventOverviewPage() {
  const params = useParams();
  const { orgSlug, eventSlug } = params;
  const [event, setEvent] = useState<any>(null);
  const [stats, setStats] = useState<any>({ teams: 0, judges: 0, submissions: 0 });
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

      const { count: teamCount } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventData.id);

      const { count: judgeCount } = await supabase
        .from('judges')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventData.id);

      setStats({
        teams: teamCount || 0,
        judges: judgeCount || 0,
        submissions: teamCount || 0, // Simplified
      });
    }
    setLoading(false);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin" /></div>;
  if (!event) return <div>Event not found</div>;

  const menuItems = [
    { name: 'Teams', icon: Users, href: `/${orgSlug}/${eventSlug}/teams`, description: 'Manage submissions and assignments' },
    { name: 'Rubric', icon: ClipboardList, href: `/${orgSlug}/${eventSlug}/rubric`, description: 'Define scoring criteria' },
    { name: 'Judges', icon: Settings, href: `/${orgSlug}/${eventSlug}/judges`, description: 'Manage judge invitations' },
    { name: 'Results', icon: Trophy, href: `/${orgSlug}/${eventSlug}/results`, description: 'Live leaderboard and exports' },
  ];

  return (
    <div className="container py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{event.name}</h1>
        <p className="text-gray-500">{event.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Teams</CardDescription>
            <CardTitle className="text-3xl">{stats.teams}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Judges</CardDescription>
            <CardTitle className="text-3xl">{stats.judges}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Submissions</CardDescription>
            <CardTitle className="text-3xl">{stats.submissions}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {menuItems.map((item) => (
          <Link key={item.name} href={item.href}>
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="p-2 bg-primary/5 rounded-lg">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle>{item.name}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
