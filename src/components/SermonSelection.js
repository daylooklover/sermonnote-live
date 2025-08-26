// src/components/SermonSelection.js
'use client';
import React from 'react';
import { PlusCircleIcon, SearchIcon, RealLifeIcon, QuickMemoIcon } from './IconComponents';

export default function SermonSelection({ setSelectedSermonType }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-4xl font-bold mb-8 text-blue-400">설교 유형 선택</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <button
                    onClick={() => setSelectedSermonType('sermon-assistant')}
                    className="p-8 rounded-2xl border border-gray-700 shadow-lg bg-gray-800 hover:bg-gray-700 transition duration-300 transform hover:scale-105"
                >
                    <div className="flex justify-center mb-4 text-blue-400"><PlusCircleIcon className="h-12 w-12" /></div>
                    <h4 className="text-2xl font-semibold mb-2 text-white">AI 설교 초안</h4>
                    <p className="text-gray-400">AI의 도움을 받아 설교 초안을 빠르게 생성합니다.</p>
                </button>
                <button
                    onClick={() => setSelectedSermonType('expository-sermon')}
                    className="p-8 rounded-2xl border border-gray-700 shadow-lg bg-gray-800 hover:bg-gray-700 transition duration-300 transform hover:scale-105"
                >
                    <div className="flex justify-center mb-4 text-gray-400"><SearchIcon className="h-12 w-12" /></div>
                    <h4 className="text-2xl font-semibold mb-2 text-white">강해 설교</h4>
                    <p className="text-gray-400">특정 성경 구절에 대한 강해 설교를 위한 도구입니다.</p>
                </button>
                <button
                    onClick={() => setSelectedSermonType('real-life-sermon')}
                    className="p-8 rounded-2xl border border-gray-700 shadow-lg bg-gray-800 hover:bg-gray-700 transition duration-300 transform hover:scale-105"
                >
                    <div className="flex justify-center mb-4 text-gray-400"><RealLifeIcon className="h-12 w-12" /></div>
                    <h4 className="text-2xl font-semibold mb-2 text-white">실생활 적용 설교</h4>
                    <p className="text-gray-400">실제 사건이나 주제에 대한 성경적 적용 설교를 생성합니다.</p>
                </button>
                <button
                    onClick={() => setSelectedSermonType('quick-memo-sermon')}
                    className="p-8 rounded-2xl border border-gray-700 shadow-lg bg-gray-800 hover:bg-gray-700 transition duration-300 transform hover:scale-105"
                >
                    <div className="flex justify-center mb-4 text-gray-400"><QuickMemoIcon className="h-12 w-12" /></div>
                    <h4 className="text-2xl font-semibold mb-2 text-white">퀵 메모 연계 설교</h4>
                    <p className="text-gray-400">흩어진 영감들을 엮어낸 설교를 만듭니다.</p>
                </button>
            </div>
        </div>
    );
}