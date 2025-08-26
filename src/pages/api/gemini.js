// src/pages/api/gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { prompt, generationConfig } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("Server configuration error: Gemini API key is missing.");
    return res.status(500).json({ message: 'Server configuration error: Gemini API key missing.' });
  }
  
  if (!prompt) {
    return res.status(400).json({ message: 'Bad Request: "prompt" is required in the request body.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
    });

    const response = result.response;
    const text = response.text();

    res.status(200).json({ text });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ message: 'Failed to generate content.', error: error.message });
  }
}