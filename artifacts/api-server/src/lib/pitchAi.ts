import type { Idea } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import {
  speechToText,
  textToSpeech,
  ensureCompatibleFormat,
} from "@workspace/integrations-openai-ai-server/audio";

export interface StructuredIdea {
  problem: string;
  solution: string;
  market: string;
  businessModel: string;
  competitiveEdge: string;
  targetAudience: string;
}

export interface IdeaValidationResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export interface DeckSlide {
  title: string;
  body: string;
  layout:
    | "title"
    | "problem"
    | "solution"
    | "market"
    | "business"
    | "edge"
    | "demo"
    | "traction"
    | "ask";
  bullets?: string[];
}

const STOPWORDS = new Set([
  "the","a","an","and","or","but","of","to","for","in","on","at","with","is","are",
  "this","that","be","by","from","it","we","our","their","they","as","have","has",
  "will","can","into","out",
]);

function topKeywords(text: string, n = 6): string[] {
  const counts = new Map<string, number>();
  for (const word of text.toLowerCase().split(/[^a-z0-9]+/)) {
    if (!word || word.length < 4 || STOPWORDS.has(word)) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([w]) => w);
}

function firstSentence(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^(.+?[.!?])(\s|$)/);
  return (match ? match[1] : trimmed).slice(0, 240).trim();
}

function pickAudience(text: string): string {
  const lower = text.toLowerCase();
  const hits: string[] = [];
  if (/student|college|school|teen|young/.test(lower)) hits.push("students and young founders");
  if (/teacher|educator|professor/.test(lower)) hits.push("educators");
  if (/business|enterprise|company|saas|b2b/.test(lower)) hits.push("small and mid-sized businesses");
  if (/parent|family|kid|child/.test(lower)) hits.push("parents and families");
  if (/developer|engineer|programmer/.test(lower)) hits.push("software builders");
  if (hits.length === 0) hits.push("early adopters in the target domain");
  return hits.join(", ");
}

export function structureIdeaText(title: string, rawText: string): StructuredIdea {
  const lead = firstSentence(rawText);
  const keywords = topKeywords(`${title} ${rawText}`, 5);
  const k = keywords.length > 0 ? keywords.join(", ") : title.toLowerCase();
  const audience = pickAudience(rawText);

  const problem = `Today, ${audience} struggle with what "${title}" solves. ${lead} The tools that exist right now are slow, disconnected, and built for someone else — not for the people who actually need it.`;
  const solution = `${title} is a simple, focused tool that handles the whole job in one place. It brings together ${k} so people can get from start to done in minutes, not weeks — with smart defaults that just work.`;
  const market = `The opportunity is at the crossing point of ${k}. Even a small slice of ${audience} is a real starting point, with room to grow into nearby areas as the product gets better.`;
  const businessModel = `Free to start, paid for more. The free plan gets people in the door. Paid plans unlock advanced features and team tools. Long term: school and organization plans, plus partnerships with accelerators and ecosystems.`;
  const competitiveEdge = `Most tools only handle one piece of the job. ${title} owns the whole flow end to end. That means a better experience, faster results, and a moat that grows as more people use it.`;

  return { problem, solution, market, businessModel, competitiveEdge, targetAudience: audience };
}

export function validateIdea(idea: Idea): IdeaValidationResult {
  const fields: (keyof Idea)[] = [
    "problem","solution","market","businessModel","competitiveEdge","targetAudience",
  ];

  const filled = fields.filter((f) => typeof idea[f] === "string" && (idea[f] as string).length > 30);
  const completeness = filled.length / fields.length;
  const rawLen = (idea.rawText ?? "").length;
  const richness = Math.min(rawLen / 600, 1);
  const score = Math.round(45 + completeness * 40 + richness * 15);

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const suggestions: string[] = [];

  if (completeness >= 0.8) {
    strengths.push("Your idea covers all the key sections an investor looks for.");
  } else {
    weaknesses.push("A few key sections are missing or too short — problem, solution, market, business model, edge, audience.");
    suggestions.push("Use the AI structuring step, then add one real example or number to each section.");
  }

  if (richness >= 0.6) {
    strengths.push("You gave enough detail for the AI to work with. That's a good sign.");
  } else {
    weaknesses.push("Your idea description is short — investors need more context to understand it.");
    suggestions.push("Expand your raw idea: who is the user, what is the exact pain, and why does it matter now.");
  }

  if (idea.competitiveEdge && idea.competitiveEdge.length > 60) {
    strengths.push("You clearly explained why you win — investors will test this hard.");
  } else {
    weaknesses.push("Why you win isn't clear yet. That's often the first thing investors ask.");
    suggestions.push("Write your unfair advantage in one sentence: what do you have that others don't?");
  }

  if (idea.businessModel && idea.businessModel.toLowerCase().includes("free")) {
    suggestions.push("Explain your free-to-paid numbers: how many free users convert, and how much do they pay?");
  }

  if (strengths.length === 0) strengths.push("You wrote it down and shared it — that's the first real step.");

  return { score: Math.min(98, Math.max(35, score)), strengths, weaknesses, suggestions };
}

