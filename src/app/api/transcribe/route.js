// app/api/transcribe/route.js
import { SpeechClient } from '@google-cloud/speech';

export async function POST(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ message: 'Method Not Allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const body = await req.json();
        const { audio } = body;

        if (!audio) {
            return new Response(JSON.stringify({ message: 'Audio data is missing.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // GOOGLE_APPLICATION_CREDENTIALS 환경 변수를 사용하여 자동 인증
        const client = new SpeechClient();

        const request = {
            audio: {
                content: audio, // Base64 인코딩된 오디오 데이터
            },
            config: {
                encoding: 'WEBM_OPUS', // 오디오 형식
                sampleRateHertz: 48000, // 샘플링 속도
                languageCode: 'ko-KR', // 언어 코드
            },
        };

        const [response] = await client.recognize(request);
        const transcript = response.results
            .map(result => result.alternatives[0].transcript)
            .join('\n');

        return new Response(JSON.stringify({ transcript }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Transcription API Error:', error);
        
        // 오류 객체의 상세 정보를 출력하여 정확한 원인을 파악합니다.
        console.error('Full Error Object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        
        return new Response(JSON.stringify({ message: 'Transcription failed.', error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
