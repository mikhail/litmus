import { Button, Collapse, Progress, Tag, Typography, Modal, Spin, Empty, Alert } from 'antd';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  EditFilled,
  LoadingOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import type { TestPacket, TestResult, RunResult } from '../../types';
import { evaluateText, rewriteText } from '../../services/api';
import DiffView from '../DiffView/DiffView';
import './TestRunner.css';

const { Text } = Typography;

interface Props {
  activePackets: TestPacket[];
  documentHtml: string;
  onRewrite: (html: string) => void;
}

export default function TestRunner({ activePackets, documentHtml, onRewrite }: Props) {
  const [results, setResults] = useState<RunResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [rewriting, setRewriting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allCriteria = activePackets.flatMap((p) => p.criteria);
  const allResults = results.flatMap((r) => r.results);
  const passCount = allResults.filter((r) => r.pass).length;
  const totalCount = allResults.length;
  const hasFailures = allResults.some((r) => !r.pass);

  const stripHtml = (html: string) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || '';
  };

  const handleRun = async () => {
    if (!documentHtml.trim() || allCriteria.length === 0) return;
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const plainText = stripHtml(documentHtml);
      const runResults: RunResult[] = [];

      for (const packet of activePackets) {
        const testResults = await evaluateText(plainText, packet.criteria);
        runResults.push({
          packetId: packet.id,
          results: testResults,
          timestamp: Date.now(),
        });
      }

      setResults(runResults);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Evaluation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRewrite = async () => {
    const failing = allResults
      .filter((r) => !r.pass)
      .map((r) => {
        const criterion = allCriteria.find((c) => c.id === r.criterionId);
        return { label: criterion?.label || r.criterionId, reasoning: r.reasoning };
      });

    if (failing.length === 0) return;
    setRewriting(true);
    setError(null);

    try {
      const rewritten = await rewriteText(documentHtml, failing);
      Modal.confirm({
        title: 'AI Rewrite Proposal',
        width: 720,
        content: (
          <div style={{ maxHeight: 450, overflow: 'auto', marginTop: 12 }}>
            <DiffView original={documentHtml} rewritten={rewritten} />
          </div>
        ),
        okText: 'Accept rewrite',
        cancelText: 'Reject',
        onOk: () => {
          onRewrite(rewritten);
          setResults([]);
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Rewrite failed');
    } finally {
      setRewriting(false);
    }
  };

  const getResultForCriterion = (criterionId: string): TestResult | undefined =>
    allResults.find((r) => r.criterionId === criterionId);

  if (activePackets.length === 0) {
    return (
      <div className="test-runner">
        <Empty
          description="No test packets active"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ marginTop: '4rem' }}
        />
      </div>
    );
  }

  return (
    <div className="test-runner">
      <div className="test-runner-header" id="tour-run-tests">
        <Button
          type="primary"
          size="large"
          onClick={handleRun}
          loading={loading}
          disabled={!documentHtml.trim()}
          block
        >
          {loading ? 'Running Tests…' : '▶ Run Tests'}
        </Button>

        {totalCount > 0 && (
          <div className="test-summary">
            <Progress
              percent={Math.round((passCount / totalCount) * 100)}
              status={hasFailures ? 'exception' : 'success'}
              format={() => `${passCount}/${totalCount} passing`}
            />
          </div>
        )}

        {hasFailures && !loading && (
          <Button
            icon={<EditFilled />}
            onClick={handleRewrite}
            loading={rewriting}
            block
            style={{ marginTop: 8 }}
          >
            {rewriting ? 'Generating rewrite…' : 'AI Rewrite'}
          </Button>
        )}

        {error && (
          <Alert
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
            message="Test run failed"
            description={error}
            style={{ marginTop: 12 }}
          />
        )}
      </div>

      <div className="test-results">
        {activePackets.map((packet) => (
          <div key={packet.id} className="packet-section">
            <Text strong style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888' }}>
              {packet.name}
            </Text>
            <Collapse
              ghost
              style={{ marginTop: 8 }}
              items={packet.criteria.map((criterion) => {
                const result = getResultForCriterion(criterion.id);
                const isRunning = loading && !result;

                let icon;
                if (isRunning) icon = <Spin indicator={<LoadingOutlined spin />} size="small" />;
                else if (result?.pass) icon = <CheckCircleFilled style={{ color: '#52c41a' }} />;
                else if (result && !result.pass) icon = <CloseCircleFilled style={{ color: '#ff4d4f' }} />;
                else icon = <Tag style={{ fontSize: 11 }}>not run</Tag>;

                return {
                  key: criterion.id,
                  label: (
                    <span className="criterion-label">
                      {icon}
                      <span style={{ marginLeft: 8 }}>{criterion.label}</span>
                    </span>
                  ),
                  children: result ? (
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      {result.reasoning}
                    </Text>
                  ) : (
                    <Text type="secondary" italic style={{ fontSize: 13 }}>
                      Run tests to see results
                    </Text>
                  ),
                };
              })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
