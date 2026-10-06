import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { imageBase64, choreType } = await request.json();
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'No OPENAI_API_KEY' }, { status: 500 });
  }

  const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

  const prompt = choreType === 'laundry'
    ? 'Look at this image. List ONLY clothing items clearly visible on the floor or out of place. Be exact — only what you can clearly see. If you see 2 items, list exactly 2. Do NOT guess or add items. Format: comma-separated list. If none: respond with just the word none'
    : 'Look at this image. List ONLY trash/garbage items you can clearly see: wrappers, napkins, empty containers, food packaging, etc. Do NOT include furniture, electronics, bags, or items in use. Be exact — if you see 1 wrapper, say 1 wrapper. Do NOT guess or hallucinate items. Format: comma-separated list. If none: respond with just the word none';

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${cleanBase64}`, detail: 'low' } },
            { type: 'text', text: prompt }
          ]
        }],
        max_tokens: 200,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('OpenAI error:', response.status, err);
      return NextResponse.json({ error: 'OpenAI failed' }, { status: 500 });
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || '';

    const items = answer.toLowerCase().trim() === 'none'
      ? []
      : answer.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0 && s !== 'none');

    return NextResponse.json({ items });
  } catch (err) {
    console.error('Vision API error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
