'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { getDocs, collection, query, where } from 'firebase/firestore';
import { useSermonGeneration } from '@/lib/hooks';
import { t } from '@/lib/translations';
import { QuickMemoIcon, LoadingSpinner } from './IconComponents';
import { callGeminiAPI } from '@/lib/gemini';
import { SUBSCRIPTION_LIMITS } from '@/lib/firebase';

export default function QuickMemoSermon({ 
    setSelectedSermonType, 
    user, 
    quickMemos, 
    isFetchingMemos,
    userId,
    sermonCount,
    commentaryCount,
    userSubscription,
    setErrorMessage,
    lang,
    openLoginModal,
    onLimitReached,
    canGenerateSermon,
    canGenerateCommentary,
    setSermonDraft
}) {
    const [selectedMemo, setSelectedMemo] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [selectedSuggestion, setSelectedSuggestion] = useState(null);
    const [commentary, setCommentary] = useState('');
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const [commentaryLoading, setCommentaryLoading] = useState(false);
    const { generateSermon, isLoading, generationError } = useSermonGeneration(userId, canGenerateSermon, canGenerateCommentary, lang, user, openLoginModal, onLimitReached, sermonCount, commentaryCount, userSubscription);

    const handleToggleMemo = useCallback(async (memo) => {
        if (!user) { openLoginModal(); return; }

        if (selectedMemo && selectedMemo.id === memo.id) {
            setSelectedMemo(null);
            setSuggestions([]);
            setSelectedSuggestion(null);
            setCommentary('');
            setErrorMessage('');
            setSermonDraft('');
        } else {
            setSelectedMemo(memo);
            setSuggestions([]);
            setSelectedSuggestion(null);
            setCommentary('');
            
            setSuggestionsLoading(true);
            setSermonDraft(t('generating', lang));
            setErrorMessage('');

            try {
                const promptText = `Based on the following note, suggest 3 relevant scripture verses and 3 sermon themes in a JSON array format. The JSON array should contain objects with keys "verse" and "theme". Note: "${memo.content}". The response should be in ${lang === 'ko' ? 'Korean' : 'English'}.`;
                const generationConfig = {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "ARRAY",
                        items: {
                            type: "OBJECT",
                            properties: {
                                "verse": { "type": "STRING" },
                                "theme": { "type": "STRING" }
                            },
                            "propertyOrdering": ["verse", "theme"]
                        }
                    }
                };
                const jsonText = await callGeminiAPI(promptText, generationConfig);
                const parsedJson = JSON.parse(jsonText.replace(/```json\n|```/g, '').trim());
                setSuggestions(parsedJson);
                setSermonDraft('');
            } catch (error) {
                setSermonDraft(t('generationFailed', lang));
                setErrorMessage(t('generationFailed', lang));
                console.error(error);
            } finally {
                setSuggestionsLoading(false);
            }
        }
    }, [selectedMemo, setSermonDraft, setErrorMessage, lang, user, openLoginModal]);

    const handleGetCommentary = useCallback(async () => {
        if (!selectedSuggestion) { setErrorMessage(t('selectSuggestion', lang)); return; }
        
        setCommentaryLoading(true);
        setCommentary(t('generating', lang));
        setErrorMessage('');

        try {
            const promptText = `Provide a detailed commentary and real-life application for the scripture: "${selectedSuggestion.verse}".
            The response should be in ${lang === 'ko' ? 'Korean' : 'English'}.`;
            const text = await generateSermon(promptText, 'commentary');
            if (text) {
                setCommentary(text);
            } else {
                setCommentary(t('generationFailed', lang));
            }
        } catch (error) {
            setCommentary(t('generationFailed', lang));
            setErrorMessage(error.message);
        } finally {
            setCommentaryLoading(false);
        }
    }, [selectedSuggestion, setCommentary, setErrorMessage, lang, generateSermon]);

    const handleGenerateSermon = useCallback(async () => {
        if (!selectedMemo || !selectedSuggestion || commentary.trim() === '') { setErrorMessage(t('missingMemoAndCommentary', lang)); return; }

        try {
            const promptText = `Based on the following memo, scripture, and commentary, write a detailed sermon in ${lang === 'ko' ? 'Korean' : 'English'}. Memo: "${selectedMemo.content}". Scripture: "${selectedSuggestion.verse}". Commentary: "${commentary}"`;
            const sermonText = await generateSermon(promptText, 'sermon');
            if (sermonText) setSermonDraft(sermonText);
        } catch (error) {
            setErrorMessage(error.message);
        }
    }, [selectedMemo, selectedSuggestion, commentary, generateSermon, setSermonDraft, setErrorMessage, lang]);

    const reviseDraft = useCallback(async (selectedText) => {
        if (!selectedText) { setErrorMessage(t('selectContentToEdit', lang)); return; }
        const comment = prompt(t('editWithAiTitle', lang));
        if (!comment) return;

        setSermonDraft(t('generating', lang));
        setErrorMessage('');
        try {
            const promptText = `Based on the following user-selected text and a user comment, please revise the text.
            User-selected text: "${selectedText}"
            User comment: "${comment}"
            Please provide the revised text in ${lang === 'ko' ? 'Korean' : 'English'}.`;
            const revisedText = await callGeminiAPI(promptText);
            setSermonDraft(revisedText);
        } catch (error) {
            setSermonDraft(t('generationFailed', lang));
            setErrorMessage(t('generationFailed', lang));
        }
    }, [setSermonDraft, setErrorMessage, lang]);

    return (
        <div className="flex flex-col items-center space-y-4 max-w-2xl mx-auto w-full">
            <h2 className="text-4xl font-extrabold text-gray-800">{t('quickMemoSermonTitle', lang)}</h2>
            <p className="text-lg text-gray-600 mb-4">{t('quickMemoDescription', lang)}</p>
            {generationError && (
                <div className="bg-red-200 text-red-800 p-4 rounded-xl mb-4 w-full">
                    {generationError}
                </div>
            )}
            {userSubscription !== 'premium' && (
                <p className="text-sm text-gray-500 mb-4">
                    {t('sermonLimit', lang, Math.max(0, (SUBSCRIPTION_LIMITS[userSubscription]?.sermon || 0) - sermonCount))}
                </p>
            )}

            <div className="w-full p-4 rounded-xl bg-white border border-gray-300 text-left">
                <p className="font-semibold text-gray-800 mb-2">{t('myMemos', lang)}</p>
                <ul className="space-y-2">
                    {isFetchingMemos ? (
                        <p className="text-gray-500">{t('fetchingMemos', lang)}</p>
                    ) : (
                        quickMemos.length > 0 ? (
                            quickMemos.map(memo => (
                                <li key={memo.id} className={`p-3 rounded-lg cursor-pointer transition ${selectedMemo && selectedMemo.id === memo.id ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                                    onClick={() => handleToggleMemo(memo)}>
                                    {memo.content}
                                </li>
                            ))
                        ) : (
                            <p className="text-gray-500">{t('noMemos', lang)}</p>
                        )
                    )}
                </ul>
            </div>

            {selectedMemo && suggestionsLoading && (
                <div className="w-full p-4 rounded-xl bg-gray-100 text-center flex items-center justify-center">
                    <LoadingSpinner />
                    <p className="ml-2 text-gray-600">{t('generating', lang)}</p>
                </div>
            )}
            
            {suggestions.length > 0 && (
                <div className="w-full p-4 rounded-xl bg-white border border-gray-300 text-left">
                    <p className="font-semibold text-gray-800 mb-2">{t('aiSuggestions', lang)}</p>
                    <ul className="space-y-2">
                        {suggestions.map((sug, index) => (
                            <li key={index} className={`p-3 rounded-lg cursor-pointer transition ${selectedSuggestion && selectedSuggestion.verse === sug.verse ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                                onClick={() => setSelectedSuggestion(sug)}>
                                <p className="font-semibold">{sug.verse}</p>
                                <p className="text-sm">{sug.theme}</p>
                            </li>
                        ))}
                    </ul>
                    <button
                        onClick={handleGetCommentary}
                        className="mt-4 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-lg transition duration-300 disabled:bg-gray-400 w-full flex items-center justify-center"
                        disabled={!selectedSuggestion || commentaryLoading}
                    >
                        {commentaryLoading && <LoadingSpinner />}
                        <span className={`${commentaryLoading ? 'ml-2' : ''}`}>{t('getCommentary', lang)}</span>
                    </button>
                </div>
            )}
            
            {commentary && (
                <div className="w-full p-4 rounded-xl bg-white border border-gray-300 text-left whitespace-pre-wrap">
                    <p className="font-semibold text-gray-800 mb-2">{t('aiCommentaryTitle', lang)}</p>
                    <p className="text-gray-600">{commentary}</p>
                    <button
                        onClick={handleGenerateSermon}
                        className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg transition duration-300 disabled:bg-gray-400 w-full flex items-center justify-center"
                        disabled={!canGenerateSermon || isLoading || commentary.trim() === ''}
                    >
                        {isLoading && <LoadingSpinner />}
                        <span className={`${isLoading ? 'ml-2' : ''}`}>{t('generateSermonFromCommentary', lang)}</span>
                    </button>
                </div>
            )}
             <button
                 onClick={() => reviseDraft(window.getSelection().toString().trim())}
                 className="mt-4 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-xl shadow-lg transition duration-300 w-full flex items-center justify-center"
                 disabled={isLoading}
             >
                 {isLoading && <LoadingSpinner />}
                 <span className={`${isLoading ? 'ml-2' : ''}`}>{t('editWithAiTitle', lang)}</span>
             </button>
        </div>
    );
}
