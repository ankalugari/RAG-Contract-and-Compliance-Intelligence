// Thin fetch wrapper for the backend
const call = async (path, opts) => {
  const res = await fetch('/api' + path, opts);
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
