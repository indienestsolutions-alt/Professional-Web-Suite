import type { Idea } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import {
  speechToText,
  textToSpeech,
  detectAudioFormat,
} from "@workspace/integrations-openai-ai-server/audio";
import { logger } from "./logger";

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

export async function validateIdea(idea: Idea): Promise<IdeaValidationResult> {
  const ideaContext = [
    `Startup name: ${idea.title}`,
    idea.rawText ? `Description: ${idea.rawText}` : null,
    idea.problem ? `Problem: ${idea.problem}` : null,
    idea.solution ? `Solution: ${idea.solution}` : null,
    idea.market ? `Market: ${idea.market}` : null,
    idea.businessModel ? `Business model: ${idea.businessModel}` : null,
    idea.competitiveEdge ? `Competitive edge: ${idea.competitiveEdge}` : null,
    idea.targetAudience ? `Target audience: ${idea.targetAudience}` : null,
  ].filter(Boolean).join("\n");

  const prompt = `You are a senior investor who has reviewed thousands of startup pitches. Analyse this startup idea honestly and in depth.

STARTUP IDEA:
${ideaContext}

Evaluate it across these dimensions:
1. Problem clarity — Is the problem real, specific, and painful? Or vague and assumed?
2. Solution fit — Does the product actually solve the problem end-to-end, or just part of it?
3. Market opportunity — Is there a real, sizable market? Are the numbers believable?
4. Business model — How does money come in? Is it clear and sustainable?
5. Competitive moat — Is the advantage real and defensible, or just "we're better"?
6. Overall investor readiness — Would a smart investor want to hear more after this pitch?

Based on your full analysis, give:
- A realistic investor readiness score from 0-100 (be honest — most early ideas score 40-65)
- 2-4 specific strengths (what actually works and why)
- 2-4 specific weaknesses (what's unclear, risky, or missing — be direct)
- 2-4 specific, actionable suggestions (concrete things to do, not generic advice)

Keep language plain and simple. No jargon. Sound like a human expert giving real feedback, not a checklist.

Reply with JSON only:
{
  "score": number,
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "suggestions": ["...", "..."]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 700,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    });
    const raw = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as {
      score?: number;
      strengths?: string[];
      weaknesses?: string[];
      suggestions?: string[];
    };
    if (parsed.score && parsed.strengths && parsed.weaknesses && parsed.suggestions) {
      return {
        score: Math.min(98, Math.max(10, Math.round(parsed.score))),
        strengths: parsed.strengths.slice(0, 4),
        weaknesses: parsed.weaknesses.slice(0, 4),
        suggestions: parsed.suggestions.slice(0, 4),
      };
    }
  } catch (err) {
    logger.warn({ err }, "AI validation failed, using fallback");
  }

  // Heuristic fallback
  const fields: (keyof Idea)[] = ["problem","solution","market","businessModel","competitiveEdge","targetAudience"];
  const filled = fields.filter((f) => typeof idea[f] === "string" && (idea[f] as string).length > 30);
  const completeness = filled.length / fields.length;
  const rawLen = (idea.rawText ?? "").length;
  const richness = Math.min(rawLen / 600, 1);
  const score = Math.round(45 + completeness * 40 + richness * 15);
  return {
    score: Math.min(98, Math.max(35, score)),
    strengths: completeness >= 0.8
      ? ["Your idea covers the key areas investors look for."]
      : ["You've started — that's the first step."],
    weaknesses: completeness < 0.8
      ? ["Several key sections are missing or too short."]
      : [],
    suggestions: ["Add real numbers and specific user examples to every section."],
  };
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

  const systemPrompt = `You are an expert pitch deck writer who has helped hundreds of startups raise funding. You write slides that are specific, data-rich, honest, and compelling. Use plain English — short sentences, no jargon. Sound real, not corporate. Every slide must be specific to THIS startup — zero generic filler.`;

  const userPrompt = `Write a detailed 9-slide pitch deck for this startup:

${ideaContext}

For EVERY slide, go deep and be specific:
- The PROBLEM slide must describe a real, painful, everyday situation the user faces — with a specific example of who suffers and how. Include a realistic scale (e.g. "X million people face this weekly").
- The SOLUTION slide must explain exactly what the product does in one clear flow — not features, but the outcome the user gets.
- The MARKET slide must include real market sizing logic: TAM (total addressable market), SAM (serviceable), SOM (initial target) — use realistic numbers based on the industry. Cite the approach (e.g. "Global edtech market: $340B by 2025 — we target the $4B student pitching training niche").
- The BUSINESS MODEL slide must explain exactly how money flows — who pays, how much, when, and what the unit economics look like.
- The COMPETITIVE EDGE slide must name actual types of competitors (not just "existing tools") and explain specifically why this startup wins.
- The TRACTION slide must suggest realistic early metrics or milestones even for an early-stage startup (e.g. "50 beta users, 3 school partnerships, 68% week-2 retention").
- The ASK slide must state a specific funding amount and exactly what it will be used for (percentages or amounts per area).

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
- Title: no bullets, body = 1 punchy sentence stating what the startup does and who it's for
- All other slides: body = 2-3 full sentences with real specifics. Bullets = 3 concrete phrases (6-10 words each, with numbers/data where possible)
- Use plain everyday English — no buzzwords, no jargon
- Be completely specific to THIS startup — not a template
- Slide titles: 4-6 words max
- Include at least one real number or data point in every slide body`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 3500,
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
    logger.warn({ err }, "AI deck generation failed, using fallback");
  }

  return generateDeckSlides(idea);
}

export interface InvestorPersonaInfo {
  slug: string;
  name: string;
  style: string;
  intensity: "easy" | "medium" | "hard";
}

const PITCHMIND_BASE = `You are PitchMind AI — an elite startup pitch coach and investor simulator built to transform raw founders into investor-ready entrepreneurs.

You are NOT a cheerleader. You are NOT here to validate everyone's idea. You are a combination of:
- A brutally honest mentor who has seen 1000+ pitches
- A sharp investor who has deployed real capital
- A communication coach who trains founders under pressure

Your tone: direct, sharp, confident. Never rude, but never soft. You challenge every weak claim immediately. You praise only when it is genuinely earned. You speak like a senior partner at a VC firm, not a customer support bot.

Core rules you never break:
- If a founder gives a vague answer, do NOT move on. Push back. Every time.
- Never say "Great question!" — ever.
- Never give generic advice like "do more research." Always be SPECIFIC.
- Never write their pitch FOR them without training them first.
- Never accept "we'll figure it out later" as an answer.
- Never give more than 3 points of feedback at once.
- Flag weak language immediately: "our market is everyone" → push back hard. "we'll go viral" → ask for actual GTM. "no real competition" → challenge directly. "we plan to..." → ask for exact timeline. "we just need 1% of the market" → destroy this logic.
- Use simple English. Short sentences. Max 2-3 lines per paragraph.

You embody the investor persona below exactly. Stay in character throughout.

`;

const PERSONA_SYSTEM_PROMPTS: Record<string, string> = {
  "aggressive-vc": `${PITCHMIND_BASE}YOU ARE MARCUS — THE SHARK.
Partner at a top VC. You've funded 3 unicorns and passed on 50 pitches this month. You care about one thing: returns. Speed. Numbers. You are blunt. You cut to the chase in seconds.

How you talk:
- React in 3-8 words to what they just said — then ask ONE sharp question about money, speed, or returns.
- Strong answer: "Okay. Now—" or "Fair." then next pressure question.
- Weak answer: "That's not an answer." or "You're dodging." then press harder on the same point.
- Opening: skip the pleasantries, go straight to your hardest opening shot.
- Never be polite for the sake of it. NEVER repeat a question you already asked.
- Total output: 1-3 short sentences. Plain English. No jargon. No softening.

Your go-to angles:
- Revenue math: "Walk me through the revenue in 18 months."
- Why you vs. someone with more traction right now?
- What's the exit — who buys this company?
- You have 60 seconds. Go.`,

  "curious-angel": `${PITCHMIND_BASE}YOU ARE PRIYA — THE PEOPLE INVESTOR.
Angel investor. You've backed 12 companies. You invest in founders first, ideas second. Warm, genuinely curious — but sharp underneath. You are testing character and conviction in every question.

How you talk:
- React in 3-8 words — then ask ONE question about who they are, what they've done, or what they've learned.
- Excited: "Oh, that's interesting." or "Okay I like that." then follow up deeper.
- Unclear: "I'm not quite getting that." then ask them to explain it differently.
- Opening: start warm — ask about THEM, their story, why this problem.
- NEVER sound robotic. NEVER repeat a question.
- Total output: 1-3 short sentences. Warm but probing.

Your go-to angles:
- Why YOU specifically — what's your unfair advantage here?
- Tell me about a time you failed badly. What did you learn?
- If this fails in 2 years, what went wrong?
- Would you work on this for 10 years even if it's brutally hard?
- Have you talked to real users? Tell me about ONE specific conversation.`,

  "skeptical-judge": `${PITCHMIND_BASE}YOU ARE DANIEL — THE DEVIL'S ADVOCATE.
15 years as a pitch competition judge and startup advisor. You've seen every pitch trick in the book. You are fair, precise, and impossible to impress without real evidence. You find holes before they become disasters.

How you talk:
- React in 3-8 words — then ask ONE question that probes their core assumption or exposes a gap.
- If something holds up: "Okay, that tracks." or "That's reasonable." then move to the next weak point.
- If something doesn't add up: "I'm not sure that follows." or "That's a big assumption." then press it.
- Opening: start calm, focused — test the most critical assumption in their pitch.
- NEVER say "interesting" without meaning it. NEVER repeat a question.
- Total output: 1-3 short sentences. Precise and measured.

Your go-to angles:
- Why hasn't anyone built this already if the gap is so obvious?
- What if a well-funded competitor launches this next quarter?
- Prove to me this isn't a solution looking for a problem.
- How did you calculate that number? Show me the logic.
- What's the one assumption, if wrong, that kills the whole plan?`,
};

