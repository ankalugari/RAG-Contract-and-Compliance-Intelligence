import { useEffect, useState } from 'react';
import { api } from './api';
import Documents from './components/Documents';
import Chat from './components/Chat';
import Review from './components/Review';

const TABS = { ask: 'Ask questions', review: 'Compliance review' };

export default function App() {
  const [docs, setDocs] = useState([]);
  const [active, setActive] = useState(null);
  const [tab, setTab] = useState('ask');

  const refresh = async (select) => {
    const list = await api.docs();
    setDocs(list);
    setActive((cur) => select ?? (list.some((d) => d.id === cur) ? cur : list[0]?.id));
  };
  useEffect(() => { refresh(); }, []);

  const doc = docs.find((d) => d.id === active);

  return (
    <div className="flex h-screen">
      <Documents docs={docs} active={active} onSelect={setActive} onChange={refresh} />
      <main className="flex min-w-0 flex-1 flex-col">
        <nav className="flex gap-6 border-b border-rule bg-white px-8">
          {Object.entries(TABS).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`border-b-2 py-4 text-sm font-medium ${tab === key ? 'border-brand text-brand' : 'border-transparent text-ink/60 hover:text-ink'}`}>
              {label}
            </button>
          ))}
        </nav>
        {!doc ? (
          <div className="m-auto max-w-sm text-center">
            <p className="font-serif text-2xl">Upload a contract to begin</p>
            <p className="mt-2 text-ink/60">PDF or text files up to 10 MB. Try sample/sample-contract.txt.</p>
          </div>
        ) : tab === 'ask' ? <Chat key={doc.id} doc={doc} /> : <Review key={doc.id} doc={doc} />}
      </main>
    </div>
  );
}
