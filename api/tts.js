// Endpoint: /api/tts.js
// Deskripsi: Menerima teks, mengubahnya menjadi audio menggunakan Gemini TTS, dan mengembalikan data audio.

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Method Not Allowed' });
    }

    const { text } = request.body;
    if (!text) {
        return response.status(400).json({ error: 'Text is required' });
    }

    // Ambil kunci API dari Vercel Environment Variables
    const apiKeys = process.env.GEMINI_API_KEYS.split(',').map(key => key.trim());
    if (!apiKeys || apiKeys.length === 0) {
        return response.status(500).json({ error: 'GEMINI_API_KEYS environment variable not set.' });
    }

    // Pilih kunci secara acak
    const apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ parts: [{ text }] }],
        generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
            }
        },
    };

    try {
        const ttsResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!ttsResponse.ok) {
            const errorBody = await ttsResponse.text();
            console.error("TTS API Error:", errorBody);
            return response.status(ttsResponse.status).json({ error: `TTS API error: ${ttsResponse.statusText}` });
        }

        const result = await ttsResponse.json();
        const part = result?.candidates?.[0]?.content?.parts?.[0];
        
        if (part?.inlineData?.data) {
            const audioData = part.inlineData.data;
            const sampleRate = parseInt(part.inlineData.mimeType.match(/rate=(\d+)/)[1], 10);
            response.status(200).json({ audioData, sampleRate });
        } else {
            throw new Error("No audio data in TTS response");
        }

    } catch (error) {
        console.error('Error calling TTS API:', error);
        response.status(500).json({ error: 'Failed to generate audio' });
    }
}
