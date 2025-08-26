import { GoogleGenerativeAI } from "@google/generative-ai";

// YOUR_API_KEY 부분에 실제 Gemini API 키를 입력하세요.
const API_KEY = "AIzaSyCpnQe0avt9Rzt69xScI43MyyXxslt6Ff8";

async function run() {
  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const result = await model.generateContent("Hello, world!");
    const response = await result.response;
    const text = response.text();
    
    console.log("API 호출 성공:", text);
    console.log("키가 유효합니다.");
  } catch (error) {
    console.error("API 호출 실패:", error);
    console.log("키가 유효하지 않거나 문제가 있습니다.");
  }
}

run();