export function generateDeckSlides(idea: Idea): {
  title: string;
  storyline: string;
  slides: DeckSlide[];
} {
  const title = `${idea.title} — Pitch Deck`;
  const storyline = `Start with the real problem, show the gap no one is fixing, present your solution as the obvious answer, prove the market and business, end with the ask.`;

  const slides: DeckSlide[] = [
    {
      title: idea.title,
      body: `Helping ${idea.targetAudience ?? "people"} do more with less effort.`,
      layout: "title",
    },
    {
      title: "The Problem",
      body: idea.problem ?? "People today struggle with a workflow that nobody owns from start to finish.",
      layout: "problem",
      bullets: [
        "The pain happens every day",
        "Existing tools are patchy and disconnected",
        "Time and money are wasted as a result",
      ],
    },
    {
      title: "Our Solution",
      body: idea.solution ?? "One product that handles the full job — not just one piece of it.",
      layout: "solution",
      bullets: [
        "Easy to start, powerful as you grow",
        "Does in minutes what used to take hours",
        "Built for the people actually doing the work",
      ],
    },
    {
      title: "Who Buys This",
      body: idea.market ?? "A clear group of people who need this and are ready to pay for it.",
      layout: "market",
      bullets: ["Large and growing market", "Specific starting group identified", "Easy to expand from there"],
    },
    {
      title: "How We Make Money",
      body: idea.businessModel ?? "Free plan to get people in, paid plan for power users, team plans for groups.",
      layout: "business",
      bullets: ["Free plan drives word-of-mouth", "Paid plan unlocks more features", "Team plans grow revenue fast"],
    },
    {
      title: "Why We Win",
      body: idea.competitiveEdge ?? "We own the whole experience — not just one step. That's hard to copy.",
      layout: "edge",
      bullets: ["Full end-to-end ownership", "Gets smarter with every user", "Hard to replicate quickly"],
    },
    {
      title: "See It In Action",
      body: "Watch the core flow: from a raw idea to a finished result in under three minutes.",
      layout: "demo",
    },
    {
      title: "Progress & Next Steps",
      body: "Early users are active. Next: deeper features, team mode, and key partnerships.",
      layout: "traction",
      bullets: ["Real users, real activity", "Usage growing week over week", "Roadmap built from user feedback"],
    },
    {
      title: "What We're Asking For",
      body: "Join us in giving the next generation of founders the tools to think, pitch, and win.",
      layout: "ask",
      bullets: ["Strategic partners", "Pilot schools and accelerators", "Seed funding to grow the product"],
    },
  ];

  return { title, storyline, slides };
}

export async function generateAIDeckSlides(idea: Idea): Promise<{
  title: string;
  storyline: string;
  slides: DeckSlide[];
}> {
  const ideaContext = [
    `Startup Name: ${idea.title}`,
    idea.rawText ? `Full Description: ${idea.rawText}` : null,
    idea.problem ? `The Problem: ${idea.problem}` : null,
    idea.solution ? `The Solution: ${idea.solution}` : null,
    idea.market ? `Market Opportunity: ${idea.market}` : null,
    idea.businessModel ? `Business Model: ${idea.businessModel}` : null,
    idea.competitiveEdge ? `Why We Win: ${idea.competitiveEdge}` : null,
    idea.targetAudience ? `Who It's For: ${idea.targetAudience}` : null,
  ].filter(Boolean).join("\n");

  const systemPrompt = `You write pitch deck slides. Use simple, clear English that anyone can understand — no jargon. Short sentences. Sound real and human, not corporate. Be specific to this startup — no generic filler.`;

  const userPrompt = `Write a 9-slide pitch deck for this startup:

${ideaContext}

Return a JSON object with this exact shape:
{
  "slides": [
    { "layout": "title", "title": "...", "body": "..." },
    { "layout": "problem", "title": "...", "body": "...", "bullets": ["...", "...", "..."] },
    { "layout": "solution", "title": "...", "body": "...", "bullets": ["...", "...", "..."] },
    { "layout": "market", "title": "...", "body": "...", "bullets": ["...", "...", "..."] },
    { "layout": "business", "title": "...", "body": "...", "bullets": ["...", "...", "..."] },
    { "layout": "edge", "title": "...", "body": "...", "bullets": ["...", "...", "..."] },
    { "layout": "demo", "title": "...", "body": "..." },
    { "layout": "traction", "title": "...", "body": "...", "bullets": ["...", "...", "..."] },
    { "layout": "ask", "title": "...", "body": "...", "bullets": ["...", "...", "..."] }
  ]
}

Rules:
- Title slide: no bullets, body is 1 short sentence (what the startup does, in plain English)
- All other slides: body is 2-3 short sentences, bullets are 3 short phrases (5-8 words each)
- Use simple everyday English — no buzzwords, no jargon
- Be specific to THIS startup using its actual description
- Slide titles: 4-6 words max`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 2000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as { slides?: DeckSlide[] };

    if (parsed.slides && Array.isArray(parsed.slides) && parsed.slides.length >= 8) {
      const title = `${idea.title} — Pitch Deck`;
      const storyline = `A clear story: the real problem, the simple solution, why it works, and why now.`;
      return { title, storyline, slides: parsed.slides };
    }
  } catch (err) {
    console.error("AI deck generation failed, using fallback:", err);
  }

  return generateDeckSlides(idea);
}

