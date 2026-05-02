import { Router, type IRouter, type Request, type Response } from "express";
import { and, asc, desc, eq } from "drizzle-orm";
import {
  db,
  ideasTable,
  personasTable,
  pitchSessionsTable,
  sessionMessagesTable,
} from "@workspace/db";
import {
  ListSessionsResponse,
  StartSessionBody,
  StartSessionResponse,
  GetSessionParams,
  GetSessionResponse,
  SendSessionMessageParams,
  SendSessionMessageBody,
  SendSessionMessageResponse,
  FinishSessionParams,
  FinishSessionResponse,
  SendSessionVoiceMessageParams,
  SendSessionVoiceMessageBody,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/requireAuth";
import {
  pickAIInvestorQuestion,
  scorePitchTurn,
  summarizeSession,
  transcribeAudio,
  generateInvestorAudio,
  MAX_SESSION_TURNS,
} from "../lib/pitchAi";

const router: IRouter = Router();

router.use("/sessions", requireAuth);

async function loadSessionDetail(sessionId: string, userId: string) {
  const [session] = await db
    .select({
      id: pitchSessionsTable.id,
      userId: pitchSessionsTable.userId,
      ideaId: pitchSessionsTable.ideaId,
      personaSlug: pitchSessionsTable.personaSlug,
      status: pitchSessionsTable.status,
      overallScore: pitchSessionsTable.overallScore,
      confidenceScore: pitchSessionsTable.confidenceScore,
      clarityScore: pitchSessionsTable.clarityScore,
      investorReadiness: pitchSessionsTable.investorReadiness,
      summary: pitchSessionsTable.summary,
      mistakes: pitchSessionsTable.mistakes,
      createdAt: pitchSessionsTable.createdAt,
      finishedAt: pitchSessionsTable.finishedAt,
      ideaTitle: ideasTable.title,
      personaName: personasTable.name,
    })
    .from(pitchSessionsTable)
    .leftJoin(ideasTable, eq(ideasTable.id, pitchSessionsTable.ideaId))
    .leftJoin(personasTable, eq(personasTable.slug, pitchSessionsTable.personaSlug))
    .where(
      and(
        eq(pitchSessionsTable.id, sessionId),
        eq(pitchSessionsTable.userId, userId),
      ),
    );
  if (!session) return null;
  const messages = await db
    .select()
    .from(sessionMessagesTable)
    .where(eq(sessionMessagesTable.sessionId, sessionId))
    .orderBy(asc(sessionMessagesTable.createdAt));
  return { ...session, messages, mistakes: session.mistakes ?? [] };
}

async function finishSessionById(sessionId: string): Promise<void> {
  const userMessages = await db
    .select()
    .from(sessionMessagesTable)
    .where(
      and(
        eq(sessionMessagesTable.sessionId, sessionId),
        eq(sessionMessagesTable.role, "user"),
      ),
    );

  const summary = summarizeSession(
    userMessages.map((m) => ({
      content: m.content,
      confidence: m.confidence,
      clarity: m.clarity,
      fillerWords: m.fillerWords,
    })),
  );

  await db
    .update(pitchSessionsTable)
    .set({
      status: "finished",
      overallScore: summary.overallScore,
      confidenceScore: summary.confidenceScore,
      clarityScore: summary.clarityScore,
      investorReadiness: summary.investorReadiness,
      summary: summary.summary,
      mistakes: summary.mistakes,
      finishedAt: new Date(),
    })
    .where(eq(pitchSessionsTable.id, sessionId));

  await db.insert(sessionMessagesTable).values({
    sessionId,
    role: "system",
    content: `Session complete. Overall score: ${summary.overallScore}. ${summary.summary}`,
  });
}

router.get("/sessions", async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const rows = await db
    .select({
      id: pitchSessionsTable.id,
      userId: pitchSessionsTable.userId,
      ideaId: pitchSessionsTable.ideaId,
      personaSlug: pitchSessionsTable.personaSlug,
      status: pitchSessionsTable.status,
      overallScore: pitchSessionsTable.overallScore,
      confidenceScore: pitchSessionsTable.confidenceScore,
      clarityScore: pitchSessionsTable.clarityScore,
      investorReadiness: pitchSessionsTable.investorReadiness,
      summary: pitchSessionsTable.summary,
      createdAt: pitchSessionsTable.createdAt,
      finishedAt: pitchSessionsTable.finishedAt,
      ideaTitle: ideasTable.title,
      personaName: personasTable.name,
    })
    .from(pitchSessionsTable)
    .leftJoin(ideasTable, eq(ideasTable.id, pitchSessionsTable.ideaId))
    .leftJoin(personasTable, eq(personasTable.slug, pitchSessionsTable.personaSlug))
    .where(eq(pitchSessionsTable.userId, userId))
    .orderBy(desc(pitchSessionsTable.createdAt));
  res.json(ListSessionsResponse.parse(rows));
});

