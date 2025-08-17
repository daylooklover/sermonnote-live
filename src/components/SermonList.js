// components/SermonList.js
'use client';

import React from 'react';

export default function SermonList() {
    const sermons = [
        { id: 1, title: '믿음의 기초', preacher: '홍길동' },
        { id: 2, title: '사랑과 용서', preacher: '이순신' },
        { id: 3, title: '희망의 메시지', preacher: '김유신' },
    ];

    return (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
            {sermons.map((sermon) => (
                <li key={sermon.id} className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:bg-gray-700 transition cursor-pointer">
                    <h4 className="text-xl font-bold">{sermon.title}</h4>
                    <p className="text-gray-400">설교자: {sermon.preacher}</p>
                </li>
            ))}
        </ul>
    );
}
