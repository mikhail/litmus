import { describe, it, expect } from 'vitest';
import { setCors, handleCors } from '../cors';

function mockReq(method: string) {
  return { method } as any;
}

function mockRes() {
  const headers: Record<string, string> = {};
  const res = {
    _headers: headers,
    _status: 0,
    _sent: false,
    set(key: string, val: string) { headers[key] = val; return res; },
    status(code: number) { res._status = code; return res; },
    send(_body: string) { res._sent = true; return res; },
  };
  return res;
}

describe('setCors', () => {
  it('sets Access-Control-Allow-Origin to *', () => {
    const res = mockRes();
    setCors(res as any);
    expect(res._headers['Access-Control-Allow-Origin']).toBe('*');
  });

  it('sets Access-Control-Allow-Methods to include POST and OPTIONS', () => {
    const res = mockRes();
    setCors(res as any);
    expect(res._headers['Access-Control-Allow-Methods']).toContain('POST');
    expect(res._headers['Access-Control-Allow-Methods']).toContain('OPTIONS');
  });

  it('sets Access-Control-Allow-Headers to include Content-Type', () => {
    const res = mockRes();
    setCors(res as any);
    expect(res._headers['Access-Control-Allow-Headers']).toContain('Content-Type');
  });

  it('sets Access-Control-Max-Age for preflight caching', () => {
    const res = mockRes();
    setCors(res as any);
    expect(res._headers['Access-Control-Max-Age']).toBeDefined();
  });
});

describe('handleCors', () => {
  it('returns true and sends 204 for OPTIONS requests', () => {
    const req = mockReq('OPTIONS');
    const res = mockRes();
    const handled = handleCors(req, res as any);
    expect(handled).toBe(true);
    expect(res._status).toBe(204);
    expect(res._sent).toBe(true);
  });

  it('returns false for POST requests (sets headers but does not send)', () => {
    const req = mockReq('POST');
    const res = mockRes();
    const handled = handleCors(req, res as any);
    expect(handled).toBe(false);
    expect(res._sent).toBe(false);
    expect(res._headers['Access-Control-Allow-Origin']).toBe('*');
  });

  it('returns false for GET requests', () => {
    const req = mockReq('GET');
    const res = mockRes();
    const handled = handleCors(req, res as any);
    expect(handled).toBe(false);
  });
});
