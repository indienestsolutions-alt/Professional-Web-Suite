import type { Idea } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import {
  speechToText,
  textToSpeech,
  detectAudioFormat,
} from "@workspace/integrations-openai-ai-server/audio";
import { logger } from "./logger";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Idea Structuring ─────────────────────────────────────────────────────────

export async function structureIdeaAI(title: string, rawText: string): Promise<StructuredIdea> {
  const prompt = `You are an expert startup analyst who has worked with 500+ early-stage startups. A founder has just described their idea in their own words. Your job is to extract and sharpen each section into investor-ready language — specific, clear, honest, without hype.

STARTUP TITLE: ${title}
FOUNDER'S DESCRIPTION: ${rawText}

Extract and write each section. Be specific to THIS idea — no generic filler. If information isn't available, make a realistic inference but keep it grounded and honest.

Requirements per section:
- problem: 2-3 sentences. Name who suffers, what exactly they can't do, and how badly. Include scale or frequency if possible.
- solution: 2-3 sentences. What the product does, the core mechanism, and what the user gets. Avoid buzzwords.
- market: 2-3 sentences. Who the paying customers are, roughly how many exist, and any relevant market size signals.
- businessModel: 2-3 sentences. How money flows in — pricing, tiers, who pays, how often. Simple and specific.
- competitiveEdge: 2 sentences. The one or two things that are hard to copy — not "better UX" but structural advantages.
- targetAudience: 1-2 sentences. The most specific first customer profile — who buys first and why.

Reply with JSON only:
{
  "problem": "string",
  "solution": "string",
  "market": "string",
  "businessModel": "string",
  "competitiveEdge": "string",
  "targetAudience": "string"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      max_completion_tokens: 900,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    });
    const raw = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as Partial<StructuredIdea>;
    if (parsed.problem && parsed.solution && parsed.market) {
      return {
        problem: parsed.problem,
        solution: parsed.solution,
        market: parsed.market,
        businessModel: parsed.businessModel ?? "Freemium model with paid upgrades for power users.",
        competitiveEdge: parsed.competitiveEdge ?? "End-to-end ownership of the user workflow.",
        targetAudience: parsed.targetAudience ?? "Early adopters in the target domain.",
      };
    }
  } catch (err) {
    logger.warn({ err }, "AI structuring failed, using heuristic fallback");
  }
  return structureIdeaHeuristic(title, rawText);
}

// Simple heuristic fallback for structuring
function structureIdeaHeuristic(title: string, rawText: string): StructuredIdea {
  const STOPWORDS = new Set(["the","a","an","and","or","but","of","to","for","in","on","at","with","is","are","this","that","be","by","from","it","we","our","their","they","as","have","has","will","can","into","out"]);
  const counts = new Map<string, number>();
  for (const word of `${title} ${rawText}`.toLowerCase().split(/[^a-z0-9]+/)) {
    if (!word || word.length < 4 || STOPWORDS.has(word)) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  const keywords = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([w]) => w);
  const k = keywords.join(", ") || title.toLowerCase();
  const lower = rawText.toLowerCase();
  const hits: string[] = [];
  if (/student|college|school|teen|young/.test(lower)) hits.push("students");
  if (/business|enterprise|company|saas|b2b/.test(lower)) hits.push("businesses");
  if (/developer|engineer/.test(lower)) hits.push("developers");
  const audience = hits.length > 0 ? hits.join(", ") : "early adopters";
  return {
    problem: `${audience} struggle to manage ${k} without fragmented, disconnected tools that were built for a different use case. ${rawText.split(".")[0]?.trim() ?? ""}.`,
    solution: `${title} unifies ${k} in a single focused product — from start to finished result in minutes, with smart defaults that work out of the box.`,
    market: `The addressable market spans ${audience} who need ${k}. Even a focused wedge represents tens of thousands of potential users with clear expansion paths.`,
    businessModel: `Free plan drives discovery; paid plans unlock advanced features and team collaboration. Long-term: org/institution plans with higher ACV.`,
    competitiveEdge: `${title} owns the full workflow end-to-end. Competitors handle only one piece — this integration creates a switching cost that grows with usage.`,
    targetAudience: audience,
  };
}

// Keep export for backward compat (used in ideas route)
export function structureIdeaText(title: string, rawText: string): StructuredIdea {
  return structureIdeaHeuristic(title, rawText);
}

// ─── Idea Validation ──────────────────────────────────────────────────────────

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

Evaluate across these investment dimensions:
1. Problem clarity & pain depth — Is the problem real, urgent, and painful enough to pay for?
2. Solution fit — Does the product solve the problem completely? What's the core MVP?
3. Market opportunity — TAM/SAM/SOM logic. Are the numbers believable?
4. Business model — Unit economics, LTV/CAC clarity. Monetization path to $100M ARR?
5. Competitive moat — Network effects, data moat, switching costs, IP? Not just "better UX."
6. Overall investor readiness — Would a Series A VC take a follow-up meeting?

Scoring guidance: Most early ideas score 35-60. Good ones hit 65-75. Exceptional ones 76-85. Be honest.

Give:
- A realistic investor readiness score 0-100
- 2-4 specific strengths (what actually works and why a smart investor would care)
- 2-4 specific weaknesses (what's unclear, risky, or missing — be direct)
- 2-4 concrete, actionable suggestions (exact things to do in the next 30 days)

Sound like a human VC partner, not a template. Be specific to THIS startup.

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

  const fields: (keyof Idea)[] = ["problem","solution","market","businessModel","competitiveEdge","targetAudience"];
  const filled = fields.filter((f) => typeof idea[f] === "string" && (idea[f] as string).length > 30);
  const completeness = filled.length / fields.length;
  const richness = Math.min((idea.rawText ?? "").length / 600, 1);
  return {
    score: Math.min(98, Math.max(35, Math.round(45 + completeness * 40 + richness * 15))),
    strengths: ["You've started — that's the first step."],
    weaknesses: completeness < 0.8 ? ["Several key sections need more detail."] : [],
    suggestions: ["Add specific numbers and user examples to every section."],
  };
}

// ─── Market Research ──────────────────────────────────────────────────────────

async function researchMarket(idea: Idea): Promise<Record<string, unknown>> {
  const ideaContext = [
    `Startup: ${idea.title}`,
    idea.rawText ? `Description: ${idea.rawText.slice(0, 800)}` : null,
    idea.problem ? `Problem: ${idea.problem}` : null,
    idea.solution ? `Solution: ${idea.solution}` : null,
    idea.market ? `Market context: ${idea.market}` : null,
    idea.targetAudience ? `Target: ${idea.targetAudience}` : null,
  ].filter(Boolean).join("\n");

  const prompt = `You are a senior market research analyst at a top-tier VC firm (Sequoia/a16z level). Your job is to produce a data-rich market brief that will inform an investor-grade pitch deck. Be specific. Use real market logic and realistic estimates.

STARTUP:
${ideaContext}

Research and produce:
1. TAM — realistic global market with specific dollar figure and logic chain
2. SAM — serviceable segment this startup can realistically reach in 3-5 years
3. SOM — first 18-month obtainable target with % capture logic
4. CAGR — market growth rate with brief rationale
5. Key trends — 3 specific trends making THIS the right moment to build
6. Competitive landscape — 3-4 real competitor categories with their core weakness
7. Why now — 2-3 specific reasons the market is ready NOW (tech shift, behavior change, regulation, etc.)
8. Pain severity — 1-5 scale with evidence
9. Revenue milestones — realistic Year 1, Year 2, Year 3 projections with assumptions

Formats for numbers: "$4.2B", "42%", "18 months". Be specific, not vague ranges.

Reply with JSON only:
{
  "tam": "string",
  "sam": "string",
  "som": "string",
  "cagr": "string",
  "trends": ["trend1", "trend2", "trend3"],
  "competitors": [{"name": "category", "weakness": "why they lose"}],
  "whyNow": ["reason1", "reason2"],
  "painSeverity": number,
  "revenueMilestones": {"year1": "string", "year2": "string", "year3": "string"}
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      max_completion_tokens: 1400,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    });
    const raw = response.choices[0]?.message?.content ?? "{}";
    return JSON.parse(raw) as Record<string, unknown>;
  } catch (err) {
    logger.warn({ err }, "Market research failed");
    return {};
  }
}

