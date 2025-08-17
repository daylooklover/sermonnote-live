// src/lib/gemini.js
export const callGeminiAPI = async (prompt, generationConfig = null) => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
    const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
    const payload = { contents: chatHistory };
    if (generationConfig) payload.generationConfig = generationConfig;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
    let retryCount = 0;
    const maxRetries = 3;
    const initialDelay = 1000;

    while (retryCount < maxRetries) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                if (response.status === 429) {
                    const delay = initialDelay * Math.pow(2, retryCount);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    retryCount++;
                    continue;
                }
                throw new Error(`API call failed with status: ${response.status}`);
            }
            const result = await response.json();
            if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
                return result.candidates[0].content.parts[0].text;
            } else {
                throw new Error("Unexpected API response structure.");
            }
        } catch (error) {
            console.error("Gemini API call failed:", error);
            if (retryCount >= maxRetries - 1) {
                throw new Error(`API call failed after ${maxRetries} retries: ${error.message}`);
            }
            retryCount++;
        }
    }
};
