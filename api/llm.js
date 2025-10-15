// Endpoint: /api/llm.js
// Deskripsi: Menerima histori percakapan, meneruskannya ke Gemini, dan mengembalikan respons teks.

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Method Not Allowed' });
    }

    const { history } = request.body;
    if (!history) {
        return response.status(400).json({ error: 'History is required' });
    }

    // Ambil kunci API dari Vercel Environment Variables
    const apiKeys = process.env.GEMINI_API_KEYS.split(',').map(key => key.trim());
    if (!apiKeys || apiKeys.length === 0) {
        return response.status(500).json({ error: 'GEMINI_API_KEYS environment variable not set.' });
    }
    
    // Pilih kunci secara acak untuk distribusi beban sederhana
    const apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    const systemPrompt = "Anda adalah asisten AI percakapan yang ramah dan ringkas. Jawab dalam Bahasa Indonesia.";
    const payload = {
        "system_instruction": { "parts": [{ "text": systemPrompt }] },
        "contents": history
    };

    try {
        const geminiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!geminiResponse.ok) {
            const errorBody = await geminiResponse.text();
            console.error("Gemini API Error:", errorBody);
            return response.status(geminiResponse.status).json({ error: `Gemini API error: ${geminiResponse.statusText}` });
        }

        const data = await geminiResponse.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, saya tidak bisa merespons saat ini.";
        
        response.status(200).json({ text });

    } catch (error) {
        console.error('Error calling Gemini API:', error);
        response.status(500).json({ error: 'Failed to fetch response from Gemini' });
    }
}
