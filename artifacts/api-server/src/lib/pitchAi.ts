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
  stat?: string;
  statLabel?: string;
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

  const prompt = `You are a seasoned venture capitalist who has reviewed 3,000+ startup pitches and deployed over $500M in capital. Analyze this startup idea with the rigor of a real funding decision — not a hackathon judge.

STARTUP IDEA:
${ideaContext}

Deep analysis across these investment dimensions:
1. Problem clarity & pain depth — Is the problem real, urgent, and painful enough to pay for? Or is it a vitamin, not a painkiller?
2. Solution fit — Does the product actually solve the problem completely, or just partially? What's the MVP scope?
3. Market opportunity — TAM/SAM/SOM logic. Are the numbers believable? Is this a billion-dollar market?
4. Business model — Unit economics, LTV/CAC, monetization clarity. How does this become a $100M revenue business?
5. Competitive moat — Network effects, data advantages, switching costs, IP? Or just "better UX"?
6. Founder-market fit — Does the team have an unfair advantage here? (if evident from context)
7. Overall investor readiness — Would a Series A VC take a follow-up meeting after this pitch?

Give:
- A realistic investor readiness score 0-100 (be honest — most early ideas score 35-60, great ones hit 70-80)
- 2-4 specific strengths (what actually works and why a smart investor would care)
- 2-4 specific weaknesses (what's unclear, risky, or missing — be direct and specific)
- 2-4 concrete, actionable suggestions (exact things to do in the next 30 days, not generic advice)

Language: plain English, short sentences. Sound like a human VC partner, not a checklist. Be specific to THIS startup, not generic.

Reply with JSON only:
{
  "score": number,
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "suggestions": ["...", "..."]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      max_completion_tokens: 900,
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

async function researchMarket(idea: Idea): Promise<string> {
  const ideaContext = [
    `Startup: ${idea.title}`,
    idea.rawText ? `Description: ${idea.rawText.slice(0, 600)}` : null,
    idea.problem ? `Problem: ${idea.problem}` : null,
    idea.solution ? `Solution: ${idea.solution}` : null,
    idea.market ? `Market context: ${idea.market}` : null,
    idea.targetAudience ? `Target: ${idea.targetAudience}` : null,
  ].filter(Boolean).join("\n");

  const prompt = `You are a market research analyst at a top VC firm. Based on this startup idea, produce a concise but data-rich market research brief that will inform the pitch deck content.

STARTUP:
${ideaContext}

Research and produce:
1. TAM (Total Addressable Market) — realistic global market size with a specific dollar figure and source/logic
2. SAM (Serviceable Addressable Market) — realistic segment this startup can reach in 3-5 years
3. SOM (Serviceable Obtainable Market) — realistic first-year or first-18-month target with % capture logic
4. Growth rate — annual market CAGR with rationale
5. Key market trends — 3 specific trends making this the right time to build this
6. Top competitors — 3-4 real competitor types (name categories, not made-up companies) and their weakness
7. Why now — 2-3 specific reasons why this market is ready NOW (technology, behavior change, regulation shift, etc.)
8. Customer pain severity — 1-5 scale with specific evidence
9. Realistic revenue milestones — Year 1, Year 2, Year 3 projections with assumptions

Be specific. Use real market data and logic. If you don't have exact numbers, use best-available estimates with clear reasoning. This will be used to write a real pitch deck.

