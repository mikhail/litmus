import { describe, it, expect, vi } from 'vitest';
import { runAllPackets } from '../services/runAllPackets';
import type { TestPacket, TestResult } from '../types';

function makePacket(id: string, name: string, criteriaCount: number): TestPacket {
  return {
    id,
    name,
    criteria: Array.from({ length: criteriaCount }, (_, i) => ({
      id: `${id}-c${i}`,
      label: `Criterion ${i}`,
    })),
    createdAt: Date.now(),
  };
}

function makeResult(criterionId: string, pass: boolean): TestResult {
  return { criterionId, pass, reasoning: pass ? 'Looks good' : 'Failed check' };
}

describe('Integration: run → partial results → rewrite flow', () => {
  it('successful packets return results even when others fail', async () => {
    const packets = [
      makePacket('company', '🏢 Company Wide', 1),
      makePacket('team', '👥 Team', 3),
      makePacket('personal', '👤 Personal', 0),
    ];

    const evaluate = vi.fn()
      .mockResolvedValueOnce([makeResult('company-c0', true)])
      .mockRejectedValueOnce(new Error('API timeout'));

    const { results, errors } = await runAllPackets('some doc text', packets, evaluate);

    // Company Wide succeeded
    expect(results).toHaveLength(1);
    expect(results[0].packetId).toBe('company');
    expect(results[0].results[0].pass).toBe(true);

    // Team failed
    expect(errors).toHaveLength(1);
    expect(errors[0].packetId).toBe('team');
    expect(errors[0].error).toBe('API timeout');

    // Personal was skipped (0 criteria)
    expect(evaluate).toHaveBeenCalledTimes(2);
  });

  it('all results include both passing and failing criteria', async () => {
    const packets = [makePacket('team', '👥 Team', 3)];
    const evaluate = vi.fn().mockResolvedValueOnce([
      makeResult('team-c0', true),
      makeResult('team-c1', false),
      makeResult('team-c2', true),
    ]);

    const { results } = await runAllPackets('text', packets, evaluate);

    const passing = results[0].results.filter((r) => r.pass);
    const failing = results[0].results.filter((r) => !r.pass);
    expect(passing).toHaveLength(2);
    expect(failing).toHaveLength(1);
    expect(failing[0].criterionId).toBe('team-c1');
  });

  it('handles mixed scenario: empty + success + failure + success', async () => {
    const packets = [
      makePacket('empty', 'Empty', 0),
      makePacket('p1', 'P1', 1),
      makePacket('p2', 'P2', 1),
      makePacket('p3', 'P3', 1),
    ];

    const evaluate = vi.fn()
      .mockResolvedValueOnce([makeResult('p1-c0', true)])
      .mockRejectedValueOnce(new Error('Fail'))
      .mockResolvedValueOnce([makeResult('p3-c0', false)]);

    const { results, errors } = await runAllPackets('text', packets, evaluate);

    expect(results).toHaveLength(2);
    expect(results.map((r) => r.packetId)).toEqual(['p1', 'p3']);
    expect(errors).toHaveLength(1);
    expect(errors[0].packetId).toBe('p2');
  });

  it('error objects include packet name for user-facing messages', async () => {
    const packets = [makePacket('p1', 'My Important Packet', 1)];
    const evaluate = vi.fn().mockRejectedValueOnce(new Error('Connection refused'));

    const { errors } = await runAllPackets('text', packets, evaluate);

    expect(errors[0].packetName).toBe('My Important Packet');
    expect(errors[0].error).toBe('Connection refused');
  });
});

describe('Edge cases', () => {
  it('handles non-Error throws gracefully', async () => {
    const packets = [makePacket('p1', 'P1', 1)];
    const evaluate = vi.fn().mockRejectedValueOnce('string error');

    const { errors } = await runAllPackets('text', packets, evaluate);

    expect(errors[0].error).toBe('string error');
  });

  it('handles undefined throw', async () => {
    const packets = [makePacket('p1', 'P1', 1)];
    const evaluate = vi.fn().mockRejectedValueOnce(undefined);

    const { errors } = await runAllPackets('text', packets, evaluate);

    expect(errors[0].error).toBe('undefined');
  });

  it('returns timestamps on all results', async () => {
    const packets = [makePacket('p1', 'P1', 1)];
    const evaluate = vi.fn().mockResolvedValueOnce([makeResult('p1-c0', true)]);

    const before = Date.now();
    const { results } = await runAllPackets('text', packets, evaluate);
    const after = Date.now();

    expect(results[0].timestamp).toBeGreaterThanOrEqual(before);
    expect(results[0].timestamp).toBeLessThanOrEqual(after);
  });
});
