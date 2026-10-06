import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import { randomUUID } from 'crypto';

import pool, { testDatabase} from './db.js';

import {docs,ingest,remove,retrieve,updateMetadata,loadDocuments} from './rag.js';

import {answer,extractMetadata,extractMemory,isContractQuestion,rewrite,review} from './llm.js';

import {normalizeFilters} from './metadata.js';

const app = express();
const clientDist = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../client/dist'
);

app.use(cors());
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

function checkDocument(id) {
  if (!docs.has(id)) {
    throw new Error(
      'Select an uploaded contract first.'
    );
  }
}

async function getGlobalConversation(sessionId) {
  const [rows] = await pool.query(
    `SELECT id
     FROM conversations
     WHERE session_id = ?
     AND doc_id IS NULL
     ORDER BY id DESC
     LIMIT 1`,
    [sessionId]
  );

  if (rows.length > 0) {
    return rows[0].id;
  }

  const [result] = await pool.query(
    `INSERT INTO conversations
     (session_id, doc_id)
     VALUES (?, NULL)`,
    [sessionId]
  );

  return result.insertId;
}

async function getHistory(sessionId) {
  const [rows] = await pool.query(
    `SELECT
       m.role,
       m.content,
       m.created_at
     FROM conversations c
     JOIN messages m
       ON c.id = m.conversation_id
     WHERE c.session_id = ?
     ORDER BY m.id ASC`,
    [sessionId]
  );

  return {
    messages: rows
  };
}

async function saveMessage(
  conversationId,
  role,
  content
) {
  await pool.query(
    `INSERT INTO messages
     (conversation_id, role, content)
     VALUES (?, ?, ?)`,
    [
      conversationId,
      role,
      content
    ]
  );
}

async function saveMemory(
  sessionId,
  memory
) {
  if (!memory) {
    return;
  }

  const [existing] = await pool.query(
    `SELECT id
     FROM memories
     WHERE session_id = ?
     AND memory = ?
     LIMIT 1`,
    [
      sessionId,
      memory
    ]
  );

  if (existing.length > 0) {
    return;
  }

  await pool.query(
    `INSERT INTO memories
     (session_id, memory)
     VALUES (?, ?)`,
    [
      sessionId,
      memory
    ]
  );
}

async function getMemories(
  sessionId,
  question
) {
  const [rows] = await pool.query(
    `SELECT
       id,
       memory,
       created_at
     FROM memories
     WHERE session_id = ?
     ORDER BY id DESC`,
    [sessionId]
  );

  if (!rows.length) {
    return [];
  }

  const words = question
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(' ')
    .filter(
      (word) => word.length > 2
    );

  if (!words.length) {
    return rows.slice(0, 10);
  }

  const matching = rows.filter(
    (row) => {
      const memory =
        row.memory.toLowerCase();

      return words.some(
        (word) =>
          memory.includes(word)
      );
    }
  );

  if (matching.length > 0) {
    return matching.slice(0, 10);
  }

  return rows.slice(0, 10);
}

app.get('/api/docs', (req, res) => {
  res.json([...docs.values()]);
});

app.post(
  '/api/docs',
  upload.single('file'),
  async (req, res, next) => {
    console.log(
      'UPLOAD REQUEST RECEIVED'
    );

    try {
      const file = req.file;

      console.log(
        'FILE:',
        file
          ? file.originalname
          : 'NO FILE'
      );

      if (!file) {
        throw new Error(
          'Attach a PDF or text file.'
        );
      }

      console.log(
        'File size:',
        file.size
      );

      const name =
        file.originalname;

      const buffer =
        file.buffer;

      const isPdf =
        file.mimetype === 'application/pdf' ||
        name
          .toLowerCase()
          .endsWith('.pdf');

      let text;

      console.log(
        'Reading file...'
      );

      if (isPdf) {
        console.log(
          'PDF detected. Extracting text...'
        );

        const result =
          await pdf(
            new Uint8Array(buffer)
          );

        text = result.text;

        console.log(
          'PDF text extracted.'
        );
      } else {
        console.log(
          'Text file detected.'
        );

        text =
          buffer.toString('utf8');
      }

      console.log(
        'Extracted text length:',
        text.length
      );

      if (text.trim().length < 50) {
        throw new Error(
          'No readable text found. Scanned PDFs need OCR first.'
        );
      }

      const id =
        randomUUID();

      let metadata = {};

      try {
        console.log(
          'Extracting contract metadata with Groq...'
        );

        metadata =
          await extractMetadata(
            text
          );

        console.log(
          'Metadata extracted successfully.'
        );
      } catch (error) {
        console.log(
          'Metadata extraction failed:',
          error.message
        );
      }

      console.log(
        'Starting document ingestion...'
      );

      await ingest(
        id,
        name,
        text,
        metadata
      );

      console.log(
        'Document ingestion completed.'
      );

      console.log(
        'Sending uploaded document to frontend...'
      );

      res.json(
        docs.get(id)
      );

      console.log(
        'UPLOAD COMPLETED'
      );
    } catch (error) {
      console.error(
        'UPLOAD ERROR:',
        error
      );

      next(error);
    }
  }
);

