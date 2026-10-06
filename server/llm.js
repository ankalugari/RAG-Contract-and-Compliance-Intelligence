import Groq from 'groq-sdk';

import { retrieve } from './rag.js';

import { normalizeMetadata } from './metadata.js';

const MODEL =
  process.env.GROQ_MODEL || 'openai/gpt-oss-20b';

let client;

function getClient() {
  if (!client) {
    client = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
  }

  return client;
}

async function ask(messages, maxTokens) {
  const response =
    await getClient().chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0,
      ...(maxTokens
        ? {
            max_completion_tokens: maxTokens
          }
        : {})
    });

  const choice = response.choices[0];

  if (!choice) {
    throw new Error(
      'No response received from the LLM.'
    );
  }

  if (choice.finish_reason === 'length') {
    throw new Error(
      'The LLM response was too long.'
    );
  }

  return choice.message.content;
}

function cleanJson(text) {
  return text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

export async function extractMetadata(text) {
  const response = await ask([
    {
      role: 'system',
      content:
        'Extract contract metadata from the contract. ' +
        'Return only one JSON object. ' +
        'Use these keys: contractType, parties, effectiveDate, ' +
        'expirationDate, governingLaw, jurisdiction, status, tags. ' +
        'Use empty strings for unknown text fields. ' +
        'Use arrays for parties and tags. ' +
        'Do not invent information.'
    },
    {
      role: 'user',
      content: text.slice(0, 12000)
    }
  ]);

  try {
    return normalizeMetadata(
      JSON.parse(cleanJson(response))
    );
  } catch {
    throw new Error(
      'The LLM returned invalid contract metadata.'
    );
  }
}

export async function isContractQuestion(question) {
  const response = await ask([
    {
      role: 'system',
      content:
        'Decide whether the user question requires ' +
        'searching an uploaded contract. ' +
        'Return only YES or NO. ' +
        'Return YES when the user asks about contract ' +
        'clauses, terms, parties, salary, payment, ' +
        'termination, renewal, confidentiality, liability, ' +
        'indemnification, dates, obligations, governing law, ' +
        'jurisdiction, compliance, or any information that ' +
        'should come from the uploaded contract. ' +
        'Return NO for greetings, introductions, casual ' +
        'conversation, personal information, questions about ' +
        'previous conversation, or information the user ' +
        'previously told the assistant.'
    },
    {
      role: 'user',
      content: question
    }
  ]);

  return response
    .trim()
    .toUpperCase()
    .startsWith('YES');
}

export async function extractMemory(question) {
  const response = await ask([
    {
      role: 'system',
      content:
        'Identify whether the user explicitly provided ' +
        'useful personal or project information that should ' +
        'be remembered for future conversations. ' +
        'Examples include name, skills, preferences, goals, ' +
        'education, job interests, project information, or ' +
        'other stable information. ' +
        'Do not store greetings, contract information, ' +
        'temporary questions, or assistant responses. ' +
        'Return only JSON in this format: ' +
        '{"memory":""}. ' +
        'If there is nothing important to remember, return ' +
        '{"memory":""}. ' +
        'Keep the memory short and factual.'
    },
    {
      role: 'user',
      content: question
    }
  ]);

  try {
    const result =
      JSON.parse(cleanJson(response));

    if (
      !result.memory ||
      typeof result.memory !== 'string'
    ) {
      return '';
    }

    return result.memory.trim();
  } catch {
    return '';
  }
}

export async function rewrite(
  question,
  history
) {
  if (!history.length) {
    return question;
  }

  return ask([
    {
      role: 'system',
      content:
        'Rewrite the user question as a standalone ' +
        'search query using the previous conversation. ' +
        'Return only the search query. ' +
        'Do not answer the question.'
    },
    ...history.slice(-4),
    {
      role: 'user',
      content: question
    }
  ]);
}

export async function answer(
  question,
  chunks,
  history,
  memories = []
) {
  const conversationHistory =
    history.slice(-20);

  const hasContractSources =
    chunks.length > 0;

  const memoryText =
    memories.length > 0
      ? memories
          .map(
            (memory, index) =>
              `[Memory ${index + 1}] ${memory.memory}`
          )
          .join('\n')
      : 'No saved memories were found.';

  let userContent;

  if (hasContractSources) {
    const contractContext =
      chunks
        .map(
          (chunk, index) =>
            `[${index + 1}] ${chunk.text}`
        )
        .join('\n\n');

    userContent =
      `Saved user memories:\n${memoryText}\n\n` +
      `Contract excerpts:\n${contractContext}\n\n` +
      `Current question: ${question}`;
  } else {
    userContent =
      `Saved user memories:\n${memoryText}\n\n` +
      `Current question: ${question}`;
  }

  return ask([
    {
      role: 'system',
      content:
        'You are a helpful contract and compliance assistant. ' +
        'You have conversation history and saved user memories. ' +
        'For general conversation and personal information, use ' +
        'saved memories and conversation history. ' +
        'For contract questions, use only the provided contract ' +
        'excerpts for contract facts. ' +
        'For contract answers, cite sources using [1], [2], etc. ' +
        'If a contract question cannot be answered from the ' +
        'provided contract excerpts, say exactly: ' +
        '"Not found in the contract." ' +
        'Do not invent contract information. ' +
        'Do not use contract information as personal memory. ' +
        'If the user previously told you something and it appears ' +
        'in saved memories, use it when answering later questions.'
    },

    ...conversationHistory,

    {
      role: 'user',
      content: userContent
    }
  ]);
}

const CHECKS = {
  Termination:
    'termination for cause or convenience and notice period',

  'Liability cap':
    'limitation of liability and cap on damages',

  Indemnification:
    'indemnification and third-party claims',

  Confidentiality:
    'confidentiality and non-disclosure obligations',

  'Payment terms':
    'fees, payment due dates and late payment interest',

  Renewal:
    'contract term, automatic renewal and renewal notice',

  'Data protection':
    'personal data, GDPR, security and breach notification',

  'Governing law':
    'governing law, jurisdiction, dispute resolution and arbitration'
};

export async function review(docId) {
  const names = Object.keys(CHECKS);

  const found = await Promise.all(
    names.map((name) =>
      retrieve(CHECKS[name], {
        docId,
        k: 3
      })
    )
  );

  const sections = names
    .map((name, index) => {
      const text = found[index]
        .map((chunk) => chunk.text)
        .join('\n---\n');

      return `## ${name}\n${text}`;
    })
    .join('\n\n');

  const response = await ask(
    [
      {
        role: 'system',
        content:
          'You are a contract compliance reviewer. ' +
          'Review only the provided contract excerpts. ' +
          'Return one JSON object only with this format: ' +
          '{"results":[{"check":"name","status":"present|missing",' +
          '"risk":"low|medium|high","summary":"one sentence",' +
          '"recommendation":"one sentence"}]}. ' +
          'If the clause is not found, use missing. ' +
          'Do not invent information.'
      },
      {
        role: 'user',
        content: sections
      }
    ],
    4096
  );

  let results;

  try {
    results =
      JSON.parse(
        cleanJson(response)
      ).results;
  } catch {
    throw new Error(
      'The LLM returned invalid compliance review data.'
    );
  }

  return results.map((result) => {
    const index =
      names.indexOf(result.check);

    return {
      ...result,
      evidence:
        found[index]?.[0]?.text || ''
    };
  });
}