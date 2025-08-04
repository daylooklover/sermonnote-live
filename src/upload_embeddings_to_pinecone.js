// functions/src/upload_embeddings_to_pinecone.js

const { Pinecone } = require('@pinecone-database/pinecone');
const fs = require('fs/promises');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config(); // functions/.env 파일에서 환경 변수 로드

// Pinecone 설정 정보 (이제 PINECONE_ENVIRONMENT, PINECONE_INDEX_HOST는 클라이언트 초기화에 직접 사용되지 않습니다)
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME; // 인덱스 이름은 계속 사용됩니다.

// 필수 환경 변수 확인
if (!PINECONE_API_KEY || !PINECONE_INDEX_NAME) {
    console.error("오류: 필수 Pinecone 환경 변수(PINECONE_API_KEY, PINECONE_INDEX_NAME)가 설정되지 않았습니다. .env 파일을 확인해주세요.");
    process.exit(1);
}

async function uploadEmbeddingsToPinecone() {
    console.log("[시작] Pinecone 데이터 업로드 과정...");

    // 1. embedded_bible_verses.json 파일 로드
    const embeddedFilePath = path.join(__dirname, 'embedded_bible_verses.json');
    let embeddedData;
    try {
        const fileContent = await fs.readFile(embeddedFilePath, 'utf8');
        embeddedData = JSON.parse(fileContent);
        console.log(`  └ ${embeddedData.length}개의 임베딩된 구절 데이터 로드 완료.`);
    } catch (e) {
        console.error(`[오류] 'embedded_bible_verses.json' 파일을 로드하거나 파싱할 수 없습니다: ${e.message}`);
        process.exit(1);
    }

    if (embeddedData.length === 0) {
        console.warn("[경고] 로드된 임베딩 데이터가 없습니다. Pinecone에 업로드하지 않고 종료합니다.");
        return;
    }

    // 2. Pinecone 클라이언트 초기화 (v6.x SDK: 이제 apiKey만 필요합니다!)
    const pineconeConfig = {
        apiKey: PINECONE_API_KEY,
        // environment: 이제 필요 없습니다.
        // controllerHostUrl: 이제 필요 없습니다.
    };
    console.log("[디버그] Pinecone 클라이언트 초기화 설정:", pineconeConfig); 
    
    let pc;
    try {
        pc = new Pinecone(pineconeConfig);
        console.log("[성공] Pinecone 클라이언트 초기화 성공!");
    } catch (error) {
        console.error("[오류] Pinecone 클라이언트 초기화 실패:", error);
        process.exit(1); // 초기화 실패 시 스크립트 종료
    }


    // 3. 인덱스 참조
    const index = pc.Index(PINECONE_INDEX_NAME);
    console.log(`  └ 인덱스 '${PINECONE_INDEX_NAME}' 참조 완료.`);

    // 4. 데이터 업로드
    const batchSize = 100; // 한 번에 업로드할 구절 수
    let uploadedCount = 0;

    for (let i = 0; i < embeddedData.length; i += batchSize) {
        const batch = embeddedData.slice(i, i + batchSize);
        
        const vectorsToUpsert = batch.map((item, indexInBatch) => {
            if (!item.embedding || !Array.isArray(item.embedding) || item.embedding.length !== 768) {
                console.warn(`[경고] 구절 ${item.book || 'Unknown'} ${item.chapter || 'Unknown'}:${item.verse || 'Unknown'} - 임베딩 데이터가 없거나 차원(768)이 일치하지 않습니다. 건너뜁니다.`);
                return null;
            }
            return {
                id: `${item.book || 'Unknown'}-${item.chapter || 'Unknown'}-${item.verse || 'Unknown'}-${i + indexInBatch}`,
                values: item.embedding,
                metadata: {
                    book: item.book || 'Unknown',
                    chapter: item.chapter || 'Unknown',
                    verse: item.verse || 'Unknown',
                    text: item.text.substring(0, 500) + (item.text.length > 500 ? '...' : ''),
                },
            };
        }).filter(Boolean);

        if (vectorsToUpsert.length === 0) {
            console.log(`[진행] Batch ${Math.ceil((i + 1) / batchSize)} / ${Math.ceil(embeddedData.length / batchSize)} - 업로드할 유효한 데이터 없음.`);
            continue;
        }

        console.log(`[진행] Batch ${Math.ceil((i + 1) / batchSize)} / ${Math.ceil(embeddedData.length / batchSize)} 처리 중... (${i + 1} ~ ${Math.min(i + vectorsToUpsert.length, embeddedData.length)} 구절 업로드 시도)`);

        try {
            await index.upsert(vectorsToUpsert);
            uploadedCount += vectorsToUpsert.length;
            console.log(`  └ ${vectorsToUpsert.length}개 구절 업로드 성공. 현재 총 ${uploadedCount}개 업로드 완료.`);

            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error(`[오류] Batch ${Math.ceil((i + 1) / batchSize)} 업로드 중 오류 발생:`, error);
            if (error.status && error.status === 429) { 
                console.error("[오류] Pinecone API 호출 제한 초과 (Rate Limit Exceeded). 잠시 후 재시도합니다...");
                await new Promise(resolve => setTimeout(resolve, 5000));
                i -= batchSize; 
            } else {
                console.error("[오류] 알 수 없는 Pinecone 업로드 오류. 다음 배치로 넘어갑니다.", error); // 전체 오류 객체 로그
                // continue; // 오류가 발생해도 계속 진행하려면 주석 해제
            }
        }
    }

    console.log(`[완료] 총 ${uploadedCount}개의 구절이 Pinecone 인덱스 '${PINECONE_INDEX_NAME}'에 성공적으로 업로드되었습니다.`);
}

// 스크립트 직접 실행
uploadEmbeddingsToPinecone().catch(error => {
    console.error("[스크립트 최종 오류]", error);
});

// Firebase Functions로 트리거할 경우 (예시 코드)
// exports.uploadBibleEmbeddings = functions.https.onCall(async (data, context) => {
//     try {
//         await uploadEmbeddingsToPinecone();
//         return { success: true, message: "Embeddings uploaded to Pinecone." };
//     } catch (error) {
//         console.error("Firebase Function error:", error);
//         throw new functions.https.HttpsError('internal', 'Failed to upload embeddings', error.message);
//     }
// });