export interface InvestorPersonaInfo {
  slug: string;
  name: string;
  style: string;
  intensity: "easy" | "medium" | "hard";
}

const PERSONA_SYSTEM_PROMPTS: Record<string, string> = {
  "aggressive-vc": `You are a tough investor named Marcus. You ask one short, direct question at a time. Use simple everyday English — no fancy words. You push back on weak points. You want clear answers about money, competition, and survival. Speak in 1-2 short sentences only. No speeches.`,

  "curious-angel": `You are a friendly investor named Sarah. You ask one simple question at a time in plain English. You care about the founder's story, their users, and what they've learned. Be warm but direct. Speak in 1 short sentence only.`,

  "skeptical-judge": `You are a careful pitch judge named David. You ask one focused question at a time using simple, plain English. You want real evidence — not promises. You check if numbers make sense and if the plan is realistic. Speak in 1-2 short sentences only.`,
};

const FALLBACK_QUESTIONS: Record<string, string[]> = {
  "aggressive-vc": [
    "Who is your biggest competitor, and why can't they just copy what you're doing?",
    "How much does it cost you to get one customer, and how much do they pay you?",
    "If I gave you money today, what's the very first thing you'd spend it on?",
    "What's the one thing that could kill this company?",
    "Have you actually talked to customers, and what did they say?",
  ],
  "curious-angel": [
    "What's your personal story — why did you decide to build this?",
    "Tell me about a real person who needs this. What is their day like?",
    "What's the most surprising thing you learned while building this?",
    "If you launch tomorrow, what does a user feel in the first five minutes?",
    "What part of this scares you the most, honestly?",
  ],
  "skeptical-judge": [
    "What's your proof that people really have this problem — not just find it annoying?",
    "Other tools do part of this already. What makes yours better?",
    "What's the one thing, if you got it wrong, that would break the whole plan?",
    "How do you know people will pay money for this — not just use a free version?",
    "Why hasn't a bigger company built this already?",
  ],
};

