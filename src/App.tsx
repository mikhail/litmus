import { useState, useCallback, useEffect } from 'react';
import { Layout, Button, ConfigProvider, theme, Modal, Input, message, Tour, Typography } from 'antd';
import type { TourProps } from 'antd';
import { SettingOutlined, KeyOutlined } from '@ant-design/icons';
import Editor from './components/Editor/Editor';
import TestRunner from './components/TestRunner/TestRunner';
import PacketManager from './components/PacketManager/PacketManager';
import DemoSwitcher from './components/DemoSwitcher/DemoSwitcher';
import { demoContexts } from './data/demoContexts';
import { usePackets } from './hooks/usePackets';
import { getApiKey, setApiKey } from './services/api';
import type { DemoContext } from './types';
import './App.css';

const { Header, Content } = Layout;
const { Paragraph } = Typography;

const ONBOARDED_KEY = 'litmus-onboarded';

function App() {
  const [documentHtml, setDocumentHtml] = useState('');
  const [currentDemoId, setCurrentDemoId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(getApiKey());
  const hasKey = !!getApiKey();

  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

  // Show welcome modal on first visit
  useEffect(() => {
    if (!localStorage.getItem(ONBOARDED_KEY)) {
      setWelcomeOpen(true);
    }
  }, []);

  const {
    packets,
    userPacketIds,
    activePackets,
    activePacketIds,
    addPacket,
    updatePacket,
    deletePacket,
    togglePacket,
    loadDemoPackets,
  } = usePackets();

  const handleDemoSelect = useCallback(
    (context: DemoContext) => {
      setCurrentDemoId(context.id);
      setDocumentHtml(context.sampleText);
      loadDemoPackets(context.packets);
    },
    [loadDemoPackets]
  );

  const handleRewrite = useCallback((html: string) => {
    setDocumentHtml(html);
  }, []);

  const tourSteps: TourProps['steps'] = [
    {
      title: '① Pick a scenario',
      description: 'Choose one of four pre-loaded company contexts — each has its own writing standards and sample text with intentional failures. We\'ve loaded the Law Firm demo for you.',
      target: () => document.getElementById('tour-demo-switcher')!,
      placement: 'bottomRight',
    },
    {
      title: '② Review active packets',
      description: 'Each context loads test packets — bundles of criteria your text must pass. Here you can see, edit, or create your own packets.',
      target: () => document.getElementById('tour-packets-btn')!,
      placement: 'right',
    },
    {
      title: '③ Run tests',
      description: 'Hit this button to have Claude evaluate your text against every active criterion. Each one returns pass or fail with reasoning.',
      target: () => document.getElementById('tour-run-tests')!,
      placement: 'left',
    },
    {
      title: '④ Fix individually or all at once',
      description: 'Each failing criterion gets a 🔧 button to fix just that one issue. Or use "Fix All Failures" to rewrite everything in one shot. You\'ll see a diff preview before accepting.',
      target: () => document.getElementById('tour-run-tests')!,
      placement: 'left',
    },
  ];

  const startTour = () => {
    setWelcomeOpen(false);
    localStorage.setItem(ONBOARDED_KEY, '1');
    // Preload the Law Firm demo so the tour has something to point at
    const lawFirm = demoContexts.find((c) => c.id === 'law-firm');
    if (lawFirm) {
      setCurrentDemoId(lawFirm.id);
      setDocumentHtml(lawFirm.sampleText);
      loadDemoPackets(lawFirm.packets);
    }
    // Small delay so the DOM updates before tour positions itself
    setTimeout(() => setTourOpen(true), 100);
  };

  const dismissWelcome = () => {
    setWelcomeOpen(false);
    localStorage.setItem(ONBOARDED_KEY, '1');
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#6366f1',
          borderRadius: 8,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        },
      }}
    >
      <Layout style={{ height: '100vh' }}>
        <Header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            background: '#1a1a2e',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
              ◈ Litmus
            </span>
          </div>
          <div id="tour-demo-switcher" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <DemoSwitcher onSelect={handleDemoSelect} currentId={currentDemoId} />
            {import.meta.env.DEV && (
              <Button
                type="text"
                icon={hasKey ? <SettingOutlined /> : <KeyOutlined />}
                onClick={() => { setApiKeyInput(getApiKey()); setSettingsOpen(true); }}
                style={{ color: hasKey ? 'rgba(255,255,255,0.65)' : '#faad14' }}
                title={hasKey ? 'API Key configured' : 'Set API Key'}
              />
            )}
          </div>
        </Header>

        <Content style={{ display: 'flex', overflow: 'hidden' }}>
          <PacketManager
            packets={packets}
            userPacketIds={userPacketIds}
            activePacketIds={activePacketIds}
            onToggle={togglePacket}
            onAdd={addPacket}
            onUpdate={updatePacket}
            onDelete={deletePacket}
          />
          <div className="panel panel-editor">
            <Editor content={documentHtml} onUpdate={setDocumentHtml} />
          </div>
          <div className="panel-divider" />
          <div className="panel panel-tests">
            <TestRunner
              activePackets={activePackets}
              documentHtml={documentHtml}
              onRewrite={handleRewrite}
            />
          </div>
        </Content>
      </Layout>

      <Modal
        title="Settings"
        open={settingsOpen}
        onOk={() => {
          setApiKey(apiKeyInput);
          setSettingsOpen(false);
          message.success('API key saved');
        }}
        onCancel={() => setSettingsOpen(false)}
        okText="Save"
      >
        <div style={{ marginTop: 16 }}>
          <label style={{ fontWeight: 500, fontSize: 14, display: 'block', marginBottom: 8 }}>
            Anthropic API Key
          </label>
          <Input.Password
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder="sk-ant-..."
            size="large"
          />
          <p style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
            Stored locally in your browser. Never sent to any server except Anthropic's API.
          </p>
        </div>
      </Modal>
      <Modal
        title={null}
        open={welcomeOpen}
        footer={null}
        closable={false}
        centered
        width={520}
      >
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>◈</div>
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>Welcome to Litmus</h2>
          <p style={{ color: '#888', fontSize: 14, marginBottom: 20 }}>A composable text compliance engine</p>
        </div>
        <Paragraph style={{ fontSize: 15, lineHeight: 1.7 }}>
          Litmus is a <strong>linter for prose</strong>. Your company, your organization, your team and your adjacent teams and you personally can define test packets — bundles of "writing criteria". Then run them against any text. This is <strong>TDD (test driven development) for creative writing</strong>.
        </Paragraph>
        <Paragraph style={{ fontSize: 15, lineHeight: 1.7 }}>
          Claude then evaluates each criterion and shows pass/fail and suggests fixes.
        </Paragraph>
        <Paragraph style={{ fontSize: 15, lineHeight: 1.7 }}>
          Review the changes in a preview and accept or reject.
        </Paragraph>
        <Paragraph style={{ fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
          For demo purposes I've pre-loaded <strong>four scenarios</strong> — a law firm, a product team, an engineering org, and a newsroom — each with its own standards and sample text with intentional failures.
        </Paragraph>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Button size="large" onClick={dismissWelcome}>
            Skip tour
          </Button>
          <Button type="primary" size="large" onClick={startTour}>
            Take the tour →
          </Button>
        </div>
      </Modal>

      <Tour
        open={tourOpen}
        onClose={() => setTourOpen(false)}
        steps={tourSteps}
      />
    </ConfigProvider>
  );
}

export default App;