// ─── Deck Generation ──────────────────────────────────────────────────────────

export function generateDeckSlides(idea: Idea): {
  title: string;
  storyline: string;
  slides: DeckSlide[];
} {
  const title = `${idea.title} — Pitch Deck`;
  const storyline = `Start with the real problem, show the gap no one is fixing, present your solution as the obvious answer, prove the market and business, end with the ask.`;
  const slides: DeckSlide[] = [
    { title: idea.title, body: `Helping ${idea.targetAudience ?? "people"} do more with less effort.`, layout: "title" },
    { title: "The Problem", body: idea.problem ?? "People today struggle with a workflow nobody owns end-to-end.", layout: "problem", bullets: ["Pain happens every day", "Existing tools are patchy and disconnected", "Time and money are wasted as a result"] },
    { title: "Our Solution", body: idea.solution ?? "One product that handles the full job — not just one piece of it.", layout: "solution", bullets: ["Easy to start, powerful as you grow", "Does in minutes what used to take hours", "Built for the people actually doing the work"] },
    { title: "Market Opportunity", body: idea.market ?? "A clear group of people who need this and are ready to pay.", layout: "market", bullets: ["Large and growing market", "Specific starting cohort identified", "Clear expansion path"] },
    { title: "Business Model", body: idea.businessModel ?? "Free plan to get people in, paid plan for power users, team plans for groups.", layout: "business", bullets: ["Free drives discovery", "Paid unlocks depth", "Team plans scale revenue"] },
    { title: "Why We Win", body: idea.competitiveEdge ?? "We own the whole workflow — end-to-end. That's hard to copy.", layout: "edge", bullets: ["Full end-to-end ownership", "Gets smarter with every user", "Hard to replicate quickly"] },
    { title: "Product Demo", body: "Watch the core flow: from a raw idea to a finished result in under three minutes.", layout: "demo" },
    { title: "Traction & Roadmap", body: "Early users active. Next: deeper features, team mode, key partnerships.", layout: "traction", bullets: ["Real users, real activity", "Usage growing week on week", "Roadmap built from user feedback"] },
    { title: "The Ask", body: "Join us in giving the next generation of founders the tools to think, pitch, and win.", layout: "ask", bullets: ["Strategic partners", "Pilot accelerators", "Seed funding to scale"] },
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

  // Phase 1: Deep market research
  const marketData = await researchMarket(idea);
  const marketContext = Object.keys(marketData).length > 0
    ? `\nMARKET RESEARCH DATA (use these exact numbers in slides — don't invent others):\n${JSON.stringify(marketData, null, 2)}`
    : "";

  const systemPrompt = `You are a world-class pitch deck writer who has helped startups raise $2B+ from top-tier VCs. You write slides that are specific, data-driven, brutally honest, and compelling enough to get a follow-up meeting.

Non-negotiable rules:
- Every slide body includes at least ONE specific number or data point
- Every bullet is a complete, specific claim (8-15 words with numbers where possible)
- Zero generic corporate language — every sentence is specific to THIS startup
- Slide titles: 3-6 words maximum, punchy
- The deck tells a coherent story: Problem → Solution → Market → Business → Edge → Proof → Ask
- Use the market research data provided — don't invent competing figures`;

  const userPrompt = `Write a complete 9-slide investor-grade pitch deck for this startup. Use the market research data provided.

STARTUP:
${ideaContext}
${marketContext}

SLIDE SPECS:

Slide 1 (title layout): Title = startup name. Body = one punchy sentence: what it does + for whom + core value prop. stat = one striking number (e.g. "$4.2B market" or "2M underserved users"). statLabel = brief label.

Slide 2 (problem layout): Describe a REAL painful daily situation a specific user faces. Name who they are and exactly what happens. Include scale. 3 bullets = specific pain manifestations with numbers/frequency.

Slide 3 (solution layout): Explain exactly what the product does — from user action to outcome. Not feature list — the transformation. 3 bullets = measurable outcome statements.

Slide 4 (market layout): Use the TAM/SAM/SOM from research. State growth rate. Explain why this niche is the right entry point. 3 bullets = TAM, SAM, and growth rate as specific numbers. stat = SAM figure. statLabel = "Serviceable market".

Slide 5 (business layout): Exact pricing tiers, who pays, when, unit economics. Show path to $10M ARR. 3 bullets = specific revenue mechanics with numbers. stat = target ARR milestone. statLabel = "Target ARR (18 months)".

Slide 6 (edge layout): Name real competitor categories. Explain exactly why this startup wins — not "better UX" but structural moat. 3 bullets = specific defensibility points.

Slide 7 (demo layout): Describe the core product flow in 3 specific steps from user's POV. One vivid, specific person doing one specific thing.

Slide 8 (traction layout): Use revenue milestones from research. Specific metrics or clear milestones with timeframes. stat = most impressive number. statLabel = brief context.

Slide 9 (ask layout): Specific funding amount with exact use-of-funds breakdown. What milestones does this capital unlock? 3 bullets = specific use-of-funds items with % or $ amounts.

Return JSON only:
{
  "storyline": "2-sentence arc of the deck narrative",
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
      return {
        title: `${idea.title} — Pitch Deck`,
        storyline: parsed.storyline ?? `A clear story: real problem, simple solution, proven market, and a compelling ask.`,
        slides: parsed.slides,
      };
    }
  } catch (err) {
    logger.warn({ err }, "AI deck generation failed, using heuristic fallback");
  }
  return generateDeckSlides(idea);
}

// ─── Investor Persona Prompts ─────────────────────────────────────────────────

const PITCHMIND_BASE = `You are PitchMind AI — an elite pitch coach and investor simulator. You are NOT a cheerleader. You are a combination of:
- A brutally honest mentor who has seen 1000+ pitches
- A sharp investor who has deployed real capital
- A communication coach who trains founders under real pressure

Core rules you never break:
- Never say "Great question!" — ever.
- Never give generic advice. Always be SPECIFIC to what they just said.
- Never accept vague answers. Push back every time.
- Flag weak language instantly: "everyone is our market" → push back hard. "we'll go viral" → ask for real GTM. "no real competition" → challenge directly.
- Short sentences. Max 3 lines per response.
- NEVER repeat a question you already asked. Track questions meticulously.
- Each new question must probe a COMPLETELY DIFFERENT business dimension.
- React to what the founder JUST said before asking your next question.

`;

const PERSONA_SYSTEM_PROMPTS: Record<string, string> = {
  "aggressive-vc": `${PITCHMIND_BASE}YOU ARE MARCUS — THE SHARK.
Partner at a top VC. 3 unicorns funded, 50 passes this month. One thing matters: returns.

Style:
- React to their answer in 3-8 words. Then ONE sharp question.
- Strong answer: "Okay. Now—" → next harder question.
- Weak answer: "That's not an answer." → press on same point.
- Skip pleasantries. Go straight to hardest shot.
- 1-3 sentences total. Plain English. Zero softening.

Question bank (pick fresh each time, probe DIFFERENT dimensions):
Revenue math, exit strategy, CAC/LTV, default alive timing, moat defensibility, why you vs better-funded rival, net revenue retention, unit economics, first $1M ARR path, why now timing.`,

  "curious-angel": `${PITCHMIND_BASE}YOU ARE PRIYA — THE PEOPLE INVESTOR.
Angel investor, 12 companies backed. You invest in founders first, ideas second. Warm but sharp.

Style:
- React in 3-8 words. Then ONE question about who they are or what they've done.
- Excited: "Oh, that's interesting." → follow up deeper.
- Unclear: "I'm not quite getting that." → ask them to explain differently.
- Start warm — but test conviction and character relentlessly.
- 1-3 sentences total. Warm but probing.

Question bank (pick fresh, probe DIFFERENT dimensions):
Why you specifically, past failure & lesson, if-fails-what-went-wrong, 10-year commitment test, specific user conversations, hardest thing right now, beta user complaints, earliest believer, founder-market fit evidence.`,

  "skeptical-judge": `${PITCHMIND_BASE}YOU ARE DANIEL — THE DEVIL'S ADVOCATE.
15 years judging pitches. Fair, precise, impossible to impress without real evidence.

Style:
- React in 3-8 words. Then ONE question that probes core assumptions.
- Strong: "That's fair." → go deeper on next assumption.
- Weak: "I need to stop you there." → expose the gap precisely.
- 1-3 sentences total. Measured and precise.

Question bank (pick fresh, probe DIFFERENT dimensions):
Why hasn't this been built already, real competition (what users do today), solution vs problem fit, killer assumption, market size methodology, well-funded copycat scenario, willingness to pay evidence, regulatory risk, hardest unsolved technical problem, distribution strategy.`,
};

const FALLBACK_QUESTIONS: Record<string, string[]> = {
  "aggressive-vc": [
    "What's your revenue in 18 months? Walk me through the exact math.",
    "Why pick you over someone with more traction right now?",
    "You have 60 seconds. Tell me why this wins. Go.",
    "What's your exit — who specifically buys this company and at what multiple?",
    "CAC and LTV — give me the numbers.",
    "What's the one thing that kills this company, and what are you doing about it?",
    "First thing you spend the check on?",
    "When do you hit default alive?",
    "Net revenue retention at 12 months — what's the target?",
  ],
  "curious-angel": [
    "Why are YOU building this — not the market, why do YOU personally care?",
    "What have you actually done about this so far? Not planned — done.",
    "Tell me about a time you failed badly. What did you learn?",
    "Tell me about one specific conversation with a real user.",
    "If this fails in 2 years, what went wrong?",
    "Would you work on this for 10 years even if it got brutal?",
    "Most surprising thing you've learned building this?",
    "Who believed in this before anyone else did?",
    "What do your beta users actually complain about?",
  ],
  "skeptical-judge": [
    "Why hasn't anyone built this already if the gap is so obvious?",
    "What are people doing right now without your product? That's your real competition.",
    "Convince me this isn't a solution looking for a problem.",
    "What's the one assumption, if wrong, that kills the whole plan?",
    "How did you calculate your market size? Walk me through it.",
    "What if a well-funded player launches this next quarter?",
    "How do you know people will actually pay — not just say they will?",
    "What's your regulatory exposure?",
    "Hardest technical problem you haven't solved yet?",
  ],
};

// ─── Investor Question Picker ─────────────────────────────────────────────────

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
    idea.rawText ? `What they built: ${idea.rawText.slice(0, 500)}` : null,
    idea.problem ? `The problem they solve: ${idea.problem}` : null,
    idea.solution ? `Their solution: ${idea.solution}` : null,
    idea.market ? `Their market: ${idea.market}` : null,
    idea.businessModel ? `How they make money: ${idea.businessModel}` : null,
    idea.competitiveEdge ? `Why they win: ${idea.competitiveEdge}` : null,
    idea.targetAudience ? `Who they sell to: ${idea.targetAudience}` : null,
    ownDeckContent ? `\nFOUNDER'S DECK:\n${ownDeckContent.slice(0, 1000)}` : null,
    uploadedDocContext ? `\nUPLOADED DOC:\n${uploadedDocContext.slice(0, 800)}` : null,
  ].filter(Boolean).join("\n");

  const previousQuestions = conversationHistory.filter((m) => m.role === "investor").map((m) => m.content);
  const previousAnswers = conversationHistory.filter((m) => m.role === "user").map((m) => m.content);
  const lastAnswer = previousAnswers.at(-1);
  const lastQuestion = previousQuestions.at(-1);

  // Language instruction — use language code or infer from last answer
  let detectedLang = language ?? "en";
  if (lastAnswer && lastAnswer.length > 10) {
    detectedLang = detectLanguageFromText(lastAnswer) ?? language ?? "en";
  }
  const langInstruction = detectedLang !== "en"
    ? `\nIMPORTANT: Respond in the same language as the founder — they are speaking ${getLanguageName(detectedLang)}. Speak naturally in that language, do not translate word-for-word.`
    : "";

  const userContent = `STARTUP INFO:
${pitchContext}

CONVERSATION SO FAR:
${conversationHistory.length > 0
    ? conversationHistory.map((m) => `${m.role === "investor" ? "You" : "Founder"}: ${m.content}`).join("\n")
    : "No conversation yet — this is your opening question."}

${lastQuestion ? `YOUR LAST QUESTION: "${lastQuestion}"` : ""}
${lastAnswer ? `FOUNDER'S LAST ANSWER: "${lastAnswer}"` : ""}