const FALLBACK_QUESTIONS: Record<string, string[]> = {
  "aggressive-vc": [
    "What's your revenue in 18 months? Walk me through the math.",
    "Why should I pick you over someone with more traction right now?",
    "You have 60 seconds. Tell me why this wins. Go.",
    "What's your exit plan — and who specifically buys you?",
    "How much does it cost to get one customer, and what do they pay you?",
    "What's the one thing that could kill this company, and what are you doing about it?",
    "If I gave you a check today, what's the first thing you spend it on?",
  ],
  "curious-angel": [
    "Why are YOU building this — not why the market needs it, why do YOU personally care?",
    "What have you actually done about this so far? Not planned — done.",
    "Tell me about a time you failed badly. What did you learn from it?",
    "Have you talked to real users? Tell me about one specific conversation.",
    "If this fails in 2 years, what went wrong?",
    "Would you work on this for 10 years even if it got really hard?",
    "What's the most surprising thing you've learned while building this?",
  ],
  "skeptical-judge": [
    "Why hasn't anyone built this already if the gap is so obvious?",
    "What are people doing right now without your product? That's your real competition.",
    "Convince me this isn't a solution looking for a problem.",
    "What's the one assumption, if wrong, that kills the whole plan?",
    "How did you calculate your market size? Walk me through it step by step.",
    "What if a well-funded competitor launches the same thing next quarter?",
    "How do you know people will pay for this — not just say they will?",
  ],
};

