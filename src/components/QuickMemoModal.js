'use client';

import React, { useState, useEffect, useRef } from 'react';

// 아이콘 및 라이브러리
import { MicIcon, SaveIcon, CloseIcon, LoadingSpinner } from './IconComponents';
import { t } from '@/lib/translations';

// 수정된 부분: Firebase 함수를 직접 import 합니다.
import { addQuickMemo, checkDailyMemoLimit } from '@/lib/firebase';

const QuickMemoModal = ({ 
    isOpen, 
    onClose, 
    memoCount, 
    memoLimit, 
    lang, 
    openLoginModal, 
    user, 
    onMemoAdded
}) => {
    const [memoText, setMemoText] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const [isLoading, setIsLoading] = useState(false);
    const [modalErrorMessage, setModalErrorMessage] = useState('');

    useEffect(() => {
        if (isOpen) {
            setModalErrorMessage('');
            setMemoText('');
        }
    }, [isOpen]);

    const handleStartRecording = async () => {
        if (!user) {
            openLoginModal();
            return;
        }
        if (isRecording) {
            mediaRecorderRef.current?.stop();
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = event => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                setIsRecording(false);
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm; codecs=opus' });
                
                if (audioBlob.size === 0) {
                    setModalErrorMessage(t('noAudioData', lang));
                    return;
                }

                setIsLoading(true);
                setModalErrorMessage(t('generating', lang));

                try {
                    const reader = new FileReader();
                    reader.onloadend = async () => {
                        const base64Audio = reader.result.split(',')[1];
                        const response = await fetch('/api/transcribe', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ audio: base64Audio })
                        });
                        const data = await response.json();
                        if (data.transcript) {
                            setMemoText(data.transcript);
                            setModalErrorMessage('');
                        } else {
                            setModalErrorMessage(data.message || t('aiTranscriptionFailed', lang));
                        }
                    };
                    reader.readAsDataURL(audioBlob);
                } catch (error) {
                    console.error('Transcription failed:', error);
                    setModalErrorMessage(t('aiTranscriptionFailed', lang));
                } finally {
                    setIsLoading(false);
                }
                
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setModalErrorMessage('');
        } catch (err) {
            console.error('Error accessing microphone:', err);
            setModalErrorMessage(t('micPermissionError', lang));
        }
    };

    const handleAddMemo = async () => {
        if (!user) { openLoginModal(); return; }
        if (memoText.trim() === '' || isLoading) { setModalErrorMessage(t('enterMemoContent', lang)); return; }
        
        setIsLoading(true);
        setModalErrorMessage('');

        try {
            // 이 컴포넌트 내부에서 함수를 직접 호출합니다.
            const currentMemoCount = await checkDailyMemoLimit(user.uid);
            if (currentMemoCount >= memoLimit) {
                setModalErrorMessage(t('memoLimitReached', lang, memoLimit));
                return;
            }
            
            await addQuickMemo(user.uid, memoText);
            setMemoText('');
            onClose();
            if (onMemoAdded) {
                onMemoAdded();
            }
            setModalErrorMessage('');
        } catch (error) {
            setModalErrorMessage(t('failedToSaveMemo', lang));
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900">{t('quickMemoTitle', lang)}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-900 transition"><CloseIcon /></button>
                </div>
                <div className="space-y-4">
                    {modalErrorMessage && (<div className="bg-red-100 text-red-700 p-3 rounded-xl">{modalErrorMessage}</div>)}
                    <div>
                        <p className="text-sm text-gray-500">
                            {t('memoLimitMessage', lang, memoLimit, memoCount)}
                        </p>
                    </div>
                    <textarea
                        value={memoText}
                        onChange={(e) => setMemoText(e.target.value)}
                        placeholder={t('quickMemoPlaceholder', lang)}
                        rows="4"
                        className="w-full p-3 rounded-md bg-gray-100 text-gray-800 placeholder-gray-400 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        disabled={isRecording || isLoading}
                    />
                    <div className="flex justify-between items-center space-x-2">
                        <button
                            onClick={handleStartRecording}
                            className={`flex items-center justify-center flex-grow py-3 rounded-md font-semibold text-white transition ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-800'}`}
                            disabled={isLoading}
                        >
                            {isRecording ? <LoadingSpinner /> : <MicIcon />}
                            <span className="ml-2">{isRecording ? t('recording', lang) : t('voiceMemo', lang)}</span>
                        </button>
                        <button
                            onClick={handleAddMemo}
                            className="flex items-center justify-center flex-grow py-3 rounded-md font-semibold text-white bg-green-500 hover:bg-green-600 transition"
                            disabled={memoText.trim() === '' || isLoading}
                        >
                            {isLoading ? <LoadingSpinner /> : <SaveIcon />}
                            <span className="ml-2">{isLoading ? t('saving', lang) : t('save', lang)}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuickMemoModal;