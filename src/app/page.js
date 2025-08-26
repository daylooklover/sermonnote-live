'use client';

import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, where, onSnapshot, doc, getDoc, setDoc } from 'firebase/firestore';

import SermonAssistantMain from '../components/SermonAssistantMain';
import LoginModal from '../components/LoginModal';
import LoadingSpinner from '../components/LoadingSpinner';
import QuickMemoModal from '../components/QuickMemoModal';
import { QuickMemoIcon } from '../components/IconComponents';
import { useSermonGeneration } from '../components/SermonAssistantMain';

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

const initializeFirebase = async () => {
    if (typeof window === 'undefined') return;

    let firebaseApp;
    if (!getApps().length) {
        firebaseApp = initializeApp(firebaseConfig);
    } else {
        firebaseApp = getApp();
    }
    
    const auth = getAuth(firebaseApp);
    const db = getFirestore(firebaseApp);

    await new Promise(resolve => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                if (initialAuthToken) {
                    await signInWithCustomToken(auth, initialAuthToken).catch(e => {
                        console.error("Firebase Custom Auth failed:", e);
                        signInAnonymously(auth);
                    });
                } else {
                    await signInAnonymously(auth).catch(e => console.error("Firebase Anonymous Auth failed:", e));
                }
            }
            unsubscribe();
            resolve();
        });
    });

    return { auth, db };
};

export default function Home() {
    const [auth, setAuth] = useState(null);
    const [db, setDb] = useState(null);
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
        const init = async () => {
            try {
                const { auth, db } = await initializeFirebase();
                setAuth(auth);
                setDb(db);
                onAuthStateChanged(auth, (currentUser) => {
                    setUser(currentUser);
                    setLoading(false);
                });
            } catch (error) {
                console.error("Firebase initialization failed:", error);
                setLoading(false);
            }
        };
        init();
    }, []);

    useEffect(() => {
        if (!db || !user) return;
        const userId = user.uid;
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

        const docRef = doc(db, 'users', user.uid);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setCommentaryCount(data.commentaryCount || 0);
                setSermonCount(data.sermonCount || 0);
            } else {
                setCommentaryCount(0);
                setSermonCount(0);
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
    
    const handleLogin = () => {
        if (!user) {
            openLoginModal();
        }
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