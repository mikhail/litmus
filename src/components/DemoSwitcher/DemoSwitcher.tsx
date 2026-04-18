import { Select, Space } from 'antd';
import type { DemoContext } from '../../types';
import { demoContexts } from '../../data/demoContexts';

interface Props {
  onSelect: (context: DemoContext) => void;
  currentId: string | null;
}

export default function DemoSwitcher({ onSelect, currentId }: Props) {
  return (
    <Space size="small" align="center">
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>Demo:</span>
      <Select
        value={currentId}
        onChange={(id) => {
          const ctx = demoContexts.find((c) => c.id === id);
          if (ctx) onSelect(ctx);
        }}
        placeholder="Choose a context…"
        style={{ width: 200 }}
        allowClear
        options={demoContexts.map((ctx) => ({
          value: ctx.id,
          label: `${ctx.icon} ${ctx.name}`,
        }))}
      />
    </Space>
  );
}
