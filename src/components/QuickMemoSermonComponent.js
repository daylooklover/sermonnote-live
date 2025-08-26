'use client';

import React, { useState, useCallback } from 'react';
// 필요한 유틸리티 함수나 아이콘을 import
// 예: import { callGeminiAPI, incrementUsageCount } from './utils';

// 아이콘 컴포넌트
const QuickMemoIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clipboard-list"><rect width="8" height="4" x="8" y="2"/><path d="M16 4h2a2 2 0 0 1-2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>);
const PlusCircleIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus-circle"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>);
const CheckIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check text-green-500"><path d="M20 6 9 17l-5-5"/></svg>);

// 언어별 텍스트 (필요에 따라 import 또는 직접 정의)
const translations = {
    ko: {
        quickMemoSermonTitle: '퀵 메모 연계 설교',
        quickMemoDescription: '흩어진 영감들을 엮어낸 설교를 만듭니다.',
        myMemos: '내 메모:',
        selectedMemo: '선택된 메모:',
        generateSermonFromMemo: '메모로 설교문 생성',
        noSelectedMemo: '메모를 선택해주세요.',
        generating: '생성 중입니다...',
        generationFailed: '생성에 실패했습니다. 다시 시도해 주세요.',
        sermonLimitError: (count) => `이번 달 설교 작성 횟수를 모두 사용했습니다.`,
    },
    en: { /* ... 영문 텍스트 ... */ },
};
const t = (key, lang, ...args) => {
    const selectedLang = translations[lang] ? lang : 'ko';
    const text = translations[selectedLang]?.[key];
    if (typeof text === 'function') {
        return text(...args);
    }
    return text || key;
};

// QuickMemoSermonComponent 정의
export default function QuickMemoSermonComponent({
    setSermonDraft,
    userId,
    sermonCount,
    userSubscription,
    setErrorMessage,
    lang,
    user,
    openLoginModal,
    memos, // props로 전달받는 메모 리스트
    canGenerateSermon,
    t: parentT,
}) {
    const [selectedMemos, setSelectedMemos] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const localT = parentT || t;

    const handleMemoSelection = useCallback((memo) => {
        setSelectedMemos(prev => 
            prev.includes(memo.id) ? prev.filter(id => id !== memo.id) : [...prev, memo.id]
        );
    }, []);

    const handleGenerateSermon = useCallback(async () => {
        if (!user) {
            openLoginModal();
            return;
        }
        if (selectedMemos.length === 0) {
            setErrorMessage(localT('noSelectedMemo', lang));
            return;
        }
        if (!canGenerateSermon) {
            setErrorMessage(localT('sermonLimitError', lang));
            return;
        }

        setIsLoading(true);
        setSermonDraft(localT('generating', lang));
        setErrorMessage('');

        try {
            const selectedContent = memos.filter(m => selectedMemos.includes(m.id)).map(m => m.content).join('\n\n');
            const prompt = `Based on the following notes, generate a detailed sermon: "${selectedContent}" in ${lang === 'ko' ? 'Korean' : 'English'}`;
            
            // 이 함수는 실제 API 호출 로직으로 변경해야 합니다.
            const sermon = await new Promise(resolve => setTimeout(() => {
                resolve(`선택된 메모를 기반으로 생성된 설교입니다: ${selectedContent}`);
            }, 2000));
            
            setSermonDraft(sermon);
            // 실제 사용량 증가 로직 (필요시 구현)
            // await incrementUsageCount('sermon', userId, sermonCount);
        } catch (error) {
            console.error("Failed to generate sermon:", error);
            setSermonDraft(localT('generationFailed', lang));
            setErrorMessage(localT('generationFailed', lang));
        } finally {
            setIsLoading(false);
        }
    }, [selectedMemos, memos, user, openLoginModal, setSermonDraft, setErrorMessage, lang, localT, canGenerateSermon]);

    return (
        <div className="text-center space-y-8 max-w-2xl mx-auto w-full">
            <h2 className="text-4xl font-extrabold text-gray-800">{localT('quickMemoSermonTitle', lang)}</h2>
            <p className="text-lg text-gray-600">{localT('quickMemoDescription', lang)}</p>
            {userSubscription !== 'premium' && (
                <p className="text-sm text-gray-500">
                    {localT('sermonLimit', lang, sermonCount)}
                </p>
            )}
            <div className="flex flex-col items-center space-y-4 w-full">
                {/* 메모 리스트 */}
                <h3 className="text-2xl font-bold text-gray-900">{localT('myMemos', lang)}</h3>
                <div className="w-full p-4 rounded-xl bg-gray-200 border border-gray-300 h-64 overflow-y-auto text-left space-y-2">
                    {memos.length > 0 ? (
                        memos.map(memo => (
                            <div
                                key={memo.id}
                                onClick={() => handleMemoSelection(memo)}
                                className={`p-3 rounded-lg cursor-pointer transition flex items-center justify-between ${selectedMemos.includes(memo.id) ? 'bg-yellow-200 border-yellow-400' : 'bg-white border-gray-300'} border shadow-sm`}
                            >
                                <span className="flex-grow text-gray-800">{memo.content}</span>
                                {selectedMemos.includes(memo.id) ? <CheckIcon className="w-6 h-6 ml-4" /> : <PlusCircleIcon className="w-6 h-6 ml-4 text-gray-400" />}
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 text-center">메모가 없습니다. 퀵 메모를 추가해주세요.</p>
                    )}
                </div>
                {/* 설교 생성 버튼 */}
                <button
                    onClick={handleGenerateSermon}
                    className="w-full px-6 py-4 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-xl shadow-lg transition duration-300 disabled:bg-gray-400 flex items-center justify-center"
                    disabled={isLoading || selectedMemos.length === 0}
                >
                    <QuickMemoIcon className="mr-2" />
                    {isLoading ? localT('generating', lang) : localT('generateSermonFromMemo', lang)}
                </button>
            </div>
        </div>
    );
}