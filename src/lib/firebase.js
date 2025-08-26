// src/lib/firebase.js
// Firebase 앱을 초기화하고 필요한 객체들을 export하는 유일한 파일
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signOut } from "firebase/auth";
import { getFirestore, doc, updateDoc, collection, addDoc, serverTimestamp, query, where, getDocs, setDoc, arrayUnion } from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app;

// Firebase 앱이 이미 초기화되었는지 확인
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const db = getFirestore(app);

// signOut 함수를 내보냅니다.
export const doSignOut = () => signOut(auth);

export { app, auth, db };

export const SUBSCRIPTION_LIMITS = {
    free: { sermon: 5, commentary: 10 },
    premium: { sermon: Infinity, commentary: Infinity }
};

// 환경 변수에서 앱 ID를 직접 가져옵니다.
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

export const incrementUsageCount = async (type, userId, currentCount) => {
    // appId가 존재하지 않을 경우 오류 방지
    if (!appId || !userId) {
        console.error("Firebase App ID or User ID is not defined.");
        return;
    }
    const userRef = doc(db, 'artifacts', appId, 'users', userId);
    
    try {
        await updateDoc(userRef, {
            [`usage.${type}`]: (currentCount || 0) + 1,
            lastUsed: new Date(),
        });
    } catch (error) {
        if (error.code === 'not-found') {
            try {
                await setDoc(userRef, {
                    usage: {
                        [type]: 1,
                    },
                    lastUsed: new Date(),
                }, { merge: true });
            } catch (e) {
                console.error("Error creating usage document in Firestore:", e);
            }
        } else {
            console.error("Error updating usage count in Firestore:", error);
        }
    }
};

export const addQuickMemo = async (userId, content) => {
    if (!appId || !userId) {
        console.error("Firebase App ID or User ID is not defined.");
        return;
    }
    const memosRef = collection(db, 'artifacts', appId, 'users', userId, 'quickMemos');
    await addDoc(memosRef, {
        content: content,
        timestamp: serverTimestamp()
    });
};

export const checkDailyMemoLimit = async (userId) => {
    if (!appId || !userId) {
        console.error("Firebase App ID or User ID is not defined.");
        return 0;
    }
    const memosRef = collection(db, 'artifacts', appId, 'users', userId, 'quickMemos');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const q = query(memosRef, 
        where('timestamp', '>', today),
    );
    
    const snapshot = await getDocs(q);
    return snapshot.size;
};

export const getSermonHistory = async (userId) => {
    if (!appId || !userId) {
        console.error("Firebase App ID or User ID is not defined.");
        return [];
    }
    const sermonsCollectionRef = collection(db, 'artifacts', appId, 'users', userId, 'sermons');
    try {
        const q = query(sermonsCollectionRef);
        const querySnapshot = await getDocs(q);
        const sermonHistory = [];
        querySnapshot.forEach((doc) => {
            sermonHistory.push({
                id: doc.id,
                ...doc.data(),
            });
        });
        return sermonHistory;
    } catch (error) {
        console.error("과거 기록을 가져오는 데 실패했습니다:", error);
        return [];
    }
};

export const saveSermon = async (userId, sermonData) => {
    if (!appId || !userId) {
        console.error("Firebase App ID or User ID is not defined.");
        return;
    }
    const sermonsCollectionRef = collection(db, 'artifacts', appId, 'users', userId, 'sermons');
    try {
        await addDoc(sermonsCollectionRef, {
            ...sermonData,
            createdAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("설교문 저장에 실패했습니다:", error);
    }
};