import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, updateDoc, collection, query, where, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Firebase 앱 초기화
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);

// 구독 제한 설정
export const SUBSCRIPTION_LIMITS = {
    'free': { commentary: 5, sermon: 5 },
    'general': { commentary: 100, sermon: 100 },
    'premium': { commentary: Infinity, sermon: Infinity }
};

// 사용량 증가 함수
export const incrementUsageCount = async (type, userId, currentCount, setErrorMessage) => {
    if (!db || !userId) {
        setErrorMessage?.('사용자 인증 또는 데이터베이스 연결 실패');
        return false;
    }
    
    try {
        const userRef = doc(db, 'users', userId);
        const updateData = {
            [`${type}_count`]: currentCount + 1,
            last_updated: serverTimestamp()
        };
        await updateDoc(userRef, updateData);
        return true;
    } catch (error) {
        console.error("Usage count update failed:", error);
        setErrorMessage?.(`사용량 업데이트 실패: ${error.message}`);
        return false;
    }
};

// 퀵 메모 추가 함수
export const addQuickMemo = async (userId, content, lang = 'ko') => {
    if (!db || !userId) {
        throw new Error('사용자 인증 또는 데이터베이스 연결 실패');
    }
    
    try {
        const memosCollection = collection(db, 'quickMemos');
        const docRef = await addDoc(memosCollection, {
            userId: userId,
            content: content,
            language: lang,
            timestamp: serverTimestamp(),
            created_at: new Date(),
        });
        return docRef.id;
    } catch (error) {
        console.error('메모 저장 실패:', error);
        throw new Error('메모 저장에 실패했습니다.');
    }
};

// 일일 메모 제한 확인 함수
export const checkDailyMemoLimit = async (userId, limit = 5) => {
    if (!db || !userId) {
        throw new Error('사용자 인증 또는 데이터베이스 연결 실패');
    }
    
    try {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        
        const memosCollection = collection(db, 'quickMemos');
        const q = query(
            memosCollection,
            where('userId', '==', userId),
            where('timestamp', '>=', startOfToday)
        );

        const snapshot = await getDocs(q);
        return snapshot.size;
    } catch (error) {
        console.error('메모 개수 확인 실패:', error);
        return 0;
    }
};