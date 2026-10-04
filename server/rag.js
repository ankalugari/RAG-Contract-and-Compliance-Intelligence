import { pipeline } from '@xenova/transformers';

const embedder = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
embedder.catch((e) => console.error('Embedding model failed to load:', e.message));

export const docs = new Map(); 
let store = []; 

const embed = async (text) =>
  Array.from((await (await embedder)(text, { pooling: 'mean', normalize: true })).data);

export function chunk(text, size = 800, overlap = 150) {
  const clean = text.replace(/\s+/g, ' ').trim();
  const out = [];
  let start = 0;
  while (start < clean.length) {
    let end = Math.min(start + size, clean.length);
    const stop = clean.lastIndexOf('. ', end);
    if (end < clean.length && stop > start + size / 2) end = stop + 1;
    out.push(clean.slice(start, end));
    if (end >= clean.length) break;
    start = end - overlap;
  }
  return out;
}

export async function ingest(id, name, text) {
  const chunks = chunk(text);
  for (const t of chunks) store.push({ docId: id, docName: name, text: t, vec: await embed(t) });
  docs.set(id, { id, name, chunks: chunks.length });
}

export const remove = (id) => {
  store = store.filter((c) => c.docId !== id);
  docs.delete(id);
};

const dot = (a, b) => a.reduce((sum, x, i) => sum + x * b[i], 0);

export async function retrieve(query, { docId, k = 5 } = {}) {
  const q = await embed(query);
  return store
    .filter((c) => !docId || c.docId === docId)
    .map(({ vec, ...c }) => ({ ...c, score: dot(q, vec) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
