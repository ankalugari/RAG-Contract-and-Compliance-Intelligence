import { useState } from 'react';

import {
  Button,
  Card,
  List,
  Typography,
  Upload,
  message,
  Space,
  Tag
} from 'antd';

import {
  UploadOutlined,
  DeleteOutlined,
  FileTextOutlined
} from '@ant-design/icons';

import { api } from '../api';

import MetadataEditor from './MetadataEditor';

const { Title } = Typography;

export default function Documents({
  docs,
  active,
  onSelect,
  onUploadSuccess,
  onChange,
  onMetadataSave
}) {
  const [loading, setLoading] = useState(false);

  async function uploadFile(file) {
    if (!file) {
      return false;
    }

    setLoading(true);

    try {
      const result = await api.upload(file);

      await onUploadSuccess(result.id);

      message.success(
        'Contract uploaded successfully'
      );
    } catch (error) {
      console.error(
        'Upload error:',
        error
      );

      message.error(
        error.message ||
        'Upload failed'
      );
    } finally {
      setLoading(false);
    }

    return false;
  }

  async function deleteDocument(id) {
    try {
      await api.remove(id);

      const updatedDocs =
        await api.docs();

      onChange();

      if (active === id) {
        onSelect(
          updatedDocs[0]?.id || null
        );
      }

      message.success(
        'Contract deleted'
      );
    } catch (error) {
      console.error(
        'Delete error:',
        error
      );

      message.error(
        error.message ||
        'Delete failed'
      );
    }
  }

  const activeDocument = docs.find(
    (doc) => doc.id === active
  );

  return (
    <div
      style={{
        width: 320,
        padding: 16,
        borderRight:
          '1px solid #ddd',
        height: '100vh',
        overflowY: 'auto'
      }}
    >
      <Title level={4}>
        Contract Intelligence
      </Title>

      <Upload
        accept=".pdf,.txt,.md"
        showUploadList={false}
        beforeUpload={uploadFile}
      >
        <Button
          type="primary"
          icon={
            <UploadOutlined />
          }
          loading={loading}
          disabled={loading}
          block
        >
          {loading
            ? 'Uploading...'
            : 'Upload Contract'}
        </Button>
      </Upload>

      <div
        style={{
          marginTop: 20
        }}
      >
        <Title level={5}>
          Contracts
        </Title>

        <List
          dataSource={docs}
          locale={{
            emptyText:
              'No contracts uploaded'
          }}
          renderItem={(doc) => (
            <List.Item
              style={{
                cursor: 'pointer',
                padding: 10,
                background:
                  active === doc.id
                    ? '#f0f5ff'
                    : 'transparent'
              }}
              onClick={() =>
                onSelect(doc.id)
              }
              actions={[
                <Button
                  key="delete"
                  type="text"
                  danger
                  icon={
                    <DeleteOutlined />
                  }
                  onClick={(event) => {
                    event.stopPropagation();

                    deleteDocument(
                      doc.id
                    );
                  }}
                />
              ]}
            >
              <List.Item.Meta
                avatar={
                  <FileTextOutlined />
                }
                title={doc.name}
                description={
                  <Space>
                    <Tag>
                      {doc.chunks || 0} chunks
                    </Tag>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </div>

      {activeDocument && (
        <Card
          title="Contract Metadata"
          size="small"
          style={{
            marginTop: 20
          }}
        >
          <MetadataEditor
            doc={activeDocument}
            onSave={onMetadataSave}
          />
        </Card>
      )}
    </div>
  );
}