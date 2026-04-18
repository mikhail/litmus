import { Button, List, Checkbox, Modal, Form, Input, Space, Tag, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useState } from 'react';
import type { TestPacket, Criterion } from '../../types';
import './PacketManager.css';

interface Props {
  packets: TestPacket[];
  userPacketIds: Set<string>;
  activePacketIds: Set<string>;
  onToggle: (id: string) => void;
  onAdd: (packet: TestPacket) => void;
  onUpdate: (id: string, updates: Partial<TestPacket>) => void;
  onDelete: (id: string) => void;
}

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

export default function PacketManager({
  packets,
  userPacketIds,
  activePacketIds,
  onToggle,
  onAdd,
  onUpdate,
  onDelete,
}: Props) {
  const [editingPacket, setEditingPacket] = useState<TestPacket | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const openCreateModal = () => {
    setEditingPacket(null);
    form.setFieldsValue({
      name: '',
      description: '',
      criteria: [{ label: '' }],
    });
    setModalOpen(true);
  };

  const openEditModal = (packet: TestPacket) => {
    setEditingPacket(packet);
    form.setFieldsValue({
      name: packet.name,
      description: packet.description || '',
      criteria: packet.criteria.map((c) => ({ label: c.label, description: c.description || '' })),
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    form.validateFields().then((values) => {
      const criteria: Criterion[] = values.criteria
        .filter((c: { label: string }) => c.label?.trim())
        .map((c: { label: string; description?: string }) => ({
          id: generateId(),
          label: c.label.trim(),
          description: c.description?.trim() || undefined,
        }));

      if (editingPacket) {
        onUpdate(editingPacket.id, {
          name: values.name.trim(),
          description: values.description?.trim() || undefined,
          criteria,
        });
      } else {
        onAdd({
          id: generateId(),
          name: values.name.trim(),
          description: values.description?.trim() || undefined,
          criteria,
          createdAt: Date.now(),
        });
      }

      setModalOpen(false);
    });
  };

  return (
    <>
      <div className="packet-sidebar" id="tour-packets-btn">
        <div className="packet-sidebar-header">
          <span className="packet-sidebar-title">Test Packets</span>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal} size="small">
            New
          </Button>
        </div>

        <div className="packet-sidebar-content">
          {packets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#999' }}>
              <p style={{ marginBottom: 8, fontSize: 13, lineHeight: 1.6 }}>
                Select a demo from the <strong>top right</strong> to see pre-built packets, or create your own.
              </p>
              <Button type="dashed" icon={<PlusOutlined />} onClick={openCreateModal} size="small">
                Create a packet
              </Button>
            </div>
          ) : (
            <List
              size="small"
              dataSource={packets}
              renderItem={(packet) => {
                const isUserPacket = userPacketIds.has(packet.id);
                return (
                  <List.Item
                    style={{ padding: '8px 12px' }}
                    actions={[
                      <Tooltip title="Edit" key="edit">
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => openEditModal(packet)}
                        />
                      </Tooltip>,
                      ...(isUserPacket
                        ? [
                            <Tooltip title="Delete" key="delete">
                              <Button
                                type="text"
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() =>
                                  Modal.confirm({
                                    title: `Delete "${packet.name}"?`,
                                    onOk: () => onDelete(packet.id),
                                  })
                                }
                              />
                            </Tooltip>,
                          ]
                        : []),
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Checkbox
                          checked={activePacketIds.has(packet.id)}
                          onChange={() => onToggle(packet.id)}
                        />
                      }
                      title={
                        <span style={{ fontSize: 13 }}>
                          {packet.name}
                          {isUserPacket && (
                            <Tag color="blue" style={{ fontSize: 10, marginLeft: 6, lineHeight: '16px' }}>custom</Tag>
                          )}
                        </span>
                      }
                      description={
                        <span style={{ fontSize: 11 }}>
                          {packet.criteria.length} criteria
                        </span>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          )}
        </div>
      </div>

      <Modal
        title={editingPacket ? 'Edit Packet' : 'Create Test Packet'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText={editingPacket ? 'Save Changes' : 'Create Packet'}
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Packet Name" rules={[{ required: true, message: 'Name is required' }]}>
            <Input placeholder="e.g. Editorial Standards" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea placeholder="Optional description of what this packet checks" rows={2} />
          </Form.Item>
          <Form.List name="criteria">
            {(fields, { add, remove }) => (
              <>
                <label style={{ fontWeight: 500, fontSize: 14 }}>Criteria</label>
                {fields.map(({ key, name }) => (
                  <Space key={key} align="start" style={{ display: 'flex', marginBottom: 8, marginTop: 8 }}>
                    <Form.Item name={[name, 'label']} noStyle rules={[{ required: true, message: 'Required' }]}>
                      <Input placeholder="e.g. No passive voice" style={{ width: 340 }} />
                    </Form.Item>
                    <Form.Item name={[name, 'description']} noStyle>
                      <Input placeholder="Details (optional)" style={{ width: 140 }} />
                    </Form.Item>
                    {fields.length > 1 && (
                      <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                    )}
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add({ label: '' })} icon={<PlusOutlined />} block>
                  Add Criterion
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </>
  );
}
