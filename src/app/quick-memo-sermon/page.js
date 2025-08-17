'use client';

import React from 'react';
import Link from 'next/link';

export default function QuickMemoSermonPage() {
    return (
        <main className="min-h-screen bg-gray-900 text-white font-sans p-6">
            <header className="flex justify-between items-center py-4 border-b border-gray-700">
                <Link href="/sermon-selection">
                    <h1 className="text-2xl font-bold text-white cursor-pointer">SermonNote</h1>
                </Link>
                <div className="flex items-center space-x-4">
                    <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition">뒤로가기</button>
                </div>
            </header>
            <div className="container mx-auto py-12 text-center">
                <h1 className="text-4xl font-bold text-blue-400">퀵 메모 연계 설교</h1>
                <p className="mt-4">이곳에 퀵 메모 연계 설교 기능이 들어갈 예정입니다.</p>
            </div>
        </main>
    );
}
