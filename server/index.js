import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import { randomUUID } from 'crypto';
import { docs, ingest, remove, retrieve } from './rag.js';
import { answer, review, rewrite } from './llm.js';

const app = express().use(cors(), express.json());
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const needDoc = (id) => { if (!docs.has(id)) throw new Error('Select an uploaded contract first.'); };

app.get('/api/docs', (_, res) => res.json([...docs.values()]));

app.post('/api/docs', upload.single('file'), async (req, res) => {
  const { originalname: name, buffer, mimetype } = req.file ?? {};
  if (!buffer) throw new Error('Attach a PDF or text file.');
  const isPdf = mimetype === 'application/pdf' || name.endsWith('.pdf');
  const text = isPdf ? (await pdf(new Uint8Array(buffer))).text : buffer.toString('utf8');
  if (text.trim().length < 50) throw new Error('No readable text found. Scanned PDFs need OCR first.');
  const id = randomUUID();
  await ingest(id, name, text);
  res.json(docs.get(id));
});

app.delete('/api/docs/:id', (req, res) => { remove(req.params.id); res.json({ ok: true }); });

app.post('/api/chat', async (req, res) => {
  const { question, docId, history = [] } = req.body;
  needDoc(docId);
  const clean = history.filter((m) => ['user', 'assistant'].includes(m.role));
  const sources = await retrieve(await rewrite(question, clean), { docId });
  res.json({ answer: await answer(question, sources, clean), sources });
});

app.post('/api/review', async (req, res) => {
  needDoc(req.body.docId);
  res.json(await review(req.body.docId));
});

app.use((err, _req, res, _next) => { console.error(err.message); res.status(500).json({ error: err.message }); });

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API on http://localhost:${port}`));
