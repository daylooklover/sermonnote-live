// src/components/ExpositorySermonComponent.js
'use client';
import React, { useState, useCallback } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 라이브러리 및 유틸리티
import { t } from '@/lib/translations';

// 아이콘
import { GoBackIcon, SearchIcon, BibleIcon, LoadingSpinner } from './IconComponents';

// API 호출을 위한 헬퍼 함수
const callAPI = async (promptText, generationConfig = {}) => {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: promptText, generationConfig }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to parse server error response.' }));
    throw new Error(errorData.message || 'Server responded with an error.');
  }
  const data = await response.json();
  return data.text;
};

const ExpositorySermonComponent = ({ setSermonDraft, userId, commentaryCount, userSubscription, setErrorMessage, lang, user, openLoginModal, onLimitReached, sermonCount, canGenerateSermon, canGenerateCommentary, generateSermon }) => {
    const [scriptureInput, setScriptureInput] = useState('');
    const [scriptureText, setScriptureText] = useState('');
    const [commentary, setCommentary] = useState('');
    const [crossReferences, setCrossReferences] = useState([]);
    
    const [commentaryLoading, setCommentaryLoading] = useState(false);
    const [scriptureLoading, setScriptureLoading] = useState(false);

    const handleGetCommentaryAndReferences = useCallback(async () => {
        if (!user) { openLoginModal(); return; }
        if (!canGenerateCommentary) { setErrorMessage(t('commentaryLimitError', lang)); onLimitReached(); return; }
        if (scriptureInput.trim() === '') { setErrorMessage(t('enterScriptureReference', lang)); return; }

        setCommentaryLoading(true);
        setCommentary(t('generating', lang));
        setCrossReferences([]);
        setErrorMessage('');

        try {
            const promptText = `Based on the following scripture reference, provide a detailed expository commentary and a list of 3-5 relevant cross-reference verses with a brief explanation for each. Format the response with a clear "Commentary:" section and a "Cross-References:" section.
            Scripture: "${scriptureInput}"
            
            The response should be in ${lang === 'ko' ? 'Korean' : 'English'}.`;

            // generateSermon prop을 사용합니다.
            const fullResponse = await generateSermon(promptText, 'commentary');
            
            if (!fullResponse) return;
            
            const commentaryMatch = fullResponse.match(/Commentary:\s*([\s\S]*?)(?=Cross-References:|$)/);
            const referencesMatch = fullResponse.match(/Cross-References:\s*([\s\S]*)/);
            
            if (commentaryMatch) {
                setCommentary(commentaryMatch[1].trim());
            } else {
                setCommentary(fullResponse);
            }

            if (referencesMatch) {
                const references = referencesMatch[1].trim().split('\n').map(line => line.trim()).filter(line => line.length > 0);
                setCrossReferences(references);
            }
        } catch (error) {
            setCommentary(t('generationFailed', lang));
            console.error(error);
            setErrorMessage(t('generationFailed', lang));
        } finally {
            setCommentaryLoading(false);
        }
    }, [scriptureInput, setCommentary, setCrossReferences, setErrorMessage, canGenerateCommentary, userId, commentaryCount, lang, user, openLoginModal, onLimitReached, userSubscription, generateSermon]);

    const handleAddSelectedText = useCallback((textToAdd) => {
        if (textToAdd && textToAdd.trim()) {
            setSermonDraft(prevDraft => prevDraft ? `${prevDraft}\n\n${textToAdd}` : textToAdd);
        }
    }, [setSermonDraft]);

    const handleGetScripture = useCallback(async () => {
        if (!user) { openLoginModal(); return; }
        if (scriptureInput.trim() === '') { setErrorMessage(t('enterScriptureReference', lang)); return; }
        
        setScriptureLoading(true);
        setScriptureText(t('gettingScripture', lang));
        setErrorMessage('');
        try {
            const promptText = `Please provide the full text for the following scripture reference in ${lang === 'ko' ? 'Korean' : 'English'}: ${scriptureInput}`;
            const text = await callAPI(promptText); // callGeminiAPI 대신 로컬 callAPI 사용
            setScriptureText(text);
        } catch (error) {
            setScriptureText(t('generationFailed', lang));
            console.error(error);
            setErrorMessage(t('generationFailed', lang));
        } finally {
            setScriptureLoading(false);
        }
    }, [scriptureInput, setScriptureText, setErrorMessage, lang, user, openLoginModal]);

    const handleGenerateSermon = useCallback(async () => {
        if (!user) { openLoginModal(); return; }
        if (!canGenerateSermon) { setErrorMessage(t('sermonLimitError', lang)); onLimitReached(); return; }
        if (commentary.trim() === '') { setErrorMessage(t('noCommentaryToGenerateSermon', lang)); return; }

        const promptText = `Based on the following commentary, write a detailed sermon in ${lang === 'ko' ? 'Korean' : 'English'}. Note: "${commentary}"`;
        await generateSermon(promptText, 'sermon');
    }, [commentary, generateSermon, canGenerateSermon, setErrorMessage, lang, user, openLoginModal, onLimitReached, userSubscription, sermonCount]);

    return (
        <div className="flex flex-col items-center space-y-4 max-w-2xl mx-auto w-full">
            <h2 className="text-4xl font-extrabold text-gray-800">{t('expositorySermonTitle', lang)}</h2>
            <p className="text-lg text-gray-600 mb-4">{t('expositoryDescription', lang)}</p>
            
            {userSubscription !== 'premium' && (
                <p className="text-sm text-gray-500 mb-4">
                    {t('commentaryLimit', lang, Math.max(0, userSubscription && SUBSCRIPTION_LIMITS[userSubscription]?.commentary ? SUBSCRIPTION_LIMITS[userSubscription].commentary - commentaryCount : 0))}
                </p>
            )}

            <div className="w-full flex space-x-2">
                <input
                    type="text"
                    value={scriptureInput}
                    onChange={(e) => setScriptureInput(e.target.value)}
                    placeholder={t('scripturePlaceholder', lang)}
                    className="flex-grow p-4 rounded-xl bg-white border border-gray-300 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    onClick={handleGetScripture}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg transition duration-300 disabled:bg-gray-400"
                    disabled={scriptureInput.trim() === '' || scriptureLoading}
                >
                    {scriptureLoading ? t('gettingScripture', lang) : t('getScripture', lang)}
                </button>
            </div>

            {scriptureText && (
                <div className="w-full p-4 rounded-xl bg-white border border-gray-300 text-left whitespace-pre-wrap">
                    <p className="font-semibold text-gray-800 mb-2">{t('scriptureTitle', lang)}</p>
                    <p className="text-gray-600" onMouseUp={() => handleAddSelectedText(window.getSelection().toString())}>{scriptureText}</p>
                    <button
                        onClick={handleGetCommentaryAndReferences}
                        className="mt-4 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-lg transition duration-300 disabled:bg-gray-400 w-full"
                        disabled={!canGenerateCommentary || commentaryLoading}
                    >
                        {commentaryLoading ? t('generating', lang) : t('getCommentary', lang)}
                    </button>
                </div>
            )}
            
            {crossReferences.length > 0 && (
                <div className="w-full p-4 rounded-xl bg-white border border-gray-300 text-left">
                    <p className="font-semibold text-gray-800 mb-2">{t('crossReferencesTitle', lang)}</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                        {crossReferences.map((ref, index) => (
                            <li key={index}>{ref}</li>
                        ))}
                    </ul>
                </div>
            )}
            
            {commentary && (
                <div className="w-full p-4 rounded-xl bg-white border border-gray-300 text-left whitespace-pre-wrap">
                    <p className="font-semibold text-gray-800 mb-2">{t('aiCommentaryTitle', lang)}</p>
                    <p className="text-gray-600">{commentary}</p>
                    <button
                        onClick={handleGenerateSermon}
                        className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg transition duration-300 disabled:bg-gray-400 w-full"
                        disabled={!canGenerateSermon || commentaryLoading || commentary.trim() === ''}
                    >
                        {commentaryLoading ? t('generating', lang) : t('generateSermonFromCommentary', lang)}
                    </button>
                </div>
            )}
            
        </div>
    );
};

export default ExpositorySermonComponent;