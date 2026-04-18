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

describe('runAllPackets', () => {
  it('returns results for all packets when all succeed', async () => {
    const packets = [makePacket('p1', 'Pack 1', 2), makePacket('p2', 'Pack 2', 1)];
    const evaluate = vi.fn()
      .mockResolvedValueOnce([makeResult('p1-c0', true), makeResult('p1-c1', false)])
      .mockResolvedValueOnce([makeResult('p2-c0', true)]);

    const { results, errors } = await runAllPackets('some text', packets, evaluate);

    expect(errors).toHaveLength(0);
    expect(results).toHaveLength(2);
    expect(results[0].packetId).toBe('p1');
    expect(results[1].packetId).toBe('p2');
    expect(evaluate).toHaveBeenCalledTimes(2);
  });

  it('skips empty packets without error', async () => {
    const packets = [
      makePacket('p1', 'Pack 1', 2),
      makePacket('empty', 'Empty Pack', 0),
      makePacket('p3', 'Pack 3', 1),
    ];
    const evaluate = vi.fn()
      .mockResolvedValueOnce([makeResult('p1-c0', true), makeResult('p1-c1', true)])
      .mockResolvedValueOnce([makeResult('p3-c0', false)]);

    const { results, errors } = await runAllPackets('some text', packets, evaluate);

    expect(errors).toHaveLength(0);
    expect(results).toHaveLength(2);
    expect(results[0].packetId).toBe('p1');
    expect(results[1].packetId).toBe('p3');
    // Empty packet should not trigger evaluate
    expect(evaluate).toHaveBeenCalledTimes(2);
  });

  it('returns partial results when one packet fails', async () => {
    const packets = [
      makePacket('p1', 'Pack 1', 1),
      makePacket('p2', 'Pack 2', 1),
      makePacket('p3', 'Pack 3', 1),
    ];
    const evaluate = vi.fn()
      .mockResolvedValueOnce([makeResult('p1-c0', true)])
      .mockRejectedValueOnce(new Error('API rate limited'))
      .mockResolvedValueOnce([makeResult('p3-c0', false)]);

    const { results, errors } = await runAllPackets('some text', packets, evaluate);

    // Should still get results from p1 and p3
    expect(results).toHaveLength(2);
    expect(results[0].packetId).toBe('p1');
    expect(results[1].packetId).toBe('p3');

    // Should capture the error from p2
    expect(errors).toHaveLength(1);
    expect(errors[0].packetId).toBe('p2');
    expect(errors[0].packetName).toBe('Pack 2');
    expect(errors[0].error).toBe('API rate limited');
  });

  it('returns partial results when multiple packets fail', async () => {
    const packets = [
      makePacket('p1', 'Pack 1', 1),
      makePacket('p2', 'Pack 2', 1),
      makePacket('p3', 'Pack 3', 1),
    ];
    const evaluate = vi.fn()
      .mockRejectedValueOnce(new Error('Timeout'))
      .mockResolvedValueOnce([makeResult('p2-c0', true)])
      .mockRejectedValueOnce(new Error('Bad model'));

    const { results, errors } = await runAllPackets('some text', packets, evaluate);

    expect(results).toHaveLength(1);
    expect(results[0].packetId).toBe('p2');
    expect(errors).toHaveLength(2);
    expect(errors[0].error).toBe('Timeout');
    expect(errors[1].error).toBe('Bad model');
  });

  it('returns empty results and no errors when all packets are empty', async () => {
    const packets = [makePacket('e1', 'Empty 1', 0), makePacket('e2', 'Empty 2', 0)];
    const evaluate = vi.fn();

    const { results, errors } = await runAllPackets('some text', packets, evaluate);

    expect(results).toHaveLength(0);
    expect(errors).toHaveLength(0);
    expect(evaluate).not.toHaveBeenCalled();
  });

  it('returns all errors when every packet fails', async () => {
    const packets = [makePacket('p1', 'Pack 1', 1), makePacket('p2', 'Pack 2', 1)];
    const evaluate = vi.fn()
      .mockRejectedValueOnce(new Error('Fail 1'))
      .mockRejectedValueOnce(new Error('Fail 2'));

    const { results, errors } = await runAllPackets('some text', packets, evaluate);

    expect(results).toHaveLength(0);
    expect(errors).toHaveLength(2);
  });

  it('passes correct text and criteria to evaluate', async () => {
    const packets = [makePacket('p1', 'Pack 1', 2)];
    const evaluate = vi.fn().mockResolvedValueOnce([
      makeResult('p1-c0', true),
      makeResult('p1-c1', true),
    ]);

    await runAllPackets('hello world', packets, evaluate);

    expect(evaluate).toHaveBeenCalledWith('hello world', packets[0].criteria);
  });
});