Reply in JSON:
{
  "tam": "string with dollar amount and reasoning",
  "sam": "string with dollar amount and reasoning",
  "som": "string with dollar amount and reasoning",
  "cagr": "string with % and reasoning",
  "trends": ["trend 1", "trend 2", "trend 3"],
  "competitors": [{"name": "category", "weakness": "why they lose"}],
  "whyNow": ["reason 1", "reason 2"],
  "painSeverity": number,
  "revenueMilestones": {"year1": "string", "year2": "string", "year3": "string"}
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      max_completion_tokens: 1200,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    });
    return response.choices[0]?.message?.content ?? "{}";
  } catch (err) {
    logger.warn({ err }, "Market research failed");
    return "{}";
  }
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
      title: "Market Opportunity",
      body: idea.market ?? "A clear group of people who need this and are ready to pay for it.",
      layout: "market",
      bullets: ["Large and growing market", "Specific starting group identified", "Easy to expand from there"],
    },
    {
      title: "Business Model",
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
      title: "Product Demo",
      body: "Watch the core flow: from a raw idea to a finished result in under three minutes.",
      layout: "demo",
    },
    {
      title: "Traction & Roadmap",
      body: "Early users are active. Next: deeper features, team mode, and key partnerships.",
      layout: "traction",
      bullets: ["Real users, real activity", "Usage growing week over week", "Roadmap built from user feedback"],
    },
    {
      title: "The Ask",
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

  // Run market research in parallel with idea context prep
  const marketResearchRaw = await researchMarket(idea);
  let marketData: Record<string, unknown> = {};
  try {
    marketData = JSON.parse(marketResearchRaw);
  } catch {
    marketData = {};
  }

  const marketContext = Object.keys(marketData).length > 0
    ? `\nMARKET RESEARCH DATA (use these specific numbers in your slides):\n${JSON.stringify(marketData, null, 2)}`
    : "";

  const systemPrompt = `You are a world-class pitch deck writer who has helped startups raise $2B+ in funding. You write slides that are specific, data-rich, brutally honest, and compelling enough to get a follow-up meeting. Every number is real or realistically estimated. Every claim is backed. You sound like a founder who has done their homework — not a student filling a template.

Rules you never break:
- Every slide body has at least ONE specific number or data point
- Every bullet is a complete, specific claim (not a vague phrase)
- No slide uses generic corporate language
- Every slide is completely specific to THIS startup
- Slide titles: 4-6 words maximum
- Bullets: 8-15 words each with numbers wherever possible`;

  const userPrompt = `Write a complete, investor-grade 9-slide pitch deck for this startup.

STARTUP DATA:
${ideaContext}
${marketContext}

SLIDE REQUIREMENTS — be completely specific:

SLIDE 1 (title): Startup name as title. Body = one punchy sentence: what it does, who it's for, and the core value prop. Include "stat" field with one striking number (e.g., "$3.4B market opportunity" or "2M students need this").

SLIDE 2 (problem): Describe a REAL, painful, specific daily situation a real user faces. Name who they are and what exactly happens to them. Include real scale — how many people face this. Bullets = 3 specific pain manifestations with numbers.

SLIDE 3 (solution): Explain exactly what the product does in one clear user flow — from start to outcome. Not features — the transformation. Bullets = 3 outcome statements with measurable improvements.

SLIDE 4 (market): Use the market research data. State TAM/SAM/SOM explicitly. Show the growth rate. Explain why this niche is the right entry point. Bullets = TAM figure, SAM figure, market growth rate. Include "stat" field = SAM number.

SLIDE 5 (business): Explain exactly how money flows — pricing tiers, who pays, when, unit economics. LTV/CAC if estimable. Bullets = 3 specific revenue mechanics with numbers. Include "stat" = target ARR at 18 months.

SLIDE 6 (edge): Name real competitor categories (incumbent tools, direct competitors, DIY alternatives). Explain specifically why this startup wins — network effects, data moat, switching costs, unique access. Bullets = 3 specific moat elements.

SLIDE 7 (demo): Describe the core product flow in 3 steps from the user's perspective. Make it vivid and specific — a real person doing a real thing.

SLIDE 8 (traction): Even for early-stage, give realistic, specific traction data or milestones. Use the market research revenue milestones. Bullets = 3 specific metrics or milestones with numbers and timeframes.

SLIDE 9 (ask): State a specific funding amount with exact breakdown. What milestones will be hit with this capital? Bullets = 3 specific use-of-funds items with % or $ amounts and the milestone each unlocks.

Return JSON only:
{
  "storyline": "2-sentence arc of the deck story",
  "slides": [
    { "layout": "title", "title": "...", "body": "...", "stat": "...", "statLabel": "..." },
    { "layout": "problem", "title": "...", "body": "...", "bullets": ["...", "...", "..."] },
    { "layout": "solution", "title": "...", "body": "...", "bullets": ["...", "...", "..."] },
    { "layout": "market", "title": "...", "body": "...", "bullets": ["...", "...", "..."], "stat": "...", "statLabel": "..." },
    { "layout": "business", "title": "...", "body": "...", "bullets": ["...", "...", "..."], "stat": "...", "statLabel": "..." },
    { "layout": "edge", "title": "...", "body": "...", "bullets": ["...", "...", "..."] },
    { "layout": "demo", "title": "...", "body": "..." },
    { "layout": "traction", "title": "...", "body": "...", "bullets": ["...", "...", "..."], "stat": "...", "statLabel": "..." },
    { "layout": "ask", "title": "...", "body": "...", "bullets": ["...", "...", "..."], "stat": "...", "statLabel": "..." }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      max_completion_tokens: 4000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as { slides?: DeckSlide[]; storyline?: string };

    if (parsed.slides && Array.isArray(parsed.slides) && parsed.slides.length >= 8) {
      const title = `${idea.title} — Pitch Deck`;
      const storyline = parsed.storyline ?? `A clear story: the real problem, the simple solution, why it works, and why now.`;
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
- NEVER repeat a question you have already asked. Track the conversation carefully.
- Each question must be completely new and probe a DIFFERENT aspect of the business.

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

Your go-to angles (pick fresh ones each time):
- Revenue math: "Walk me through the revenue in 18 months."
- Why you vs. someone with more traction right now?
- What's the exit — who buys this company?
- You have 60 seconds. Go.
- What's your CAC and LTV?
- How defensible is your tech moat?
- When do you hit default alive?`,

  "curious-angel": `${PITCHMIND_BASE}YOU ARE PRIYA — THE PEOPLE INVESTOR.
Angel investor. You've backed 12 companies. You invest in founders first, ideas second. Warm, genuinely curious — but sharp underneath. You are testing character and conviction in every question.

How you talk:
- React in 3-8 words — then ask ONE question about who they are, what they've done, or what they've learned.
- Excited: "Oh, that's interesting." or "Okay I like that." then follow up deeper.
- Unclear: "I'm not quite getting that." then ask them to explain it differently.
- Opening: start warm — ask about THEM, their story, why this problem.
- NEVER sound robotic. NEVER repeat a question.
- Total output: 1-3 short sentences. Warm but probing.

Your go-to angles (pick fresh ones each time):
- Why YOU specifically — what's your unfair advantage here?
- Tell me about a time you failed badly. What did you learn?
- If this fails in 2 years, what went wrong?
- Would you work on this for 10 years even if it's brutally hard?
- Have you talked to real users? Tell me about ONE specific conversation.
- What's the hardest thing about building this right now?
- What do your earliest users actually say about the product?`,

  "skeptical-judge": `${PITCHMIND_BASE}YOU ARE DANIEL — THE DEVIL'S ADVOCATE.
15 years as a pitch competition judge and startup advisor. You've seen every pitch trick in the book. You are fair, precise, and impossible to impress without real evidence. You find holes before they become disasters.

How you talk:
- React in 3-8 words — then ask ONE question that probes their core assumption or exposes a gap.
- If something holds up: "Okay, that tracks." or "That's reasonable." then move to the next weak point.
- If something doesn't add up: "I'm not sure that follows." or "That's a big assumption." then press it.
- Opening: start calm, focused — test the most critical assumption in their pitch.
- NEVER say "interesting" without meaning it. NEVER repeat a question.
- Total output: 1-3 short sentences. Precise and measured.

Your go-to angles (pick fresh ones each time):
- Why hasn't anyone built this already if the gap is so obvious?
- What if a well-funded competitor launches this next quarter?
- Prove to me this isn't a solution looking for a problem.
- How did you calculate that number? Show me the logic.
- What's the one assumption, if wrong, that kills the whole plan?
- What's your regulatory risk?
- How long until a copycat could replicate your core feature?`,
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
    "When do you hit default alive — when does revenue cover burn?",
    "What's your net revenue retention look like at 12 months?",
  ],
  "curious-angel": [
    "Why are YOU building this — not why the market needs it, why do YOU personally care?",
    "What have you actually done about this so far? Not planned — done.",
    "Tell me about a time you failed badly. What did you learn from it?",
    "Have you talked to real users? Tell me about one specific conversation.",
    "If this fails in 2 years, what went wrong?",
    "Would you work on this for 10 years even if it got really hard?",
    "What's the most surprising thing you've learned while building this?",
    "Who's the one person who believed in this before anyone else did?",
    "What do your beta users actually complain about?",
  ],
  "skeptical-judge": [
    "Why hasn't anyone built this already if the gap is so obvious?",
    "What are people doing right now without your product? That's your real competition.",
    "Convince me this isn't a solution looking for a problem.",
    "What's the one assumption, if wrong, that kills the whole plan?",
    "How did you calculate your market size? Walk me through it step by step.",
    "What if a well-funded competitor launches the same thing next quarter?",
    "How do you know people will pay for this — not just say they will?",
    "What's your regulatory exposure — and have you talked to a lawyer about it?",
    "What's the hardest technical problem you haven't solved yet?",
  ],
};

