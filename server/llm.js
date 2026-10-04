import Groq from 'groq-sdk';
import { retrieve } from './rag.js';

const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
let client;
const ask = (messages, json = false) =>
  (client ??= new Groq({ apiKey: process.env.GROQ_API_KEY })).chat.completions
    .create({
      model: MODEL,
      messages,
      temperature: 0, 
      ...(json && { response_format: { type: 'json_object' } }), 
    })
    .then((r) => r.choices[0].message.content);

const numbered = (chunks) => chunks.map((c, i) => `[${i + 1}] ${c.text}`).join('\n\n');

export const rewrite = async (question, history) =>
  history.length
    ? ask([
        { role: 'system', content: "Rewrite the user's last question as a standalone search query using the chat history. Output only the query." },
        ...history.slice(-4),
        { role: 'user', content: question },
      ])
    : question;

export const answer = (question, chunks, history) =>
  ask([
    {
      role: 'system',
      content:
        'You are a contract and compliance analyst. Answer ONLY from the numbered contract excerpts. ' +
        'Cite excerpts like [1]. If the excerpts do not contain the answer, reply "Not found in the contract." Never invent clauses.',
    },
    ...history.slice(-6),
    { role: 'user', content: `Excerpts:\n${numbered(chunks)}\n\nQuestion: ${question}` },
  ]);

const CHECKS = {
  Termination: 'termination for cause or convenience, notice period',
  'Liability cap': 'limitation of liability, cap on damages, excluded damages',
  Indemnification: 'indemnification, who covers third-party claims',
  Confidentiality: 'confidentiality and non-disclosure obligations',
  'Payment terms': 'fees, payment due dates, late payment interest',
  Renewal: 'contract term, automatic renewal, renewal notice',
  'Data protection': 'personal data protection, GDPR, security, breach notification',
  'Governing law': 'governing law, jurisdiction, dispute resolution, arbitration',
};

export async function review(docId) {
  const names = Object.keys(CHECKS);
  const found = await Promise.all(names.map((n) => retrieve(CHECKS[n], { docId, k: 3 })));
  const context = names.map((n, i) => `## ${n}\n${found[i].map((c) => c.text).join('\n---\n')}`).join('\n\n');

  const raw = await ask(
    [
      {
        role: 'system',
        content:
          'You are a contract compliance reviewer. For every section below, judge ONLY from the excerpts under it. ' +
          'Return JSON: {"results":[{"check":"<section name>","status":"present|missing","risk":"low|medium|high",' +
          '"summary":"one sentence","recommendation":"one sentence"}]}. ' +
          'If the excerpts do not contain the clause, status is "missing". Risk is the exposure to the party signing the contract.',
      },
      { role: 'user', content: context },
    ],
    true,
  );
  return JSON.parse(raw).results.map((r) => ({ ...r, evidence: found[names.indexOf(r.check)]?.[0]?.text }));
}
