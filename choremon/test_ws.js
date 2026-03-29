const WebSocket = require('ws'); 
const WS_URL = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent';
const apiKey = 'REDACTED_GEMINI_KEY';

const ws = new WebSocket(`${WS_URL}?key=${apiKey}`);

ws.on('open', () => {
    console.log('Connected');
    ws.send(JSON.stringify({
        setup: {
            model: 'models/gemini-2.5-flash-native-audio-latest',
            generationConfig: { responseModalities: ['AUDIO'], temperature: 0.3 },
            systemInstruction: { parts: [{ text: 'You must call the update_ui function with the specified JSON parameters.'}] },
            tools: [{
                functionDeclarations: [{
                    name: 'update_ui',
                    description: 'Updates the user interface with scan status.',
                    parameters: {
                        type: 'OBJECT',
                        properties: {
                            phase: { type: 'STRING' },
                            items: { type: 'ARRAY', items: { type: 'STRING' } }
                        }
                    }
                }]
            }]
        }
    }));
    
    // Test receiving text
    setTimeout(() => {
        ws.send(JSON.stringify({
            clientContent: { turns: [{ role: 'user', parts: [{ text: 'Please call the update_ui function with phase "scan" and some item.' }] }], turnComplete: true }
        }));
    }, 1000);
});

ws.on('message', (data) => {
    console.log('Message:', data.toString());
});

ws.on('close', (code, reason) => {
    console.log('Closed:', code, reason.toString());
});

ws.on('error', (err) => {
    console.error('Error:', err);
});
