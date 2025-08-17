'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { onAuthStateChanged, signInAnonymously, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import SermonAssistantComponent from '@/components/SermonAssistantComponent';
import { auth, db, SUBSCRIPTION_LIMITS } from '@/lib/firebase';
import { onSnapshot, doc, setDoc } from 'firebase/firestore';

// 아이콘 컴포넌트들
const PlusCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus-circle"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
);
const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-book-text"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M8 7h6"/><path d="M8 11h8"/></svg>
);
const RealLifeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const QuickMemoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clipboard-list"><rect width="8" height="4" x="8" y="2"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>
);
const SecureIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lock"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);
const ShareIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-share"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
);
const RefreshCwIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-refresh-cw"><path d="M21 12a9 9 0 0 0-9-9c-3.34-1.22-5.46-3.84-6-6"/><polyline points="12 2 12 12 19 19"/><path d="M19 12a9 9 0 0 1-9 9c-3.34 1.22-5.46 3.84-6-6"/></svg>
);

// Gemini API 호출 함수 (src/lib/gemini.js에서 import 해야 함)
const callGeminiAPI = async (prompt) => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
    const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
    const payload = { contents: chatHistory };
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
    let retryCount = 0;
    const maxRetries = 3;
    const initialDelay = 1000;

    while (retryCount < maxRetries) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                if (response.status === 429) {
                    const delay = initialDelay * Math.pow(2, retryCount);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    retryCount++;
                    continue;
                }
                throw new Error(`API call failed with status: ${response.status}`);
            }
            const result = await response.json();
            if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
                return result.candidates[0].content.parts[0].text;
            } else {
                throw new Error("Unexpected API response structure.");
            }
        } catch (error) {
            console.error("Gemini API call failed:", error);
            if (retryCount >= maxRetries - 1) {
                throw new Error(`API call failed after ${maxRetries} retries: ${error.message}`);
            }
            retryCount++;
        }
    }
};

