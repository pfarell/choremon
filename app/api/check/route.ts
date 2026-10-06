import { NextRequest, NextResponse } from 'next/server';

const API_KEYS = [
  process.env.GEMINI_API_KEY,
  ...(process.env.GEMINI_API_KEYS || '').split(',').map((k) => k.trim()),
].filter(Boolean) as string[];

interface RemainingItem {
  id: string;
  name: string;
  location: string;
}

function getCheckPrompt(remainingItems: RemainingItem[], ignoredNames: string[], choreType: string): string {
  const itemList = remainingItems
    .map(item => `- ${item.id}: "${item.name}" at "${item.location}"`)
    .join('\n');

  let ignoreLine = '';
  if (ignoredNames.length > 0) {
    ignoreLine = `\nIGNORE these items — the user confirmed they are NOT ${choreType}: ${ignoredNames.join(', ')}\n`;
  }

  return `Look at this photo. I previously identified these items that need cleaning:
${itemList}
${ignoreLine}
Which of these items can you STILL see in the photo?
ONLY list items you can clearly see. If an item is gone/removed, do NOT include it.

Return ONLY valid JSON, no markdown formatting, no code blocks:
{ "still_visible": ["item_1", "item_3"] }

Use the exact item IDs from the list above. If none are visible, return { "still_visible": [] }.`;
}

function parseJsonResponse(text: string): unknown | null {
  try {
    let jsonText = text.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim();
    }
    return JSON.parse(jsonText);
  } catch (e) {
    console.error('JSON parse error:', e, 'Raw text:', text.substring(0, 200));
    return null;
  }
}

async function tryGeminiWithKey(
  apiKey: string,
  base64Data: string,
  remainingItems: RemainingItem[],
  ignoredNames: string[],
  choreType: string,
  keyIndex: number
): Promise<{ still_visible: string[] } | null> {
  console.log(`=== GEMINI CHECK: Trying key #${keyIndex} ===`);
  console.log('Remaining items:', remainingItems.length);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: base64Data,
                },
              },
              {
                text: getCheckPrompt(remainingItems, ignoredNames, choreType),
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 256,
        },
      }),
    }
  );

  console.log('Gemini check response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Gemini check error (key #${keyIndex}):`, response.status, errorText.substring(0, 300));
    return null;
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    console.error('No text in Gemini check response');
    return null;
  }

  console.log('Gemini check text:', text);

  const parsed = parseJsonResponse(text) as { still_visible?: string[] } | null;
  if (parsed && Array.isArray(parsed.still_visible)) {
    console.log(`✅ Gemini check succeeded (key #${keyIndex}), still visible:`, parsed.still_visible);
    return parsed as { still_visible: string[] };
  }

  console.error('Failed to parse check response as JSON');
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, remainingItems, ignoredItems, choreType } = body;

    console.log('=== CHECK API CALLED ===');
    console.log('Remaining items count:', remainingItems?.length);
    console.log('Ignored items:', ignoredItems?.length || 0);

    if (!imageBase64 || !remainingItems) {
      return NextResponse.json(
        { error: 'Missing imageBase64 or remainingItems' },
        { status: 400 }
      );
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const ignoredNames: string[] = (ignoredItems || []).map((id: string) => {
      const item = remainingItems.find((i: RemainingItem) => i.id === id);
      return item ? item.name : id;
    }).filter(Boolean);

    if (API_KEYS.length === 0) {
      console.error('NO API KEYS AVAILABLE');
      return NextResponse.json({
        still_visible: remainingItems.map((item: RemainingItem) => item.id),
      });
    }

    for (let i = 0; i < API_KEYS.length; i++) {
      try {
        const result = await tryGeminiWithKey(API_KEYS[i], base64Data, remainingItems, ignoredNames, choreType || 'trash', i);
        if (result) {
          return NextResponse.json(result);
        }
      } catch (error) {
        console.error(`Check key #${i} threw error:`, error);
        continue;
      }
    }

    console.warn('ALL API keys failed for check, returning all visible');
    return NextResponse.json({
      still_visible: remainingItems.map((item: RemainingItem) => item.id),
    });
  } catch (error) {
    console.error('Check API top-level error:', error);
    return NextResponse.json({ still_visible: [] });
  }
}
