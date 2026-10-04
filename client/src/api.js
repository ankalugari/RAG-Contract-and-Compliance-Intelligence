// Thin fetch wrapper for the backend
const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

const call = async (path, opts) => {
  const res = await fetch(API_BASE + path, opts);
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('The API returned a web page instead of JSON. Set VITE_API_URL in Netlify to your Render API URL ending in /api, then redeploy.');
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
};
const post = (body) => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

export const api = {
  docs: () => call('/docs'),
  upload: (file) => { const form = new FormData(); form.append('file', file); return call('/docs', { method: 'POST', body: form }); },
  remove: (id) => call('/docs/' + id, { method: 'DELETE' }),
  chat: (body) => call('/chat', post(body)),
  review: (docId) => call('/review', post({ docId })),
};
