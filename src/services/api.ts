import type { Criterion, TestResult } from '../types';

const API_KEY_STORAGE = 'litmus-anthropic-key';

export function getApiKey(): string {
  return localStorage.getItem(API_KEY_STORAGE) || '';
}

export function setApiKey(key: string) {
  localStorage.setItem(API_KEY_STORAGE, key);
}

async function callClaude(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('Anthropic API key not set. Click the ⚙ icon in the header to add it.');

  const res = await fetch('/anthropic-proxy/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    const status = res.status;

    // Extract the actual message from Anthropic's error shape
    const rawMsg =
      err?.error?.message ||
      err?.message ||
      (typeof err?.error === 'string' ? err.error : null) ||
      JSON.stringify(err);

    // Map to actionable user-facing messages
    if (status === 401 || rawMsg?.includes('invalid x-api-key')) {
      throw new Error(
        'Your API key was rejected by Anthropic. → Open Settings (⚙) in the header and check that you pasted the full key starting with "sk-ant-".'
      );
    }
    if (status === 400 && rawMsg?.includes('model')) {
      throw new Error(
        'This is a software bug — the app is requesting a model that Anthropic no longer supports. → Please contact the developer to update the model configuration.'
      );
    }
    if (status === 400) {
      throw new Error(
        `The request to Anthropic was malformed. → This is likely a software bug. Please contact the developer. (Detail: ${rawMsg})`
      );
    }
    if (status === 403) {
      throw new Error(
        'Your API key doesn\'t have permission for this operation. → Check your key\'s permissions at console.anthropic.com, or generate a new key with full access.'
      );
    }
    if (status === 429) {
      throw new Error(
        'You\'ve hit Anthropic\'s rate limit. → Wait about a minute and click "Run Tests" again. If this keeps happening, check your usage tier at console.anthropic.com.'
      );
    }
    if (status === 529 || status === 503) {
      throw new Error(
        'Anthropic\'s API is temporarily overloaded. → Wait a moment and click "Run Tests" again. This usually resolves within a few minutes.'
      );
    }
    throw new Error(
      `Unexpected error from Anthropic (${status}). → If this persists, contact the developer with this detail: ${rawMsg}`
    );
  }

  const data = await res.json();
  const content = data.content?.[0];
  if (!content || content.type !== 'text') {
    throw new Error('Received an unexpected response format from Anthropic. → This is likely a software bug. Please contact the developer.');
  }
  return content.text;
}

export async function evaluateText(
  text: string,
  criteria: Criterion[]
): Promise<TestResult[]> {
  const criteriaList = criteria
    .map(
      (c, i) =>
        `${i + 1}. ID: "${c.id}" | Label: "${c.label}"${c.description ? ` | Description: ${c.description}` : ''}`
    )
    .join('\n');

  const response = await callClaude(
    'You are a strict text compliance evaluator. You evaluate text against specific criteria and return structured JSON results.',
    `Evaluate the following text against each criterion. For each criterion, determine if the text PASSES or FAILS.

TEXT TO EVALUATE:
---
${text}
---

CRITERIA:
${criteriaList}

Respond with a JSON array. Each element must have:
- "criterionId": the criterion ID
- "pass": boolean (true if the text meets the criterion, false if it violates it)
- "reasoning": a brief explanation (1-2 sentences) of why it passes or fails

Respond ONLY with the JSON array, no other text.`
  );

  try {
    // Claude sometimes returns multiple JSON blocks (self-correcting).
    // Extract all ```json...``` blocks, fall back to raw text.
    const codeBlocks = [...response.matchAll(/```(?:json)?\s*\n?([\s\S]*?)```/g)].map(m => m[1].trim());
    const candidates = codeBlocks.length > 0 ? codeBlocks : [response.trim()];

    // Try each candidate from last to first — the last block is usually the corrected one
    for (let i = candidates.length - 1; i >= 0; i--) {
      try {
        const parsed = JSON.parse(candidates[i]);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        continue;
      }
    }
    throw new Error('No valid JSON array found');
  } catch {
    throw new Error('Claude returned a response we couldn\'t understand. → Try running the tests again. If this keeps happening, contact the developer.');
  }
}

export async function rewriteText(
  text: string,
  failingCriteria: { label: string; reasoning: string }[]
): Promise<string> {
  const failureList = failingCriteria
    .map((c, i) => `${i + 1}. "${c.label}" — Failed because: ${c.reasoning}`)
    .join('\n');

  const response = await callClaude(
    'You are a precise text editor. You fix text to meet specific criteria while preserving the original meaning, tone, and structure.',
    `Rewrite the following text to fix ALL of the failing criteria listed below. Preserve the original meaning, tone, and structure as much as possible. Only make changes necessary to pass the failing criteria. Keep the same HTML formatting.

ORIGINAL TEXT:
---
${text}
---

FAILING CRITERIA:
${failureList}

Respond ONLY with the rewritten text (HTML). No explanations, no preamble.`
  );

  return response.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
}