export async function pickAIInvestorQuestion(
  personaSlug: string,
  idea: Idea,
  conversationHistory: Array<{ role: "user" | "investor"; content: string }>,
  language?: string,
): Promise<string> {
  const systemPrompt = PERSONA_SYSTEM_PROMPTS[personaSlug] ?? PERSONA_SYSTEM_PROMPTS["curious-angel"]!;

  const pitchContext = [
    idea.title ? `Startup: ${idea.title}` : null,
    idea.rawText ? `What they built: ${idea.rawText.slice(0, 400)}` : null,
    idea.problem ? `The problem they solve: ${idea.problem}` : null,
    idea.solution ? `Their solution: ${idea.solution}` : null,
    idea.market ? `Their market: ${idea.market}` : null,
    idea.businessModel ? `How they make money: ${idea.businessModel}` : null,
    idea.competitiveEdge ? `Why they win: ${idea.competitiveEdge}` : null,
    idea.targetAudience ? `Who they sell to: ${idea.targetAudience}` : null,
  ].filter(Boolean).join("\n");

  const previousQuestions = conversationHistory
    .filter((m) => m.role === "investor")
    .map((m) => m.content);

  const previousAnswers = conversationHistory
    .filter((m) => m.role === "user")
    .map((m) => m.content);

  const languageInstruction = language && language !== "en"
    ? `\nIMPORTANT: Ask your question in this language: ${language}. Use simple words in that language.`
    : "";

  const userContent = `STARTUP INFO:
${pitchContext}

QUESTIONS ALREADY ASKED (do not repeat these):
${previousQuestions.length > 0 ? previousQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n") : "None yet — this is the first question."}

FOUNDER'S ANSWERS SO FAR:
${previousAnswers.length > 0 ? previousAnswers.map((a, i) => `${i + 1}. ${a}`).join("\n") : "No answers yet."}

Ask ONE short question (1-2 sentences max) that:
1. Is specific to this startup — not generic
2. Builds on their most recent answer if there is one
3. Uses simple everyday English — no jargon
4. Has NOT been asked before
5. Gets at something important they haven't fully explained yet

Output ONLY the question. Nothing else.${languageInstruction}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      max_completion_tokens: 120,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
    });
    const question = response.choices[0]?.message?.content?.trim();
    if (question && question.length > 10) return question;
  } catch (err) {
    console.error("AI question generation failed, using fallback:", err);
  }

  const bank = FALLBACK_QUESTIONS[personaSlug] ?? FALLBACK_QUESTIONS["curious-angel"]!;
  const usedCount = previousQuestions.length;
  return bank[usedCount % bank.length]!;
}

export function scorePitchTurn(content: string): {
  feedback: string;
  confidence: number;
  clarity: number;
  fillerWords: number;
} {
  const fillerList = [
    "um","uh","like","you know","kind of","sort of","basically","actually","literally","i mean",
  ];
  const lower = ` ${content.toLowerCase()} `;
  let fillerWords = 0;
  for (const f of fillerList) {
    const re = new RegExp(`\\b${f}\\b`, "g");
    fillerWords += (lower.match(re) ?? []).length;
  }

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const avgSentenceLength = sentences.length > 0 ? wordCount / sentences.length : wordCount;

  const hedgeCount = (
    lower.match(/\b(maybe|might|perhaps|i think|i guess|hopefully|probably)\b/g) ?? []
  ).length;
  let confidence = 75 - hedgeCount * 6 - fillerWords * 3;
  if (wordCount > 30) confidence += 8;
  if (wordCount > 80) confidence += 5;
  confidence = Math.max(20, Math.min(98, confidence));

  let clarity = 80 - Math.abs(avgSentenceLength - 17) * 1.5 - fillerWords * 2;
  if (wordCount < 12) clarity -= 15;
  clarity = Math.max(20, Math.min(98, Math.round(clarity)));
  confidence = Math.round(confidence);

  let feedback: string;
  if (clarity > 78 && confidence > 78) {
    feedback = "Good answer! You were clear and confident. Keep that energy — add one concrete number next time if you can.";
  } else if (fillerWords > 3) {
    feedback = `You used filler words ${fillerWords} times. Try pausing instead — silence sounds more confident than "um" or "like."`;
  } else if (hedgeCount > 1) {
    feedback = "Remove the hedging — phrases like 'I think' or 'maybe' make you sound unsure. Say it like you know it.";
  } else if (avgSentenceLength > 25) {
    feedback = "Your answer ran a bit long. Try to cut it in half — one clear point is better than three tangled ones.";
  } else if (wordCount < 25) {
    feedback = "A bit short. Investors want to understand your thinking — add one example or one number to back it up.";
  } else {
    feedback = "Solid answer. Finish stronger — end with your boldest sentence, not your safest one.";
  }

  return { feedback, confidence, clarity, fillerWords };
}

async function generateAIFeedback(
  content: string,
  lastQuestion: string | undefined,
  scores: { confidence: number; clarity: number; fillerWords: number },
): Promise<string> {
  const prompt = `A founder is practicing their investor pitch.

The investor asked: "${lastQuestion ?? "Tell me about your startup."}"

The founder answered: "${content.slice(0, 400)}"

Give them 1-2 sentences of coaching in simple, plain English:
- Be honest but kind
- Point out the ONE most important thing to improve
- Keep it short (under 35 words total)
- No jargon, no complex words
- Sound like a helpful coach, not a professor

Extra context: confidence score ${scores.confidence}/100, clarity score ${scores.clarity}/100, filler words used: ${scores.fillerWords}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_completion_tokens: 80,
    messages: [{ role: "user", content: prompt }],
  });
  return response.choices[0]?.message?.content?.trim() ?? "";
}