router.post("/sessions", async (req: Request, res: Response): Promise<void> => {
  const parsed = StartSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const userId = req.user!.id;
  const [idea] = await db
    .select()
    .from(ideasTable)
    .where(and(eq(ideasTable.id, parsed.data.ideaId), eq(ideasTable.userId, userId)));
  if (!idea) {
    res.status(404).json({ error: "Idea not found" });
    return;
  }
  const [persona] = await db
    .select()
    .from(personasTable)
    .where(eq(personasTable.slug, parsed.data.personaSlug));
  if (!persona) {
    res.status(404).json({ error: "Persona not found" });
    return;
  }

  const [session] = await db
    .insert(pitchSessionsTable)
    .values({
      userId,
      ideaId: idea.id,
      personaSlug: persona.slug,
      status: "active",
    })
    .returning();

  await db.insert(sessionMessagesTable).values([
    {
      sessionId: session.id,
      role: "system",
      content: `${persona.name} has joined the room. Style: ${persona.style}. Take a breath. Open with the strongest version of your pitch.`,
    },
    {
      sessionId: session.id,
      role: "investor",
      content: `Alright. Pitch me ${idea.title}. You have one minute. Make it count.`,
    },
  ]);

  const detail = await loadSessionDetail(session.id, userId);
  res.json(StartSessionResponse.parse({ ...detail! }));
});

router.get("/sessions/:id", async (req: Request, res: Response): Promise<void> => {
  const params = GetSessionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const userId = req.user!.id;
  const detail = await loadSessionDetail(params.data.id, userId);
  if (!detail) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  res.json(GetSessionResponse.parse(detail));
});

router.post("/sessions/:id/messages", async (req: Request, res: Response): Promise<void> => {
  const params = SendSessionMessageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = SendSessionMessageBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const userId = req.user!.id;
  const [session] = await db
    .select()
    .from(pitchSessionsTable)
    .where(
      and(
        eq(pitchSessionsTable.id, params.data.id),
        eq(pitchSessionsTable.userId, userId),
      ),
    );
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  if (session.status === "finished") {
    res.status(400).json({ error: "Session already finished" });
    return;
  }

  const score = scorePitchTurn(body.data.content);

  await db.insert(sessionMessagesTable).values({
    sessionId: session.id,
    role: "user",
    content: body.data.content,
    feedback: score.feedback,
    confidence: score.confidence,
    clarity: score.clarity,
    fillerWords: score.fillerWords,
  });

  const userTurnRows = await db
    .select({ id: sessionMessagesTable.id })
    .from(sessionMessagesTable)
    .where(
      and(
        eq(sessionMessagesTable.sessionId, session.id),
        eq(sessionMessagesTable.role, "user"),
      ),
    );
  const userTurnCount = userTurnRows.length;

  const autoFinish = userTurnCount >= MAX_SESSION_TURNS;

  if (!autoFinish) {
    const allMessages = await db
      .select()
      .from(sessionMessagesTable)
      .where(eq(sessionMessagesTable.sessionId, session.id))
      .orderBy(asc(sessionMessagesTable.createdAt));

    const [idea] = await db.select().from(ideasTable).where(eq(ideasTable.id, session.ideaId));

    const conversationHistory = allMessages
      .filter((m) => m.role === "user" || m.role === "investor")
      .map((m) => ({ role: m.role as "user" | "investor", content: m.content }));

    const investorReply = await pickAIInvestorQuestion(
      session.personaSlug,
      idea,
      conversationHistory,
      body.data.language,
    );

    await db.insert(sessionMessagesTable).values({
      sessionId: session.id,
      role: "investor",
      content: investorReply,
    });
  } else {
    await finishSessionById(session.id);
  }

  const detail = await loadSessionDetail(session.id, userId);
  res.json(SendSessionMessageResponse.parse(detail!));
});

