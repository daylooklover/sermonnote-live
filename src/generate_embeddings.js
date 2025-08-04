// functions/src/generate_embeddings.js

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs/promises');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config(); // functions/.env 파일에서 환경 변수 로드 (Node.js 실행 시 현재 작업 디렉토리 기준)

// API 키 설정 (보안에 유의)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.error("오류: GEMINI_API_KEY 환경 변수가 설정되지 않았습니다. functions/.env 파일을 확인해주세요.");
    process.exit(1); // 스크립트 종료
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const embeddingModelName = "embedding-001"; 

// [새로운 부분] 재시도 로직을 위한 헬퍼 함수
async function callApiWithRetry(apiCall, maxRetries = 5, initialDelay = 1000) {
    let retries = 0;
    while (retries < maxRetries) {
        try {
            return await apiCall();
        } catch (error) {
            retries++;
            console.error(`[오류] API 호출 실패 (재시도 ${retries}/${maxRetries}):`, error.message || error);
            if (error.response && error.response.status === 429) {
                console.warn("[경고] API 호출 제한 초과. 대기 시간을 늘립니다.");
                initialDelay *= 2; // Rate Limit 시 딜레이 더 크게 증가
            }
            if (retries < maxRetries) {
                const delay = initialDelay * Math.pow(2, retries - 1); // 지수 백오프
                console.log(`[재시도] ${delay / 1000}초 후 재시도...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                console.error("[오류] 최대 재시도 횟수 초과. API 호출 실패.");
                throw error; // 최대 재시도 후에도 실패하면 오류 throw
            }
        }
    }
}


// 1. kn_한글성경전체.json 파일 로드 및 파싱 함수
async function loadAndParseBibleData() {
    const bibleFilePath = path.join(__dirname, 'kn_한글성경전체.json'); 
    
    console.log(`[시작] 한글 성경 데이터 로드 및 파싱...`);
    console.log(`  └ 성경 파일 경로: ${bibleFilePath}`); 

    let fileContent;
    try {
        fileContent = await fs.readFile(bibleFilePath, 'utf8');
    } catch (e) {
        console.error(`[오류] 성경 파일을 찾을 수 없습니다: '${bibleFilePath}'`);
        console.error("  └ 파일 경로 또는 파일 이름/확장자를 다시 확인해 주세요. (ENOENT 오류)");
        process.exit(1); // 스크립트 종료
    }
    
    let rawBibleObject;
    try {
        rawBibleObject = JSON.parse(fileContent); // JSON 객체로 파싱
    } catch (e) {
        console.error("[오류] kn_한글성경전체.json 파일 파싱 실패. 파일 내용이 올바른 JSON 형식이 아닙니다:", e);
        process.exit(1); // 파싱 실패 시 스크립트 종료
    }
    
    const rawBibleArray = Object.values(rawBibleObject); 

    const parsedData = rawBibleArray.map(verseString => {
        const match = verseString.match(/^(.+?)(\d+):(\d+):\s(.+)$/); 
        if (match && match.length === 5) {
            return {
                book: match[1].trim(),
                chapter: parseInt(match[2]),
                verse: parseInt(match[3]),
                text: match[4].trim()
            };
        }
        console.warn(`[경고] 구절 파싱 실패 (정규표현식 불일치): "${verseString}"`);
        return {
            book: null, chapter: null, verse: null, text: verseString.trim()
        };
    }); 

    console.log(`[완료] 총 ${parsedData.length}개의 성경 구절 파싱 완료.`);
    return parsedData;
}

// 2. 임베딩 생성 및 저장 함수
async function createAndStoreEmbeddings() {
    console.log("[시작] 임베딩 생성 과정...");
    const parsedBibleData = await loadAndParseBibleData();
    

    if (parsedBibleData.length === 0) {
        console.warn("[경고] 파싱된 성경 구절이 없습니다. 임베딩을 생성하지 않고 종료합니다.");
        return [];
    }

    const embeddedVerses = [];
    const batchSize = 100; // 한 번에 처리할 구절 수 (Promise.all로 병렬 처리)
    
    for (let i = 0; i < parsedBibleData.length; i += batchSize) {
        const batch = parsedBibleData.slice(i, i + batchSize);
        console.log(`[진행] Batch ${Math.ceil((i + 1) / batchSize)} / ${Math.ceil(parsedBibleData.length / batchSize)} 처리 중... (구절 ${i+1} ~ ${Math.min(i + batchSize, parsedBibleData.length)})`);

        const embeddingPromises = batch.map(async (verse) => {
            // 빈 텍스트는 임베딩하지 않음
            if (!verse.text || verse.text.trim() === '') {
                console.warn(`[경고] 빈 텍스트 구절 건너뜀 (구절: ${verse.book || 'Unknown'} ${verse.chapter || 'Unknown'}:${verse.verse || 'Unknown'})`);
                return null;
            }

            try {
                // 재시도 로직을 적용하여 API 호출
                const modelInstance = genAI.getGenerativeModel({ model: embeddingModelName });
                const result = await callApiWithRetry(async () => {
                    return await modelInstance.embedContent({
                        content: { parts: [{ text: verse.text }] }
                    });
                });

                if (result && result.embedding && Array.isArray(result.embedding.values)) {
                    return {
                        ...verse,
                        embedding: result.embedding.values
                    };
                } else {
                    console.warn(`[경고] 단일 구절 임베딩 결과 형식 이상 (구절: ${verse.book || 'Unknown'} ${verse.chapter || 'Unknown'}:${verse.verse || 'Unknown'}):`, result);
                    return null;
                }
            } catch (singleEmbedError) {
                console.error(`[오류] 단일 구절 임베딩 최종 실패 (구절: ${verse.book || 'Unknown'} ${verse.chapter || 'Unknown'}:${verse.verse || 'Unknown'}):`, singleEmbedError.message || singleEmbedError);
                return null;
            }
        });

        const batchResults = await Promise.all(embeddingPromises);
        
        batchResults.forEach(result => {
            if (result !== null) {
                embeddedVerses.push(result);
            }
        });
            
        // 배치 처리 간 딜레이
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`[완료] 총 ${embeddedVerses.length}개의 구절 임베딩 완료.`);

    // 3. 임베딩된 데이터를 파일로 저장
    const outputFilePath = path.join(__dirname, 'embedded_bible_verses.json');
    try {
        await fs.writeFile(outputFilePath, JSON.stringify(embeddedVerses, null, 2), 'utf8');
        console.log(`[저장 완료] 임베딩된 데이터가 ${outputFilePath}에 성공적으로 저장되었습니다.`);
    } catch (fileError) {
        console.error("[오류] 임베딩된 데이터를 파일로 저장하는 데 실패했습니다:", fileError);
    }

    return embeddedVerses;
}

// 스크립트 직접 실행
createAndStoreEmbeddings().catch(error => {
    console.error("[스크립트 최종 오류]", error);
});

// Firebase Functions로 트리거할 경우 (예시 코드, 현재는 주석 처리)
// exports.generateBibleEmbeddings = functions.https.onCall(async (data, context) => {
//     try {
//         await uploadEmbeddingsToPinecone();
//         return { success: true, message: "Embeddings uploaded to Pinecone." };
//     } catch (error) {
//         console.error("Firebase Function error:", error);
//         throw new functions.https.HttpsError('internal', 'Failed to upload embeddings', error.message);
//     }
// });