QUESTIONS ALREADY ASKED — DO NOT REPEAT OR PARAPHRASE ANY OF THESE:
${previousQuestions.length > 0 ? previousQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n") : "None yet."}

Your next question MUST probe a completely different business dimension. Cover different areas: revenue, team, market, competition, customers, technology, moat, timeline, traction, exit, risk.

Respond in character. React to the founder's last answer (3-8 words), then ask your next question. 1-3 sentences max.${langInstruction}`;

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
  return bank[previousQuestions.length % bank.length]!;
}

// Language helpers
function detectLanguageFromText(text: string): string | null {
  const lower = text.toLowerCase();
  const patterns: Array<[RegExp, string]> = [
    [/\b(el|la|los|las|que|con|para|por|como|pero|más|cuando|este|esta)\b/g, "es"],
    [/\b(le|la|les|et|en|de|un|une|mais|avec|pour|sur|dans|nous)\b/g, "fr"],
    [/\b(und|die|der|das|ist|ein|eine|nicht|für|mit|auf|dem|den|bei|als)\b/g, "de"],
    [/\b(और|है|में|का|के|को|से|पर|यह|वह|जो|हैं)\b/g, "hi"],
    [/[\u4e00-\u9fff]{3,}/g, "zh"],
    [/[\u0600-\u06ff]{3,}/g, "ar"],
    [/\b(de|da|em|para|que|não|uma|com|por|são|está)\b/g, "pt"],
    [/[\u3040-\u309f\u30a0-\u30ff]{3,}/g, "ja"],
    [/[\uac00-\ud7af]{3,}/g, "ko"],
  ];
  for (const [pattern, lang] of patterns) {
    const matches = lower.match(pattern);
    if (matches && matches.length >= 3) return lang;
  }
  return null;
}