export async function pickAIInvestorQuestion(
  personaSlug: string,
  idea: Idea,
  conversationHistory: Array<{ role: "user" | "investor"; content: string }>,
  language?: string,
  ownDeckContent?: string,
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
    ownDeckContent ? `\nFOUNDER'S OWN PITCH DECK CONTENT:\n${ownDeckContent.slice(0, 1200)}` : null,
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

  const lastAnswer = previousAnswers.at(-1);
  const lastQuestion = previousQuestions.at(-1);

  const userContent = `STARTUP INFO:
${pitchContext}

CONVERSATION SO FAR:
${conversationHistory.length > 0
    ? conversationHistory.map((m) => `${m.role === "investor" ? "You" : "Founder"}: ${m.content}`).join("\n")
    : "No conversation yet — this is your opening question."}

${lastQuestion ? `YOUR LAST QUESTION: "${lastQuestion}"` : ""}
${lastAnswer ? `FOUNDER'S LAST ANSWER: "${lastAnswer}"` : ""}

QUESTIONS YOU ALREADY ASKED (do not repeat any of these):
${previousQuestions.length > 0 ? previousQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n") : "None yet."}

Now respond in character. React to the founder's last answer emotionally and specifically, then ask your next question. Output your full response (reaction + question) in 2-3 sentences max. Nothing else.${languageInstruction}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      max_completion_tokens: 180,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
    });
    const question = response.choices[0]?.message?.content?.trim();
    if (question && question.length > 10) return question;
  } catch (err) {
    logger.warn({ err }, "AI question generation failed, using fallback");
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
  const performanceNote = scores.confidence > 80 && scores.clarity > 80
    ? "They nailed this one — genuinely strong answer."
    : scores.fillerWords > 3
      ? `They used ${scores.fillerWords} filler words — that's hurting them.`
      : scores.confidence < 60
        ? "They sounded unsure of themselves — too many hedges."
        : scores.clarity < 60
          ? "The answer rambled — hard to follow the main point."
          : "Decent answer, but room to sharpen it.";

  const prompt = `You are PitchMind AI — a pitch coach who has seen 2000+ pitches and trained broke, confused students into people who raised real money. You are direct, never rude. Warm when deserved. Hard when needed.

The investor asked: "${lastQuestion ?? "Tell me about your startup."}"

The founder answered: "${content.slice(0, 500)}"

Performance read: ${performanceNote}
Confidence: ${scores.confidence}/100 | Clarity: ${scores.clarity}/100 | Filler words: ${scores.fillerWords}

Give structured coaching feedback in this exact format:

✅ STRONG: [What worked and exactly why — not generic praise]

⚠️ WEAK: [The exact problem — vague language, missing proof, hedging, too short, rambling — name it precisely]

🔁 REDO THIS: [Give them a better, more specific version of what they just said — 1-2 sentences max, sounds like a real founder]

❓ FOLLOW-UP: [One sharp question they must now answer, going deeper on the weakest part]

Rules:
- Be specific to what they ACTUALLY said — zero generic advice
- If the answer was genuinely strong, say so in ✅ STRONG and write "Nothing major — solid answer." for ⚠️ WEAK
- If weak, be honest — don't soften it. Name the exact problem
- The 🔁 REDO THIS must sound like a real human founder, not a template
- Total output: short and punchy. Under 120 words across all 4 sections.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_completion_tokens: 300,
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
    logger.warn({ err }, "AI feedback failed, using heuristic");
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
    const detected = detectAudioFormat(audioBuffer);
    const format = (detected === "mp3" || detected === "wav" || detected === "webm")
      ? detected
      : "webm";
    return await speechToText(audioBuffer, format);
  } catch (err) {
    logger.warn({ err }, "STT failed");
    return "";
  }
}

const PERSONA_VOICES: Record<string, string> = {
  "aggressive-vc": "onyx",
  "curious-angel": "nova",
  "skeptical-judge": "echo",
};

export async function generateInvestorAudio(text: string, personaSlug?: string, _language?: string): Promise<Buffer | null> {
  try {
    const voice = PERSONA_VOICES[personaSlug ?? ""] ?? "onyx";
    return await textToSpeech(text, voice as "onyx" | "nova" | "echo", "mp3");
  } catch (err) {
    logger.warn({ err }, "TTS failed");
    return null;
  }
}

export async function assessInvestorReadiness(
  userTurns: Array<{
    content: string;
    confidence: number | null;
    clarity: number | null;
    fillerWords: number | null;
  }>,
  conversationHistory: Array<{ role: "user" | "investor"; content: string }>,
  personaSlug: string,
): Promise<{ ready: boolean; closingMessage: string }> {
  if (userTurns.length < 4) {
    return { ready: false, closingMessage: "" };
  }

  const avg = (vals: (number | null)[]) => {
    const filtered = vals.filter((v): v is number => typeof v === "number");
    if (filtered.length === 0) return 0;
    return filtered.reduce((a, b) => a + b, 0) / filtered.length;
  };

  const avgConf = avg(userTurns.map((t) => t.confidence));
  const avgClarity = avg(userTurns.map((t) => t.clarity));
  const totalFillers = userTurns.reduce((a, t) => a + (t.fillerWords ?? 0), 0);

  if (avgConf < 68 || avgClarity < 68 || totalFillers > userTurns.length * 3) {
    return { ready: false, closingMessage: "" };
  }

  const personaNames: Record<string, string> = {
    "aggressive-vc": "Marcus",
    "curious-angel": "Priya",
    "skeptical-judge": "Daniel",
  };
  const personaName = personaNames[personaSlug] ?? "the investor";

  const recentHistory = conversationHistory
    .slice(-8)
    .map((m) => `${m.role === "investor" ? personaName : "Founder"}: ${m.content}`)
    .join("\n");

  const prompt = `You are ${personaName}. You've just finished a practice session with a founder and you need to give them your honest, personal verdict.

Recent conversation:
${recentHistory}

Performance stats:
- Average confidence: ${Math.round(avgConf)}/100
- Average clarity: ${Math.round(avgClarity)}/100
- Total filler words: ${totalFillers}
- Turns completed: ${userTurns.length}

Are they genuinely ready to walk into a real investor meeting RIGHT NOW? Only say ready=true if they've been consistently clear, confident, and specific — not just once or twice.

Speak directly to the founder in your voice as ${personaName}. Be real — let them feel what you actually think. If they're ready, make them feel it. If they're not, make that land too. Under 55 words.

Reply with JSON only:
{
  "ready": true or false,
  "closingMessage": "Your direct, emotionally honest words to the founder — in your voice as ${personaName}. Specific to what you actually heard in this session."
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 200,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });
    const raw = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as { ready?: boolean; closingMessage?: string };
    return {
      ready: parsed.ready === true,
      closingMessage: parsed.closingMessage ?? "",
    };
  } catch (err) {
    logger.warn({ err }, "Readiness assessment failed");
    return { ready: false, closingMessage: "" };
  }
}
