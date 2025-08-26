'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, where, onSnapshot, doc, getDoc, setDoc } from 'firebase/firestore';

import SermonAssistantMain from '../../components/SermonAssistantMain';
import LoginModal from '../../components/LoginModal';
import LoadingSpinner from '../../components/LoadingSpinner';
import QuickMemoModal from '../../components/QuickMemoModal';
import { QuickMemoIcon } from '../../components/IconComponents';
import { useSermonGeneration } from '../../components/SermonAssistantMain';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let firebaseApp;
if (typeof window !== 'undefined') {
    if (!getApps().length) {
        firebaseApp = initializeApp(firebaseConfig);
    } else {
        firebaseApp = getApp();
    }
}

const auth = firebaseApp ? getAuth(firebaseApp) : null;
const db = firebaseApp ? getFirestore(firebaseApp) : null;

export default function Home() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [selectedSermonType, setSelectedSermonType] = useState('sermon-selection');
    const [memos, setMemos] = useState([]);
    const [isFetchingMemos, setIsFetchingMemos] = useState(false);
    const [lang, setLang] = useState('ko');
    const [quickMemoModalOpen, setQuickMemoModalOpen] = useState(false);
    const [sermonInput, setSermonInput] = useState('');
    const [sermonDraft, setSermonDraft] = useState('');
    const [commentaryCount, setCommentaryCount] = useState(0);
    const [sermonCount, setSermonCount] = useState(0);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!auth) return;
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [auth]);

    useEffect(() => {
        if (!db || !user) return;
        const userId = user.uid;
        const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
        if (!appId) {
             console.error("Firebase App ID is not defined.");
             return;
        }

        setIsFetchingMemos(true);
        const q = query(collection(db, `artifacts/${appId}/users/${userId}/memos`));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const memos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMemos(memos);
            setIsFetchingMemos(false);
        }, (error) => {
            console.error("Error fetching memos: ", error);
            setIsFetchingMemos(false);
        });

        return () => unsubscribe();
    }, [db, user]);

    useEffect(() => {
        if (!db || !user) return;
        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setCommentaryCount(data.commentaryCount || 0);
                setSermonCount(data.sermonCount || 0);
            } else {
                setCommentaryCount(0);
                setSermonCount(0);
                // 새로운 사용자인 경우 문서 생성
                setDoc(userDocRef, {
                    subscription: 'free',
                    commentaryCount: 0,
                    sermonCount: 0
                });
            }
        }, (error) => {
            console.error("Error fetching usage data: ", error);
        });

        return () => unsubscribe();
    }, [db, user]);

    if (loading) {
        return <LoadingSpinner />;
    }

    const openLoginModal = () => setIsLoginModalOpen(true);
    const closeLoginModal = () => setIsLoginModalOpen(false);
    const toggleFullscreen = (content) => {
        // 토글 풀스크린 로직은 SermonAssistantMain에서 처리되므로, 빈 함수로 전달합니다.
        console.log('toggleFullscreen called with:', content);
    };
    
    const handleAddMemo = () => {
        setSelectedSermonType('quick-memo-sermon');
    };

    return (
        <div className="flex bg-gray-100 text-gray-800 font-sans min-h-screen">
            <div className="flex-1 flex flex-col items-center p-4">
                <SermonAssistantMain
                    selectedSermonType={selectedSermonType}
                    setSelectedSermonType={setSelectedSermonType}
                    user={user}
                    memos={memos}
                    isFetchingMemos={isFetchingMemos}
                    openLoginModal={openLoginModal}
                    lang={lang}
                    setLang={setLang}
                    db={db}
                    sermonInput={sermonInput}
                    setSermonInput={setSermonInput}
                    sermonDraft={sermonDraft}
                    setSermonDraft={setSermonDraft}
                    commentaryCount={commentaryCount}
                    sermonCount={sermonCount}
                    errorMessage={errorMessage}
                    setErrorMessage={setErrorMessage}
                    // toggleFullscreen prop을 전달합니다.
                    toggleFullscreen={toggleFullscreen}
                />
            </div>
            {isLoginModalOpen && <LoginModal onClose={closeLoginModal} />}

            <button
                onClick={() => setQuickMemoModalOpen(true)}
                className="fixed bottom-8 right-8 p-5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full shadow-2xl transition z-40 transform hover:scale-110"
            >
                <QuickMemoIcon className="w-6 h-6" />
            </button>

            <QuickMemoModal
                isOpen={quickMemoModalOpen}
                onClose={() => setQuickMemoModalOpen(false)}
                onAddMemo={handleAddMemo}
                memoLimit={5}
                lang={lang}
                openLoginModal={openLoginModal}
                user={user}
                onMemoAdded={() => setSelectedSermonType('quick-memo-sermon')}
            />
        </div>
    );
}