function getLanguageName(code: string): string {
  const names: Record<string, string> = {
    es: "Spanish", fr: "French", de: "German", hi: "Hindi",
    zh: "Chinese", ar: "Arabic", pt: "Portuguese", ja: "Japanese", ko: "Korean",
  };
  return names[code] ?? "English";
}

// ─── Per-Turn Scoring ─────────────────────────────────────────────────────────

export function scorePitchTurn(content: string): {
  feedback: string;
  confidence: number;
  clarity: number;
  fillerWords: number;
} {
  const fillerList = ["um","uh","like","you know","kind of","sort of","basically","actually","literally","i mean"];
  const lower = ` ${content.toLowerCase()} `;
  let fillerWords = 0;
  for (const f of fillerList) {
    const re = new RegExp(`\\b${f.replace(/\s+/g, "\\s+")}\\b`, "g");
    fillerWords += (lower.match(re) ?? []).length;
  }
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const avgSentenceLength = sentences.length > 0 ? wordCount / sentences.length : wordCount;
  const hedgeCount = (lower.match(/\b(maybe|might|perhaps|i think|i guess|hopefully|probably)\b/g) ?? []).length;

  let confidence = 75 - hedgeCount * 6 - fillerWords * 3;
  if (wordCount > 30) confidence += 8;
  if (wordCount > 80) confidence += 5;
  confidence = Math.max(20, Math.min(98, Math.round(confidence)));

  let clarity = 80 - Math.abs(avgSentenceLength - 17) * 1.5 - fillerWords * 2;
  if (wordCount < 12) clarity -= 15;
  clarity = Math.max(20, Math.min(98, Math.round(clarity)));

  let feedback: string;
  if (clarity > 78 && confidence > 78) {
    feedback = "Good answer — clear and confident. Add one concrete number next time and you're investor-ready.";
  } else if (fillerWords > 3) {
    feedback = `You used ${fillerWords} filler words. Pause instead — silence sounds more confident than "um."`;
  } else if (hedgeCount > 1) {
    feedback = "Cut the hedging. 'I think' and 'maybe' signal doubt. Say it like you know it.";
  } else if (avgSentenceLength > 25) {
    feedback = "Too long. Cut it in half — one sharp point beats three tangled ones.";
  } else if (wordCount < 25) {
    feedback = "Too short. Add one example or one number — investors need to see your thinking.";
  } else {
    feedback = "Solid. End stronger — your boldest sentence should close, not your safest one.";
  }
  return { feedback, confidence, clarity, fillerWords };
}

