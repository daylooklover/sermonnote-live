// components/SermonFilter.js
'use client';

import React, { useState } from 'react';

export default function SermonFilter() {
    const [search, setSearch] = useState('');

    const handleSearch = () => {
        // 이 alert는 나중에 실제 검색 로직으로 교체될 예정입니다.
        alert(`검색어: ${search}`);
    };

    return (
        <div className="mb-8 flex justify-center items-center space-x-2">
            <input
                type="text"
                placeholder="설교 제목 검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full max-w-md p-4 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
                onClick={handleSearch}
                className="px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition duration-300"
            >
                검색
            </button>
        </div>
    );
}
