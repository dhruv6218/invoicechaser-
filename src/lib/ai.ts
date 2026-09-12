/**
 * AI Engine — Gemini (primary) with OpenRouter (fallback)
 * Used for tone cloning and email draft generation.
 */

const GEMINI_MODEL = 'gemini-3.6-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

interface AIResponse {
  content: string;
  provider: 'gemini' | 'openrouter';
}

/**
 * Call Gemini API to generate content.
 */
async function callGemini(prompt: string, systemPrompt?: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error: ${err}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned empty response');
  return text.trim();
}

/**
 * Call OpenRouter API as fallback.
 */
async function callOpenRouter(prompt: string, systemPrompt?: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set');

  const res = await fetch(OPENROUTER_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek/deepseek-chat:free',
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter API error: ${err}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('OpenRouter returned empty response');
  return text.trim();
}

/**
 * Generate AI content with Gemini primary, OpenRouter fallback.
 */
export async function generateAIContent(
  prompt: string,
  systemPrompt?: string
): Promise<AIResponse> {
  // Try Gemini first
  if (process.env.GEMINI_API_KEY) {
    try {
      const content = await callGemini(prompt, systemPrompt);
      return { content, provider: 'gemini' };
    } catch (err) {
      console.error('[AI] Gemini failed, falling back to OpenRouter:', err);
    }
  }

  // Fallback to OpenRouter
  if (process.env.OPENROUTER_API_KEY) {
    const content = await callOpenRouter(prompt, systemPrompt);
    return { content, provider: 'openrouter' };
  }

  throw new Error('No AI provider configured. Set GEMINI_API_KEY or OPENROUTER_API_KEY.');
}

/**
 * Generate a tone prompt from sample emails.
 * This analyzes the user's writing style and creates a system prompt for future emails.
 */
export async function generateTonePrompt(sampleEmails: string): Promise<string> {
  const systemPrompt = `You are a writing style analyzer. Analyze the following email samples and create a concise "voice profile" that captures the user's tone, vocabulary, sentence structure, greeting style, sign-off, and personality. Output a 2-3 sentence description that can be used as a system prompt for an AI to write emails in this exact style.`;
  const prompt = `Sample emails from the user:\n\n${sampleEmails}\n\nCreate the voice profile:`;
  const { content } = await generateAIContent(prompt, systemPrompt);
  return content;
}

/**
 * Generate a reminder email for an overdue invoice.
 */
export async function generateReminderEmail(params: {
  clientName: string;
  invoiceAmount: number;
  currency: string;
  invoiceId: string;
  daysOverdue: number;
  reminderCount: number;
  toneLevel: number; // 1 = friendly, 2 = balanced, 3 = firm
  tonePrompt: string; // user's voice profile
  paymentLink: string;
}): Promise<string> {
  const toneLabels = { 1: 'friendly and warm', 2: 'professional and balanced', 3: 'firm and assertive' };
  const toneLabel = toneLabels[params.toneLevel as 1 | 2 | 3] || toneLabels[2];

  const systemPrompt = `You are an AI assistant writing a payment reminder email for an overdue invoice. You must write in the following voice/style:\n\n${params.tonePrompt}\n\nThe tone for this email should be ${toneLabel}. Keep the email concise (max 150 words). Include the payment link naturally. Do not use subject lines — just write the email body. Do not include any preamble or explanation — output ONLY the email text.`;

  const prompt = `Write a payment reminder email with these details:
- Client name: ${params.clientName}
- Invoice amount: ${params.currency} ${params.invoiceAmount}
- Invoice ID: ${params.invoiceId}
- Days overdue: ${params.daysOverdue}
- This is reminder #${params.reminderCount}
- Payment link: ${params.paymentLink}

Write the email now:`;

  const { content } = await generateAIContent(prompt, systemPrompt);
  return content;
}
