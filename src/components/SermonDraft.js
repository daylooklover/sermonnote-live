// src/components/SermonDraft.js
'use client';

import React, { useState, useCallback } from 'react';
import { t } from '@/lib/translations';

// 설교문 초안을 표시하고 편집할 수 있는 컴포넌트
const SermonDraft = ({ sermonDraft, setSermonDraft, lang, onSave, onDownload }) => {
    const handleSave = useCallback(() => {
        if (sermonDraft.trim() !== '') {
            onSave(sermonDraft);
        }
    }, [sermonDraft, onSave]);

    const handleDownload = useCallback(() => {
        if (sermonDraft.trim() !== '') {
            onDownload(sermonDraft);
        }
    }, [sermonDraft, onDownload]);

    return (
        <div className="flex flex-col space-y-4 p-4 rounded-xl bg-white border border-gray-300 h-full">
            <h3 className="text-2xl font-semibold text-gray-800">{t('sermonDraftTitle', lang)}</h3>
            <textarea
                className="flex-grow p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('sermonDraftPlaceholder', lang)}
                value={sermonDraft}
                onChange={(e) => setSermonDraft(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
                <button
                    onClick={handleSave}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-lg transition duration-300 disabled:bg-gray-400"
                    disabled={sermonDraft.trim() === ''}
                >
                    {t('saveDraft', lang)}
                </button>
                <button
                    onClick={handleDownload}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg transition duration-300 disabled:bg-gray-400"
                    disabled={sermonDraft.trim() === ''}
                >
                    {t('downloadDraft', lang)}
                </button>
            </div>
        </div>
    );
};

export default SermonDraft;
