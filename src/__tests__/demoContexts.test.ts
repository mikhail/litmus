import { describe, it, expect } from 'vitest';
import { demoContexts } from '../data/demoContexts';

describe('Demo contexts', () => {
  it('has exactly 4 demo contexts', () => {
    expect(demoContexts).toHaveLength(4);
  });

  it('Engineering Org is the first context (default for tour)', () => {
    expect(demoContexts[0].id).toBe('engineering-org');
  });

  it('each context has a unique id', () => {
    const ids = demoContexts.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('each context has non-empty sample text', () => {
    for (const ctx of demoContexts) {
      expect(ctx.sampleText.trim().length).toBeGreaterThan(0);
    }
  });

  it('each context has at least 2 packets (company + team)', () => {
    for (const ctx of demoContexts) {
      expect(ctx.packets.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('each context has a Personal packet that starts empty', () => {
    for (const ctx of demoContexts) {
      const personal = ctx.packets.find((p) => p.name.includes('Personal'));
      expect(personal).toBeDefined();
      expect(personal!.criteria).toHaveLength(0);
    }
  });

  it('non-personal packets all have at least 1 criterion', () => {
    for (const ctx of demoContexts) {
      for (const packet of ctx.packets) {
        if (packet.name.includes('Personal')) continue;
        expect(packet.criteria.length).toBeGreaterThan(0);
      }
    }
  });

  it('all criterion IDs are unique within a context', () => {
    for (const ctx of demoContexts) {
      const ids = ctx.packets.flatMap((p) => p.criteria.map((c) => c.id));
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('sample text contains intentional failures for non-personal packets', () => {
    // Engineering Org: should have TODOs and undefined acronyms
    const eng = demoContexts.find((c) => c.id === 'engineering-org')!;
    expect(eng.sampleText).toContain('TODO');
    expect(eng.sampleText).toContain('gRPC'); // undefined acronym

    // Law Firm: should have speculative language and contractions
    const law = demoContexts.find((c) => c.id === 'law-firm')!;
    expect(law.sampleText).toContain('could potentially');
    expect(law.sampleText).toMatch(/shouldn't|won't|can't|don't/);

    // Product Team: should have financial disclosure and codename
    const prod = demoContexts.find((c) => c.id === 'product-team')!;
    expect(prod.sampleText).toContain('$2.3M');
    expect(prod.sampleText).toContain('Project Falcon');

    // Journalist: should have passive voice and unattributed stat
    const news = demoContexts.find((c) => c.id === 'journalist')!;
    expect(news.sampleText).toMatch(/was unveiled|was expressed|was submitted/);
    expect(news.sampleText).toContain('42%');
  });
});
