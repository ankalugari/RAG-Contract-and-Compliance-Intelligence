import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  Select,
  Space,
  message
} from 'antd';

import { api } from '../api';

export default function MetadataEditor({ doc, onSaved }) {
  const [form] = Form.useForm();

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!doc) {
      form.resetFields();
      return;
    }

    const metadata = doc.metadata || {};

    form.setFieldsValue({
      contractType: metadata.contractType || '',

      party: Array.isArray(metadata.parties)
        ? metadata.parties.join(', ')
        : '',

      tag: Array.isArray(metadata.tags)
        ? metadata.tags.join(', ')
        : '',

      governingLaw:
        metadata.governingLaw || '',

      jurisdiction:
        metadata.jurisdiction || '',

      status:
        metadata.status || '',

      effectiveDate:
        metadata.effectiveDate || '',

      expirationDate:
        metadata.expirationDate || ''
    });
  }, [doc, form]);

  if (!doc) {
    return null;
  }

  async function saveMetadata(values) {
    setSaving(true);

    try {
      const metadata = {
        contractType:
          values.contractType || '',

        parties: values.party
          ? values.party
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean)
          : [],

        tags: values.tag
          ? values.tag
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean)
          : [],

        governingLaw:
          values.governingLaw || '',

        jurisdiction:
          values.jurisdiction || '',

        status:
          values.status || '',

        effectiveDate: values.effectiveDate || '',

        expirationDate: values.expirationDate || ''
      };

      const updatedDoc =
        await api.updateMetadata(
          doc.id,
          metadata
        );

      message.success(
        'Metadata saved successfully.'
      );

      if (onSaved) {
        onSaved(updatedDoc);
      }
    } catch (error) {
      message.error(
        error.message ||
          'Failed to save metadata.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card
      title="Contract Metadata"
      size="small"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={saveMetadata}
      >
        <Form.Item
          label="Contract Type"
          name="contractType"
        >
          <Input
            placeholder="Employment Agreement"
          />
        </Form.Item>

        <Form.Item
          label="Party"
          name="party"
        >
          <Input
            placeholder="Company, Employee"
          />
        </Form.Item>

        <Form.Item
          label="Tag"
          name="tag"
        >
          <Input
            placeholder="Employment, Salary"
          />
        </Form.Item>

        <Form.Item
          label="Governing Law"
          name="governingLaw"
        >
          <Input
            placeholder="India"
          />
        </Form.Item>

        <Form.Item
          label="Jurisdiction"
          name="jurisdiction"
        >
          <Input
            placeholder="Andhra Pradesh"
          />
        </Form.Item>

        <Form.Item
          label="Status"
          name="status"
        >
          <Select
            placeholder="Select status"
            allowClear
            options={[
              {
                label: 'Active',
                value: 'Active'
              },
              {
                label: 'Expired',
                value: 'Expired'
              },
              {
                label: 'Draft',
                value: 'Draft'
              },
              {
                label: 'Terminated',
                value: 'Terminated'
              }
            ]}
          />
        </Form.Item>

        <Form.Item
          label="Effective Date"
          name="effectiveDate"
        >
          <Input type="date" />
        </Form.Item>

        <Form.Item
          label="Expiration Date"
          name="expirationDate"
        >
          <Input type="date" />
        </Form.Item>

        <Space>
          <Button
            type="primary"
            htmlType="submit"
            loading={saving}
          >
            Save Metadata
          </Button>

          <Button
            htmlType="button"
            onClick={() => form.resetFields()}
          >
            Reset
          </Button>
        </Space>
      </Form>
    </Card>
  );
}
