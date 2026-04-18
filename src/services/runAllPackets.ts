import type { TestPacket, TestResult, RunResult, Criterion } from '../types';

export interface EvaluateFn {
  (text: string, criteria: Criterion[]): Promise<TestResult[]>;
}

export interface RunAllResult {
  results: RunResult[];
  errors: { packetId: string; packetName: string; error: string }[];
}

/**
 * Runs all active packets against the given text.
 * Provides partial results: if some packets fail, the successful ones are still returned.
 * Empty packets (no criteria) are silently skipped.
 */
export async function runAllPackets(
  text: string,
  packets: TestPacket[],
  evaluate: EvaluateFn
): Promise<RunAllResult> {
  const results: RunResult[] = [];
  const errors: RunAllResult['errors'] = [];

  for (const packet of packets) {
    if (packet.criteria.length === 0) continue;

    try {
      const testResults = await evaluate(text, packet.criteria);
      results.push({
        packetId: packet.id,
        results: testResults,
        timestamp: Date.now(),
      });
    } catch (e) {
      errors.push({
        packetId: packet.id,
        packetName: packet.name,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return { results, errors };
}
