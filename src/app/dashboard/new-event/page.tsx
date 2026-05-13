'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2 } from 'lucide-react';

export default function NewEventPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Event Info
  const [eventInfo, setEventInfo] = useState({
    name: '',
    slug: '',
    description: '',
    submission_deadline: '',
    judging_deadline: '',
    max_teams: 50,
  });

  // Step 2: Rubric
  const [rubric, setRubric] = useState<any[]>([
    { label: 'Technical Complexity', description: 'How difficult was it to build?', max_score: 10, weight: 1.0, ai_assessed: true },
    { label: 'Innovation', description: 'How original is the idea?', max_score: 10, weight: 1.0, ai_assessed: false },
  ]);

  // Step 3: Judges
  const [judges, setJudges] = useState<string[]>(['']);

  const addCriterion = () => {
    setRubric([...rubric, { label: '', description: '', max_score: 10, weight: 1.0, ai_assessed: false }]);
  };

  const removeCriterion = (index: number) => {
    setRubric(rubric.filter((_, i) => i !== index));
  };

  const addJudge = () => setJudges([...judges, '']);
  const updateJudge = (index: number, email: string) => {
    const newJudges = [...judges];
    newJudges[index] = email;
    setJudges(newJudges);
  };
  const removeJudge = (index: number) => setJudges(judges.filter((_, i) => i !== index));

  const handleFinish = async () => {
    setLoading(true);
    try {
      // 1. Get user and organization (simplified: assume one org for now or create one)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let { data: orgs } = await supabase.from('organisations').select('id').limit(1);
      let orgId;
      if (!orgs || orgs.length === 0) {
        const { data: newOrg } = await supabase.from('organisations').insert({
          name: `${user.email}'s Org`,
          slug: user.email?.split('@')[0] || 'default-org',
        }).select().single();
        orgId = newOrg.id;
      } else {
        orgId = orgs[0].id;
      }

      // 2. Create Event
      const { data: event, error: eventError } = await supabase.from('events').insert({
        org_id: orgId,
        name: eventInfo.name,
        slug: eventInfo.slug,
        description: eventInfo.description,
        submission_deadline: eventInfo.submission_deadline || null,
        judging_deadline: eventInfo.judging_deadline || null,
        max_teams: eventInfo.max_teams,
      }).select().single();

      if (eventError) throw eventError;

      // 3. Create Rubric
      const rubricWithOrder = rubric.map((r, i) => ({ ...r, event_id: event.id, sort_order: i }));
      await supabase.from('rubric_criteria').insert(rubricWithOrder);

      // 4. Invite Judges
      const judgeRows = judges.filter(email => email.trim() !== '').map(email => ({
        event_id: event.id,
        email,
        name: email.split('@')[0],
      }));
      if (judgeRows.length > 0) {
        await supabase.from('judges').insert(judgeRows);
      }

      router.push(`/dashboard`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl py-12">
      <div className="mb-8 flex justify-between items-center">
        <div className="flex gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 w-12 rounded-full ${s <= step ? 'bg-primary' : 'bg-gray-200'}`}
            />
          ))}
        </div>
        <span className="text-sm font-medium text-gray-500">Step {step} of 3</span>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <CardDescription>Tell us about your hackathon.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Event Name</Label>
              <Input
                placeholder="Global AI Hack 2024"
                value={eventInfo.name}
                onChange={(e) => setEventInfo({ ...eventInfo, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>URL Slug</Label>
              <Input
                placeholder="ai-hack-2024"
                value={eventInfo.slug}
                onChange={(e) => setEventInfo({ ...eventInfo, slug: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="A 48-hour hackathon focused on generative AI..."
                value={eventInfo.description}
                onChange={(e) => setEventInfo({ ...eventInfo, description: e.target.value })}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => setStep(2)}>Next: Rubric Builder</Button>
          </CardFooter>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Rubric Builder</CardTitle>
            <CardDescription>Define how projects will be scored.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {rubric.map((criterion, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-4 relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 text-red-500"
                  onClick={() => removeCriterion(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Criterion Label</Label>
                    <Input
                      placeholder="e.g. Impact"
                      value={criterion.label}
                      onChange={(e) => {
                        const next = [...rubric];
                        next[index].label = e.target.value;
                        setRubric(next);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Weight</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={criterion.weight}
                      onChange={(e) => {
                        const next = [...rubric];
                        next[index].weight = parseFloat(e.target.value);
                        setRubric(next);
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    placeholder="Brief instructions for judges"
                    value={criterion.description}
                    onChange={(e) => {
                      const next = [...rubric];
                      next[index].description = e.target.value;
                      setRubric(next);
                    }}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`ai-${index}`}
                    checked={criterion.ai_assessed}
                    onCheckedChange={(checked) => {
                      const next = [...rubric];
                      next[index].ai_assessed = !!checked;
                      setRubric(next);
                    }}
                  />
                  <Label htmlFor={`ai-${index}`}>AI assesses this criterion</Label>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full" onClick={addCriterion}>
              <Plus className="w-4 h-4 mr-2" /> Add Criterion
            </Button>
          </CardContent>
          <CardFooter className="flex gap-4">
            <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
            <Button className="flex-1" onClick={() => setStep(3)}>Next: Invite Judges</Button>
          </CardFooter>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Invite Judges</CardTitle>
            <CardDescription>Enter the emails of the people who will score projects.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {judges.map((email, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="judge@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => updateJudge(index, e.target.value)}
                />
                <Button variant="ghost" size="icon" onClick={() => removeJudge(index)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
            <Button variant="outline" className="w-full" onClick={addJudge}>
              <Plus className="w-4 h-4 mr-2" /> Add Judge
            </Button>
          </CardContent>
          <CardFooter className="flex gap-4">
            <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Back</Button>
            <Button className="flex-1" onClick={handleFinish} disabled={loading}>
              {loading ? 'Creating...' : 'Finish & Launch'}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
