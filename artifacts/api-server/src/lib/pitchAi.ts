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

  const problem = `Today, ${audience} struggle with the gap that "${title}" addresses. ${lead} The current options force people to stitch together generic tools, which is slow, frustrating, and produces inconsistent results.`;
  const solution = `${title} is a focused, opinionated platform that turns scattered effort into a clear workflow. It blends ${k} into a single experience so users can move from intent to outcome in minutes instead of weeks, with intelligent defaults that get out of the way.`;
  const market = `The opportunity sits at the intersection of ${k}. Even a conservative slice of ${audience} represents a meaningful initial wedge, with room to expand into adjacent segments as the product matures.`;
  const businessModel = `Freemium core with paid upgrades for power users and teams. Free tier covers everyday use and drives organic adoption; paid tiers unlock advanced workflows, collaboration, and priority support. Long term: school and organization plans, plus partnerships with incubators and ecosystem players.`;
  const competitiveEdge = `Unlike generic tools that handle one slice of the journey, ${title} owns the full loop end to end. The result is a sharper experience, faster results, and a defensible moat built from compounding workflow data and feedback.`;

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
    strengths.push("Idea is well structured across the core founder canvas.");
  } else {
    weaknesses.push("Several core sections are missing or thin (problem, solution, market, business model, edge, audience).");
    suggestions.push("Run the AI structuring step, then sharpen each section with one concrete example or number.");
  }

  if (richness >= 0.6) {
    strengths.push("The raw description gives the AI enough context to reason about details.");
  } else {
    weaknesses.push("Raw idea description is short — investors will need more context to grade you.");
    suggestions.push("Expand the raw idea: who is the user, what is the moment of pain, and why now.");
  }

  if (idea.competitiveEdge && idea.competitiveEdge.length > 60) {
    strengths.push("You have a stated competitive edge — investors test this hard.");
  } else {
    weaknesses.push("Competitive edge is unclear or generic.");
    suggestions.push("Name your unfair advantage in one sentence: a workflow, dataset, distribution, or insight only you have.");
  }

  if (idea.businessModel && idea.businessModel.toLowerCase().includes("free")) {
    suggestions.push("Quantify your freemium funnel: what % of free users convert, and to what ARPU.");
  }

  if (strengths.length === 0) strengths.push("You showed up and put a real idea on the page — that's step one.");

  return { score: Math.min(98, Math.max(35, score)), strengths, weaknesses, suggestions };
}

export function generateDeckSlides(idea: Idea): {
  title: string;
  storyline: string;
  slides: DeckSlide[];
} {
  const title = `${idea.title} — Pitch Deck`;
  const storyline = `Open on the human problem, reveal the gap nobody is closing, show the solution as the inevitable answer, prove the market and business model, end on the ask.`;

  const slides: DeckSlide[] = [
    {
      title: idea.title,
      body: `Transforming ${idea.targetAudience ?? "the user's world"} with a focused, end-to-end experience.`,
      layout: "title",
    },
    {
      title: "The Problem",
      body: idea.problem ?? "Users today struggle with a workflow that nobody owns end to end.",
      layout: "problem",
      bullets: [
        "Pain is daily and unmistakable",
        "Existing tools are partial and disconnected",
        "Time and confidence are bleeding out of the process",
      ],
    },
    {
      title: "Our Solution",
      body: idea.solution ?? "A single product that owns the full journey, not just one step.",
      layout: "solution",
      bullets: [
        "Intelligent defaults that get out of the way",
        "Workflow that feels obvious once you've used it",
        "Built for the people actually doing the work",
      ],
    },
    {
      title: "Market",
      body: idea.market ?? "An opportunity at the intersection of clear demand and underserved supply.",
      layout: "market",
      bullets: ["TAM expanding", "Wedge audience identified", "Adjacent segments warm"],
    },
    {
      title: "Business Model",
      body: idea.businessModel ?? "Freemium core, paid upgrades for advanced workflows, organization plans for distribution.",
      layout: "business",
      bullets: ["Free tier drives adoption", "Paid tier monetizes power users", "Org plans drive land-and-expand"],
    },
    {
      title: "Competitive Edge",
      body: idea.competitiveEdge ?? "Unlike point tools, we own the full loop — and the data that compounds inside it.",
      layout: "edge",
      bullets: ["End-to-end ownership", "Compounding data moat", "Tighter feedback loop"],
    },
    {
      title: "Demo",
      body: "Live walkthrough of the core flow: from raw input to polished outcome in under three minutes.",
      layout: "demo",
    },
    {
      title: "Traction & Roadmap",
      body: "Early signal: real users, real ideas, real pitches. Next: deeper personalization, team mode, and ecosystem partnerships.",
      layout: "traction",
      bullets: ["Active builders this month", "Sessions per active user trending up", "Roadmap aligned to user-stated needs"],
    },
    {
      title: "The Ask",
      body: "Join us in arming the next generation of founders with the tools to think, pitch, and defend their ideas like the pros.",
      layout: "ask",
      bullets: ["Strategic partners", "Pilot schools and incubators", "Seed capital to expand the product surface"],
    },
  ];

  return { title, storyline, slides };
}

