// src/components/SermonAssistantMain.js
'use client';

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

// firebase.js에서 필요한 객체와 변수들을 가져옵니다.
import { auth, db, doSignOut, SUBSCRIPTION_LIMITS } from '@/lib/firebase';
import { t } from '@/lib/translations';
import ExpositorySermonComponent from './ExpositorySermonComponent';
import RealLifeSermonComponent from './RealLifeSermonComponent';
import QuickMemo from './QuickMemo';
import SermonDraft from './SermonDraft';

// 사이드바가 삭제되었으므로 lucide-react 아이콘 라이브러리 import도 필요 없습니다.

// 메인 컴포넌트
export default function SermonAssistantMain() {
    const [user, setUser] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [userSubscription, setUserSubscription] = useState('free');
    const [sermonCount, setSermonCount] = useState(0);
    const [commentaryCount, setCommentaryCount] = useState(0);
    const [activeTab, setActiveTab] = useState('realLife');
    const [sermonDraft, setSermonDraft] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [lang, setLang] = useState('ko');
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    useEffect(() => {
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
        const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setUserId(currentUser.uid);
            } else {
                try {
                    if (initialAuthToken) {
                        const credential = await signInWithCustomToken(auth, initialAuthToken);
                        setUser(credential.user);
                        setUserId(credential.user.uid);
                    } else {
                        const anonymousUser = await signInAnonymously(auth);
                        setUser(anonymousUser.user);
                        setUserId(anonymousUser.user.uid);
                    }
                } catch (error) {
                    console.error("인증 실패:", error);
                }
            }
            setIsAuthReady(true);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (isAuthReady && userId) {
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
            const userRef = doc(db, 'artifacts', appId, 'users', userId);
            
            const unsubscribe = onSnapshot(userRef, (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setUserSubscription(data.subscription || 'free');
                    setSermonCount(data.usage?.sermon || 0);
                    setCommentaryCount(data.usage?.commentary || 0);
                }
            }, (error) => {
                console.error("Firestore 리스너 오류:", error);
                setErrorMessage(`Error fetching user data: ${error.message}`);
            });
            return () => unsubscribe();
        }
    }, [isAuthReady, userId]);

    const handleSignOut = async () => {
        await doSignOut();
        setUserId(null);
        setUser(null);
        setSermonDraft('');
        setErrorMessage('');
    };

    const canGenerateSermon = userSubscription === 'premium' || sermonCount < SUBSCRIPTION_LIMITS[userSubscription]?.sermon;
    const canGenerateCommentary = userSubscription === 'premium' || commentaryCount < SUBSCRIPTION_LIMITS[userSubscription]?.commentary;

    const renderContent = () => {
        switch (activeTab) {
            case 'realLife':
                return <RealLifeSermonComponent userId={userId} setSermonDraft={setSermonDraft} canGenerateSermon={canGenerateSermon} sermonCount={sermonCount} lang={lang} t={t} />;
            case 'expository':
                return <ExpositorySermonComponent userId={userId} setSermonDraft={setSermonDraft} canGenerateSermon={canGenerateSermon} sermonCount={sermonCount} lang={lang} t={t} />;
            case 'memo':
                return <QuickMemo userId={userId} lang={lang} t={t} />;
            case 'draft':
                return <SermonDraft sermonDraft={sermonDraft} lang={lang} t={t} />;
            default:
                return null;
        }
    };

    if (!isAuthReady) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 font-inter text-gray-800">
                <div className="text-xl font-medium text-gray-500">Loading...</div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-gray-100 font-inter text-gray-800">
            {/* 메인 콘텐츠 영역 */}
            <div className="p-8">
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-extrabold text-gray-900 leading-tight mb-2">Sermon Assistant</h1>
                    <p className="text-gray-500">{t(lang, 'assistant_description')}</p>
                </div>

                {/* 탭 네비게이션 */}
                <div className="flex justify-center mb-6 space-x-4">
                    <button
                        onClick={() => setActiveTab('realLife')}
                        className={`p-3 rounded-lg font-medium transition duration-300 ease-in-out
                            ${activeTab === 'realLife'
                            ? 'bg-teal-600 text-white shadow-md'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        실생활 적용 설교
                    </button>
                    <button
                        onClick={() => setActiveTab('expository')}
                        className={`p-3 rounded-lg font-medium transition duration-300 ease-in-out
                            ${activeTab === 'expository'
                            ? 'bg-teal-600 text-white shadow-md'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        강해 설교
                    </button>
                    <button
                        onClick={() => setActiveTab('memo')}
                        className={`p-3 rounded-lg font-medium transition duration-300 ease-in-out
                            ${activeTab === 'memo'
                            ? 'bg-teal-600 text-white shadow-md'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        빠른 메모
                    </button>
                    <button
                        onClick={() => setActiveTab('draft')}
                        className={`p-3 rounded-lg font-medium transition duration-300 ease-in-out
                            ${activeTab === 'draft'
                            ? 'bg-teal-600 text-white shadow-md'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        설교 초안
                    </button>
                </div>
                
                {/* 탭 콘텐츠 렌더링 */}
                <div className="bg-white rounded-xl shadow-lg p-6 min-h-[600px] flex flex-col">
                    {renderContent()}
                </div>

                {errorMessage && (
                    <div className="mt-4 p-4 rounded-lg bg-red-100 text-red-700 font-medium">
                        {errorMessage}
                    </div>
                )}

                {/* 로그아웃 버튼을 하단 중앙에 배치 */}
                <div className="mt-8 flex justify-center">
                    <button
                        onClick={handleSignOut}
                        className="p-3 rounded-lg bg-gray-700 text-gray-200 hover:bg-red-500 hover:text-white transition duration-300 ease-in-out flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        로그아웃
                    </button>
                </div>

            </div>
        </div>
    );
};
