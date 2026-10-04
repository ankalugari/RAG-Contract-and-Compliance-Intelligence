import { useEffect, useRef, useState } from 'react';
import { api } from '../api';

const SUGGESTIONS = ['What are the termination terms?', 'Is the liability capped?', 'How does renewal work?'];

export default function Chat({ doc }) {
  const [msgs, setMsgs] = useState([]);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef();
  useEffect(() => end.current?.scrollIntoView({ behavior: 'smooth' }), [msgs, busy]);

  const send = async (e, text = q) => {
    e?.preventDefault();
    const question = text.trim();
    if (!question || busy) return;
    const history = msgs.map(({ role, content }) => ({ role, content }));
    setMsgs((m) => [...m, { role: 'user', content: question }]);
    setQ('');
    setBusy(true);
    try {
      const { answer, sources } = await api.chat({ question, docId: doc.id, history });
      setMsgs((m) => [...m, { role: 'assistant', content: answer, sources }]);
    } catch (err) {
      setMsgs((m) => [...m, { role: 'assistant', content: err.message, sources: [] }]);
    } finally { setBusy(false); }
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto px-8 py-6">
        {!msgs.length && (
          <div className="max-w-xl">
            <p className="font-serif text-2xl">Ask about {doc.name}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(null, s)} className="rounded-full border border-rule bg-white px-3 py-1.5 text-sm hover:border-brand">{s}</button>
              ))}
            </div>
          </div>
        )}
        {msgs.map((m, i) => m.role === 'user' ? (
          <p key={i} className="ml-auto w-fit max-w-xl rounded-lg bg-brand px-4 py-2 text-white">{m.content}</p>
        ) : (
          <div key={i} className="max-w-2xl">
            <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
            {m.sources?.length > 0 && (
              <details className="mt-2 text-sm text-ink/70">
                <summary className="cursor-pointer">Sources ({m.sources.length})</summary>
                {m.sources.map((s, j) => (
                  <p key={j} className="mt-2 border-l-2 border-rule pl-3">
                    <b>[{j + 1}]</b> {s.text} <span className="text-ink/50">match {Math.round(s.score * 100)}%</span>
                  </p>
                ))}
              </details>
            )}
          </div>
        ))}
        {busy && <p className="text-ink/50">Searching the contract…</p>}
        <div ref={end} />
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-rule bg-white p-4">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask about a clause, obligation or deadline"
          className="flex-1 rounded border border-rule px-3 py-2 outline-none focus:border-brand focus-visible:ring-2 focus-visible:ring-brand/30" />
        <button disabled={busy} className="rounded bg-brand px-5 py-2 text-sm font-medium text-white disabled:opacity-60">Ask</button>
      </form>
    </section>
  );
}
