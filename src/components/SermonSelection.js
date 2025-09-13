'use client';
import React from 'react';
import { PlusCircleIcon, SearchIcon, RealLifeIcon, QuickMemoIcon } from './IconComponents';

// 새로운 아이콘 컴포넌트 추가
const RebirthIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001m0 0l-2.499 2.499m2.499-2.499-2.499-2.499M12.99 21.042c-.411 0-.822-.034-1.222-.102M12 21a9 9 0 0 0 9-9c0-2.46-.948-4.7-2.499-6.39m-1.468-1.56a9 9 0 0 0-14.542 0A9 9 0 0 0 21 12c0 .411.034.822.102 1.222M12 21a9 9 0 0 1-9-9c0-2.46.948-4.7 2.499-6.39m1.468-1.56a9 9 0 0 1 14.542 0" />
  </svg>
);

const PremiumIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M10.788 3.21c.44-.91.956-1.545 1.212-1.545s.772.635 1.212 1.545a3.182 3.182 0 0 0 4.113.882c.91-.44 1.545-.956 1.545-1.212s-.635-.772-1.545-1.212a3.182 3.182 0 0 0-.882-4.113c-.44-.91-.956-1.545-1.212-1.545s-.772.635-1.212 1.545a3.182 3.182 0 0 0-4.113-.882c-.91.44-1.545.956-1.545 1.212s.635.772 1.545 1.212a3.182 3.182 0 0 0 .882 4.113ZM12 4.5a7.5 7.5 0 0 0-7.5 7.5c0 4.142 3.358 7.5 7.5 7.5s7.5-3.358 7.5-7.5a7.5 7.5 0 0 0-7.5-7.5ZM12 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" clipRule="evenodd" />
  </svg>
);


export default function SermonSelection({ setSelectedSermonType }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-4xl font-bold mb-8 text-blue-400">설교 유형 선택</h1>
            {/* Grid 레이아웃을 2-3-4 열로 변경하여 새로운 버튼을 추가할 공간 확보 */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
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

                {/* '설교의 재탄생' 카드 추가 */}
                <button
                    onClick={() => setSelectedSermonType('rebirth-sermon')}
                    className="p-8 rounded-2xl border border-blue-400 shadow-lg bg-gray-800 hover:bg-gray-700 transition duration-300 transform hover:scale-105"
                >
                    <div className="flex justify-center mb-4 text-blue-400"><RebirthIcon className="h-12 w-12" /></div>
                    <h4 className="text-2xl font-semibold mb-2 text-white">설교의 재탄생</h4>
                    <p className="text-gray-400">기존 설교문을 재구성하고 다듬습니다.</p>
                </button>

                {/* '프리미엄 가입' 카드 추가 */}
                <button
                    onClick={() => alert('프리미엄 가입 기능은 준비 중입니다.')}
                    className="p-8 rounded-2xl border border-yellow-400 shadow-lg bg-gray-800 hover:bg-gray-700 transition duration-300 transform hover:scale-105"
                >
                    <div className="flex justify-center mb-4 text-yellow-400"><PremiumIcon className="h-12 w-12" /></div>
                    <h4 className="text-2xl font-semibold mb-2 text-white">프리미엄 가입</h4>
                    <p className="text-gray-400">더 많은 설교 유형과 고급 기능을 사용하세요.</p>
                </button>

            </div>
        </div>
    );
}
