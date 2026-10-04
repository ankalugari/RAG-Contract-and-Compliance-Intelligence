import { useRef, useState } from 'react';
import { api } from '../api';

export default function Documents({ docs, active, onSelect, onChange }) {
  const input = useRef();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      onChange((await api.upload(file)).id); 
    }
    catch (e) { 
      setError(e.message); 
    }
    finally { 
      setBusy(false); 
      input.current.value = ''; 
    }
  };

  return (
    <aside className="flex w-72 shrink-0 flex-col gap-5 bg-ink p-5 text-white">
      <h1 className="font-serif text-xl leading-snug">Contract and Compliance Intelligence</h1>
      <button onClick={() => input.current.click()} disabled={busy}
        className="rounded bg-white px-3 py-2 text-sm font-medium text-ink disabled:opacity-60">
        {busy ? 'Reading and indexing…' : 'Upload contract'}
      </button>
      <input ref={input} type="file" accept=".pdf,.txt,.md" hidden onChange={(e) => upload(e.target.files[0])} />
      {error && <p className="text-sm text-red-300">{error}</p>}
      <ul className="space-y-1 overflow-y-auto">
        {docs.map((d) => (
          <li key={d.id} className={`flex items-center rounded px-3 py-2 text-sm ${d.id === active ? 'bg-white/15' : 'hover:bg-white/10'}`}>
            <button onClick={() => onSelect(d.id)} className="min-w-0 flex-1 text-left">
              <span className="block truncate">{d.name}</span>
              <span className="text-xs text-white/60">{d.chunks} passages indexed</span>
            </button>
            <button aria-label={`Remove ${d.name}`} className="ml-2 text-white/50 hover:text-white"
              onClick={async () => { await api.remove(d.id); onChange(); }}>✕</button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