// 로그인/회원가입 모달 컴포넌트
const LoginModal = ({ isOpen, onClose, onLoginSuccess, errorMessage, setErrorMessage }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);

    const handleAuth = async () => {
        setErrorMessage('');
        try {
            if (isSignUp) {
                await createUserWithEmailAndPassword(auth, email, password);
                alert("회원가입에 성공했습니다! 자동으로 로그인됩니다.");
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            onLoginSuccess();
            onClose();
        } catch (error) {
            setErrorMessage(`인증 실패: ${error.message}`);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75">
            <div className="bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4 text-white">{isSignUp ? '회원가입' : '로그인'}</h2>
                {errorMessage && <div className="bg-red-900 text-red-300 p-3 rounded-md mb-4">{errorMessage}</div>}
                <input
                    type="email"
                    placeholder="이메일"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 mb-4 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                    type="password"
                    placeholder="비밀번호"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 mb-6 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex justify-between items-center">
                    <button onClick={() => setIsSignUp(!isSignUp)} className="text-blue-400 hover:underline">
                        {isSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
                    </button>
                    <div className="flex space-x-4">
                        <button onClick={onClose} className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-full transition duration-300">
                            취소
                        </button>
                        <button onClick={handleAuth} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full transition duration-300">
                            {isSignUp ? '회원가입' : '로그인'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 랜덤 성경 구절 컴포넌트
const RandomScriptureDisplay = () => {
    const [scripture, setScripture] = useState("오늘의 성경 구절을 받아보세요.");
    const [isLoading, setIsLoading] = useState(false);

    const fetchRandomScripture = useCallback(async () => {
        setIsLoading(true);
        try {
            const prompt = `Provide a random, single, well-known scripture verse in Korean, along with its reference. Format as "구절 (참조)". Example: "너희는 세상의 빛이라 (마태복음 5:14)".`;
            const text = await callGeminiAPI(prompt);
            setScripture(text);
        } catch (error) {
            console.error("Failed to fetch random scripture:", error);
            setScripture("성경 구절을 가져오는 데 실패했습니다. 다시 시도해 주세요.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRandomScripture();
    }, [fetchRandomScripture]);

    return (
        <div className="bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-700 mt-8">
            <h3 className="text-xl font-bold mb-4 text-white flex items-center justify-center space-x-2">
                <span>오늘의 성경 구절</span>
                <button onClick={fetchRandomScripture} disabled={isLoading} className="text-blue-400 hover:text-blue-500 transition disabled:opacity-50">
                    <RefreshCwIcon />
                </button>
            </h3>
            <p className="text-gray-300 italic text-center text-lg">{isLoading ? "구절을 가져오는 중..." : scripture}</p>
        </div>
    );
};

// LandingPage 컴포넌트 (제공해주신 코드를 기반으로 재구성)
const LandingPage = ({ onGetStarted, user, signOut, openLoginModal }) => (
    <div className="bg-gray-900 min-h-screen text-white font-sans">
        <header className="py-4 px-6 flex justify-between items-center bg-gray-900 shadow-md border-b border-gray-700">
            <h1 className="text-2xl font-bold text-white">SermonNote</h1>
            <div className="flex space-x-4">
                {user ? (
                    <>
                        <button onClick={onGetStarted} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-full transition duration-300 shadow-lg">
                            Start Creating
                        </button>
                        <button onClick={signOut} className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-full transition duration-300 shadow-lg">
                            Logout
                        </button>
                    </>
                ) : (
                    <button onClick={openLoginModal} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-full transition duration-300 shadow-lg">
                        Sign Up / Login
                    </button>
                )}
            </div>
        </header>

        <main className="container mx-auto py-16 px-4">
            <section className="text-center mb-16">
                <h2 className="text-5xl md:text-6xl font-extrabold text-white leading-tight">SermonNote</h2>
                <p className="text-lg md:text-xl text-gray-400 mt-4 max-w-2xl mx-auto">
                    Deepen Your Faith, Organize Your Insights.
                </p>
                <div className="mt-8">
                    {user ? (
                        <button onClick={onGetStarted} className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xl font-semibold transition duration-300 shadow-lg transform hover:scale-105">
                            Start Creating Sermons
                        </button>
                    ) : (
                        <button onClick={openLoginModal} className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xl font-semibold transition duration-300 shadow-lg transform hover:scale-105">
                            Sign Up / Login
                        </button>
                    )}
                </div>
            </section>

            <section className="text-center mb-16">
                <h3 className="text-3xl font-bold text-blue-400 mb-8">Our Unique Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-lg">
                        <div className="flex justify-center mb-4 text-blue-400"><PlusCircleIcon className="h-12 w-12" /></div>
                        <h4 className="text-2xl font-semibold mb-2 text-white">AI-Powered Insights</h4>
                        <p className="text-gray-400">Generate commentary, insights, and drafts from any scripture or topic.</p>
                    </div>
                    <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-lg">
                        <div className="flex justify-center mb-4 text-gray-400"><SearchIcon className="h-12 w-12" /></div>
                        <h4 className="text-2xl font-semibold mb-2 text-white">Expository Sermon Creation</h4>
                        <p className="text-gray-400">Dive deep into biblical truth with a structured tool for creating expository sermons.</p>
                    </div>
                    <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-lg">
                        <div className="flex justify-center mb-4 text-gray-400"><RealLifeIcon className="h-12 w-12" /></div>
                        <h4 className="text-2xl font-semibold mb-2 text-white">Real-Life Application</h4>
                        <p className="text-gray-400">Connect scripture to daily life events with AI-suggested verses and themes for practical sermons.</p>
                    </div>
                    <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-lg">
                        <div className="flex justify-center mb-4 text-gray-400"><QuickMemoIcon className="h-12 w-12" /></div>
                        <h4 className="text-2xl font-semibold mb-2 text-white">Quick Memo Integration</h4>
                        <p className="text-gray-400">Weave scattered notes and voice memos to easily generate sermon outlines.</p>
                    </div>
                    <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-lg">
                        <div className="flex justify-center mb-4 text-gray-400"><SecureIcon className="h-12 w-12" /></div>
                        <h4 className="text-2xl font-semibold mb-2 text-white">Secure & Organized</h4>
                        <p className="text-gray-400">Keep all your spiritual insights, notes, and sermons organized and securely stored.</p>
                    </div>
                    <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-lg">
                        <div className="flex justify-center mb-4 text-gray-400"><ShareIcon className="h-12 w-12" /></div>
                        <h4 className="text-2xl font-semibold mb-2 text-white">Community Sharing (Optional)</h4>
                        <p className="text-gray-400">Share insights and grow with a community of fellow believers and leaders.</p>
                    </div>
                </div>
            </section>

            <section className="text-center mb-16">
                <h3 className="text-3xl font-bold text-blue-400 mb-8">Why SermonNote?</h3>
                <div className="max-w-4xl mx-auto text-lg text-gray-300 leading-relaxed">
                    <p className="mb-4">SermonNote is not just another note-taking app. It’s a dedicated platform designed to support your spiritual journey and sermon preparation. We believe that technology can be a powerful tool for deepening your relationship with God and organizing your divine insights. Our AI assistant helps you explore scripture in new ways, connecting ancient texts to modern life, while our secure system ensures your spiritual reflections are always safe and accessible.</p>
                    <p className="mb-4">Whether you are a seasoned pastor, a small group leader, or a believer seeking to grow, SermonNote provides the tools you need to make your study of the Word more organized, insightful, and inspiring.</p>
                </div>
            </section>
        </main>
        
        <footer className="bg-gray-950 py-8 px-6 border-t border-gray-700 text-center text-gray-500">
            <div className="container mx-auto">
                <div className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-8 mb-4">
                    <a className="hover:text-white transition" href="/about">About Us</a>
                    <a className="hover:text-white transition" href="/contact">Contact</a>
                    <a className="hover:text-white transition" href="/privacy-policy">Privacy Policy</a>
                    <a className="hover:text-white transition" href="/terms-of-service">Terms of Service</a>
                </div>
                <p>&copy; {new Date().getFullYear()} SermonNote. All rights reserved.</p>
            </div>
        </footer>
    </div>
);

// 메인 페이지 컴포넌트
export default function Home() {
    const [user, setUser] = useState(null);
    const [userId, setUserId] = useState(null);
    const [userSubscription, setUserSubscription] = useState('premium');
    const [commentaryCount, setCommentaryCount] = useState(0);
    const [sermonCount, setSermonCount] = useState(0);
    const [sermonInput, setSermonInput] = useState('');
    const [sermonDraft, setSermonDraft] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    // 'home' 상태를 랜딩 페이지로 활용하도록 변경
    const [selectedSermonType, setSelectedSermonType] = useState('home');
    
    // 로그인 모달 상태
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    
    // 전체 화면 모달 상태 추가
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState('');
    const [isEditingModal, setIsEditingModal] = useState(false);

    const lang = 'ko'; // 언어를 한국어로 고정

    // Firebase 인증 상태 변경 리스너
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setUserId(currentUser.uid);
                fetchUserData(currentUser.uid);
            } else {
                signInAnonymously(auth);
                setUser(null);
                setUserId(null);
            }
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // 사용자 데이터 불러오기 및 실시간 업데이트 리스너
    const fetchUserData = (uid) => {
        if (!db) {
            console.error("Firestore is not initialized.");
            return;
        }

        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const userRef = doc(db, 'artifacts', appId, 'users', uid);

        const unsubscribe = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setUserSubscription(data.subscription || 'premium');
                setCommentaryCount(data.commentary_count || 0);
                setSermonCount(data.sermon_count || 0);
            } else {
                console.log("No user data found. Initializing with default values.");
                setDoc(userRef, {
                    subscription: 'premium',
                    commentary_count: 0,
                    sermon_count: 0,
                }).catch(e => console.error("Error creating user data:", e));
            }
        }, (error) => {
            console.error("Error fetching user data:", error);
            setErrorMessage("사용자 데이터를 불러오는 데 실패했습니다.");
        });

        return () => unsubscribe();
    };

    // 전체 화면 모달을 열고 닫는 함수
    const toggleFullscreen = (content) => {
        if (content) {
            setModalContent(content);
            setIsModalOpen(true);
            setIsEditingModal(false);
        } else {
            setIsModalOpen(false);
            setModalContent('');
            setIsEditingModal(false);
        }
    };
    
    // 모달 내용 변경 핸들러
    const handleModalContentChange = (e) => {
      setModalContent(e.target.value);
    };

    // 모달 내 저장 버튼 핸들러
    const handleModalSave = () => {
      setSermonDraft(modalContent);
      toggleFullscreen(null);
    };
    
    // 모달 내 인쇄 버튼 핸들러
    const handleModalPrint = () => {
      const printContent = document.createElement('div');
      printContent.innerHTML = modalContent.replace(/\n/g, '<br />');
      const printWindow = window.open('', '', 'height=600,width=800');
      printWindow.document.write('<html><head><title>Sermon Draft</title>');
      printWindow.document.write('</head><body >');
      printWindow.document.write(printContent.innerHTML);
      printWindow.document.close();
      printWindow.print();
    };
    
    // 이메일/비밀번호 로그인 핸들러
    const handleLogin = async (email, password) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            setErrorMessage('');
            alert('로그인 성공!');
            setSelectedSermonType('sermon-selection');
        } catch (error) {
            setErrorMessage(`로그인 실패: ${error.message}`);
        }
    };
    
    // 이메일/비밀번호 회원가입 핸들러
    const handleSignUp = async (email, password) => {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            setErrorMessage('');
            alert('회원가입 성공!');
            setSelectedSermonType('sermon-selection');
        } catch (error) {
            setErrorMessage(`회원가입 실패: ${error.message}`);
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">로딩 중...</div>;
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-900 text-white">
            <header className="p-4 bg-gray-800 shadow-md">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setSelectedSermonType('home')}
                            className="text-2xl font-bold hover:text-gray-300 transition-colors"
                        >
                            SermonNote
                        </button>
                    </div>
                    {user && (
                        <span className="text-sm text-gray-400">
                           사용자 ID: {userId}
                        </span>
                    )}
                </div>
            </header>
            <main className="flex-grow container mx-auto p-8">
                {selectedSermonType === 'home' ? (
                    <LandingPage onGetStarted={() => setSelectedSermonType('sermon-selection')} user={user} signOut={() => signOut(auth)} openLoginModal={() => setIsLoginModalOpen(true)}/>
                ) : (
                    <SermonAssistantComponent
                        sermonInput={sermonInput}
                        setSermonInput={setSermonInput}
                        sermonDraft={sermonDraft}
                        setSermonDraft={setSermonDraft}
                        errorMessage={errorMessage}
                        setErrorMessage={setErrorMessage}
                        toggleFullscreen={toggleFullscreen}
                        userSubscription={userSubscription}
                        commentaryCount={commentaryCount}
                        sermonCount={sermonCount}
                        userId={userId}
                        canGenerateSermon={userSubscription === 'premium' || sermonCount < SUBSCRIPTION_LIMITS[userSubscription].sermon}
                        lang={lang}
                        selectedSermonType={selectedSermonType}
                        setSelectedSermonType={setSelectedSermonType}
                        openLoginModal={() => setIsLoginModalOpen(true)}
                        user={user}
                    />
                )}
            </main>

            {/* 로그인 모달 컴포넌트 */}
            <LoginModal 
                isOpen={isLoginModalOpen} 
                onClose={() => setIsLoginModalOpen(false)} 
                onLogin={handleLogin}
                onSignUp={handleSignUp}
                errorMessage={errorMessage}
                setErrorMessage={setErrorMessage}
                onLoginSuccess={() => setSelectedSermonType('sermon-selection')}
            />

            {/* 전체 화면 모달 컴포넌트 */}
            {isModalOpen && (
              <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-95 flex flex-col p-8">
                <div className="flex-grow flex flex-col bg-gray-800 rounded-xl shadow-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-white">설교문 전체 보기</h2>
                        <button onClick={() => toggleFullscreen(null)} className="p-2 text-gray-400 hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                    </div>
                    <textarea
                        value={modalContent}
                        onChange={handleModalContentChange}
                        readOnly={!isEditingModal}
                        className={`flex-grow w-full p-4 rounded-xl bg-gray-700 text-white resize-none border ${isEditingModal ? 'border-blue-500' : 'border-gray-600'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    <div className="flex justify-end space-x-4 mt-4">
                        <button
                            onClick={() => setIsEditingModal(!isEditingModal)}
                            className={`px-4 py-2 rounded-xl font-semibold transition-colors ${isEditingModal ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-white'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                            {isEditingModal ? '수정 중...' : '수정'}
                        </button>
                        <button onClick={handleModalSave} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-save"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                            저장
                        </button>
                        <button onClick={handleModalPrint} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucude-printer"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
                            인쇄
                        </button>
                        <button onClick={() => toggleFullscreen(null)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x-circle"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                            닫기
                        </button>
                    </div>
                </div>
              </div>
            )}
        </div>
    );
}

