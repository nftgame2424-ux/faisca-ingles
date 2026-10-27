// Conversa livre com o Claude (opcional): usa a chave da API que você colar nos Ajustes.
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { Level, Scenario } from "../data/content";

const TutorReply = z.object({
  reply: z.string(),
  reply_pt: z.string(),
  better: z.string(),
  why_pt: z.string(),
  suggestions: z.array(z.string())
});
export type TutorReply = z.infer<typeof TutorReply>;

const LEVEL_DESC: Record<Level, string> = {
  A: "beginner (CEFR A1-A2): very simple, common words and short present-tense sentences",
  B: "intermediate (CEFR B1-B2): everyday vocabulary, past and future tenses, a few common phrasal verbs",
  C: "advanced (CEFR C1): natural, idiomatic English with nuance"
};

export interface ChatTurn { role: "ai" | "me"; text: string }

export class TutorError extends Error {
  constructor(public kind: "auth" | "rate" | "network" | "refusal" | "other", message: string) { super(message); }
}

export async function askTutor(opts: {
  apiKey: string; model: string; level: Level; scenario: Scenario; history: ChatTurn[]; onlyHelp: boolean;
}): Promise<TutorReply> {
  const client = new Anthropic({ apiKey: opts.apiKey, dangerouslyAllowBrowser: true });
  const last = opts.history[opts.history.length - 1];
  const learnerTurn = !opts.onlyHelp && last?.role === "me";
  const transcript = opts.history.slice(-16).map((m) => `${m.role === "ai" ? "Sam" : "Learner"}: ${m.text}`).join("\n");
  const system = `You are "Sam", a warm, patient English conversation partner for a Brazilian Portuguese speaker who has ADHD and is practicing speaking. The learner's messages come from speech recognition, so ignore missing punctuation and capitalization, but do point out words that look misrecognized because of pronunciation.
Learner level: ${LEVEL_DESC[opts.level]}.
Scenario: ${opts.scenario.p}
Stay in the scenario and in character. Be light, friendly and encouraging; never shame.
Fill the fields like this:
- reply: your next line in English, at most ${opts.level === "A" ? 2 : 3} short sentences at the learner's level, ending with one simple question.${opts.onlyHelp ? " The learner is stuck, so leave reply empty." : ""}
- reply_pt: Brazilian Portuguese translation of reply.
- better: ${learnerTurn ? "if the learner's last message has a mistake or sounds unnatural, the corrected natural English version; if they wrote Portuguese, the English version; if it is already fine, an empty string." : "an empty string."}
- why_pt: ${learnerTurn ? "when better is not empty, one short explanation in Brazilian Portuguese (max 20 words); otherwise empty." : "an empty string."}
- suggestions: exactly 3 short, varied things the learner could say next, in English, at their level.`;

  try {
    const res = await client.messages.parse({
      model: opts.model,
      max_tokens: 4000,
      system,
      output_config: { effort: "low", format: zodOutputFormat(TutorReply) },
      messages: [{ role: "user", content: `Conversation so far:\n${transcript}` }]
    });
    if (res.stop_reason === "refusal") throw new TutorError("refusal", "O Sam não pode responder isso. Tente outra frase.");
    if (!res.parsed_output) throw new TutorError("other", "A resposta veio incompleta. Tente de novo.");
    return res.parsed_output;
  } catch (e) {
    if (e instanceof TutorError) throw e;
    if (e instanceof Anthropic.AuthenticationError) throw new TutorError("auth", "A chave da API não foi aceita. Confira nos Ajustes.");
    if (e instanceof Anthropic.RateLimitError) throw new TutorError("rate", "Muitas mensagens em pouco tempo. Espere um pouco e tente de novo.");
    if (e instanceof Anthropic.APIConnectionError) throw new TutorError("network", "Sem conexão com a internet.");
    if (e instanceof Anthropic.APIError) throw new TutorError("other", `Erro da API (${e.status ?? "?"}). Tente de novo.`);
    throw new TutorError("other", "Não deu para falar com o Sam agora.");
  }
}

