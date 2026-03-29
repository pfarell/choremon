import { NextRequest, NextResponse } from 'next/server';

interface AnalyzeRequest {
  imageBase64: string;
  choreType: 'vacuum' | 'mop' | 'trash' | 'laundry';
}

const CHORE_LABELS: Record<string, string> = {
  vacuum: 'vacuuming/sweeping',
  mop: 'mopping/wiping',
  trash: 'trash removal/decluttering',
  laundry: 'laundry',
};

function getPrompt(choreType: string): string {
  return `You are Rascal, a snarky raccoon cleaning coach in the app "Choremon". 
The user selected chore type: ${CHORE_LABELS[choreType]}.
Analyze this room and identify specific spots that need ${CHORE_LABELS[choreType]} attention.

Respond with ONLY valid JSON, no markdown formatting, no code blocks:
{
  "spots": [
    {
      "label": "specific description of the dirty spot",
      "xp": number between 10-50,
      "position": "center" | "left" | "right" | "top-left" | "top-right" | "bottom-left" | "bottom-right",
      "difficulty": "easy" | "medium" | "hard"
    }
  ],
  "totalSpots": number,
  "overallCleanliness": number 1-10,
  "roast": "funny Rascal roast about what you see, specific to the mess. Be snarky and reference specific things you see.",
  "encouragement": "motivational one-liner to start cleaning"
}

Rules:
- Return 3-5 spots max
- Each spot should have a clear, specific label based ONLY on what is actually visible in the image. Do not hallucinate furniture (like beds) if they are not there.
- CRITICAL: "position" MUST BE EXACTLY ONE OF THESE STRINGS: "center", "left", "right", "top-left", "top-right", "bottom-left", "bottom-right". Do NOT write descriptive text like "under the bed" for the position field.
- Distribute positions across the screen (don't repeat positions)
- Make the roast genuinely funny and specific to what you see
- XP should scale with difficulty: easy 10-20, medium 25-35, hard 40-50`;
}

function parseJsonResponse(text: string): unknown | null {
  try {
    let jsonText = text.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim();
    }
    return JSON.parse(jsonText);
  } catch {
    return null;
  }
}

// ===== Claude Vision API =====
async function tryClaudeVision(base64Data: string, choreType: string): Promise<unknown | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: base64Data,
                },
              },
              {
                type: 'text',
                text: getPrompt(choreType),
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error('Claude API error:', response.status);
      return null;
    }

    const data = await response.json();
    const textContent = data.content?.find((c: { type: string }) => c.type === 'text');
    if (!textContent?.text) return null;

    return parseJsonResponse(textContent.text);
  } catch (error) {
    console.error('Claude API failed:', error);
    return null;
  }
}

// ===== Gemini Vision API =====
async function tryGeminiVision(base64Data: string, choreType: string): Promise<unknown | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
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
                  text: getPrompt(choreType),
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

    if (!response.ok) {
      console.error('Gemini API error:', response.status);
      return null;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    return parseJsonResponse(text);
  } catch (error) {
    console.error('Gemini API failed:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();
    const { imageBase64, choreType } = body;

    // Strip the data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    // Try Claude first
    console.log('Trying Claude Vision API...');
    const claudeResult = await tryClaudeVision(base64Data, choreType);
    if (claudeResult) {
      console.log('✅ Claude Vision succeeded');
      return NextResponse.json(claudeResult);
    }

    // Fallback to Gemini
    console.log('Trying Gemini Vision API...');
    const geminiResult = await tryGeminiVision(base64Data, choreType);
    if (geminiResult) {
      console.log('✅ Gemini Vision succeeded');
      return NextResponse.json(geminiResult);
    }

    // Final fallback: mock data
    console.warn('Both APIs failed, returning mock data');
    return NextResponse.json(getMockResponse(choreType));
  } catch (error) {
    console.error('Analyze API error:', error);
    return NextResponse.json(getMockResponse('vacuum'));
  }
}

function getMockResponse(choreType: string) {
  const mocks: Record<string, { spots: Array<{ label: string; xp: number; position: string; difficulty: string }>; totalSpots: number; overallCleanliness: number; roast: string; encouragement: string }> = {
    vacuum: {
      spots: [
        { label: 'Dusty corner behind the furniture', xp: 30, position: 'bottom-left', difficulty: 'easy' },
        { label: 'Crumbs under the table', xp: 40, position: 'center', difficulty: 'medium' },
        { label: 'Pet hair on the carpet', xp: 50, position: 'right', difficulty: 'hard' },
        { label: 'Dust bunny colony', xp: 25, position: 'top-right', difficulty: 'easy' },
      ],
      totalSpots: 4,
      overallCleanliness: 4,
      roast: "I've seen dumpsters with less floor debris. Those dust bunnies are forming a civilization down there! 🐰💀",
      encouragement: "Grab that vacuum and show those dust bunnies who's boss! 💪",
    },
    mop: {
      spots: [
        { label: 'Sticky spot near the counter', xp: 35, position: 'left', difficulty: 'medium' },
        { label: 'Coffee ring stain', xp: 25, position: 'top-left', difficulty: 'easy' },
        { label: 'Splatter marks', xp: 45, position: 'center', difficulty: 'hard' },
        { label: 'Dusty shelf surface', xp: 20, position: 'top-right', difficulty: 'easy' },
      ],
      totalSpots: 4,
      overallCleanliness: 5,
      roast: "Those surfaces are so sticky, my paws would get stuck if I touched them! When's the last time you met a sponge? 🧽😭",
      encouragement: "A little elbow grease and this place will sparkle! Let's go!",
    },
    trash: {
      spots: [
        { label: 'Random items piling up', xp: 30, position: 'bottom-right', difficulty: 'medium' },
        { label: 'Overflowing bin area', xp: 45, position: 'center', difficulty: 'hard' },
        { label: 'Misplaced items on the floor', xp: 20, position: 'left', difficulty: 'easy' },
      ],
      totalSpots: 3,
      overallCleanliness: 5,
      roast: "This place has more clutter than my nest, and I'm literally a raccoon who lives in trash! 🗑️🦝",
      encouragement: "Declutter time! If you haven't used it in a month, it's gotta go!",
    },
    laundry: {
      spots: [
        { label: 'Clothes on the floor', xp: 35, position: 'bottom-left', difficulty: 'medium' },
        { label: 'Overflowing hamper', xp: 40, position: 'right', difficulty: 'medium' },
        { label: 'Chair covered in clothes', xp: 50, position: 'center', difficulty: 'hard' },
      ],
      totalSpots: 3,
      overallCleanliness: 4,
      roast: "Ah yes, the classic 'floordrobe' look. I can't tell where the laundry ends and the furniture begins! 👕💀",
      encouragement: "Sort, wash, fold — you've got this, champ! 👕✨",
    },
  };

  return mocks[choreType] || mocks.vacuum;
}