export async function pickAIInvestorQuestion(
  personaSlug: string,
  idea: Idea,
  conversationHistory: Array<{ role: "user" | "investor"; content: string }>,
  language?: string,
  ownDeckContent?: string,
  uploadedDocContext?: string,
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
    uploadedDocContext ? `\nFOUNDER'S UPLOADED DOCUMENT:\n${uploadedDocContext.slice(0, 1000)}` : null,
  ].filter(Boolean).join("\n");

  const previousQuestions = conversationHistory
    .filter((m) => m.role === "investor")
    .map((m) => m.content);

  const previousAnswers = conversationHistory
    .filter((m) => m.role === "user")
    .map((m) => m.content);

  const languageInstruction = language && language !== "en"
    ? `\nIMPORTANT: Respond entirely in this language: ${language}. Adapt your tone naturally — do not translate word for word, speak naturally in that language.`
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

QUESTIONS YOU ALREADY ASKED — DO NOT REPEAT ANY OF THESE:
${previousQuestions.length > 0 ? previousQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n") : "None yet."}

IMPORTANT: Your next question must probe a COMPLETELY DIFFERENT aspect than any question above. Cover different dimensions: revenue, team, market, competition, customers, technology, moat, timeline, etc.

Now respond in character. React to the founder's last answer specifically (3-8 words), then ask your next question. Output your full response in 1-3 sentences max.${languageInstruction}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      max_completion_tokens: 200,
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

Give coaching feedback in 3 short lines — no headers, no emojis, no formatting:

Line 1: What worked (or what fell flat if nothing worked). Be specific — name exactly what they said.
Line 2: The one thing to fix. Name the exact problem in plain English.
Line 3: A better version of their answer in 1 sentence — sounds like a real founder, not a template.

Rules:
- React to what they ACTUALLY said — zero generic advice
- If genuinely strong, say so on line 1 and skip line 2 (just write the stronger version on line 3)
- Plain English only. Under 60 words total. No bullet points. No labels.`;

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

export interface SessionSummaryResult {
  overallScore: number;
  confidenceScore: number;
  clarityScore: number;
  investorReadiness: number;
  summary: string;
  mistakes: SessionMistake[];
}

export async function summarizeSessionAI(
  fullConversation: Array<{ role: "user" | "investor" | "system"; content: string }>,
  personaSlug: string,
  ideaTitle?: string,
): Promise<SessionSummaryResult> {
  const userTurns = fullConversation.filter((m) => m.role === "user");

  if (userTurns.length === 0) {
    return {
      overallScore: 30,
      confidenceScore: 30,
      clarityScore: 30,
      investorReadiness: 30,
      summary: "No answers were recorded. Start a new session and pitch at least once to get real feedback.",
      mistakes: [],
    };
  }

  const personaNames: Record<string, string> = {
    "aggressive-vc": "Marcus (aggressive VC)",
    "curious-angel": "Priya (angel investor)",
    "skeptical-judge": "Daniel (skeptical judge)",
  };
  const personaName = personaNames[personaSlug] ?? "the investor";

  const conversationText = fullConversation
    .filter((m) => m.role !== "system")
    .map((m) => `${m.role === "investor" ? personaName : "Founder"}: ${m.content}`)
    .join("\n\n");

  const prompt = `You are a senior investment partner who just observed a full pitch practice session between a founder and ${personaName}. Read the ENTIRE conversation and evaluate the founder's performance as you would before making a real investment decision.

${ideaTitle ? `Startup being pitched: ${ideaTitle}\n` : ""}

FULL SESSION TRANSCRIPT:
${conversationText}

Evaluate the founder across these dimensions — read every single answer carefully:

1. CONFIDENCE (0-100): Did they sound certain about their numbers, direction, and decisions? Or did they hedge, guess, and backpedal? Look at word choice, directness, and whether they backed up claims.

2. CLARITY (0-100): Were answers clear, concise, and easy to follow? Did they get to the point? Or did they ramble, circle back, or lose the thread?

3. INVESTOR READINESS (0-100): As ${personaName}, would you take a follow-up meeting? Did they handle pressure well? Did they know their numbers? Did they give up ground when challenged?

4. OVERALL SCORE (0-100): Weighted combination. Be honest — most early founders score 40-65. Only someone who genuinely impressed should score above 75.

5. MISTAKES (2-4 specific ones): What concrete mistakes will cost them in a real investor meeting? Be specific — name exact moments from the transcript.

6. SUMMARY (2-3 sentences): Your honest, personal verdict as ${personaName}. What did this founder do well? What will sink them? What's the single most important thing to fix?

Be brutally honest. This feedback will make or break their next real pitch.

Reply with JSON only:
{
  "confidenceScore": number,
  "clarityScore": number,
  "investorReadiness": number,
  "overallScore": number,
  "summary": "string",
  "mistakes": [
    {
      "title": "short title",
      "description": "specific description referencing what they actually said",
      "suggestion": "concrete fix",
      "severity": "high|medium|low"
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      max_completion_tokens: 1000,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as Partial<SessionSummaryResult>;

    if (parsed.overallScore != null) {
      return {
        overallScore: Math.min(98, Math.max(10, Math.round(parsed.overallScore))),
        confidenceScore: Math.min(98, Math.max(10, Math.round(parsed.confidenceScore ?? 50))),
        clarityScore: Math.min(98, Math.max(10, Math.round(parsed.clarityScore ?? 50))),
        investorReadiness: Math.min(98, Math.max(10, Math.round(parsed.investorReadiness ?? 50))),
        summary: parsed.summary ?? "Session completed.",
        mistakes: (parsed.mistakes ?? []).slice(0, 4),
      };
    }
  } catch (err) {
    logger.warn({ err }, "AI session summary failed, using heuristic fallback");
  }

  // Heuristic fallback
  return summarizeSessionHeuristic(userTurns.map((m) => ({
    content: m.content,
    confidence: null,
    clarity: null,
    fillerWords: null,
  })));
}

export function summarizeSessionHeuristic(
  userTurns: Array<{
    content: string;
    confidence: number | null;
    clarity: number | null;
    fillerWords: number | null;
  }>,
): SessionSummaryResult {
  if (userTurns.length === 0) {
    return {
      overallScore: 30,
      confidenceScore: 30,
      clarityScore: 30,
      investorReadiness: 30,
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
  // Need at least 5 turns for a meaningful assessment
  if (userTurns.length < 5) {
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

  // Only consider closing if performance is genuinely strong
  if (avgConf < 72 || avgClarity < 72 || totalFillers > userTurns.length * 3) {
    return { ready: false, closingMessage: "" };
  }

  const personaNames: Record<string, string> = {
    "aggressive-vc": "Marcus",
    "curious-angel": "Priya",
    "skeptical-judge": "Daniel",
  };
  const personaName = personaNames[personaSlug] ?? "the investor";

  const recentHistory = conversationHistory
    .slice(-10)
    .map((m) => `${m.role === "investor" ? personaName : "Founder"}: ${m.content}`)
    .join("\n");

  const prompt = `You are ${personaName}. You've just had a thorough pitch practice session with a founder. 

Recent conversation:
${recentHistory}

Performance stats:
- Average confidence: ${Math.round(avgConf)}/100
- Average clarity: ${Math.round(avgClarity)}/100
- Total filler words: ${totalFillers}
- Turns completed: ${userTurns.length}

Are they genuinely ready to walk into a real investor meeting RIGHT NOW? Only say ready=true if they've been consistently clear, confident, specific, and handled pressure well across ALL turns — not just once or twice.

Speak directly to the founder in your voice as ${personaName}. Be real — let them feel what you actually think. Under 55 words. Reference something specific from the conversation.

Reply with JSON only:
{
  "ready": true or false,
  "closingMessage": "Your direct, emotionally honest words to the founder — in your voice. Reference what you actually heard."
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

export function extractTextFromBase64(base64: string, filename: string): string {
  try {
    const buffer = Buffer.from(base64, "base64");
    const text = buffer.toString("utf-8");
    // Remove non-printable characters except newlines and tabs
    const cleaned = text.replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\uFFFF]/g, " ").trim();
    if (cleaned.length > 50) return cleaned.slice(0, 4000);
    return `[Document: ${filename} — content could not be extracted as text. Summarize what you know from the filename.]`;
  } catch {
    return `[Document: ${filename}]`;
  }
}
