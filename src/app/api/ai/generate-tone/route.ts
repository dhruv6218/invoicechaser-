import { NextRequest, NextResponse } from 'next/server';
import { generateTonePrompt } from '../../../../lib/ai';

/**
 * AI Tone Generation API route.
 * POST: Analyze sample emails and generate a voice profile prompt.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sampleEmails } = body;

    if (!sampleEmails || !sampleEmails.trim()) {
      return NextResponse.json({ error: 'Sample emails are required' }, { status: 400 });
    }

    const tonePrompt = await generateTonePrompt(sampleEmails);

    return NextResponse.json({ tonePrompt });
  } catch (err) {
    console.error('[AI] Tone generation failed:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'AI generation failed' },
      { status: 500 }
    );
  }
}