router.post("/sessions/:id/voice-messages", async (req: Request, res: Response): Promise<void> => {
  const params = SendSessionVoiceMessageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = SendSessionVoiceMessageBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const userId = req.user!.id;
  const [session] = await db
    .select()
    .from(pitchSessionsTable)
    .where(
      and(
        eq(pitchSessionsTable.id, params.data.id),
        eq(pitchSessionsTable.userId, userId),
      ),
    );
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  if (session.status === "finished") {
    res.status(400).json({ error: "Session already finished" });
    return;
  }

  const audioBuffer = Buffer.from(body.data.audio, "base64");
  const transcript = await transcribeAudio(audioBuffer);

  if (!transcript || transcript.trim().length === 0) {
    res.status(400).json({ error: "Could not transcribe audio. Please speak clearly and try again." });
    return;
  }

  const score = scorePitchTurn(transcript);

  await db.insert(sessionMessagesTable).values({
    sessionId: session.id,
    role: "user",
    content: transcript,
    feedback: score.feedback,
    confidence: score.confidence,
    clarity: score.clarity,
    fillerWords: score.fillerWords,
  });

  const userTurnRows = await db
    .select({ id: sessionMessagesTable.id })
    .from(sessionMessagesTable)
    .where(
      and(
        eq(sessionMessagesTable.sessionId, session.id),
        eq(sessionMessagesTable.role, "user"),
      ),
    );
  const userTurnCount = userTurnRows.length;
  const autoFinish = userTurnCount >= MAX_SESSION_TURNS;

  let investorReply: string;
  let investorAudioB64 = "";

  if (!autoFinish) {
    const allMessages = await db
      .select()
      .from(sessionMessagesTable)
      .where(eq(sessionMessagesTable.sessionId, session.id))
      .orderBy(asc(sessionMessagesTable.createdAt));

    const [idea] = await db.select().from(ideasTable).where(eq(ideasTable.id, session.ideaId));

    const conversationHistory = allMessages
      .filter((m) => m.role === "user" || m.role === "investor")
      .map((m) => ({ role: m.role as "user" | "investor", content: m.content }));

    investorReply = await pickAIInvestorQuestion(
      session.personaSlug,
      idea,
      conversationHistory,
      body.data.language,
    );

    await db.insert(sessionMessagesTable).values({
      sessionId: session.id,
      role: "investor",
      content: investorReply,
    });

    const audioBuffer = await generateInvestorAudio(investorReply, body.data.language);
    if (audioBuffer) {
      investorAudioB64 = audioBuffer.toString("base64");
    }
  } else {
    investorReply = "That was your final question. Well done — let's see how you performed.";
    const audioBuffer = await generateInvestorAudio(investorReply);
    if (audioBuffer) investorAudioB64 = audioBuffer.toString("base64");
    await finishSessionById(session.id);
  }

  const detail = await loadSessionDetail(session.id, userId);
  res.json({
    ...detail!,
    transcript,
    investorAudio: investorAudioB64,
    autoFinished: autoFinish,
  });
});

router.post("/sessions/:id/finish", async (req: Request, res: Response): Promise<void> => {
  const params = FinishSessionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const userId = req.user!.id;
  const [session] = await db
    .select()
    .from(pitchSessionsTable)
    .where(
      and(
        eq(pitchSessionsTable.id, params.data.id),
        eq(pitchSessionsTable.userId, userId),
      ),
    );
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  if (session.status !== "finished") {
    await finishSessionById(session.id);
  }

  const detail = await loadSessionDetail(session.id, userId);
  res.json(FinishSessionResponse.parse(detail!));
});

export default router;
