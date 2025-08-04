// 필요한 모듈들을 불러옵니다.
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const {GoogleGenerativeAI} = require("@google/generative-ai");
const {Pinecone} = require("@pinecone-database/pinecone");
const crypto = require('crypto');

// Firebase Admin SDK 초기화
admin.initializeApp();

// Firestore 데이터베이스 인스턴스 가져오기
const db = admin.firestore();

// 환경 변수 설정 확인 및 가져오기 (functions.config() 사용)
const GEMINI_API_KEY = functions.config().gemini?.api_key;
const PINECONE_API_KEY = functions.config().pinecone?.api_key;
const PINECONE_INDEX_NAME = functions.config().pinecone?.index_name;
const PINECONE_ENVIRONMENT = functions.config().pinecone?.environment;
const PADDLE_WEBHOOK_SECRET = functions.config().paddle?.webhook_secret;

// --- 디버깅용 코드 시작 ---
console.log("DEBUG ENV VARS:");
console.log("GEMINI_API_KEY:", GEMINI_API_KEY ? "Loaded" : "Undefined/Missing");
console.log("PINECONE_API_KEY:", PINECONE_API_KEY ? "Loaded" : "Undefined/Missing");
console.log("PINECONE_INDEX_NAME:", PINECONE_INDEX_NAME ? "Loaded" : "Undefined/Missing");
console.log("PINECONE_ENVIRONMENT:", PINECONE_ENVIRONMENT ? "Loaded" : "Undefined/Missing");
console.log("PADDLE_WEBHOOK_SECRET:", PADDLE_WEBHOOK_SECRET ? "Loaded" : "Undefined/Missing");
console.log("--- END DEBUG ---");
// --- 디버깅용 코드 끝 ---


// 필수 환경 변수가 누락되었을 경우 초기화 오류를 방지하기 위해 경고만 기록
if (!GEMINI_API_KEY || !PINECONE_API_KEY || !PINECONE_INDEX_NAME || !PINECONE_ENVIRONMENT || !PADDLE_WEBHOOK_SECRET) {
    functions.logger.error("오류: 필수 환경 변수가 설정되지 않았습니다. 함수 실행 중 문제가 발생할 수 있습니다.");
}

// Gemini AI 클라이언트 초기화 (API 키가 없으면 초기화하지 않음)
let genAI;
let textModel;
let embeddingModel;
if (GEMINI_API_KEY) {
    try {
        genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        textModel = genAI.getGenerativeModel({model: "gemini-2.0-pro"});
        embeddingModel = genAI.getGenerativeModel({model: "embedding-001"});
    } catch (error) {
        functions.logger.error("오류: Gemini AI 클라이언트 초기화 실패:", error);
    }
}


// Pinecone 클라이언트 초기화 (API 키와 환경 변수가 없으면 초기화하지 않음)
let pineconeClient;
if (PINECONE_API_KEY && PINECONE_ENVIRONMENT) {
    try {
        pineconeClient = new Pinecone({
            apiKey: PINECONE_API_KEY,
            environment: PINECONE_ENVIRONMENT,
        });
        functions.logger.info("Pinecone 클라이언트 초기화 성공.");
    } catch (error) {
        functions.logger.error("오류: Pinecone 클라이언트 초기화 실패:", error);
    }
}


// 우리 서비스의 내부 planId를 Paddle Price ID에 매핑 (권장)
const paddlePriceIdToInternalPlanId = {
    // Paddle 대시보드에서 확인한 실제 Price ID를 여기에 입력하세요.
    // 예시: 'pri_01klehvp7rqm0i7q5i7h261mhmd': 'monthly_pro_plan',
};

/**
 * 사용자의 질문을 받아 Pinecone에서 관련 성경 구절을 검색하고,
 * Gemini AI를 통해 답변을 생성하여 반환하는 Firebase HTTP Callable Function.
 *
 * @param {object} data - 클라이언트로부터 전송된 데이터.
 * @param {string} data.query - 사용자의 질문 텍스트.
 * @returns {Promise<object>} - AI가 생성한 답변 또는 오류 메시지.
 */
