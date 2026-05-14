'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Github, Loader2, ArrowLeft, Zap } from 'lucide-react';
import Link from 'next/link';
import { auditTeamWithAI } from '@/app/actions/ai-score';

export default function TeamsPage() {
  const params = useParams();
  const router = useRouter();
  const { orgSlug, eventSlug } = params;
  
  const [event, setEvent] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingTeam, setAddingTeam] = useState(false);
  const [auditingId, setAuditingId] = useState<string | null>(null);
  const [newTeam, setNewTeam] = useState({ name: '', repo_url: '', project_description: '' });

  useEffect(() => {
    fetchData();
  }, [orgSlug, eventSlug]);

  const fetchData = async () => {
    setLoading(true);
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
        .select('*')
        .eq('event_id', eventData.id)
        .order('created_at', { ascending: false });
      
      setTeams(teamsData || []);
    }
    setLoading(false);
  };

  const handleAddTeam = async () => {
    if (!newTeam.name) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('teams')
      .insert({
        event_id: event.id,
        name: newTeam.name,
        repo_url: newTeam.repo_url,
        project_description: newTeam.project_description
      })
      .select()
      .single();

    if (error) {
      alert(error.message);
    } else {
      setTeams([data, ...teams]);
      setNewTeam({ name: '', repo_url: '', project_description: '' });
      setAddingTeam(false);
    }
    setLoading(false);
  };

  const deleteTeam = async (id: string) => {
    const { error } = await supabase.from('teams').delete().eq('id', id);
    if (error) alert(error.message);
    else setTeams(teams.filter(t => t.id !== id));
  };

  const handleAIAudit = async (teamId: string) => {
    setAuditingId(teamId);
    const result = await auditTeamWithAI(teamId, event.id);
    if (!result.success) {
      alert(result.error);
    } else {
      alert("AI Audit Complete! Scores saved to database.");
      fetchData(); // Refresh to show updated stats if any
    }
    setAuditingId(null);
  };

  if (loading && !event) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="container py-12 max-w-4xl">
      <div className="mb-8">
        <Link href={`/${orgSlug}/${eventSlug}`} className="text-sm text-gray-500 hover:text-primary flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Event Overview
        </Link>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold">Manage Teams</h1>
            <p className="text-gray-500">Add and manage participants for {event?.name}</p>
          </div>
          <Button onClick={() => setAddingTeam(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Team
          </Button>
        </div>
      </div>

      {addingTeam && (
        <Card className="mb-8 border-primary/50 bg-primary/5 shadow-lg animate-in slide-in-from-top-4 duration-300">
          <CardHeader>
            <CardTitle>Register New Team</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Team Name</Label>
                <Input 
                  placeholder="Team Alpha" 
                  value={newTeam.name}
                  onChange={e => setNewTeam({...newTeam, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>GitHub Repository (Optional)</Label>
                <div className="relative">
                  <Github className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input 
                    className="pl-10" 
                    placeholder="https://github.com/..." 
                    value={newTeam.repo_url}
                    onChange={e => setNewTeam({...newTeam, repo_url: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Project Description</Label>
              <Textarea 
                placeholder="What did they build? Mention key features and technologies used..." 
                rows={4}
                value={newTeam.project_description}
                onChange={e => setNewTeam({...newTeam, project_description: e.target.value})}
              />
            </div>
          </CardContent>
          <CardFooter className="flex gap-4">
            <Button variant="outline" className="flex-1" onClick={() => setAddingTeam(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleAddTeam} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : 'Confirm Add Team'}
            </Button>
          </CardFooter>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {teams.length === 0 ? (
          <Card className="p-12 text-center text-gray-500 border-dashed">
            No teams registered yet. Click "Add Team" to get started.
          </Card>
        ) : (
          teams.map(team => (
            <Card key={team.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{team.name}</CardTitle>
                  {team.repo_url && (
                    <a href={team.repo_url} target="_blank" className="text-sm text-blue-500 flex items-center gap-1 mt-1 hover:underline">
                      <Github className="w-3 h-3" /> {team.repo_url}
                    </a>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteTeam(team.id)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 line-clamp-2">{team.project_description}</p>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/${orgSlug}/${eventSlug}/teams/${team.id}`}>View Details</Link>
                </Button>
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600"
                  onClick={() => handleAIAudit(team.id)}
                  disabled={auditingId === team.id}
                >
                   {auditingId === team.id ? (
                     <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Auditing...</>
                   ) : (
                     <><Zap className="w-4 h-4 mr-2" /> Audit with Gemini AI</>
                   )}
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
