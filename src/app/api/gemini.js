// src/lib/gemini.js
export const callGeminiAPI = async (prompt, generationConfig = {}) => {
  try {
    // 올바른 API 라우트 경로를 사용합니다.
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, generationConfig }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'API call failed');
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
};