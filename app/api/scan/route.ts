import { NextRequest, NextResponse } from 'next/server';

const API_KEYS = [
  process.env.GEMINI_API_KEY,
  ...(process.env.GEMINI_API_KEYS || '').split(',').map((k) => k.trim()),
].filter(Boolean) as string[];

function getScanPrompt(choreType: string): string {
  const itemType = choreType === 'laundry' ? 'clothing item' : 'trash item';
  const cleanType = choreType === 'laundry' ? 'laundry' : 'trash';

  return `You are Rascal, a snarky raccoon cleaning coach.
The user wants to clean up ${cleanType}.
Look at this room carefully. Identify EVERY specific ${itemType} you can see.
Be very precise — "crumpled white paper near desk" not just "paper".

Return ONLY valid JSON, no markdown formatting, no code blocks:
{
  "items": [
    { "id": "item_1", "name": "plastic water bottle", "location": "floor near door", "xp": 20 },
    { "id": "item_2", "name": "crumpled paper", "location": "next to trash can", "xp": 15 }
  ],
  "roast": "one funny roast about the mess"
}

Rules:
- Max 8 items. Min XP 10, max XP 30 per item.
- Each item must have a unique id like "item_1", "item_2", etc.
- Be very specific with item names and locations based on what you actually see.
- The roast should be genuinely funny and reference specific things you see.
- If you can't see any relevant items, return an empty items array with a roast about the clean room.`;
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

async function tryGeminiWithKey(apiKey: string, base64Data: string, choreType: string, keyIndex: number): Promise<unknown | null> {
  console.log(`=== GEMINI SCAN: Trying key #${keyIndex} ===`);
  console.log('API Key first 10 chars:', apiKey.substring(0, 10));
  console.log('Image data length:', base64Data.length);

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
                text: getScanPrompt(choreType),
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    }
  );

  console.log('Gemini response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Gemini API error (key #${keyIndex}):`, response.status, errorText.substring(0, 300));
    return null;
  }

  const data = await response.json();
  console.log('Gemini raw response:', JSON.stringify(data).substring(0, 500));

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    console.error('No text in Gemini response. Candidates:', JSON.stringify(data.candidates).substring(0, 300));
    return null;
  }

  console.log('Gemini text response:', text.substring(0, 300));

  const parsed = parseJsonResponse(text);
  if (parsed) {
    console.log(`✅ Gemini scan succeeded with key #${keyIndex}`);
    return parsed;
  }

  console.error('Failed to parse Gemini response as JSON');
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, choreType } = body;

    console.log('=== SCAN API CALLED ===');
    console.log('choreType:', choreType);
    console.log('imageBase64 exists:', !!imageBase64);
    console.log('imageBase64 length:', imageBase64?.length || 0);

    if (!imageBase64 || !choreType) {
      console.error('Missing required fields');
      return NextResponse.json(
        { error: 'Missing imageBase64 or choreType' },
        { status: 400 }
      );
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    console.log('base64Data length after strip:', base64Data.length);

    if (API_KEYS.length === 0) {
      console.error('NO API KEYS AVAILABLE');
      return NextResponse.json(getMockScanResponse(choreType));
    }

    console.log(`Total API keys available: ${API_KEYS.length}`);

    for (let i = 0; i < API_KEYS.length; i++) {
      try {
        const result = await tryGeminiWithKey(API_KEYS[i], base64Data, choreType, i);
        if (result) {
          return NextResponse.json(result);
        }
      } catch (error) {
        console.error(`Key #${i} threw error:`, error);
        continue;
      }
    }

    console.warn('ALL API keys failed, returning mock data');
    return NextResponse.json(getMockScanResponse(choreType));
  } catch (error) {
    console.error('Scan API top-level error:', error);
    return NextResponse.json(getMockScanResponse('trash'));
  }
}

function getMockScanResponse(choreType: string) {
  console.log('⚠️ Returning MOCK scan response for:', choreType);
  if (choreType === 'laundry') {
    return {
      items: [
        { id: 'item_1', name: 'blue hoodie', location: 'draped over chair', xp: 20 },
        { id: 'item_2', name: 'white socks', location: 'floor near bed', xp: 15 },
        { id: 'item_3', name: 'jeans', location: 'crumpled on floor', xp: 25 },
        { id: 'item_4', name: 'grey t-shirt', location: 'hanging off desk', xp: 15 },
      ],
      roast: "Your floor has more clothes on it than your closet does. That chair isn't furniture anymore — it's a wardrobe! 🦝👕",
    };
  }
  return {
    items: [
      { id: 'item_1', name: 'plastic water bottle', location: 'floor near door', xp: 20 },
      { id: 'item_2', name: 'crumpled paper', location: 'next to trash can', xp: 15 },
      { id: 'item_3', name: 'candy wrapper', location: 'on desk', xp: 10 },
      { id: 'item_4', name: 'empty chip bag', location: 'under chair', xp: 20 },
      { id: 'item_5', name: 'used napkin', location: 'on nightstand', xp: 10 },
    ],
    roast: "Bro, the trash can is RIGHT THERE and you still missed? Your aim is worse than a Stormtrooper's! 🗑️🦝",
  };
}
