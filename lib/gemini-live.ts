// =============================================================================
// Gemini REST API Client — No WebSocket, just fetch() calls
// =============================================================================
// Uses the standard generateContent REST endpoint with function calling
// to scan for items and track their visibility across frames.
// =============================================================================

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export class GeminiLive {
  private apiKey: string;
  private onScanResult: (items: unknown[], roast: string) => void;
  private onTrackResult: (stillVisible: string[], comment: string) => void;
  private onErrorCallback?: (err: string) => void;
  private _ready = false;
  private phase: 'scan' | 'track' = 'scan';
  private choreType: string = '';
  private busy = false; // prevent overlapping requests

  constructor(
    apiKey: string,
    onScanResult: (items: unknown[], roast: string) => void,
    onTrackResult: (stillVisible: string[], comment: string) => void,
    onErrorCallback?: (err: string) => void
  ) {
    this.apiKey = apiKey;
    this.onScanResult = onScanResult;
    this.onTrackResult = onTrackResult;
    this.onErrorCallback = onErrorCallback;
  }

  connect(choreType: string) {
    this.choreType = choreType;
    this._ready = true;
  }

  isReady() {
    return this._ready;
  }

  disconnect() {
    this._ready = false;
  }

  async sendFrame(
    base64: string,
    trackedItems?: { id: string; name: string }[],
    requestUpdate: boolean = true
  ) {
    if (!this._ready || this.busy || !requestUpdate) return;
    this.busy = true;

    const imageData = base64.replace(/^data:image\/\w+;base64,/, '');
    const itemType = this.choreType === 'laundry' ? 'clothing items' : 'trash items';

    try {
      if (this.phase === 'scan') {
        await this._doScan(imageData, itemType);
      } else if (this.phase === 'track' && trackedItems && trackedItems.length > 0) {
        await this._doTrack(imageData, trackedItems);
      }
    } catch (err) {
      console.error('Gemini API error:', err);
      if (this.onErrorCallback) {
        this.onErrorCallback(`API error: ${err instanceof Error ? err.message : String(err)}`);
      }
    } finally {
      this.busy = false;
    }
  }

  // ---- Phase 1: Scan for items -------------------------------------------
  private async _doScan(imageData: string, itemType: string) {
    const url = `${API_BASE}/models/gemini-3.0-flash:generateContent?key=${this.apiKey}`;

    const body = {
      systemInstruction: {
        parts: [{
          text: `You are Rascal, a snarky raccoon for Choremon.
The user is cleaning up ${this.choreType}.
Identify ALL specific ${itemType} you can see in the image. Be precise about what each item is.
Max 8 items. XP between 10-30 each.
You MUST respond by calling the "update_ui" function with phase="scan", the list of items, and a funny specific roast about the mess.`
        }]
      },
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: imageData } },
          { text: `Scan this room for ${itemType}. Call the update_ui function with the results.` }
        ]
      }],
      tools: [{ functionDeclarations: [this._getToolDeclaration()] }],
      generationConfig: { temperature: 0.3 }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const result = this._extractFunctionCall(data);

    if (result && result.phase === 'scan' && result.items) {
      this.phase = 'track';
      this.onScanResult(result.items as unknown[], (result.roast as string) || '');
    } else {
      // Try to parse a text response as fallback
      const textResult = this._extractTextFallback(data, 'scan');
      if (textResult && textResult.items) {
        this.phase = 'track';
        this.onScanResult(textResult.items as unknown[], (textResult.roast as string) || '');
      } else {
        if (this.onErrorCallback) {
          this.onErrorCallback('No items detected. Try pointing at a messier area!');
        }
      }
    }
  }

  // ---- Phase 2: Track which items are still visible ----------------------
  private async _doTrack(
    imageData: string,
    trackedItems: { id: string; name: string }[]
  ) {
    const url = `${API_BASE}/models/gemini-3.0-flash:generateContent?key=${this.apiKey}`;
    const itemList = trackedItems.map(i => `${i.id}: "${i.name}"`).join(', ');

    const body = {
      systemInstruction: {
        parts: [{
          text: `You are Rascal, a snarky raccoon watching a LIVE camera feed for Choremon.
You must call the "update_ui" function with phase="track".
Look at this image and determine which of the tracked items are STILL visible.
If an item has been picked up or is gone, do NOT include it in still_visible.
Add a short snarky comment about progress.`
        }]
      },
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: imageData } },
          { text: `Still tracking these items: ${itemList}. Which can you STILL see in the image? Call the update_ui function.` }
        ]
      }],
      tools: [{ functionDeclarations: [this._getToolDeclaration()] }],
      generationConfig: { temperature: 0.3 }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const result = this._extractFunctionCall(data);

    if (result && result.phase === 'track') {
      this.onTrackResult((result.still_visible as string[]) || [], (result.comment as string) || '');
    } else {
      // Try text fallback
      const textResult = this._extractTextFallback(data, 'track');
      if (textResult) {
        this.onTrackResult((textResult.still_visible as string[]) || [], (textResult.comment as string) || '');
      }
    }
  }

  // ---- Tool declaration --------------------------------------------------
  private _getToolDeclaration() {
    return {
      name: 'update_ui',
      description: 'Updates the tracking UI with scan or track results',
      parameters: {
        type: 'OBJECT',
        properties: {
          phase: { type: 'STRING', description: 'Must be "scan" or "track"' },
          items: {
            type: 'ARRAY',
            description: 'For phase="scan". Found items.',
            items: {
              type: 'OBJECT',
              properties: {
                id: { type: 'STRING' },
                name: { type: 'STRING' },
                location: { type: 'STRING' },
                xp: { type: 'INTEGER' },
              },
            },
          },
          roast: {
            type: 'STRING',
            description: 'For phase="scan". A snarky roast about the mess.',
          },
          still_visible: {
            type: 'ARRAY',
            description: 'For phase="track". List of item IDs that are STILL visible.',
            items: { type: 'STRING' },
          },
          comment: {
            type: 'STRING',
            description: 'For phase="track". Snarky Rascal reaction.',
          },
        },
      },
    };
  }

  // ---- Extract function call from response --------------------------------
  private _extractFunctionCall(data: Record<string, unknown>): Record<string, unknown> | null {
    try {
      const candidates = data.candidates as Array<Record<string, unknown>>;
      if (!candidates || candidates.length === 0) return null;

      const content = candidates[0].content as { parts?: Array<Record<string, unknown>> };
      if (!content?.parts) return null;

      for (const part of content.parts) {
        const functionCall = part.functionCall as { name?: string; args?: Record<string, unknown> };
        if (functionCall && functionCall.name === 'update_ui' && functionCall.args) {
          return functionCall.args;
        }
      }
    } catch {
      // ignore parse errors
    }
    return null;
  }

  // ---- Fallback: try to parse JSON from text response ---------------------
  private _extractTextFallback(
    data: Record<string, unknown>,
    expectedPhase: string
  ): Record<string, unknown> | null {
    try {
      const candidates = data.candidates as Array<Record<string, unknown>>;
      if (!candidates || candidates.length === 0) return null;

      const content = candidates[0].content as { parts?: Array<Record<string, unknown>> };
      if (!content?.parts) return null;

      for (const part of content.parts) {
        if (typeof part.text === 'string') {
          // Try to extract JSON from the text
          const jsonMatch = part.text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.phase === expectedPhase) return parsed;
          }
        }
      }
    } catch {
      // ignore parse errors
    }
    return null;
  }
}
