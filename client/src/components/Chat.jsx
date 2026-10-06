import { useEffect, useState } from 'react';

import {
  Alert,
  Button,
  Checkbox,
  Collapse,
  Input,
  Select,
  Space,
  Spin,
  Tag,
  Typography
} from 'antd';

import { api } from '../api';

const { Text, Paragraph } = Typography;

export default function Chat({ doc }) {
  const [messages, setMessages] = useState([]);

  const [question, setQuestion] = useState('');

  const [filters, setFilters] = useState({});

  const [appliedFilters, setAppliedFilters] = useState({});

  const [allContracts, setAllContracts] = useState(false);

  const [loading, setLoading] = useState(true);

  const [busy, setBusy] = useState(false);

  const [error, setError] = useState('');

  const sessionId = api.sessionId();

  useEffect(() => {
    loadHistory();
  }, [doc.id, allContracts]);

  async function loadHistory() {
    setLoading(true);
    setError('');

    try {
      const scope = allContracts
        ? 'all'
        : doc.id;

      const result = await api.chatHistory(
        scope,
        sessionId
      );

      setMessages(
        result.messages || []
      );
    } catch (err) {
      setError(
        err.message ||
        'Could not load conversation'
      );
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    const text = question.trim();

    if (
      !text ||
      busy ||
      loading
    ) {
      return;
    }

    setMessages((old) => [
      ...old,
      {
        role: 'user',
        content: text
      }
    ]);

    setQuestion('');

    setBusy(true);
    setError('');

    try {
      const result = await api.chat({
        question: text,

        docId: allContracts
          ? undefined
          : doc.id,

        filters: appliedFilters
      });

      setMessages((old) => [
        ...old,
        {
          role: 'assistant',
          content: result.answer,

          sources:
            result.sources || []
        }
      ]);
    } catch (err) {
      setError(
        err.message ||
        'Could not get an answer'
      );
    } finally {
      setBusy(false);
    }
  }

  async function clearChat() {
    try {
      const scope = allContracts
        ? 'all'
        : doc.id;

      await api.clearChat(
        scope,
        sessionId
      );

      setMessages([]);

      setError('');
    } catch (err) {
      setError(
        err.message ||
        'Could not clear chat'
      );
    }
  }

  function changeFilter(
    name,
    value
  ) {
    setFilters((old) => ({
      ...old,
      [name]: value
    }));
  }

  function applyFilters() {
    setAppliedFilters(filters);
  }

  function clearFilters() {
    setFilters({});
    setAppliedFilters({});
  }

  const filterFields = [
    ['party', 'Party'],
    ['tag', 'Tag'],
    [
      'governingLaw',
      'Governing Law'
    ],
    [
      'jurisdiction',
      'Jurisdiction'
    ]
  ];

  return (
    <div
      style={{
        padding: 24,
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Space
        direction="vertical"
        style={{
          width: '100%',
          flex: 1
        }}
      >
        <Space wrap>
          <Text strong>
            {allContracts
              ? 'All Contracts'
              : doc.name}
          </Text>

          <Checkbox
            checked={allContracts}
            onChange={(e) =>
              setAllContracts(
                e.target.checked
              )
            }
          >
            Search all contracts
          </Checkbox>

          <Button
            danger
            size="small"
            onClick={clearChat}
            disabled={
              !messages.length
            }
          >
            Clear Chat
          </Button>
        </Space>

        <Collapse
          items={[
            {
              key: 'filters',

              label:
                'Metadata Filters',

              children: (
                <Space
                  direction="vertical"
                  style={{
                    width: '100%'
                  }}
                >
                  <Space wrap>
                    <Select
                      placeholder="Contract Type"
                      value={
                        filters.contractType ||
                        undefined
                      }
                      onChange={(value) =>
                        changeFilter(
                          'contractType',
                          value
                        )
                      }
                      style={{
                        width: 180
                      }}
                      options={[
                        {
                          value:
                            'Employment Agreement',
                          label:
                            'Employment Agreement'
                        },
                        {
                          value:
                            'Service Agreement',
                          label:
                            'Service Agreement'
                        },
                        {
                          value:
                            'Non-Disclosure Agreement',
                          label:
                            'Non-Disclosure Agreement'
                        },
                        {
                          value:
                            'Vendor Agreement',
                          label:
                            'Vendor Agreement'
                        }
                      ]}
                    />

                    {filterFields.map(
                      ([name, label]) => (
                        <Input
                          key={name}
                          placeholder={label}
                          value={
                            filters[name] ||
                            ''
                          }
                          onChange={(e) =>
                            changeFilter(
                              name,
                              e.target.value
                            )
                          }
                          style={{
                            width: 170
                          }}
                        />
                      )
                    )}

                    <Select
                      placeholder="Status"
                      value={
                        filters.status ||
                        undefined
                      }
                      onChange={(value) =>
                        changeFilter(
                          'status',
                          value
                        )
                      }
                      style={{
                        width: 150
                      }}
                      options={[
                        {
                          value: 'Active',
                          label: 'Active'
                        },
                        {
                          value: 'Expired',
                          label: 'Expired'
                        },
                        {
                          value: 'Pending',
                          label: 'Pending'
                        }
                      ]}
                    />

                    <Input
                      type="date"
                      value={
                        filters.dateFrom ||
                        ''
                      }
                      onChange={(e) =>
                        changeFilter(
                          'dateFrom',
                          e.target.value
                        )
                      }
                      style={{
                        width: 160
                      }}
                    />

                    <Input
                      type="date"
                      value={
                        filters.dateTo ||
                        ''
                      }
                      onChange={(e) =>
                        changeFilter(
                          'dateTo',
                          e.target.value
                        )
                      }
                      style={{
                        width: 160
                      }}
                    />
                  </Space>

                  <Space>
                    <Button
                      type="primary"
                      onClick={
                        applyFilters
                      }
                    >
                      Apply Filters
                    </Button>

                    <Button
                      onClick={
                        clearFilters
                      }
                    >
                      Clear Filters
                    </Button>
                  </Space>

                  {Object.keys(
                    appliedFilters
                  ).length > 0 && (
                    <Text type="secondary">
                      Filters applied
                    </Text>
                  )}
                </Space>
              )
            }
          ]}
        />

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
          />
        )}

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '10px 0'
          }}
        >
          {loading && (
            <Space>
              <Spin />

              <Text>
                Loading previous conversation...
              </Text>
            </Space>
          )}

          {!loading &&
            messages.map(
              (message, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: 16
                  }}
                >
                  <Tag
                    color={
                      message.role ===
                      'user'
                        ? 'blue'
                        : 'green'
                    }
                  >
                    {message.role ===
                    'user'
                      ? 'You'
                      : 'AI'}
                  </Tag>

                  <Paragraph
                    style={{
                      whiteSpace:
                        'pre-wrap'
                    }}
                  >
                    {message.content}
                  </Paragraph>

                  {message.sources
                    ?.length > 0 && (
                    <Collapse
                      size="small"
                      items={[
                        {
                          key: 'sources',

                          label:
                            `Sources (${message.sources.length})`,

                          children:
                            message.sources.map(
                              (
                                source,
                                i
                              ) => (
                                <div
                                  key={i}
                                  style={{
                                    marginBottom: 10
                                  }}
                                >
                                  <Text strong>
                                    [{i + 1}]{' '}
                                    {source.docName ||
                                      ''}
                                  </Text>

                                  <Paragraph>
                                    {
                                      source.text
                                    }
                                  </Paragraph>

                                  <Text type="secondary">
                                    Match:{' '}
                                    {Math.round(
                                      source.score *
                                        100
                                    )}
                                    %
                                  </Text>
                                </div>
                              )
                            )
                        }
                      ]}
                    />
                  )}
                </div>
              )
            )}

          {busy && (
            <Space>
              <Spin size="small" />

              <Text>
                Searching contracts...
              </Text>
            </Space>
          )}
        </div>

        <Space.Compact
          style={{
            width: '100%'
          }}
        >
          <Input
            value={question}
            onChange={(e) =>
              setQuestion(
                e.target.value
              )
            }
            onPressEnter={sendMessage}
            placeholder="Ask about a clause, obligation or deadline"
            disabled={
              busy || loading
            }
          />

          <Button
            type="primary"
            onClick={sendMessage}
            loading={busy}
            disabled={
              loading ||
              !question.trim()
            }
          >
            Ask
          </Button>
        </Space.Compact>
      </Space>
    </div>
  );
}
