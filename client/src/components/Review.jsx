import { useState } from 'react';
import {Alert,Button,Card,Empty,List,Space,Spin,Statistic,Tag,Typography} from 'antd';
import { api } from '../api';

const { Title, Text, Paragraph } = Typography;

export default function Review({ doc }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function runReview() {
    if (!doc) return;
    setLoading(true);
    setError('');

    try {
      const result = await api.review(doc.id);
      setItems(result.items || []);
    } catch (err) {
      setError(err.message || 'Could not complete compliance review');
    } finally {
      setLoading(false);
    }
  }

  const high = items.filter((item) => item.risk === 'high').length;
  const medium = items.filter((item) => item.risk === 'medium').length;
  const low = items.filter((item) => item.risk === 'low').length;

  function getRiskColor(risk) {
    if (risk === 'high') return 'red';
    if (risk === 'medium') return 'orange';
    return 'green';
  }

  if (!doc) {
    return <Empty description="Select a contract first" />;
  }

  return (
    <div
      style={{
        padding: 24,
        height: '100%',
        overflowY: 'auto'
      }}
    >
      <Space
        direction="vertical"
        size="large"
        style={{ width: '100%' }}
      >
        <div>
          <Title level={3}>Compliance Review</Title>
          <Text type="secondary">{doc.name}</Text>
        </div>

        <Button
          type="primary"
          onClick={runReview}
          loading={loading}
        >
          Run Compliance Review
        </Button>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
          />
        )}

        {loading && (
          <Card>
            <Space>
              <Spin />
              <Text>Analyzing contract...</Text>
            </Space>
          </Card>
        )}

        {!loading && items.length > 0 && (
          <>
            <Space wrap>
              <Card>
                <Statistic
                  title="High Risk"
                  value={high}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>

              <Card>
                <Statistic
                  title="Medium Risk"
                  value={medium}
                  valueStyle={{ color: '#d46b08' }}
                />
              </Card>

              <Card>
                <Statistic
                  title="Low Risk"
                  value={low}
                  valueStyle={{ color: '#389e0d' }}
                />
              </Card>
            </Space>

            <List
              dataSource={items}
              renderItem={(item, index) => (
                <List.Item>
                  <Card
                    style={{ width: '100%' }}
                    title={
                      <Space>
                        <Text strong>
                          {item.title || `Compliance Item ${index + 1}`}
                        </Text>

                        <Tag color={getRiskColor(item.risk)}>
                          {item.risk || 'low'}
                        </Tag>
                      </Space>
                    }
                  >
                    <Space
                      direction="vertical"
                      style={{ width: '100%' }}
                    >
                      {item.status && (
                        <Text>
                          <strong>Status:</strong> {item.status}
                        </Text>
                      )}

                      {item.summary && (
                        <Paragraph>
                          <strong>Summary:</strong>{' '}
                          {item.summary}
                        </Paragraph>
                      )}

                      {item.recommendation && (
                        <Paragraph>
                          <strong>Recommendation:</strong>{' '}
                          {item.recommendation}
                        </Paragraph>
                      )}

                      {item.evidence && (
                        <Card size="small" title="Evidence">
                          <Paragraph>
                            {item.evidence}
                          </Paragraph>
                        </Card>
                      )}
                    </Space>
                  </Card>
                </List.Item>
              )}
            />
          </>
        )}

        {!loading && items.length === 0 && (
          <Empty description="Run the review to see compliance results" />
        )}
      </Space>
    </div>
  );
}
