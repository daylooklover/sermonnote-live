'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { t } from '@/lib/translations';
import { RealLifeIcon, BibleIcon, LoadingSpinner } from './IconComponents';
import { SUBSCRIPTION_LIMITS, incrementUsageCount } from '@/lib/firebase';
import { useRouter } from 'next/navigation'; // next/navigation을 import 합니다.

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

// Custom Hook for Sermon Generation Logic
const useSermonGeneration = (userId, canGenerateSermon, canGenerateCommentary, lang, user, openLoginModal, onLimitReached, sermonCount, commentaryCount, userSubscription) => {
  const [isLoading, setIsLoading] = useState(false);
  const [generationError, setGenerationError] = useState(null);

  const generateSermon = useCallback(async (promptText, usageType = 'sermon', generationConfig = {}) => {
    setGenerationError(null);
    if (!user) {
      openLoginModal();
      return null;
    }

    const userLimit = SUBSCRIPTION_LIMITS[userSubscription] || SUBSCRIPTION_LIMITS['free'];

    if (usageType === 'sermon' && (!canGenerateSermon || sermonCount >= userLimit.sermon)) {
      onLimitReached();
      setGenerationError(t('sermonLimitError', lang, Math.max(0, userLimit.sermon - sermonCount)));
      return null;
    }
    if (usageType === 'commentary' && (!canGenerateCommentary || commentaryCount >= userLimit.commentary)) {
      onLimitReached();
      setGenerationError(t('commentaryLimitError', lang, Math.max(0, userLimit.commentary - commentaryCount)));
      return null;
    }

    setIsLoading(true);
    try {
      const text = await callAPI(promptText, generationConfig); // callGeminiAPI 대신 callAPI 사용
      await incrementUsageCount(usageType, userId, usageType === 'sermon' ? sermonCount : commentaryCount);
      return text;
    } catch (error) {
      console.error(error);
      setGenerationError(t('generationFailed', lang));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userId, sermonCount, commentaryCount, canGenerateSermon, canGenerateCommentary, lang, user, openLoginModal, onLimitReached, userSubscription]);

  return { generateSermon, isLoading, generationError };
};

const RealLifeSermonComponent = ({ setSermonDraft, userId, sermonCount, userSubscription, setErrorMessage, lang, user, openLoginModal, onLimitReached, canGenerateSermon }) => {
  const [realLifeInput, setRealLifeInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [commentary, setCommentary] = useState('');
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [commentaryLoading, setCommentaryLoading] = useState(false);

  const { generateSermon, isLoading, generationError } = useSermonGeneration(userId, canGenerateSermon, canGenerateSermon, lang, user, openLoginModal, onLimitReached, sermonCount, 0, userSubscription);

  const handleGetSuggestions = useCallback(async () => {
    if (realLifeInput.trim() === '') {
      setErrorMessage(t('enterRealLifeTopic', lang));
      return;
    }
    
    setSuggestionsLoading(true);
    setSuggestions([]);
    setSelectedSuggestion(null);
    setCommentary('');
    setSermonDraft(t('generating', lang));
    setErrorMessage('');

    try {
      const promptText = `Based on the following real-life topic, suggest 3 relevant scripture verses and 3 sermon themes in a JSON array format. The JSON array should contain objects with keys "verse" and "theme". Topic: "${realLifeInput}". The response should be in ${lang === 'ko' ? 'Korean' : 'English'}.`;
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
      const jsonText = await callAPI(promptText, generationConfig); // callGeminiAPI 대신 callAPI 사용
      const cleanedJsonText = jsonText.replace(/```json\n|```/g, '').trim();
      const parsedJson = JSON.parse(cleanedJsonText);
      setSuggestions(parsedJson);
      setSermonDraft('');
    } catch (error) {
      setSermonDraft(t('generationFailed', lang));
      setErrorMessage(t('generationFailed', lang));
      console.error(error);
    } finally {
      setSuggestionsLoading(false);
    }
  }, [realLifeInput, setErrorMessage, setSermonDraft, lang]);

  const handleGetCommentary = useCallback(async () => {
    if (!selectedSuggestion) {
      setErrorMessage(t('selectSuggestion', lang));
      return;
    }

    setCommentaryLoading(true);
    setCommentary(t('generating', lang));
    setErrorMessage('');

    try {
      const promptText = `Provide a detailed commentary on "${selectedSuggestion.verse}" and connect it to the theme "${selectedSuggestion.theme}". The response should be in ${lang === 'ko' ? 'Korean' : 'English'}.`;
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
    if (!selectedSuggestion || commentary.trim() === '') {
      setErrorMessage(t('missingSuggestionAndCommentary', lang));
      return;
    }
    try {
      const promptText = `Based on the real-life topic "${realLifeInput}", the scripture "${selectedSuggestion.verse}", and the commentary "${commentary}", write a detailed sermon in ${lang === 'ko' ? 'Korean' : 'English'}.`;
      const sermonText = await generateSermon(promptText, 'sermon');
      if (sermonText) setSermonDraft(sermonText);
    } catch (error) {
      setErrorMessage(error.message);
    }
  }, [realLifeInput, selectedSuggestion, commentary, generateSermon, setSermonDraft, setErrorMessage, lang]);
  
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
        const revisedText = await callAPI(promptText); // callGeminiAPI 대신 callAPI 사용
        setSermonDraft(revisedText);
    } catch (error) {
        setSermonDraft(t('generationFailed', lang));
        setErrorMessage(t('generationFailed', lang));
    }
}, [setSermonDraft, setErrorMessage, lang]);

  return (
    <div className="flex flex-col items-center space-y-4 max-w-2xl mx-auto w-full">
      <h2 className="text-4xl font-extrabold text-gray-800">{t('realLifeSermonTitle', lang)}</h2>
      <p className="text-lg text-gray-600 mb-4">{t('realLifeDescription', lang)}</p>
      
      {userSubscription !== 'premium' && (
        <p className="text-sm text-gray-500 mb-4">
          {t('sermonLimit', lang, Math.max(0, (SUBSCRIPTION_LIMITS[userSubscription]?.sermon || 0) - sermonCount))}
        </p>
      )}
      {generationError && (
          <div className="bg-red-200 text-red-800 p-4 rounded-xl mb-4 w-full">
              {generationError}
          </div>
      )}

      <div className="w-full flex space-x-2">
        <input
          type="text"
          value={realLifeInput}
          onChange={(e) => setRealLifeInput(e.target.value)}
          placeholder={t('enterRealLifeTopic', lang)}
          className="flex-grow p-4 rounded-xl bg-white border border-gray-300 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          onClick={handleGetSuggestions}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl shadow-lg transition duration-300 disabled:bg-gray-400 flex items-center justify-center"
          disabled={realLifeInput.trim() === '' || suggestionsLoading}
        >
          {suggestionsLoading && <LoadingSpinner />}
          <span className={`${suggestionsLoading ? 'ml-2' : ''}`}>{t('suggestScriptureAndThemes', lang)}</span>
        </button>
      </div>

      {suggestions.length > 0 && (
        <div className="w-full p-4 rounded-xl bg-white border border-gray-300 text-left">
          <p className="font-semibold text-gray-800 mb-2">{t('aiSuggestions', lang)}</p>
          <ul className="space-y-2">
            {suggestions.map((sug, index) => (
              <li
                key={index}
                className={`p-3 rounded-lg cursor-pointer transition ${selectedSuggestion && selectedSuggestion.verse === sug.verse ? 'bg-purple-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                onClick={() => setSelectedSuggestion(sug)}
              >
                <p className="font-semibold">{sug.verse}</p>
                <p className="text-sm">{sug.theme}</p>
              </li>
            ))}
          </ul>
          <button
            onClick={handleGetCommentary}
            className="mt-4 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-lg transition duration-300 disabled:bg-gray-400 w-full flex items-center justify-center"
            disabled={!canGenerateSermon || commentaryLoading || !selectedSuggestion}
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
            <span className={`${isLoading ? 'ml-2' : ''}`}>{t('generateSermonFromChat', lang)}</span>
          </button>
        </div>
      )}
      
      {setSermonDraft && (
           <button
              onClick={() => reviseDraft(window.getSelection().toString().trim())}
              className="mt-4 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-xl shadow-lg transition duration-300 w-full flex items-center justify-center"
              disabled={isLoading}
              >
              {isLoading && <LoadingSpinner />}
              <span className={`${isLoading ? 'ml-2' : ''}`}>{t('editWithAiTitle', lang)}</span>
             </button>
      )}
    </div>
  );
};

export default RealLifeSermonComponent;