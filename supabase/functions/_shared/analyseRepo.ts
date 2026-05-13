import Anthropic from 'https://esm.sh/@anthropic-ai/sdk';
import { Octokit } from 'https://esm.sh/@octokit/rest';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });
const octokit = new Octokit({ auth: Deno.env.get('GITHUB_TOKEN') });

// Parse "https://github.com/owner/repo" → { owner, repo }
function parseGithubUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace('.git', '') };
}

// Fetch up to ~60KB of the most important files from the repo
async function fetchRepoContents(owner: string, repo: string): Promise<string> {
  const IMPORTANT_FILES = [
    'README.md', 'readme.md', 'README.txt',
    'package.json', 'requirements.txt', 'pyproject.toml', 'Cargo.toml', 'go.mod',
    'src/index.ts', 'src/index.js', 'src/main.py', 'main.py', 'app.py',
    'src/App.tsx', 'src/App.jsx',
  ];

  let combined = '';
  let charCount = 0;
  const MAX_CHARS = 60000;

  // Fetch known important files first
  for (const path of IMPORTANT_FILES) {
    if (charCount >= MAX_CHARS) break;
    try {
      const { data } = await octokit.repos.getContent({ owner, repo, path });
      if (!Array.isArray(data) && 'content' in data && data.encoding === 'base64') {
        // Correctly handle UTF-8 decoding in Deno
        const binary = atob(data.content);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const content = new TextDecoder().decode(bytes);
        combined += `\n\n--- FILE: ${path} ---\n${content}`;
        charCount += content.length;
      }
    } catch {
      // File doesn't exist, skip
    }
  }

  // If we have room, fetch top-level src/ directory
  if (charCount < MAX_CHARS) {
    try {
      const { data } = await octokit.repos.getContent({ owner, repo, path: 'src' });
      if (Array.isArray(data)) {
        for (const file of data.slice(0, 10)) {
          if (charCount >= MAX_CHARS) break;
          if (file.type === 'file' && file.size < 10000) {
            try {
              const { data: fileData } = await octokit.repos.getContent({ owner, repo, path: file.path });
              if (!Array.isArray(fileData) && 'content' in fileData && fileData.encoding === 'base64') {
                const binary = atob(fileData.content);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) {
                  bytes[i] = binary.charCodeAt(i);
                }
                const content = new TextDecoder().decode(bytes);
                combined += `\n\n--- FILE: ${file.path} ---\n${content}`;
                charCount += content.length;
              }
            } catch { /* skip */ }
          }
        }
      }
    } catch { /* no src/ dir */ }
  }

  return combined || 'No readable files found in repository.';
}

export interface AnalysisResult {
  summary: string;          // markdown summary for judge
  scores: Record<string, number>;  // criterion_label → score (0–10)
  flags: string[];          // warning flags
  languages: string[];      // detected languages/frameworks
}

export async function analyseRepo(
  githubUrl: string,
  rubricCriteria: Array<{ id: string; label: string; description: string; ai_assessed: boolean }>
): Promise<AnalysisResult> {
  const parsed = parseGithubUrl(githubUrl);
  if (!parsed) throw new Error('Invalid GitHub URL');

  const repoContents = await fetchRepoContents(parsed.owner, parsed.repo);

  const aiCriteria = rubricCriteria.filter(c => c.ai_assessed);

  const scoresSection = aiCriteria.length > 0
    ? `\nFor each of the following criteria, provide a score from 0–10:\n${aiCriteria.map(c => `- "${c.label}": ${c.description}`).join('\n')}`
    : '';

  const prompt = `You are a senior software engineer evaluating a hackathon project submission.

Analyse the following repository contents and return a JSON object with this exact structure:
{
  "summary": "string — a 150–200 word markdown summary of what the project does, how it's built, code quality observations, and what stands out. Written for a non-technical judge. Use ## headings: What it does, How it's built, Code quality, Standout points.",
  "scores": { "criterion label": score_0_to_10 },
  "flags": ["array of short warning strings if any issues found"],
  "languages": ["array of detected languages and frameworks"]
}
${scoresSection}

Flags to check for (add to flags array if true):
- "No README found"
- "README is placeholder/empty"
- "No working code found"
- "Appears to be a template/boilerplate with minimal changes"
- "No comments or documentation in code"
- "Demo link missing"

Return ONLY the JSON object. No markdown fences, no explanation.

Repository contents:
${repoContents}`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = (message.content[0] as { type: string; text: string }).text;
  const result: AnalysisResult = JSON.parse(text);
  return result;
}