async function generateAIFeedback(
  content: string,
  lastQuestion: string | undefined,
  scores: { confidence: number; clarity: number; fillerWords: number },
): Promise<string> {
  const performanceNote = scores.confidence > 80 && scores.clarity > 80
    ? "Strong answer — genuinely clear and confident."
    : scores.fillerWords > 3
      ? `Used ${scores.fillerWords} filler words — hurting their credibility.`
      : scores.confidence < 60
        ? "Too many hedges — sounds unsure."
        : scores.clarity < 60
          ? "Answer rambled — hard to follow."
          : "Decent, but room to sharpen.";

  const prompt = `You are a pitch coach who has trained broke students into founders who raised real money. Direct, never rude. Warm when deserved. Hard when needed.

Investor asked: "${lastQuestion ?? "Tell me about your startup."}"
Founder answered: "${content.slice(0, 500)}"
Read: ${performanceNote}
Confidence: ${scores.confidence}/100 | Clarity: ${scores.clarity}/100 | Fillers: ${scores.fillerWords}

Coaching feedback — 3 short lines, no headers, no emojis:
Line 1: What worked (or what fell flat). Be specific — name exactly what they said.
Line 2: The one thing to fix. Plain English. Specific.
Line 3: A better version of their answer in 1 sentence — sounds like a real founder, not a template.

Rules: React to what they ACTUALLY said. Under 60 words total. No bullet points.`;

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
    if (aiFeedback && aiFeedback.length > 10) return { ...scores, feedback: aiFeedback };
  } catch (err) {
    logger.warn({ err }, "AI feedback failed, using heuristic");
  }
  return scores;
}

