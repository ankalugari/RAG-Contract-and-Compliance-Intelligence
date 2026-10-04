import { useState } from 'react';
import { api } from '../api';

const ORDER = { high: 0, medium: 1, low: 2 };
const TONE = {
  high: 'border-high text-high',
  medium: 'border-medium text-medium',
  low: 'border-low text-low',
};

export default function Review({ doc }) {
  const [items, setItems] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    setBusy(true);
    setError('');
    try { 
      setItems((await api.review(doc.id)).sort((a, b) => ORDER[a.risk] - ORDER[b.risk])); 
    }
    catch (e) { 
      setError(e.message); 
    }
    finally { 
      setBusy(false); 
    }
  };
  const count = (risk) => items.filter((i) => i.risk === risk).length;

  return (
    <section className="flex-1 overflow-y-auto px-8 py-6">
      <div className="flex items-center justify-between gap-4">
        <p className="font-serif text-2xl">Compliance review of {doc.name}</p>
        <button onClick={run} disabled={busy} className="rounded bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
          {busy ? 'Reviewing 8 clauses…' : items ? 'Run again' : 'Run review'}
        </button>
      </div>
      {error && <p className="mt-4 text-high">{error}</p>}
      {items && (
        <>
          <p className="mt-4 text-ink/70">
            <b className="text-high">{count('high')} high</b>, <b className="text-medium">{count('medium')} medium</b>, <b className="text-low">{count('low')} low</b> risk
          </p>
          <ul className="mt-4 max-w-3xl space-y-3">
            {items.map((i) => (
              <li key={i.check} className={`rounded border-l-4 bg-white p-4 ${TONE[i.risk]?.split(' ')[0]}`}>
                <p className="flex justify-between font-medium text-ink">
                  {i.check}
                  <span className={`text-sm ${TONE[i.risk]?.split(' ')[1]}`}>{i.status === 'missing' ? 'Missing' : 'Present'}, {i.risk} risk</span>
                </p>
                <p className="mt-1 text-ink/80">{i.summary}</p>
                <p className="mt-1 text-sm text-ink/60">Recommendation: {i.recommendation}</p>
                {i.status === 'present' && (
                  <details className="mt-2 text-sm text-ink/60">
                    <summary className="cursor-pointer">Evidence</summary>
                    <p className="mt-1 border-l-2 border-rule pl-3">{i.evidence}</p>
                  </details>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