app.delete(
  '/api/docs/:id',
  async (req, res, next) => {
    try {
      checkDocument(
        req.params.id
      );

      await remove(
        req.params.id
      );

      res.json({
        ok: true
      });
    } catch (error) {
      next(error);
    }
  }
);

app.patch(
  '/api/docs/:id/metadata',
  async (req, res, next) => {
    try {
      checkDocument(
        req.params.id
      );

      const metadata =
        req.body.metadata || {};

      const updated =
        await updateMetadata(
          req.params.id,
          metadata
        );

      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
);

app.get(
  '/api/chat/:scope',
  async (req, res, next) => {
    try {
      const scope =
        req.params.scope;

      const sessionId =
        req.query.sessionId;

      if (
        scope !== 'all'
      ) {
        checkDocument(scope);
      }

      if (!sessionId) {
        throw new Error(
          'A chat session is required.'
        );
      }

      const result =
        await getHistory(
          sessionId
        );

      res.json({
        messages:
          result.messages
      });
    } catch (error) {
      next(error);
    }
  }
);

app.delete(
  '/api/chat/:scope',
  async (req, res, next) => {
    try {
      const scope =
        req.params.scope;

      const sessionId =
        req.query.sessionId;

      if (
        scope !== 'all'
      ) {
        checkDocument(scope);
      }

      if (!sessionId) {
        throw new Error(
          'A chat session is required.'
        );
      }

      const [conversations] =
        await pool.query(
          `SELECT id
           FROM conversations
           WHERE session_id = ?`,
          [sessionId]
        );

      for (
        const conversation
        of conversations
      ) {
        await pool.query(
          `DELETE FROM messages
           WHERE conversation_id = ?`,
          [conversation.id]
        );
      }

      await pool.query(
        `DELETE FROM conversations
         WHERE session_id = ?`,
        [sessionId]
      );

      res.json({
        messages: []
      });
    } catch (error) {
      next(error);
    }
  }
);

app.post(
  '/api/chat',
  async (req, res, next) => {
    try {
      const {
        question,
        docId,
        sessionId,
        filters
      } = req.body;

      if (docId) {
        checkDocument(docId);
      }

      if (!sessionId) {
        throw new Error(
          'A chat session is required.'
        );
      }

      if (
        typeof question !== 'string' ||
        !question.trim()
      ) {
        throw new Error(
          'Enter a question first.'
        );
      }

      const cleanQuestion =
        question.trim();

      const conversationId =
        await getGlobalConversation(
          sessionId
        );

      const historyResult =
        await getHistory(
          sessionId
        );

      const history =
        historyResult.messages;

      const chatHistory =
        history.map(
          ({
            role,
            content
          }) => ({
            role,
            content
          })
        );

      await saveMessage(
        conversationId,
        'user',
        cleanQuestion
      );

      let memory = '';

      try {
        memory =
          await extractMemory(
            cleanQuestion
          );
      } catch (error) {
        console.log(
          'Memory extraction failed:',
          error.message
        );
      }

      if (memory) {
        await saveMemory(
          sessionId,
          memory
        );
      }

      const memories =
        await getMemories(
          sessionId,
          cleanQuestion
        );

      const contractQuestion =
        await isContractQuestion(
          cleanQuestion
        );

      let sources = [];

      if (contractQuestion) {
        if (!docId) {
          throw new Error(
            'Select a contract before asking a contract question.'
          );
        }

        const cleanFilters =
          normalizeFilters(
            filters
          );

        const searchQuery =
          await rewrite(
            cleanQuestion,
            chatHistory
          );

        sources =
          await retrieve(
            searchQuery,
            {
              docId,
              filters:
                cleanFilters
            }
          );
      }

      const response =
        await answer(
          cleanQuestion,
          sources,
          chatHistory,
          memories
        );

      await saveMessage(
        conversationId,
        'assistant',
        response
      );

      res.json({
        answer: response,
        sources
      });
    } catch (error) {
      next(error);
    }
  }
);

app.post(
  '/api/review',
  async (req, res, next) => {
    try {
      const {
        docId
      } = req.body;

      checkDocument(docId);

      const result =
        await review(docId);

      res.json({
        items: result
      });
    } catch (error) {
      next(error);
    }
  }
);

app.use('/api', (req, res) => {
  res.status(404).json({
    error: 'API route not found'
  });
});

app.use(express.static(clientDist));

app.use((req, res, next) => {
  if (req.method !== 'GET') {
    return next();
  }

  res.sendFile(
    path.join(clientDist, 'index.html'),
    (error) => {
      if (error) {
        next(error);
      }
    }
  );
});

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      'SERVER ERROR:',
      error
    );

    res.status(500).json({
      error:
        error.message ||
        'Server error'
    });
  }
);

const PORT =
  process.env.PORT || 4000;

async function startServer() {
  try {
    await testDatabase();

    await loadDocuments();

    console.log(
      'Documents loaded from MySQL'
    );

    app.listen(
      PORT,
      () => {
        console.log(
          `Server running on http://localhost:${PORT}`
        );
      }
    );
  } catch (error) {
    console.error(
      'MySQL connection failed:',
      error.message
    );
  }
}

startServer();