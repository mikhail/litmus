import { Button, Collapse, Progress, Tag, Typography, Modal, Spin, Empty, Alert, Tooltip } from 'antd';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  EditFilled,
  LoadingOutlined,
  PlayCircleOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import type { TestPacket, TestResult, RunResult, Criterion } from '../../types';
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
  const [runningCriterionId, setRunningCriterionId] = useState<string | null>(null);
  const [fixingCriterionId, setFixingCriterionId] = useState<string | null>(null);
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

  const upsertResult = (criterionId: string, result: TestResult, packetId: string) => {
    setResults((prev) => {
      const existing = prev.find((r) => r.packetId === packetId);
      if (existing) {
        return prev.map((r) =>
          r.packetId === packetId
            ? {
                ...r,
                results: r.results.some((tr) => tr.criterionId === criterionId)
                  ? r.results.map((tr) => (tr.criterionId === criterionId ? result : tr))
                  : [...r.results, result],
                timestamp: Date.now(),
              }
            : r
        );
      }
      return [...prev, { packetId, results: [result], timestamp: Date.now() }];
    });
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
        if (packet.criteria.length === 0) continue;
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

  const handleRunSingle = async (criterion: Criterion, packetId: string) => {
    if (!documentHtml.trim()) return;
    setRunningCriterionId(criterion.id);
    setError(null);

    try {
      const plainText = stripHtml(documentHtml);
      const testResults = await evaluateText(plainText, [criterion]);
      if (testResults.length > 0) {
        upsertResult(criterion.id, testResults[0], packetId);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Evaluation failed');
    } finally {
      setRunningCriterionId(null);
    }
  };

  const handleFixSingle = async (criterion: Criterion, result: TestResult) => {
    setFixingCriterionId(criterion.id);
    setError(null);

    try {
      const rewritten = await rewriteText(documentHtml, [
        { label: criterion.label, reasoning: result.reasoning },
      ]);
      Modal.confirm({
        title: `Fix: ${criterion.label}`,
        width: 720,
        content: (
          <div style={{ maxHeight: 450, overflow: 'auto', marginTop: 12 }}>
            <DiffView original={documentHtml} rewritten={rewritten} />
          </div>
        ),
        okText: 'Accept fix',
        cancelText: 'Reject',
        onOk: () => {
          onRewrite(rewritten);
          // Invalidate all results — text has changed
          setResults([]);
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Rewrite failed');
    } finally {
      setFixingCriterionId(null);
    }
  };

  const handleRewriteAll = async () => {
    const failing = allResults
      .filter((r) => !r.pass)
      .map((r) => {
        const criterion = allCriteria.find((c) => c.id === r.criterionId);
        return { label: criterion?.label || r.criterionId, reasoning: r.reasoning };
      });

    if (failing.length === 0) return;
    setFixingCriterionId('__all__');
    setError(null);

    try {
      const rewritten = await rewriteText(documentHtml, failing);
      Modal.confirm({
        title: 'AI Rewrite — Fix All Failures',
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
      setFixingCriterionId(null);
    }
  };

  const getResultForCriterion = (criterionId: string): TestResult | undefined =>
    allResults.find((r) => r.criterionId === criterionId);

  if (activePackets.length === 0) {
    return (
      <div className="test-runner">
        <Empty
          description={
            <span style={{ color: '#999' }}>
              Activate a packet from the left panel,<br />
              or choose a demo from the top right.
            </span>
          }
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
          {loading ? 'Running Tests…' : '▶ Run All Tests'}
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
            onClick={handleRewriteAll}
            loading={fixingCriterionId === '__all__'}
            block
            style={{ marginTop: 8 }}
          >
            {fixingCriterionId === '__all__' ? 'Generating rewrite…' : 'Fix All Failures'}
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
                const isRunningThis = runningCriterionId === criterion.id;
                const isFixingThis = fixingCriterionId === criterion.id;
                const isRunningAll = loading && !result;

                let icon;
                if (isRunningThis || isRunningAll) icon = <Spin indicator={<LoadingOutlined spin />} size="small" />;
                else if (result?.pass) icon = <CheckCircleFilled style={{ color: '#52c41a' }} />;
                else if (result && !result.pass) icon = <CloseCircleFilled style={{ color: '#ff4d4f' }} />;
                else icon = <Tag style={{ fontSize: 11 }}>not run</Tag>;

                return {
                  key: criterion.id,
                  label: (
                    <span className="criterion-label">
                      {icon}
                      <span style={{ marginLeft: 8, flex: 1 }}>{criterion.label}</span>
                    </span>
                  ),
                  extra: (
                    <span className="criterion-actions" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Run this test">
                        <Button
                          type="text"
                          size="small"
                          icon={<PlayCircleOutlined />}
                          loading={isRunningThis}
                          disabled={!documentHtml.trim() || loading}
                          onClick={() => handleRunSingle(criterion, packet.id)}
                        />
                      </Tooltip>
                      {result && !result.pass && (
                        <Tooltip title="Fix this one">
                          <Button
                            type="text"
                            size="small"
                            icon={<ToolOutlined />}
                            loading={isFixingThis}
                            onClick={() => handleFixSingle(criterion, result)}
                          />
                        </Tooltip>
                      )}
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
