'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";
import { Octokit } from "@octokit/rest";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');
const octokit = new Octokit();

export async function auditTeamWithAI(teamId: string, eventId: string) {
  try {
    // 1. Fetch team and rubric data
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();

    const { data: rubric, error: rubricError } = await supabase
      .from('rubric_criteria')
      .select('*')
      .eq('event_id', eventId)
      .eq('ai_assessed', true);

    if (teamError || rubricError || !team || !rubric) {
      throw new Error("Failed to fetch team or rubric data");
    }

    // 2. Fetch context (README from GitHub if available)
    let extraContext = "";
    if (team.repo_url) {
      try {
        const urlParts = team.repo_url.replace('https://github.com/', '').split('/');
        const owner = urlParts[0];
        const repo = urlParts[1];
        const { data: readme } = await octokit.rest.repos.getReadme({ owner, repo });
        const content = Buffer.from(readme.content, 'base64').toString();
        extraContext = `\n\nGitHub README content:\n${content.substring(0, 5000)}`;
      } catch (err) {
        console.error("Failed to fetch README", err);
      }
    }

    // 3. Prepare Prompt
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Using 1.5 Flash as requested (standard for speed/cost)
    
    const prompt = `
      You are an expert technical auditor and hackathon judge. 
      Your task is to audit a project submission based on a provided rubric.
      
      PROJECT NAME: ${team.name}
      PROJECT DESCRIPTION: ${team.project_description}
      ${extraContext}
      
      RUBRIC CRITERIA:
      ${rubric.map((r: any) => `- ${r.label} (Max Score: ${r.max_score}): ${r.description}`).join('\n')}
      
      For each criterion, provide:
      1. A numeric score (0 to max_score).
      2. A concise reasoning for the score.
      
      Output your response as a JSON array of objects:
      [
        { "criterion_id": "...", "score": 8, "reasoning": "..." },
        ...
      ]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json|```/g, '');
    const scores = JSON.parse(text);

    // 4. Save scores to Supabase
    const scoreRows = scores.map((s: any) => ({
      team_id: teamId,
      criterion_id: s.criterion_id,
      score: s.score,
      reasoning: s.reasoning,
      is_ai: true
    }));

    const { error: insertError } = await supabase.from('scores').insert(scoreRows);
    if (insertError) throw insertError;

    return { success: true, scores };
  } catch (error: any) {
    console.error("AI Audit Error:", error);
    return { success: false, error: error.message };
  }
}
