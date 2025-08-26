// pages/api/transcribe.js
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { audio } = req.body;
  
  // 수정: 올바른 Gemini API 키 환경 변수 이름을 사용합니다.
  const apiKey = process.env.GEMINI_API_KEY; 

  if (!apiKey) {
    return res.status(500).json({ message: 'Server configuration error: Gemini API key missing.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 수정: 멀티모달(오디오) 입력을 지원하는 올바른 모델 이름을 사용합니다.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 음성 데이터를 Base64 인코딩된 문자열에서 추출합니다.
    const base64Data = audio.split(',')[1];
    
    // 모델에 전달할 parts 배열을 생성합니다.
    const parts = [
      {
        text: "이 오디오 파일을 텍스트로 변환해줘. 출력은 변환된 텍스트만 포함해야 해.",
      },
      {
        inlineData: {
          mimeType: "audio/webm",
          data: base64Data,
        },
      },
    ];

    // 모델을 사용하여 콘텐츠를 생성합니다.
    const result = await model.generateContent({ contents: [{ parts }] });
    const response = result.response;
    const transcript = response.text();

    res.status(200).json({ transcript });
  } catch (error) {
    console.error("Transcription API Error:", error);
    // 오류가 발생해도 유효한 JSON을 반환하도록 수정합니다.
    res.status(500).json({ message: '음성 변환에 실패했습니다.', error: error.message });
  }
}