import { onRequest } from "firebase-functions/v2/https";
import Anthropic from "@anthropic-ai/sdk";
import { defineSecret } from "firebase-functions/params";

const anthropicApiKey = defineSecret("ANTHROPIC_API_KEY");

function getClient(apiKey: string) {
  return new Anthropic({ apiKey });
}

function extractLastJsonArray(text: string): unknown[] {
  const codeBlocks = [...text.matchAll(/```(?:json)?\s*\n?([\s\S]*?)```/g)].map(m => m[1].trim());
  const candidates = codeBlocks.length > 0 ? codeBlocks : [text.trim()];
  for (let i = candidates.length - 1; i >= 0; i--) {
    try {
      const parsed = JSON.parse(candidates[i]);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      continue;
    }
  }
  throw new Error("No valid JSON array found in response");
}

export const evaluate = onRequest(
  { cors: true, secrets: [anthropicApiKey] },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const { text, criteria } = req.body as {
      text: string;
      criteria: { id: string; label: string; description?: string }[];
    };

    if (!text || !criteria?.length) {
      res.status(400).json({ error: "Missing text or criteria" });
      return;
    }

    const client = getClient(anthropicApiKey.value());

    const criteriaList = criteria
      .map(
        (c, i) =>
          `${i + 1}. ID: "${c.id}" | Label: "${c.label}"${c.description ? ` | Description: ${c.description}` : ""}`
      )
      .join("\n");

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `You are a strict text compliance evaluator. Evaluate the following text against each criterion. For each criterion, determine if the text PASSES or FAILS.

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

Respond ONLY with the JSON array, no other text.`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      res.status(500).json({ error: "Unexpected response format" });
      return;
    }

    try {
      const results = extractLastJsonArray(content.text);
      res.json({ results });
    } catch {
      res.status(500).json({ error: "Failed to parse AI response", raw: content.text });
    }
  }
);

export const rewrite = onRequest(
  { cors: true, secrets: [anthropicApiKey] },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const { text, failingCriteria } = req.body as {
      text: string;
      failingCriteria: { label: string; reasoning: string }[];
    };

    if (!text || !failingCriteria?.length) {
      res.status(400).json({ error: "Missing text or failingCriteria" });
      return;
    }

    const client = getClient(anthropicApiKey.value());

    const failureList = failingCriteria
      .map((c, i) => `${i + 1}. "${c.label}" — Failed because: ${c.reasoning}`)
      .join("\n");

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `You are a precise text editor. Rewrite the following text to fix ALL of the failing criteria listed below. Preserve the original meaning, tone, and structure as much as possible. Only make changes necessary to pass the failing criteria. Keep the same HTML formatting.

ORIGINAL TEXT:
---
${text}
---

FAILING CRITERIA:
${failureList}

Respond ONLY with the rewritten text (HTML). No explanations, no preamble.`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      res.status(500).json({ error: "Unexpected response format" });
      return;
    }

    const rewrittenText = content.text.replace(/```html\n?/g, "").replace(/```\n?/g, "").trim();
    res.json({ rewrittenText });
  }
);
