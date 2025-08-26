// src/components/HeaderComponent.js
'use client';

import React from 'react';
import Link from 'next/link';

// 필요한 아이콘을 IconComponents.js에서 가져옵니다.
import { LogOutIcon } from './IconComponents';

// 언어 데이터를 import합니다.
import { translations } from '@/lib/translations';

const HeaderComponent = ({ lang, setLang, user }) => {
    const t = (key) => translations[lang]?.[key] || key;
    
    return (
        <header className="p-6 bg-white border-b border-gray-200 flex items-center justify-between shadow-sm w-full">
            <div className="flex items-center space-x-4">
                <Link href="/" passHref>
                    <h1 className="text-3xl font-extrabold text-gray-900 cursor-pointer">SermonNote</h1>
                </Link>
            </div>
            <div className="flex items-center space-x-4">
                {user && (
                    <p className="text-sm text-gray-600 hidden sm:block">{t('welcome', user.email)}</p>
                )}
                <select
                    onChange={(e) => setLang(e.target.value)}
                    value={lang}
                    className="bg-gray-100 text-gray-800 rounded-lg p-2 border border-gray-300"
                >
                    <option value="ko">한국어</option>
                    <option value="en">English</option>
                    <option value="zh">中文</option>
                    <option value="ja">日本語</option>
                    <option value="ru">Русский</option>
                    <option value="vi">Tiếng Việt</option>
                    <option value="fil">Filipino</option>
                </select>
            </div>
        </header>
    );
};

export default HeaderComponent;
