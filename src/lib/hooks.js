// src/lib/hooks.js
import { useState, useCallback } from 'react';

import { incrementUsageCount, SUBSCRIPTION_LIMITS } from '@/lib/firebase';
import { t } from '@/lib/translations';

/**
 * 설교 생성 관련 로직을 관리하는 커스텀 훅.
 * @param {string} userId - 현재 로그인된 사용자의 ID.
 * @param {function} setSermonDraft - 설교 초안을 업데이트하는 상태 함수.
 * @param {function} setErrorMessage - 오류 메시지를 설정하는 상태 함수.
 * @param {boolean} canGenerateSermon - 설교 생성이 가능한지 여부.
 * @param {boolean} canGenerateCommentary - 주석 생성이 가능한지 여부.
 * @param {string} lang - 현재 언어 설정.
 * @param {object} user - 현재 사용자 객체.
 * @param {function} openLoginModal - 로그인 모달을 여는 함수.
 * @param {function} onLimitReached - 사용량 제한 도달 시 호출될 함수.
 * @param {number} sermonCount - 이번 달 설교 생성 횟수.
 * @param {number} commentaryCount - 이번 달 주석 생성 횟수.
 * @param {string} userSubscription - 현재 사용자 구독 등급.
 * @returns {object} - 설교 생성 함수와 로딩 상태.
 */
export const useSermonGeneration = (userId, setSermonDraft, setErrorMessage, canGenerateSermon, canGenerateCommentary, lang, user, openLoginModal, onLimitReached, sermonCount, commentaryCount, userSubscription) => {
    const [isLoading, setIsLoading] = useState(false);

    const generateSermon = useCallback(async (promptText, usageType = 'sermon') => {
        if (!user) { openLoginModal(); return; }

        const limits = SUBSCRIPTION_LIMITS[userSubscription] || {};
        if (usageType === 'sermon' && !canGenerateSermon) {
            setErrorMessage(t('sermonLimitError', lang, Math.max(0, limits.sermon - sermonCount)));
            onLimitReached();
            return;
        }
        if (usageType === 'commentary' && !canGenerateCommentary) {
            setErrorMessage(t('commentaryLimitError', lang, Math.max(0, limits.commentary - commentaryCount)));
            onLimitReached();
            return;
        }

        setIsLoading(true);
        setSermonDraft(t('generating', lang));
        setErrorMessage('');

        try {
            const text = await callGeminiAPI(promptText);
            setSermonDraft(text);
            await incrementUsageCount(usageType, userId, usageType === 'sermon' ? sermonCount : commentaryCount, setErrorMessage);
        } catch (error) {
            setSermonDraft(t('generationFailed', lang));
            console.error(error);
            setErrorMessage(t('generationFailed', lang));
        } finally {
            setIsLoading(false);
        }
    }, [userId, sermonCount, commentaryCount, setSermonDraft, setErrorMessage, canGenerateSermon, canGenerateCommentary, lang, user, openLoginModal, onLimitReached, userSubscription]);

    return { generateSermon, isLoading };
};
