import { db, learningTopicsTable, personasTable } from "@workspace/db";
import { logger } from "./logger";

const PERSONAS = [
  {
    slug: "aggressive-vc",
    name: "Marcus, Aggressive VC",
    description:
      "A senior partner at a top-tier fund. Has heard ten thousand pitches. Will hunt for the weakest assumption in your thesis.",
    style:
      "Hard-charging, numbers-first, zero patience for fluff. Interrupts. Pushes you to defend unit economics.",
    intensity: "hard" as const,
  },
  {
    slug: "curious-angel",
    name: "Priya, Curious Angel",
    description:
      "An angel who funds first-time founders. Warm, but sharp. Wants to understand the human behind the idea.",
    style:
      "Warm, curious, asks 'why now' and 'why you'. Gives space — but pulls on every thread.",
    intensity: "easy" as const,
  },
  {
    slug: "skeptical-judge",
    name: "Daniel, Skeptical Judge",
    description:
      "A pitch competition judge. Methodical and quietly demanding. Will test the structural integrity of your argument.",
    style:
      "Calm, structural, probes for evidence and proof. Asks the question you hoped he wouldn't.",
    intensity: "medium" as const,
  },
];

const LEARNING_TOPICS = [
  {
    slug: "tam-sam-som",
    title: "TAM, SAM, and SOM — sized properly",
    summary:
      "How to size your market without making investors roll their eyes.",
    category: "Market sizing",
    readMinutes: 6,
    body:
      "TAM (Total Addressable Market) is the entire universe of customers who could buy your category. SAM (Serviceable Addressable Market) is the slice you can realistically serve given your product, geography, and channel. SOM (Serviceable Obtainable Market) is the slice you can capture in the next 1-3 years.\n\nWhy investors care: TAM proves the ceiling is high enough to matter. SAM proves you've thought about constraints. SOM proves you can earn the right to talk about the bigger numbers.\n\nHow to do it well: build it bottom-up, not top-down. Don't say '1% of a $100B market'. Say 'there are 40,000 schools in our launch geography, average contract is $4,800/year, so SOM at 5% capture is $9.6M ARR'. Use one number you can defend in a follow-up question.\n\nCommon mistakes: copy-pasting a Gartner report, using global TAM for a city-specific product, or confusing 'people who could care' with 'people who would pay'.",
  },
  {
    slug: "idea-validation",
    title: "Idea validation that actually predicts success",
    summary:
      "Cheap, fast experiments that separate real demand from polite enthusiasm.",
    category: "Validation",
    readMinutes: 7,
    body:
      "Most early validation is theater. Friends say 'cool idea', strangers fill out a survey to be polite, and a landing page collects emails from curious tourists. None of that is signal.\n\nReal validation is when someone changes their behavior or spends a scarce resource. Examples: a paid pre-order, a signed letter of intent, a pilot scheduled with a real budget, a Stripe checkout with their card on file, even a 30-minute call where they walk you through their workaround.\n\nThe cheapest experiment is the founder interview. Ask 'tell me about the last time you tried to solve this'. Listen for emotion (frustration, time wasted, money spent). If they shrug, you don't have a wedge yet.\n\nA good early validation funnel is: 20 founder interviews → 5 deep prototypes shown 1:1 → 3 paid pilots → 1 retained customer with a renewal conversation. Hit that, and you're past the hardest part.",
  },
  {
    slug: "pitch-structure",
    title: "The pitch structure investors actually expect",
    summary:
      "Seven beats, in this order, every time. Skip one and the room gets nervous.",
    category: "Pitching",
    readMinutes: 5,
    body:
      "The structure: 1) Problem — make us feel it. 2) Gap — why nothing today solves it cleanly. 3) Solution — your product as the inevitable answer. 4) Demo — show, don't tell. 5) Market — bottom-up TAM/SAM/SOM, defendable. 6) Business model — how money flows in. 7) Future vision — where this goes if you win.\n\nTime budget for a 7-minute pitch: 60s problem, 30s gap, 90s solution, 90s demo, 60s market, 45s model, 45s vision. Practice with a stopwatch. The discipline is the deliverable.\n\nWhat investors are listening for behind every section: 'do they actually understand the user', 'is this defensible', 'can this person execute', and 'will I be embarrassed to introduce them to my partners'. Every sentence in your pitch should be earning yes to one of those.",
  },
  {
    slug: "defending-questions",
    title: "Defending the hard questions",
    summary:
      "How to handle aggressive Q&A without losing the room.",
    category: "Pitching",
    readMinutes: 6,
    body:
      "When the question lands, don't flinch. Pause for one full breath. The pause reads as confidence; the rush reads as panic.\n\nRespond in three beats: acknowledge ('great question — that's exactly what we tested'), answer ('the data shows X'), advance ('which is why we're doing Y next'). Acknowledge buys you a half-second. Answer is the substance. Advance puts the conversation back in your hands.\n\nIf you don't know, say so. 'We don't have data on that yet. Here's how we'd find out and when' is a stronger answer than a guess. Investors are not testing whether you know everything. They're testing whether they can trust your judgment when you don't.",
  },
  {
    slug: "case-airbnb-cereal",
    title: "Case study: Airbnb's cereal-box runway",
    summary:
      "When the round wouldn't close, the founders sold cereal to keep the lights on.",
    category: "Case studies",
    readMinutes: 4,
    body:
      "In 2008, Airbnb couldn't raise. Investors didn't believe people would let strangers sleep in their homes. To keep the company alive, the founders designed and sold limited-edition political cereal boxes — Obama O's and Cap'n McCain's — during the US presidential election. They made $30,000.\n\nThe lesson isn't 'sell cereal'. The lesson is the founder mindset: when the obvious door is locked, find any door. That story is what got them into Y Combinator. Paul Graham later said: 'If you can convince people to pay $40 for a $4 box of cereal, you can probably convince people to stay in a stranger's home.'\n\nApplied to your pitch: investors aren't only buying the idea. They're buying the founder. Show one moment where you did something nobody else would have done to move the company forward.",
  },
  {
    slug: "fundraising-101",
    title: "Fundraising 101 for first-time founders",
    summary:
      "How rounds, valuations, and dilution actually work — without the jargon.",
    category: "Fundraising",
    readMinutes: 8,
    body:
      "A round is a moment in time when you take outside money in exchange for ownership. Pre-seed and seed are the earliest stages — typically $500k to $3M, often via SAFEs (Simple Agreement for Future Equity). A SAFE postpones setting a valuation until a later priced round.\n\nValuation matters because it sets dilution. If you raise $1M at a $9M post-money valuation, you give up 11.1% of the company. Cap tables compound — every round dilutes everyone. The founders who win negotiate the terms they care about (board control, option pool, pro-rata) not just the headline number.\n\nKnow what you're raising for. 'We need 18 months of runway to hit X milestone, which unlocks a Series A at Y valuation' is a story investors can map. 'We need money' is not.\n\nFinally: raise from people you'd want as bosses for the next decade. Money is a commodity. Time and judgment are not.",
  },
];

export async function seedReferenceData(): Promise<void> {
  for (const persona of PERSONAS) {
    await db
      .insert(personasTable)
      .values(persona)
      .onConflictDoUpdate({
        target: personasTable.slug,
        set: {
          name: persona.name,
          description: persona.description,
          style: persona.style,
          intensity: persona.intensity,
        },
      });
  }
  for (const topic of LEARNING_TOPICS) {
    await db
      .insert(learningTopicsTable)
      .values(topic)
      .onConflictDoUpdate({
        target: learningTopicsTable.slug,
        set: {
          title: topic.title,
          summary: topic.summary,
          category: topic.category,
          body: topic.body,
          readMinutes: topic.readMinutes,
        },
      });
  }
  logger.info(
    { personas: PERSONAS.length, topics: LEARNING_TOPICS.length },
    "Seed reference data ready",
  );
}
