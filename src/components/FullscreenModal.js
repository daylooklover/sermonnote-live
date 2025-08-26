// src/components/FullscreenModal.js
'use client';
import React from 'react';
import { CloseIcon } from './IconComponents';

export default function FullscreenModal({ isOpen, onClose, content, setContent, isEditing, setIsEditing, onSave, onPrint }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-95 flex flex-col p-8">
            <div className="flex-grow flex flex-col bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-white">설교문 전체 보기</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors">
                        <CloseIcon />
                    </button>
                </div>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    readOnly={!isEditing}
                    className={`flex-grow w-full p-4 rounded-xl bg-gray-700 text-white resize-none border ${isEditing ? 'border-blue-500' : 'border-gray-600'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <div className="flex justify-end space-x-4 mt-4">
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`px-4 py-2 rounded-xl font-semibold transition-colors ${isEditing ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-white'}`}
                    >
                        수정
                    </button>
                    <button onClick={onSave} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors">
                        저장
                    </button>
                    <button onClick={onPrint} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors">
                        인쇄
                    </button>
                    <button onClick={onClose} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors">
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
}