exports.generateSermonAid = functions.https.onCall(async (data, context) => {
    functions.logger.info("generateSermonAid 함수 호출됨.");

    const userQuery = data.query;

    // 초기화가 실패했는지 다시 확인
    if (!genAI || !pineconeClient) {
        functions.logger.error("오류: AI 또는 벡터 데이터베이스 클라이언트가 초기화되지 않았습니다. 필수 환경 변수를 확인해주세요.");
        throw new functions.https.HttpsError(
            "internal",
            "서버 설정 오류: AI 또는 벡터 데이터베이스에 연결할 수 없습니다.",
        );
    }
    
    if (!userQuery || typeof userQuery !== "string" || userQuery.trim() === "") {
        functions.logger.warn("유효하지 않은 질문입니다. 수신된 쿼리:", userQuery);
        throw new functions.https.HttpsError(
            "invalid-argument",
            "질문 텍스트가 필요합니다.",
        );
    }
    functions.logger.info("수신된 질문:", userQuery);

    let relevantBibleVerses = [];
    try {
        functions.logger.info("사용자 질문 임베딩 중...");
        const queryEmbeddingResult = await embeddingModel.embedContent({
            content: {parts: [{text: userQuery}]},
            model: embeddingModel.modelName,
        });
        const queryEmbedding = queryEmbeddingResult.embedding.values;
        functions.logger.info("질문 임베딩 완료.");

        functions.logger.info("Pinecone에서 관련 성경 구절 검색 중...");
        const index = pineconeClient.Index(PINECONE_INDEX_NAME);
        const topK = 5;

        const queryResult = await index.query({
            vector: queryEmbedding,
            topK: topK,
            includeMetadata: true,
        });
        functions.logger.info(`Pinecone 검색 완료. ${queryResult.matches.length}개 결과 반환됨.`);

        relevantBibleVerses = queryResult.matches.map((match) => {
            const book = match.metadata.book || "알 수 없음";
            const chapter = match.metadata.chapter || "알 수 없음";
            const verse = match.metadata.verse || "알 수 없음";
            const text = match.metadata.text || "내용 없음";
            return `${book} ${chapter}:${verse}: ${text}`;
        });
    } catch (error) {
        functions.logger.error("Pinecone 검색 또는 임베딩 과정 중 오류 발생:", error);
        throw new functions.https.HttpsError(
            "internal",
            "성경 구절 검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        );
    }

    functions.logger.info("Gemini AI를 통해 답변 생성 중...");
    const prompt = `
당신은 기독교 설교 준비를 돕는 AI 비서입니다.
제공된 [참조 성경 구절]을 바탕으로, [사용자 질문]에 대해 깊이 있고 성경적인 관점에서 설교 아이디어나 주석을 한국어로 생성해 주세요.
설교 아이디어는 구체적이고 실용적인 내용으로 구성해 주십시오.

[참조 성경 구절]
${relevantBibleVerses.join("\n\n")}

[사용자 질문]
${userQuery}

[답변]
`;

    let aiResponseText = "답변 생성에 실패했습니다.";
    try {
        const result = await textModel.generateContent(prompt);
        aiResponseText = result.response.text;
        functions.logger.info("Gemini AI 답변 생성 완료.");
    } catch (error) {
        functions.logger.error("Gemini AI 답변 생성 중 오류 발생:", error);
        throw new functions.https.HttpsError(
            "internal",
            "AI 답변 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        );
    }

    return {
        response: aiResponseText,
    };
});

exports.initializeUserSubscription = functions.https.onCall(async (data, context) => {
    functions.logger.info("initializeUserSubscription 함수 호출됨.");
    
    if (!context.auth) {
        functions.logger.warn("인증되지 않은 사용자 호출.");
        throw new functions.https.HttpsError(
            "unauthenticated",
            "인증된 사용자만 접근할 수 있습니다.",
        );
    }
    
    const userId = context.auth.uid;
    const userRef = db.collection("users").doc(userId);
    
    functions.logger.info(`사용자 ID: ${userId} 구독 정보 초기화/업데이트 시도.`);
    
    try {
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
            const initialSubscriptionData = {
                userId: userId,
                email: context.auth.token.email || null,
                subscriptionTier: "free",
                aiUsage: {
                    freeTrialCount: 4,
                    standardMonthlyCount: 0,
                    premiumMonthlyCount: 0,
                    lastResetDate: admin.firestore.FieldValue.serverTimestamp(),
                },
                isActive: true,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            await userRef.set(initialSubscriptionData);
            functions.logger.info(`새로운 사용자 ${userId} 구독 정보 초기화 완료.`);
            return {status: "success", message: "구독 정보가 초기화되었습니다.", subscription: initialSubscriptionData};
        } else {
            await userRef.update({
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            functions.logger.info(`기존 사용자 ${userId} 구독 정보 업데이트 완료.`);
            return {status: "success", message: "구독 정보가 업데이트되었습니다.", subscription: userDoc.data()};
        }
    } catch (error) {
        functions.logger.error(`사용자 ${userId} 구독 정보 초기화/업데이트 중 오류 발생:`, error);
        throw new functions.https.HttpsError(
            "internal",
            "사용자 구독 정보 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        );
    }
});

exports.paddleWebhook = functions.https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }
    
    const signature = req.headers['paddle-signature'];
    
    if (!signature) {
        functions.logger.error('🚫 Paddle Webhook: No signature header found.');
        return res.status(401).send('No signature header.');
    }

    try {
        // PADDLE_WEBHOOK_SECRET이 정의되지 않았을 경우 오류 처리
        if (!PADDLE_WEBHOOK_SECRET) {
            functions.logger.error('⚠️ Paddle Webhook secret is not configured.');
            return res.status(500).send('Webhook secret is not configured.');
        }

        const hmac = crypto.createHmac('sha256', PADDLE_WEBHOOK_SECRET);
        hmac.update(req.rawBody);
        const digest = hmac.digest('hex');

        if (digest !== signature) {
            functions.logger.error('🚫 Paddle Webhook: Signature verification failed. Calculated:', digest, 'Received:', signature);
            return res.status(401).send('Signature mismatch.');
        }
    } catch (err) {
        functions.logger.error('⚠️ Paddle Webhook signature verification error:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const event = req.body;
    functions.logger.info('✅ Paddle Webhook received:', event.event_type);

    try {
        switch (event.event_type) {
            case 'subscription.created':
            case 'subscription.updated':
                const subscriptionData = event.data;
                const paddleCustomerId = subscriptionData.customer_id;

                const usersRef = db.collection('users');
                const userQuery = await usersRef.where('paddleCustomerId', '==', paddleCustomerId).limit(1).get();

                let userId = null;
                if (!userQuery.empty) {
                    userId = userQuery.docs[0].id;
                } else {
                    functions.logger.warn(`User not found for Paddle Customer ID: ${paddleCustomerId}. This might be a new customer or an issue.`);
                    return res.status(200).send('User not linked yet. Webhook received.');
                }

                if (userId) {
                    const subscriptionDocRef = db.collection('subscriptions').doc(subscriptionData.id);
                    const subscriptionFields = {
                        paddleSubscriptionId: subscriptionData.id,
                        paddleCustomerId: paddleCustomerId,
                        userId: userId,
                        planId: paddlePriceIdToInternalPlanId[subscriptionData.items[0].price.id] || subscriptionData.items[0].price.id,
                        status: subscriptionData.status,
                        nextBillDate: subscriptionData.next_billed_at ? new Date(subscriptionData.next_billed_at) : null,
                        lastPaymentDate: subscriptionData.last_billed_at ? new Date(subscriptionData.last_billed_at) : null,
                        endDate: subscriptionData.ends_at ? new Date(subscriptionData.ends_at) : null,
                        trialEndDate: subscriptionData.trial_ends_at ? new Date(subscriptionData.trial_ends_at) : null,
                        pausedAt: subscriptionData.paused_at ? new Date(subscriptionData.paused_at) : null,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        createdAt: subscriptionData.created_at ? new Date(subscriptionData.created_at) : admin.firestore.FieldValue.serverTimestamp(),
                    };

                    await subscriptionDocRef.set(subscriptionFields, { merge: true });
                    functions.logger.info(`Subscription ${subscriptionData.id} updated/created in Firestore.`);

                    await db.collection('users').doc(userId).update({
                        isPremiumUser: subscriptionData.status === 'active' || subscriptionData.status === 'trialing',
                        activeSubscriptionId: subscriptionData.id
                    });
                    functions.logger.info(`User ${userId} premium status updated.`);
                }
                break;

            case 'subscription.canceled':
                const canceledSubscription = event.data;
                const canceledSubscriptionDocRef = db.collection('subscriptions').doc(canceledSubscription.id);

                await canceledSubscriptionDocRef.update({
                    status: canceledSubscription.status,
                    endDate: canceledSubscription.ends_at ? new Date(canceledSubscription.ends_at) : admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                functions.logger.info(`Subscription ${canceledSubscription.id} marked as canceled in Firestore.`);

                const canceledCustomerId = canceledSubscription.customer_id;
                const canceledUserQuery = await db.collection('users').where('paddleCustomerId', '==', canceledCustomerId).limit(1).get();

                if (!canceledUserQuery.empty) {
                    const canceledUserId = canceledUserQuery.docs[0].id;
                    await db.collection('users').doc(canceledUserId).update({
                        isPremiumUser: false,
                        activeSubscriptionId: null
                    });
                    functions.logger.info(`User ${canceledUserId} premium status set to false.`);
                }
                break;

            case 'transaction.completed':
                const transaction = event.data;
                const transactionSubscriptionId = transaction.subscription_id;
                if (transactionSubscriptionId) {
                    const subscriptionDocRef = db.collection('subscriptions').doc(transactionSubscriptionId);
                    await subscriptionDocRef.update({
                        lastPaymentDate: transaction.billed_at ? new Date(transaction.billed_at) : admin.firestore.FieldValue.serverTimestamp(),
                        status: 'active',
                        nextBillDate: transaction.details && transaction.details.line_items && transaction.details.line_items[0] && transaction.details.line_items[0].next_billed_at ? new Date(transaction.details.line_items[0].next_billed_at) : null,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                    functions.logger.info(`Transaction completed for subscription ${transactionSubscriptionId}. Status set to active.`);
                }
                break;

            case 'transaction.failed':
                const failedTransaction = event.data;
                const failedSubscriptionId = failedTransaction.subscription_id;
                if (failedSubscriptionId) {
                    const subscriptionDocRef = db.collection('subscriptions').doc(failedSubscriptionId);
                    await subscriptionDocRef.update({
                        status: 'past_due',
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                    functions.logger.info(`Transaction failed for subscription ${failedSubscriptionId}. Status set to past_due.`);
                }
                break;

            default:
                functions.logger.log(`Unhandled Paddle event type: ${event.event_type}`);
        }
        res.status(200).send('Webhook Received');
    } catch (error) {
        functions.logger.error('Paddle Webhook handler error:', error);
        res.status(500).send('Webhook handler failed');
    }
});
