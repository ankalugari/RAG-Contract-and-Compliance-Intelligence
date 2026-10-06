import { pipeline } from '@xenova/transformers';

import {
  matchesMetadata,
  normalizeMetadata
} from './metadata.js';

import pool from './db.js';

const embedder = pipeline(
  'feature-extraction',
  'Xenova/all-MiniLM-L6-v2'
);

embedder.catch((error) => {
  console.error(
    'Embedding model failed to load:',
    error.message
  );
});

export const docs = new Map();

let store = [];

async function embed(text) {
  const model = await embedder;

  const result = await model(text, {
    pooling: 'mean',
    normalize: true
  });

  return Array.from(result.data);
}

export function chunk(
  text,
  size = 800,
  overlap = 150
) {
  const cleanText = text
    .replace(/\s+/g, ' ')
    .trim();

  const chunks = [];

  let start = 0;

  while (start < cleanText.length) {
    let end = Math.min(
      start + size,
      cleanText.length
    );

    const sentenceEnd =
      cleanText.lastIndexOf(
        '. ',
        end
      );

    if (
      end < cleanText.length &&
      sentenceEnd >
        start + size / 2
    ) {
      end = sentenceEnd + 1;
    }

    const textChunk =
      cleanText.slice(
        start,
        end
      );

    chunks.push(textChunk);

    if (
      end >= cleanText.length
    ) {
      break;
    }

    start = end - overlap;
  }

  return chunks;
}

export async function ingest(
  id,
  name,
  text,
  metadata = {}
) {
  const chunks = chunk(text);

  const cleanMetadata =
    normalizeMetadata(
      metadata
    );

  await pool.query(
    `INSERT INTO documents
     (id, name, chunks)
     VALUES (?, ?, ?)`,
    [
      id,
      name,
      chunks.length
    ]
  );

  await pool.query(
    `INSERT INTO document_metadata
     (
       document_id,
       contract_type,
       parties,
       effective_date,
       expiration_date,
       governing_law,
       jurisdiction,
       status,
       tags
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      cleanMetadata.contractType,
      JSON.stringify(
        cleanMetadata.parties
      ),
      cleanMetadata.effectiveDate ||
        null,
      cleanMetadata.expirationDate ||
        null,
      cleanMetadata.governingLaw,
      cleanMetadata.jurisdiction,
      cleanMetadata.status,
      JSON.stringify(
        cleanMetadata.tags
      )
    ]
  );

  for (
    let i = 0;
    i < chunks.length;
    i++
  ) {
    const textChunk =
      chunks[i];

    const vector =
      await embed(
        textChunk
      );

    store.push({
      docId: id,
      docName: name,
      text: textChunk,
      vec: vector
    });

    await pool.query(
      `INSERT INTO document_chunks
       (
         document_id,
         chunk_index,
         content,
         embedding
       )
       VALUES (?, ?, ?, ?)`,
      [
        id,
        i,
        textChunk,
        JSON.stringify(vector)
      ]
    );
  }

  docs.set(id, {
    id,
    name,
    chunks: chunks.length,
    metadata: cleanMetadata
  });
}

export async function loadDocuments() {
  docs.clear();

  store = [];

  const [rows] =
    await pool.query(`
      SELECT
        d.id,
        d.name,
        d.chunks,
        m.contract_type,
        m.parties,
        m.effective_date,
        m.expiration_date,
        m.governing_law,
        m.jurisdiction,
        m.status,
        m.tags
      FROM documents d
      LEFT JOIN document_metadata m
        ON d.id = m.document_id
    `);

  for (const row of rows) {
    let parties = [];
    let tags = [];

    try {
      parties = row.parties
        ? JSON.parse(row.parties)
        : [];

      tags = row.tags
        ? JSON.parse(row.tags)
        : [];
    } catch {
      parties = [];
      tags = [];
    }

    docs.set(row.id, {
      id: row.id,
      name: row.name,
      chunks: row.chunks,
      metadata:
        normalizeMetadata({
          contractType:
            row.contract_type,

          parties,

          effectiveDate:
            row.effective_date,

          expirationDate:
            row.expiration_date,

          governingLaw:
            row.governing_law,

          jurisdiction:
            row.jurisdiction,

          status:
            row.status,

          tags
        })
    });
  }

  const [chunkRows] =
    await pool.query(`
      SELECT
        c.document_id,
        c.chunk_index,
        c.content,
        c.embedding,
        d.name
      FROM document_chunks c
      JOIN documents d
        ON c.document_id = d.id
      ORDER BY
        c.document_id,
        c.chunk_index
    `);

  for (
    const row of chunkRows
  ) {
    let vector = [];

    try {
      vector =
        typeof row.embedding ===
          'string'
          ? JSON.parse(
              row.embedding
            )
          : row.embedding;
    } catch {
      vector = [];
    }

    store.push({
      docId:
        row.document_id,

      docName:
        row.name,

      text:
        row.content,

      vec:
        vector
    });
  }

  console.log(
    `${docs.size} documents loaded`
  );

  console.log(
    `${store.length} chunks loaded`
  );
}

export async function updateMetadata(
  id,
  metadata
) {
  const doc = docs.get(id);

  if (!doc) {
    throw new Error(
      'Contract not found.'
    );
  }

  const cleanMetadata =
    normalizeMetadata(
      metadata
    );

  await pool.query(
    `UPDATE document_metadata
     SET
       contract_type = ?,
       parties = ?,
       effective_date = ?,
       expiration_date = ?,
       governing_law = ?,
       jurisdiction = ?,
       status = ?,
       tags = ?
     WHERE document_id = ?`,
    [
      cleanMetadata.contractType,

      JSON.stringify(
        cleanMetadata.parties
      ),

      cleanMetadata.effectiveDate ||
        null,

      cleanMetadata.expirationDate ||
        null,

      cleanMetadata.governingLaw,

      cleanMetadata.jurisdiction,

      cleanMetadata.status,

      JSON.stringify(
        cleanMetadata.tags
      ),

      id
    ]
  );

  const updated = {
    ...doc,
    metadata:
      cleanMetadata
  };

  docs.set(
    id,
    updated
  );

  return updated;
}

export async function remove(id) {
  await pool.query(
    `DELETE FROM documents
     WHERE id = ?`,
    [id]
  );

  store =
    store.filter(
      (item) =>
        item.docId !== id
    );

  docs.delete(id);
}

function dot(a, b) {
  let result = 0;

  for (
    let i = 0;
    i < a.length;
    i++
  ) {
    result +=
      a[i] * b[i];
  }

  return result;
}

export async function retrieve(
  query,
  {
    docId,
    filters = {},
    k = 5
  } = {}
) {
  const queryVector =
    await embed(query);

  const matchingDocIds =
    new Set();

  for (
    const doc
    of docs.values()
  ) {
    const sameDocument =
      !docId ||
      doc.id === docId;

    const matches =
      matchesMetadata(
        doc.metadata,
        filters
      );

    if (
      sameDocument &&
      matches
    ) {
      matchingDocIds.add(
        doc.id
      );
    }
  }

  const results =
    store
      .filter(
        (item) =>
          matchingDocIds.has(
            item.docId
          )
      )
      .map((item) => {
        return {
          docId:
            item.docId,

          docName:
            item.docName,

          text:
            item.text,

          metadata:
            docs.get(
              item.docId
            )?.metadata || {},

          score:
            dot(
              queryVector,
              item.vec
            )
        };
      })
      .sort(
        (a, b) =>
          b.score - a.score
      )
      .slice(0, k);

  return results;
}