// ─── Session Summary (AI-powered, full history) ───────────────────────────────

export async function summarizeSessionAI(
  fullConversation: Array<{ role: "user" | "investor" | "system"; content: string }>,
  personaSlug: string,
  ideaTitle?: string,
): Promise<SessionSummaryResult> {
  const userTurns = fullConversation.filter((m) => m.role === "user");

  if (userTurns.length === 0) {
    return {
      overallScore: 30, confidenceScore: 30, clarityScore: 30, investorReadiness: 30,
      summary: "No answers recorded. Start a new session and pitch at least once to get real feedback.",
      mistakes: [],
    };
  }

  const personaNames: Record<string, string> = {
    "aggressive-vc": "Marcus (Aggressive VC Partner)",
    "curious-angel": "Priya (Angel Investor)",
    "skeptical-judge": "Daniel (Skeptical Judge)",
  };
  const personaName = personaNames[personaSlug] ?? "the investor";

  const conversationText = fullConversation
    .filter((m) => m.role !== "system")
    .map((m) => `${m.role === "investor" ? personaName : "FOUNDER"}: ${m.content}`)
    .join("\n\n");

  const prompt = `You are a senior investment partner who just observed a full pitch practice session. Read the ENTIRE transcript carefully and evaluate the founder's performance as you would before a real funding decision.

${ideaTitle ? `Startup pitched: ${ideaTitle}\n` : ""}Investor persona: ${personaName}
Turns completed: ${userTurns.length}

FULL SESSION TRANSCRIPT:
${conversationText}

Evaluate meticulously — read EVERY answer:

CONFIDENCE (0-100): Did they sound certain about their numbers, direction, and decisions? Or did they hedge, backpedal, and guess? Check word choice and directness.

CLARITY (0-100): Were answers clear and concise? Did they get to the point? Or did they ramble and circle back?

INVESTOR READINESS (0-100): Would ${personaName} take a follow-up meeting? Did they handle pressure? Know their numbers? Hold ground when challenged?

OVERALL SCORE (0-100): Weighted combination. Be honest — most early founders score 40-65. Only genuinely impressive founders score above 75.

MISTAKES (2-4 specific ones): What exact mistakes will cost them in a real meeting? Name specific moments from the transcript.

SUMMARY (2-3 sentences): Your honest personal verdict as ${personaName}. What did this founder do well? What will sink them? Most important single fix?

Scoring calibration:
- 30-45: Unprepared. Vague, defensive, no numbers.
- 46-60: Early stage. Some good answers, major gaps.
- 61-75: Making progress. Clear in places, needs sharper numbers and conviction.
- 76-85: Strong. Handles pressure, knows the business, investor-ready with minor work.
- 86+: Exceptional. Rarely awarded.

Reply with JSON only:
{
  "confidenceScore": number,
  "clarityScore": number,
  "investorReadiness": number,
  "overallScore": number,
  "summary": "string",
  "mistakes": [
    {
      "title": "short specific title",
      "description": "specific — reference what they actually said in the transcript",
      "suggestion": "concrete, actionable fix",
      "severity": "high|medium|low"
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      max_completion_tokens: 1200,
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

  return summarizeSessionHeuristic(userTurns.map((m) => ({
    content: m.content, confidence: null, clarity: null, fillerWords: null,
  })));
}

export function summarizeSessionHeuristic(
  userTurns: Array<{ content: string; confidence: number | null; clarity: number | null; fillerWords: number | null }>,
): SessionSummaryResult {
  if (userTurns.length === 0) {
    return { overallScore: 30, confidenceScore: 30, clarityScore: 30, investorReadiness: 30, summary: "No answers recorded.", mistakes: [] };
  }
  const avg = (vals: (number | null)[]) => {
    const filtered = vals.filter((v): v is number => typeof v === "number");
    return filtered.length === 0 ? 60 : Math.round(filtered.reduce((a, b) => a + b, 0) / filtered.length);
  };
  const confidenceScore = avg(userTurns.map((t) => t.confidence));
  const clarityScore = avg(userTurns.map((t) => t.clarity));
  const totalFillers = userTurns.reduce((a, t) => a + (t.fillerWords ?? 0), 0);
  const investorReadiness = Math.max(25, Math.min(99, Math.round(confidenceScore * 0.45 + clarityScore * 0.45 - totalFillers * 1.5)));
  const overallScore = Math.round(confidenceScore * 0.35 + clarityScore * 0.35 + investorReadiness * 0.3);
  const mistakes: SessionMistake[] = [];
  if (totalFillers > 5) mistakes.push({ title: "Too many filler words", description: `Used filler words ${totalFillers} times. Investors read this as nervousness.`, suggestion: "Practice pausing instead of filling silence. Record yourself answering with zero fillers.", severity: totalFillers > 10 ? "high" : "medium" });
  if (confidenceScore < 65) mistakes.push({ title: "Sounded unsure", description: "Used phrases like 'I think', 'maybe', 'hopefully' — sounds like you don't believe in your own idea.", suggestion: "Start each answer with a strong clear statement. Lead with what you know.", severity: "high" });
  if (clarityScore < 65) mistakes.push({ title: "Hard to follow", description: "Some answers were too long or went in circles — the investor lost your main point.", suggestion: "Use the claim→proof→why-it-matters pattern for every answer, then stop.", severity: "medium" });
  const summary = overallScore >= 80 ? "Great session! You sounded like a founder who knows their stuff. Focus on ending each answer with your strongest sentence."
    : overallScore >= 65 ? "Good progress. Bring in more specific numbers and facts — that's what separates great pitches from average ones."
    : "There's real work to do, but that's why you practice. Drill the opening sentence of each answer until it feels natural and automatic.";
  return { overallScore, confidenceScore, clarityScore, investorReadiness, summary, mistakes };
}

// ─── Audio ────────────────────────────────────────────────────────────────────

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  try {
    const detected = detectAudioFormat(audioBuffer);
    const format = (detected === "mp3" || detected === "wav" || detected === "webm") ? detected : "webm";
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

// ─── Session Readiness Assessment ─────────────────────────────────────────────

const MAX_SESSION_TURNS = 10;

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
  const turnCount = userTurns.length;

  // Hard cap at MAX_SESSION_TURNS — always close the session after N turns
  if (turnCount >= MAX_SESSION_TURNS) {
    const personaNames: Record<string, string> = {
      "aggressive-vc": "Marcus",
      "curious-angel": "Priya",
      "skeptical-judge": "Daniel",
    };
    const personaName = personaNames[personaSlug] ?? "the investor";
    const recentHistory = conversationHistory
      .slice(-6)
      .map((m) => `${m.role === "investor" ? personaName : "Founder"}: ${m.content}`)
      .join("\n");

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_completion_tokens: 150,
        response_format: { type: "json_object" },
        messages: [{
          role: "user",
          content: `You are ${personaName}. The pitch session has run its full course (${turnCount} turns). Give your honest closing statement to the founder — you've heard enough to form a real opinion. Reference something specific from the conversation. Under 60 words. Be real and direct — no fluff.

Recent conversation:
${recentHistory}

Reply JSON: { "ready": true, "closingMessage": "your closing words" }`,
        }],
      });
      const parsed = JSON.parse(response.choices[0]?.message?.content ?? "{}") as { ready?: boolean; closingMessage?: string };
      return { ready: true, closingMessage: parsed.closingMessage ?? "Time's up. We've covered a lot of ground — review the scorecard." };
    } catch {
      return { ready: true, closingMessage: `That's all the time we have. Review your scorecard and come back stronger.` };
    }
  }

  // Before max turns: only close early if performance is genuinely strong (min 5 turns)
  if (turnCount < 5) return { ready: false, closingMessage: "" };

  const avg = (vals: (number | null)[]) => {
    const filtered = vals.filter((v): v is number => typeof v === "number");
    return filtered.length === 0 ? 0 : filtered.reduce((a, b) => a + b, 0) / filtered.length;
  };
  const avgConf = avg(userTurns.map((t) => t.confidence));
  const avgClarity = avg(userTurns.map((t) => t.clarity));
  const totalFillers = userTurns.reduce((a, t) => a + (t.fillerWords ?? 0), 0);

  // Only consider early close if performance is strong
  if (avgConf < 75 || avgClarity < 75 || totalFillers > turnCount * 2.5) {
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

  const prompt = `You are ${personaName}. You've had a thorough pitch session with a founder.

Recent conversation:
${recentHistory}

Stats: avg confidence ${Math.round(avgConf)}/100, avg clarity ${Math.round(avgClarity)}/100, fillers ${totalFillers}, turns ${turnCount}

Are they genuinely ready for a real investor meeting RIGHT NOW? Only say ready=true if they've been consistently clear, confident, specific, and handled pressure well across ALL turns — not just once or twice. Be selective.

If ready: give an honest, direct closing statement referencing something specific from the conversation. Under 55 words.
If not ready: set ready=false and leave closingMessage empty.

JSON: { "ready": true/false, "closingMessage": "string or empty" }`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 200,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    });
    const parsed = JSON.parse(response.choices[0]?.message?.content ?? "{}") as { ready?: boolean; closingMessage?: string };
    return { ready: parsed.ready === true, closingMessage: parsed.closingMessage ?? "" };
  } catch (err) {
    logger.warn({ err }, "Readiness assessment failed");
    return { ready: false, closingMessage: "" };
  }
}

// ─── Document Extraction ──────────────────────────────────────────────────────

export function extractTextFromBase64(base64: string, filename: string): string {
  try {
    const buffer = Buffer.from(base64, "base64");
    const text = buffer.toString("utf-8");
    const cleaned = text.replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\uFFFF]/g, " ").trim();
    if (cleaned.length > 50) return cleaned.slice(0, 4000);
    return `[Document: ${filename} — could not extract text content. Use the filename for context.]`;
  } catch {
    return `[Document: ${filename}]`;
  }
}