export async function scoreAndCoachTurn(
  content: string,
  lastQuestion?: string,
): Promise<{ feedback: string; confidence: number; clarity: number; fillerWords: number }> {
  const scores = scorePitchTurn(content);
  try {
    const aiFeedback = await generateAIFeedback(content, lastQuestion, scores);
    if (aiFeedback && aiFeedback.length > 10) {
      return { ...scores, feedback: aiFeedback };
    }
  } catch (err) {
    console.error("AI feedback failed, using heuristic:", err);
  }
  return scores;
}

export interface SessionMistake {
  title: string;
  description: string;
  suggestion: string;
  severity: "low" | "medium" | "high";
}

export function summarizeSession(
  userTurns: Array<{
    content: string;
    confidence: number | null;
    clarity: number | null;
    fillerWords: number | null;
  }>,
): {
  overallScore: number;
  confidenceScore: number;
  clarityScore: number;
  investorReadiness: number;
  summary: string;
  mistakes: SessionMistake[];
} {
  if (userTurns.length === 0) {
    return {
      overallScore: 50,
      confidenceScore: 50,
      clarityScore: 50,
      investorReadiness: 50,
      summary: "No answers were recorded. Start a new session and pitch at least once to get real feedback.",
      mistakes: [],
    };
  }

  const avg = (vals: (number | null)[]) => {
    const filtered = vals.filter((v): v is number => typeof v === "number");
    if (filtered.length === 0) return 60;
    return Math.round(filtered.reduce((a, b) => a + b, 0) / filtered.length);
  };

  const confidenceScore = avg(userTurns.map((t) => t.confidence));
  const clarityScore = avg(userTurns.map((t) => t.clarity));
  const totalFillers = userTurns.reduce((a, t) => a + (t.fillerWords ?? 0), 0);
  const investorReadiness = Math.max(
    25,
    Math.min(99, Math.round(confidenceScore * 0.45 + clarityScore * 0.45 - totalFillers * 1.5)),
  );
  const overallScore = Math.round(
    confidenceScore * 0.35 + clarityScore * 0.35 + investorReadiness * 0.3,
  );

  const mistakes: SessionMistake[] = [];

  if (totalFillers > 5) {
    mistakes.push({
      title: "Too many filler words",
      description: `You said filler words like "um", "like", or "basically" ${totalFillers} times. Investors notice this and read it as nervousness.`,
      suggestion: "Practice pausing instead of filling silence. Record yourself answering one question with zero fillers.",
      severity: totalFillers > 10 ? "high" : "medium",
    });
  }

  if (confidenceScore < 65) {
    mistakes.push({
      title: "Sounded unsure",
      description: "You used phrases like 'I think', 'maybe', or 'hopefully' — these make you sound like you don't fully believe in your own idea.",
      suggestion: "Start each answer with a strong, clear statement. Lead with what you know, not what you hope.",
      severity: "high",
    });
  }

  if (clarityScore < 65) {
    mistakes.push({
      title: "Hard to follow",
      description: "Some answers were too long or went in circles. The investor probably lost track of your main point.",
      suggestion: "Use this pattern for every answer: one clear claim, one proof, one sentence on why it matters. Then stop.",
      severity: "medium",
    });
  }

  const shortTurns = userTurns.filter((t) => t.content.trim().split(/\s+/).length < 25).length;
  if (shortTurns >= Math.max(2, userTurns.length / 2)) {
    mistakes.push({
      title: "Answers were too short",
      description: "Several of your answers were too brief. Investors need the what, the why, and the proof in every answer.",
      suggestion: "For each question, add one concrete example and one number. That alone will double the quality of your answer.",
      severity: "medium",
    });
  }

  const summary =
    overallScore >= 80
      ? "Great session! You sounded like a founder who knows their stuff. Focus on ending each answer with your strongest sentence."
      : overallScore >= 65
        ? "Good start. Your confidence and clarity are developing — bring in more specific numbers and facts next time."
        : "You've got work to do, but so did every great founder at the start. Drill the opening sentence of each answer until it feels natural.";

  return { overallScore, confidenceScore, clarityScore, investorReadiness, summary, mistakes };
}

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  try {
    const { buffer, format } = await ensureCompatibleFormat(audioBuffer);
    return await speechToText(buffer, format);
  } catch (err) {
    console.error("STT failed:", err);
    return "";
  }
}

export async function generateInvestorAudio(text: string, _language?: string): Promise<Buffer | null> {
  try {
    return await textToSpeech(text, "onyx", "mp3");
  } catch (err) {
    console.error("TTS failed:", err);
    return null;
  }
}

export const MAX_SESSION_TURNS = 7;
