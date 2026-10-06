import {
  lazy,
  Suspense,
  useEffect,
  useState
} from 'react';

import {
  Alert,
  Button,
  Empty,
  Layout,
  Space,
  Typography
} from 'antd';

import { api } from './api';

import Documents from './components/Documents';

const Chat = lazy(
  () => import('./components/Chat')
);

const Review = lazy(
  () => import('./components/Review')
);

const { Header, Content, Sider } = Layout;

const { Title } = Typography;

export default function App() {
  const [docs, setDocs] = useState([]);

  const [active, setActive] = useState(null);

  const [tab, setTab] = useState('ask');

  const [error, setError] = useState('');

  async function loadDocuments(selectId = null) {
    try {
      const result = await api.docs();

      setDocs(result);

      if (selectId) {
        setActive(selectId);
        setTab('ask');
        setError('');
        return;
      }

      setActive((current) => {
        if (
          result.some(
            (doc) => doc.id === current
          )
        ) {
          return current;
        }

        return result[0]?.id || null;
      });

      setError('');
    } catch (err) {
      setError(
        err.message ||
        'Could not load contracts'
      );
    }
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  async function handleUploadSuccess(id) {
    await loadDocuments(id);
  }

  const activeDocument = docs.find(
    (doc) => doc.id === active
  );

  function updateDocument(updated) {
    setDocs((current) =>
      current.map((doc) =>
        doc.id === updated.id
          ? updated
          : doc
      )
    );
  }

  function openAskQuestions() {
    setTab('ask');
  }

  function openComplianceReview() {
    setTab('review');
  }

  return (
    <Layout
      className="contract-app"
      style={{
        minHeight: '100vh'
      }}
    >
      <Sider
        className="contract-sider"
        width={320}
        theme="light"
      >
        <Documents
          docs={docs}
          active={active}
          onSelect={setActive}
          onUploadSuccess={handleUploadSuccess}
          onChange={loadDocuments}
          onMetadataSave={updateDocument}
        />
      </Sider>

      <Layout>
        <Header
          className="contract-header"
          style={{
            background: '#fff',
            padding: '0 24px'
          }}
        >
          <Space size="middle" wrap>
            <Title
              level={4}
              style={{
                margin: 0
              }}
            >
              Contract and Compliance Intelligence
            </Title>

            <Button
              type={
                tab === 'ask'
                  ? 'primary'
                  : 'default'
              }
              onClick={openAskQuestions}
            >
              Ask Questions
            </Button>

            <Button
              type={
                tab === 'review'
                  ? 'primary'
                  : 'default'
              }
              onClick={openComplianceReview}
            >
              Compliance Review
            </Button>
          </Space>
        </Header>

        <Content
          className="contract-content"
          style={{
            padding: 24
          }}
        >
          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              style={{
                marginBottom: 16
              }}
            />
          )}

          {!activeDocument ? (
            <Empty
              description="Upload a contract to begin"
            />
          ) : tab === 'ask' ? (
            <Suspense fallback={<div>Loading...</div>}>
              <Chat
                key={activeDocument.id}
                doc={activeDocument}
              />
            </Suspense>
          ) : (
            <Suspense fallback={<div>Loading...</div>}>
              <Review
                key={activeDocument.id}
                doc={activeDocument}
              />
            </Suspense>
          )}
        </Content>
      </Layout>
    </Layout>
  );
}