export interface InvestorPersonaInfo {
  slug: string;
  name: string;
  style: string;
  intensity: "easy" | "medium" | "hard";
}

const PERSONA_SYSTEM_PROMPTS: Record<string, string> = {
  "aggressive-vc": `You are an aggressive, high-stakes venture capitalist. You challenge every claim with sharp, pointed questions. You care about defensibility, unit economics, and why this won't get crushed by incumbents. You speak with authority and directness. Never let a weak answer slide.`,
  "curious-angel": `You are a curious, empathetic angel investor. You ask thoughtful questions about the founder's motivation, user insights, and what they've learned. You care about the founder-market fit and the human story behind the startup.`,
  "skeptical-judge": `You are a skeptical pitch competition judge. You require evidence for every claim. You challenge assumptions, ask for data, and probe for the weakest point in the thesis. You are fair but unforgiving of vague answers.`,
};

const FALLBACK_QUESTIONS: Record<string, string[]> = {
  "aggressive-vc": [
    "Why won't a well-funded incumbent crush you in six months?",
    "What is the one number that, if it doesn't move, kills this company?",
    "Walk me through unit economics. CAC, LTV, payback — be specific.",
    "If I gave you one million dollars right now, what's the first hire and why?",
    "What part of this pitch did you rehearse the most? Skip it — convince me without it.",
  ],
  "curious-angel": [
    "What's the moment you knew this was worth quitting everything for?",
    "Tell me about the user you've spoken to who needed this most.",
    "What's the most surprising thing you've learned building this?",
    "If we shipped tomorrow, what's the first thing a user would feel?",
    "What part of this scares you the most, honestly?",
  ],
  "skeptical-judge": [
    "What's your evidence that the problem is real and not just annoying?",
    "Three competitors do part of this. Why is your wedge defensible?",
    "What assumption, if wrong, breaks the whole thesis?",
    "How do you know your target audience will pay, not just download?",
    "What's the honest reason this hasn't been built yet?",
  ],
};

export async function pickAIInvestorQuestion(
  personaSlug: string,
  idea: Idea,
  conversationHistory: Array<{ role: "user" | "investor"; content: string }>,
  language?: string
): Promise<string> {
  const systemPrompt = PERSONA_SYSTEM_PROMPTS[personaSlug] ?? PERSONA_SYSTEM_PROMPTS["curious-angel"]!;

  const pitchContext = [
    idea.title ? `Startup: ${idea.title}` : null,
    idea.problem ? `Problem: ${idea.problem}` : null,
    idea.solution ? `Solution: ${idea.solution}` : null,
    idea.market ? `Market: ${idea.market}` : null,
    idea.businessModel ? `Business Model: ${idea.businessModel}` : null,
    idea.competitiveEdge ? `Competitive Edge: ${idea.competitiveEdge}` : null,
    idea.targetAudience ? `Target Audience: ${idea.targetAudience}` : null,
  ].filter(Boolean).join("\n");

  const previousQuestions = conversationHistory
    .filter((m) => m.role === "investor")
    .map((m) => m.content);

  const previousAnswers = conversationHistory
    .filter((m) => m.role === "user")
    .map((m) => m.content);

  const languageInstruction = language && language !== "en"
    ? `\nIMPORTANT: Respond in the same language as the founder. Detected language: ${language}. Ask your question in that language.`
    : "";

  const userContent = `PITCH CONTEXT:
${pitchContext}

CONVERSATION SO FAR (investor questions already asked):
${previousQuestions.length > 0 ? previousQuestions.map((q, i) => `Q${i + 1}: ${q}`).join("\n") : "This is the first question."}

FOUNDER RESPONSES SO FAR:
${previousAnswers.length > 0 ? previousAnswers.map((a, i) => `A${i + 1}: ${a}`).join("\n") : "No answers yet."}

Generate ONE sharp investor question based on:
1. The specific content of their pitch (reference actual details they've shared)
2. Their most recent answer — probe weaknesses or follow up on claims
3. Do NOT repeat or paraphrase previous questions
4. Be specific to THIS startup, not generic
5. Maximum 2 sentences

Just output the question, nothing else.${languageInstruction}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.1",
      max_completion_tokens: 200,
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
    feedback = "Sharp delivery — your point landed in one breath. Keep that pace and tighten one specific number into the next answer.";
  } else if (fillerWords > 3) {
    feedback = `You leaned on filler words ${fillerWords} times. Pause instead — silence reads as confidence, hedging reads as doubt.`;
  } else if (hedgeCount > 1) {
    feedback = "Drop the hedging language. Replace 'I think' with 'we know' and back it with one concrete data point.";
  } else if (avgSentenceLength > 25) {
    feedback = "Sentences are running long. Cut each one in half — investors lose your thesis when you stack clauses.";
  } else if (wordCount < 25) {
    feedback = "Too short. Investors need the why, the what, and the proof in one breath. Add a concrete example.";
  } else {
    feedback = "Solid turn. Tighten the close — finish on the strongest sentence, not the longest one.";
  }

  return { feedback, confidence, clarity, fillerWords };
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
      summary: "No user turns recorded — start a new session and pitch at least once to get a real read.",
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
      description: `You used ${totalFillers} filler words across the session. Investors register every "um" as hesitation.`,
      suggestion: "Replace filler with a half-second pause. Practice three answers out loud with no fillers at all.",
      severity: totalFillers > 10 ? "high" : "medium",
    });
  }

  if (confidenceScore < 65) {
    mistakes.push({
      title: "Low confidence signal",
      description: "Your phrasing leaned on hedging like 'I think' and 'maybe'. That tells the room you don't fully believe the thesis.",
      suggestion: "Rewrite each answer to lead with a definitive statement. Open with the strongest sentence, not the safest.",
      severity: "high",
    });
  }

  if (clarityScore < 65) {
    mistakes.push({
      title: "Hard-to-follow structure",
      description: "Several answers ran long or buried the point. The investor lost the thesis halfway through.",
      suggestion: "Use the formula: claim, proof, why-it-matters. One sentence each. Stop talking after the third.",
      severity: "medium",
    });
  }

  const shortTurns = userTurns.filter((t) => t.content.trim().split(/\s+/).length < 25).length;
  if (shortTurns >= Math.max(2, userTurns.length / 2)) {
    mistakes.push({
      title: "Answers under-developed",
      description: "You answered in fragments. Investors need the what, the why, and the proof — every time.",
      suggestion: "For each question, force yourself to add one concrete example, one number, and one sentence about what it means.",
      severity: "medium",
    });
  }

  const summary =
    overallScore >= 80
      ? "Strong session. You sounded like a founder who has done the reps. Focus on tightening the close on each answer."
      : overallScore >= 65
        ? "Solid foundation. Confidence and clarity are workable — bring more concrete numbers and sharper closes next time."
        : "Real work to do, but every founder starts here. Drill the opening sentence of each answer until it's reflexive.";

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

export const MAX_SESSION_TURNS = 5;
