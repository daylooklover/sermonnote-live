'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getAuth, onAuthStateChanged, signOut, signInAnonymously } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, addDoc, onSnapshot, query, orderBy, getDoc, setDoc, updateDoc, where, serverTimestamp } from 'firebase/firestore';

// Firebase utilities
import { app, auth, db, incrementUsageCount, SUBSCRIPTION_LIMITS, addQuickMemo, checkDailyMemoLimit } from '@/lib/firebase';
// Gemini utilities
import { callGeminiAPI } from '@/lib/gemini';
// PremiumSubscriptionPage 컴포넌트 import
import PremiumSubscriptionPage from './PremiumSubscriptionPage';

// Icon components
const LogOutIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>);
const PlusCircleIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus-circle"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>);
const SearchIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-book-text"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M8 7h6"/><path d="M8 11h8"/></svg>);
const SaveIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-save"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>);
const EditIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>);
const PrintIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-printer"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>);
const CloseIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x-circle"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>);
const FullscreenIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-maximize"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>);
const MicIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mic"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>);
const BookmarkIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bookmark"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>);
const RealLifeIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const QuickMemoIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clipboard-list"><rect width="8" height="4" x="8" y="2"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>);
const GoBackIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>);
const CheckIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check text-green-500"><path d="M20 6 9 17l-5-5"/></svg>);
const BibleIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-book-open-text"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/><path d="M6 8h2"/><path d="M6 12h2"/><path d="M16 8h2"/><path d="M16 12h2"/></svg>);

// Language specific text data object
const translations = {
    ko: {
        sermonAssistantTitle: '설교 도우미',
        assistantDescription: 'AI와 직접 대화하며 설교 아이디어를 발전시키세요.',
        commentaryLimit: (count) => `이번 달 주석 생성 남은 횟수: ${count}회`,
        sermonLimit: (count) => `이번 달 설교 작성 남은 횟수: ${count}회`,
        errorMessage: (message) => message,
        inputPlaceholder: 'AI에게 질문하세요...',
        sendButton: '전송',
        generateSermonFromChat: '대화 내용으로 설교문 생성',
        generating: '대화 내용을 바탕으로 설교문을 생성하는 중입니다...',
        generatedSermonTitle: '생성된 설교문:',
        expositorySermonTitle: '강해 설교',
        expositoryDescription: '특정 성경 구절에 대한 강해 설교를 위한 도구입니다.',
        getScripture: '구절 가져오기',
        scripturePlaceholder: '예: 요한복음 3:16',
        scriptureTitle: '성경 본문:',
        getCommentary: '주석 가져오기',
        aiCommentaryTitle: 'AI 주석:',
        addFullCommentary: '주석 전체 추가',
        realLifeSermonTitle: '실생활 적용 설교',
        realLifeDescription: '실제 사건이나 주제에 대한 성경적 적용 설교를 생성합니다.',
        suggestScriptureAndThemes: '구절과 주제 제안 받기',
        aiSuggestions: 'AI 제안:',
        quickMemoSermonTitle: '퀵 메모 연계 설교',
        quickMemoDescription: '흩어진 영감들을 엮어낸 설교를 만듭니다.',
        myMemos: '내 메모:',
        selectedMemo: '선택된 메모:',
        generateSermonFromMemo: '메모로 설교문 생성',
        editWithAiTitle: 'AI로 텍스트 편집하기',
        selectedContent: '선택한 내용:',
        summarize: '요약하기',
        elaborate: '상세 설명',
        rewrite: '문체 수정',
        findVerse: '구절 찾기',
        cancel: '취소',
        applyChanges: '변경 내용 적용',
        save: '저장',
        edit: '편집',
        print: '인쇄',
        close: '닫기',
        welcome: (userEmail) => `환영합니다, ${userEmail || '익명 사용자'}!`,
        goBack: '뒤로가기',
        logout: '로그아웃',
        chooseSermonType: '설교 유형 선택',
        chooseSermonTypeDescription: '만들고 싶은 설교 유형을 선택하세요.',
        sermonAssistantIntro: 'AI 기반 주석 및 설교 초안을 즉시 생성합니다.',
        expositoryIntro: '성경적 진리에 대한 깊이 있는 탐구와 정확한 해석을 위한 도구입니다.',
        expositoryIntro2: '성경적 진리에 대한 깊이 있는 탐구와 정확한 해석을 위한 도구입니다. 성경 구절을 입력하면 AI가 해설을 제공하고, 이를 기반으로 설교문을 작성할 수 있습니다.',
        realLifeIntro: '일상에 스며드는 하나님의 말씀의 능력에 대한 설교를 만듭니다.',
        quickMemoIntro: '흩어진 영감들을 엮어낸 설교를 만듭니다.',
        noConversationError: '먼저 AI와 대화를 시작해주세요.',
        commentaryLimitError: '이번 달 주석 생성 횟수를 모두 사용했습니다. 구독 플랜을 확인해주세요.',
        sermonLimitError: '이번 달 설교 작성 횟수를 모두 사용했습니다. 구독 플랜을 확인해주세요.',
        generationFailed: '생성에 실패했습니다. 다시 시도해 주세요.',
        initialPrompt: '성경 본문이나 설교 주제에 대해 궁금한 점을 AI에게 물어보세요.',
        upgradeToPremium: '프리미엄으로 업그레이드',
        memoLimitReached: '하루 메모 작성 횟수 5개를 모두 사용했습니다.',
        aiTranscriptionFailed: '음성 변환 기능은 현재 지원하지 않습니다. 텍스트 메모를 이용해주세요.',
        language: '언어',
        korean: 'Korean',
        english: 'English',
        chinese: 'Chinese',
        japanese: 'Japanese',
        russian: 'Russian',
        vietnamese: 'Vietnamese',
        multilingualPromo: 'SermonNote는 다언어를 지원합니다!',
        addComment: '주석 추가',
        addCrossReferences: '상호 참조 추가',
    },
    en: {
        sermonAssistantTitle: 'Sermon Assistant',
        assistantDescription: 'Develop your sermon ideas by chatting directly with our AI.',
        commentaryLimit: (count) => `Commentary generations remaining this month: ${count}`,
        sermonLimit: (count) => `Sermon generations remaining this month: ${count}`,
        errorMessage: (message) => message,
        inputPlaceholder: 'Ask the AI a question...',
        sendButton: 'Send',
        generateSermonFromChat: 'Generate Sermon from Chat',
        generating: 'Generating sermon from conversation...',
        generatedSermonTitle: 'Generated Sermon:',
        expositorySermonTitle: 'Expository Sermon',
        expositoryDescription: 'A tool for deep exploration and precise interpretation of biblical truth.',
        getScripture: 'Get Scripture',
        scripturePlaceholder: 'e.g., John 3:16',
        scriptureTitle: 'Scripture:',
        getCommentary: 'Get Commentary',
        aiCommentaryTitle: 'AI Commentary:',
        addFullCommentary: 'Add Full Commentary',
        realLifeSermonTitle: 'Real-Life Application Sermon',
        realLifeDescription: 'Enter a real-life event or topic and get a sermon that applies God\'s Word to it.',
        suggestScriptureAndThemes: 'Suggest Scripture & Themes',
        aiSuggestions: 'AI Suggestions:',
        quickMemoSermonTitle: 'Quick Memo Linked Sermon',
        quickMemoDescription: 'Weaving scattered pieces of inspiration into a cohesive whole.',
        myMemos: 'My Memos:',
        selectedMemo: 'Selected Memo:',
        generateSermonFromMemo: 'Generate Sermon from Memo',
        editWithAiTitle: 'Edit Text with AI',
        selectedContent: 'Selected Text:',
        summarize: 'Summarize',
        elaborate: 'Elaborate',
        rewrite: 'Rewrite',
        findVerse: 'Find Verse',
        cancel: 'Cancel',
        applyChanges: 'Apply Changes',
        save: 'Save',
        edit: 'Edit',
        print: 'Print',
        close: 'Close',
        welcome: (userEmail) => `Welcome, ${userEmail || 'Anonymous User'}!`,
        goBack: 'Go Back',
        logout: 'Logout',
        chooseSermonType: 'Choose Sermon Type',
        chooseSermonTypeDescription: 'Select the type of sermon you want to create.',
        sermonAssistantIntro: 'Get AI-powered commentary and sermon drafts instantly.',
        expositoryIntro: 'Deep exploration of biblical truth and precise interpretation.',
        expositoryIntro2: 'Dive deep into biblical truth and precise interpretation. Enter a scripture passage and our AI will provide commentary, which you can use to craft your sermon.',
        realLifeIntro: 'The power of God\'s Word permeating daily life.',
        quickMemoIntro: 'Weaving scattered pieces of inspiration into a cohesive whole.',
        noConversationError: 'Please start a conversation with the AI first.',
        commentaryLimitError: 'You have reached your commentary generation limit for this month. Please check your subscription plan.',
        sermonLimitError: 'You have reached your sermon generation limit for this month. Please check your subscription plan.',
        generationFailed: 'Failed to generate sermon. Please try again.',
        initialPrompt: 'Ask the AI about a scripture passage or sermon topic to get started.',
        upgradeToPremium: 'Upgrade to Premium',
        memoLimitReached: 'You have reached the daily limit of 5 memos.',
        aiTranscriptionFailed: 'Voice transcription is not currently supported. Please use text memos.',
        language: 'Language',
        korean: 'Korean',
        english: 'English',
        chinese: 'Chinese',
        japanese: 'Japanese',
        russian: 'Russian',
        vietnamese: 'Vietnamese',
        multilingualPromo: 'SermonNote는 다언어를 지원합니다!',
        addComment: 'Add Comment',
        addCrossReferences: 'Add Cross References',
    },
    zh: {
        sermonAssistantTitle: '讲道助手',
        assistantDescription: '与AI直接对话，拓展您的讲道思路。',
        commentaryLimit: (count) => `本月剩余注释生成次数：${count}次`,
        sermonLimit: (count) => `本月剩余讲道稿撰写次数：${count}次`,
        errorMessage: (message) => message,
        inputPlaceholder: '向AI提问...',
        sendButton: '发送',
        generateSermonFromChat: '根据对话生成讲道稿',
        generating: '正在根据对话内容生成讲道稿...',
        generatedSermonTitle: '已生成的讲道稿：',
        expositorySermonTitle: '释经讲道',
        expositoryDescription: '深入探索圣经真理并进行精确解读的工具。',
        getScripture: '获取经文',
        scripturePlaceholder: '例如：约翰福音 3:16',
        scriptureTitle: '圣经经文：',
        getCommentary: '获取注释',
        aiCommentaryTitle: 'AI注释：',
        addFullCommentary: '添加完整注释',
        realLifeSermonTitle: '实际应用讲道',
        realLifeDescription: '根据真实事件或主题，生成应用神话语的讲道稿。',
        suggestScriptureAndThemes: '获取经文和主题建议',
        aiSuggestions: 'AI建议：',
        quickMemoSermonTitle: '快速备忘录关联讲道',
        quickMemoDescription: '将零散的灵感编织成一篇完整的讲道。',
        myMemos: '我的备忘录：',
        selectedMemo: '已选备忘录：',
        generateSermonFromMemo: '根据备忘录生成讲道稿',
        editWithAiTitle: '使用AI编辑文本',
        selectedContent: '已选内容：',
        summarize: '摘要',
        elaborate: '详细说明',
        rewrite: '修改文风',
        findVerse: '查找经文',
        cancel: '取消',
        applyChanges: '应用更改',
        save: '保存',
        edit: '编辑',
        print: '打印',
        close: '关闭',
        welcome: (userEmail) => `欢迎您，${userEmail || '匿名用户'}！`,
        goBack: '返回',
        logout: '登出',
        chooseSermonType: '选择讲道类型',
        chooseSermonTypeDescription: '请选择您想创建的讲道类型。',
        sermonAssistantIntro: '即时生成AI驱动的注释和讲道草稿。',
        expositoryIntro: '深入探索圣经真理和精确解读的工具。',
        expositoryIntro2: '深入探索圣经真理和精确解读的工具。输入圣经经文，AI将提供解说，您可以以此为基础撰写讲道稿。',
        realLifeIntro: '创作关于神的话语渗透日常生活的讲道。',
        quickMemoIntro: '将零散的灵感编织成一篇完整的讲道。',
        noConversationError: '请先与AI开始对话。',
        commentaryLimitError: '您本月的注释生成次数已用完。请查看您的订阅方案。',
        sermonLimitError: '您本月的讲道稿撰写次数已用完。请查看您的订阅方案。',
        generationFailed: '生成失败。请重试。',
        initialPrompt: '请向AI询问圣经经文或讲道主题，即可开始。',
        upgradeToPremium: '升级至高级版',
        memoLimitReached: '您已达到每日备忘录撰写上限5条。',
        aiTranscriptionFailed: '目前不支持语音转录功能。请使用文字备忘录。',
        language: '语言',
        korean: '한국어',
        english: '영어',
        chinese: '中文',
        japanese: '日本語',
        russian: 'ロシア語',
        vietnamese: 'ベトナム語',
        multilingualPromo: 'SermonNoteは多言語に対応しました！',
        addComment: '注釈を追加',
        addCrossReferences: '相互参照を追加',
    },
    ja: {
        sermonAssistantTitle: '説教アシスタント',
        assistantDescription: 'AIと直接対話して、説教のアイデアを練りましょう。',
        commentaryLimit: (count) => `今月の注釈生成残り回数：${count}回`,
        sermonLimit: (count) => `今月の説教作成残り回数：${count}回`,
        errorMessage: (message) => message,
        inputPlaceholder: 'AIに質問してください...',
        sendButton: '送信',
        generateSermonFromChat: '対話内容から説教文を作成',
        generating: '対話内容に基づいて説教文を作成中です...',
        generatedSermonTitle: '生成された説教文：',
        expositorySermonTitle: '釈義説教',
        expositoryDescription: '特定の聖書箇所に対する釈義説教のためのツールです。',
        getScripture: '聖書箇所を取得',
        scripturePlaceholder: '例：ヨハネによる福音書 3:16',
        scriptureTitle: '聖書本文：',
        getCommentary: '注釈を取得',
        aiCommentaryTitle: 'AI注釈：',
        addFullCommentary: '注釈全体を追加',
        realLifeSermonTitle: '実生活への適用説教',
        realLifeDescription: '実際の出来事やテーマに対する聖書的な適用説教を作成します。',
        suggestScriptureAndThemes: '聖書箇所とテーマの提案を受ける',
        aiSuggestions: 'AIの提案：',
        quickMemoSermonTitle: 'クイックメモ連携説教',
        quickMemoDescription: '断片的なインスピレーションを繋ぎ合わせて説教を作成します。',
        myMemos: '私のメモ：',
        selectedMemo: '選択されたメモ：',
        generateSermonFromMemo: 'メモから説教文を作成',
        editWithAiTitle: 'AIでテキストを編集',
        selectedContent: '選択した内容：',
        summarize: '要約',
        elaborate: '詳細な説明',
        rewrite: '文体修正',
        findVerse: '聖書箇所を検索',
        cancel: 'キャンセル',
        applyChanges: '変更を適用',
        save: '保存',
        edit: '編集',
        print: '印刷',
        close: '閉じる',
        welcome: (userEmail) => `ようこそ、${userEmail || '匿名ユーザー'}さん！`,
        goBack: '戻る',
        logout: 'ログアウト',
        chooseSermonType: '説教タイプの選択',
        chooseSermonTypeDescription: '作成したい説教タイプを選択してください。',
        sermonAssistantIntro: 'AIによる注釈と説教草稿を即座に生成します。',
        expositoryIntro: '聖書的真理を深く探求し、正確に解釈するためのツールです。',
        expositoryIntro2: '聖書的真理を深く探求し、正確に解釈するためのツールです。聖書箇所を入力すると、AIが解説を提供し、それを基に説教文を作成できます。',
        realLifeIntro: '日々の生活に浸透する神の言葉の力についての説教を作成します。',
        quickMemoIntro: '断片的なインスピレーションを繋ぎ合わせて説教を作成します。',
        noConversationError: 'まずAIとの対話を開始してください。',
        commentaryLimitError: '今月の注釈生成回数をすべて使用しました。サブスクリプションプランをご確認ください。',
        sermonLimitError: '今月の説教作成回数をすべて使用しました。サブスクリプションプランをご確認ください。',
        generationFailed: '生成に失敗しました。もう一度お試しください。',
        initialPrompt: '聖書箇所や説教のテーマについてAIに質問して始めてください。',
        upgradeToPremium: 'プレミアムにアップグレード',
        memoLimitReached: '1日のメモ作成回数上限である5回に達しました。',
        aiTranscriptionFailed: '音声書き起こし機能は現在サポートされていません。テキストメモをご利用ください。',
        language: '言語',
        korean: '韓国語',
        english: '英語',
        chinese: '中国語',
        japanese: '日本語',
        russian: 'ロシア語',
        vietnamese: 'ベトナム어',
        multilingualPromo: 'SermonNote는 다언어를 지원합니다!',
        addComment: '注釈を追加',
        addCrossReferences: '相互参照を追加',
    },
    fil: {
        sermonAssistantTitle: 'Katulong sa Pagsesermon',
        assistantDescription: 'Paunlarin ang iyong mga ideya sa sermon sa pamamagitan ng direktang pakikipag-ugnayan sa aming AI.',
        commentaryLimit: (count) => `Natitirang henerasyon ng komentaryo ngayong buwan: ${count} beses`,
        sermonLimit: (count) => `Natitirang henerasyon ng sermon ngayong buwan: ${count} beses`,
        errorMessage: (message) => message,
        inputPlaceholder: 'Magtanong sa AI...',
        sendButton: 'Ipadala',
        generateSermonFromChat: 'Bumuo ng sermon mula sa chat',
        generating: 'Bumubuo ng sermon mula sa pag-uusap...',
        generatedSermonTitle: 'Nabuo na Sermon:',
        expositorySermonTitle: 'Sermon na Pang-eksposisyon',
        expositoryDescription: 'Isang tool para sa malalim na paggalugad at tumpak na interpretasyon ng katotohanan ng Bibliya.',
        getScripture: 'Kumuha ng Sipi',
        scripturePlaceholder: 'hal., Juan 3:16',
        scriptureTitle: 'Sipi ng Bibliya:',
        getCommentary: 'Kumuha ng Komentaryo',
        aiCommentaryTitle: 'Komentaryo ng AI:',
        addFullCommentary: 'Idagdag ang Buong Komentaryo',
        realLifeSermonTitle: 'Sermon na may Aplikasyon sa Totoong Buhay',
        realLifeDescription: 'Gumawa ng sermon na may aplikasyong Biblikal para sa isang tunay na pangyayari o paksa.',
        suggestScriptureAndThemes: 'Magmungkahi ng Sipi at Tema',
        aiSuggestions: 'Mga Mungkahi ng AI:',
        quickMemoSermonTitle: 'Sermon na Nakaugnay sa Mabilisang Paalala',
        quickMemoDescription: 'Pinagbubuklod ang mga kalat-kalat na inspirasyon upang makabuo ng isang buong sermon.',
        myMemos: 'Aking Mga Paalala:',
        selectedMemo: 'Napiling Paalala:',
        generateSermonFromMemo: 'Bumuo ng sermon mula sa paalala',
        editWithAiTitle: 'I-edit ang Teksto gamit ang AI',
        selectedContent: 'Napiling Nilalaman:',
        summarize: 'Lagumin',
        elaborate: 'Detalyado',
        rewrite: 'Muling isulat',
        findVerse: 'Maghanap ng Sipi',
        cancel: 'Kanselahin',
        applyChanges: 'Ilapat ang mga Pagbabago',
        save: 'I-save',
        edit: 'I-edit',
        print: 'I-print',
        close: 'Isara',
        welcome: (userEmail) => `Maligayang pagdating, ${userEmail || 'Anonymous User'}!`,
        goBack: 'Bumalik',
        logout: 'Mag-log out',
        chooseSermonType: 'Pumili ng Uri ng Sermon',
        chooseSermonTypeDescription: 'Piliin ang uri ng sermon na nais mong gawin.',
        sermonAssistantIntro: 'Agad na bumuo ng komentaryo at bản nháp bài giảng na pinapagana ng AI.',
        expositoryIntro: 'Isang tool para sa malalim na paggalugad at tumpak na interpretasyon ng katotohanan ng Bibliya.',
        expositoryIntro2: 'Isang tool para sa malalim na paggalugad at tumpak na interpretasyon ng katotohanan ng Bibliya. Maglagay ng sipi ng Bibliya at ang aming AI ay magbibigay ng komentaryo, na maaari mong gamitin upang buuin ang iyong sermon.',
        realLifeIntro: 'Sức mạnh ng Salita ng Diyos na sumasalamin sa pang-araw-araw na buhay.',
        quickMemoIntro: 'Pinagbubuklod ang mga kalat-kalat na inspirasyon upang makabuo ng isang buong sermon.',
        noConversationError: 'Mangyaring magsimula muna ng pag-uusap sa AI.',
        commentaryLimitError: 'Bạn đã đạt giới hạn tạo chú giải trong tháng này. Vui lòng kiểm tra gói đăng ký của bạn.',
        sermonLimitError: 'Bạn đã đạt giới hạn tạo bài giảng trong tháng này. Vui lòng kiểm tra gói đăng ký của bạn.',
        generationFailed: 'Nabigo ang pagbuo. Pakisubukang muli.',
        initialPrompt: 'Magtanong sa AI tungkol sa isang sipi ng Bibliya o paksa ng sermon upang makapagsimula.',
        upgradeToPremium: 'Mag-upgrade sa Premium',
        memoLimitReached: 'Naabot mo na ang araw-araw na limitasyon na 5 na paalala.',
        aiTranscriptionFailed: 'Ang voice transcription ay kasalukuyang hindi suportado. Mangyaring gumamit ng mga text memo.',
        language: 'Wika',
        korean: 'Koreano',
        english: 'Ingles',
        chinese: 'Tsino',
        japanese: 'Hapon',
        russian: 'Ruso',
        vietnamese: 'Vietnamese',
        multilingualPromo: 'SermonNote hiện đã hỗ trợ nhiều ngôn ngữ!',
        addComment: 'Magdagdag ng Komentaryo',
        addCrossReferences: 'Magdagdag ng Cross-References',
    },
};

// Simple function for text translation
const t = (key, lang) => {
    const selectedLang = translations[lang] ? lang : 'ko';
    return translations[selectedLang]?.[key] || key;
};

// Custom Hook for Sermon Generation Logic
const useSermonGeneration = (userId, setSermonDraft, setErrorMessage, canGenerateSermon, canGenerateCommentary, lang, user, openLoginModal, onLimitReached, sermonCount, commentaryCount) => {
    
    const [isLoading, setIsLoading] = useState(false);
    
    const generateSermon = useCallback(async (promptText, usageType = 'sermon') => {
        if (!user) { openLoginModal(); return; }
        
        if (usageType === 'sermon' && !canGenerateSermon) { 
            setErrorMessage(t('sermonLimitError', lang)); 
            onLimitReached(); 
            return; 
        }
        if (usageType === 'commentary' && !canGenerateCommentary) { 
            setErrorMessage(t('commentaryLimitError', lang)); 
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
    }, [userId, sermonCount, commentaryCount, setSermonDraft, setErrorMessage, canGenerateSermon, canGenerateCommentary, lang, user, openLoginModal, onLimitReached]);

    const reviseDraft = useCallback(async (selectedText) => {
        if (!user) { openLoginModal(); return; }
        if (!selectedText) { setErrorMessage(t('selectContentToEdit', lang)); return; }

        const comment = prompt(t('editWithAiTitle', lang));
        if (!comment) return;

        setIsLoading(true);
        setSermonDraft(t('generating', lang));
        setErrorMessage('');
        try {
            const promptText = `Based on the following user-selected text and a user comment, please revise the text.
            User-selected text: "${selectedText}"
            User comment: "${comment}"
            
            Please provide the revised text in ${lang === 'ko' ? 'Korean' : 'English'}.`;
            
            const revisedText = await callGeminiAPI(promptText);
            setSermonDraft(revisedText);
        } catch (error) {
            setSermonDraft(t('generationFailed', lang));
            console.error(error);
            setErrorMessage(t('generationFailed', lang));
        } finally {
            setIsLoading(false);
        }
    }, [user, openLoginModal, setSermonDraft, setErrorMessage, lang]);

    return { generateSermon, reviseDraft, isLoading };
};

// QuickMemoModal Component
const QuickMemoModal = ({ isOpen, onClose, onAddMemo, memoCount, memoLimit, lang, openLoginModal, user, onMemoAdded }) => {
    const [memoText, setMemoText] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const [isLoading, setIsLoading] = useState(false);
    const [modalErrorMessage, setModalErrorMessage] = useState('');

    useEffect(() => {
        if (isOpen) {
            setModalErrorMessage('');
        }
    }, [isOpen]);

    const handleStartRecording = async () => {
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
                setIsLoading(true);
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm; codecs=opus' });
                const reader = new FileReader();
                reader.onloadend = async () => {
                    const base64Audio = reader.result.split(',')[1];
                    try {
                        const response = await fetch('/api/transcribe', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ audio: base64Audio })
                        });
                        const data = await response.json();
                        if (data.transcript) {
                            setMemoText(data.transcript);
                        } else {
                            setModalErrorMessage(data.message || t('transcriptionFailed', lang));
                        }
                    } catch (error) {
                        console.error('Transcription failed:', error);
                        setModalErrorMessage(t('transcriptionFailedError', lang));
                    } finally {
                        setIsLoading(false);
                    }
                };
                reader.readAsDataURL(audioBlob);
                
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
        
        const currentMemoCount = await checkDailyMemoLimit(user.uid);
        if (currentMemoCount >= memoLimit) { setModalErrorMessage(t('memoLimitReached', lang)(memoLimit)); return; }
        
        try {
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
                            {t('memoLimitMessage', lang)(memoLimit, memoCount)}
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
                            <MicIcon />
                            <span className="ml-2">{isRecording ? t('recording', lang) : t('voiceMemo', lang)}</span>
                        </button>
                        <button
                            onClick={handleAddMemo}
                            className="flex items-center justify-center flex-grow py-3 rounded-md font-semibold text-white bg-green-500 hover:bg-green-600 transition"
                            disabled={memoText.trim() === '' || isLoading}
                        >
                            <SaveIcon />
                            <span className="ml-2">{t('save', lang)}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ExpositorySermon Component
const ExpositorySermonComponent = ({ setSermonDraft, userId, commentaryCount, userSubscription, setErrorMessage, lang, user, openLoginModal, onLimitReached, sermonCount, canGenerateSermon, canGenerateCommentary }) => {
    const [scriptureInput, setScriptureInput] = useState('');
    const [scriptureText, setScriptureText] = useState('');
    const [commentary, setCommentary] = useState('');
    const [crossReferences, setCrossReferences] = useState([]);
    
    const { generateSermon, reviseDraft, isLoading: sermonIsLoading } = useSermonGeneration(userId, setSermonDraft, setErrorMessage, canGenerateSermon, canGenerateCommentary, lang, user, openLoginModal, onLimitReached, sermonCount, commentaryCount);
    const [commentaryLoading, setCommentaryLoading] = useState(false);

    const handleGetCommentaryAndReferences = useCallback(async () => {
        if (!user) { openLoginModal(); return; }
        if (!canGenerateCommentary) { setErrorMessage(t('commentaryLimitError', lang)); onLimitReached(); return; }
        if (scriptureInput.trim() === '') { setErrorMessage(t('enterScriptureReference', lang)); return; }

        setCommentaryLoading(true);
        setCommentary(t('generating', lang));
        setCrossReferences([]);
        setErrorMessage('');
        try {
            const promptText = `Based on the following scripture reference, provide a detailed expository commentary and a list of 3-5 relevant cross-reference verses with a brief explanation for each. Format the response with a clear "Commentary:" section and a "Cross-References:" section.
            Scripture: "${scriptureInput}"
            
            The response should be in ${lang === 'ko' ? 'Korean' : 'English'}.`;

            const fullResponse = await callGeminiAPI(promptText);
            
            const commentaryMatch = fullResponse.match(/Commentary:\s*([\s\S]*?)(?=Cross-References:|$)/);
            const referencesMatch = fullResponse.match(/Cross-References:\s*([\s\S]*)/);
            
            if (commentaryMatch) {
                setCommentary(commentaryMatch[1].trim());
            } else {
                setCommentary(fullResponse);
            }

            if (referencesMatch) {
                const references = referencesMatch[1].trim().split('\n').map(line => line.trim()).filter(line => line.length > 0);
                setCrossReferences(references);
            }

            await incrementUsageCount('commentary', userId, commentaryCount, setErrorMessage);
        } catch (error) {
            setCommentary(t('generationFailed', lang));
            console.error(error);
        } finally {
            setCommentaryLoading(false);
        }
    }, [scriptureInput, setCommentary, setCrossReferences, setErrorMessage, canGenerateCommentary, userId, commentaryCount, lang, user, openLoginModal, onLimitReached]);

    const handleAddSelectedText = useCallback((textToAdd) => {
        if (textToAdd && textToAdd.trim()) {
            setSermonDraft(prevDraft => prevDraft ? `${prevDraft}\n\n${textToAdd}` : textToAdd);
        }
    }, [setSermonDraft]);

    const handleGetScripture = async () => {
        if (!user) { openLoginModal(); return; }
        if (scriptureInput.trim() === '') { setErrorMessage(t('enterScriptureReference', lang)); return; }
        
        setSermonDraft(t('gettingScripture', lang));
        setErrorMessage('');
        try {
            const promptText = `Please provide the full text for the following scripture reference in ${lang === 'ko' ? 'Korean' : 'English'}: ${scriptureInput}`;
            const text = await callGeminiAPI(promptText);
            setScriptureText(text);
            setSermonDraft('');
        } catch (error) {
            setSermonDraft(t('generationFailed', lang));
            console.error(error);
            setErrorMessage(t('generationFailed', lang));
        }
    };

    return (
        <div className="flex flex-col items-center space-y-4 max-w-2xl mx-auto w-full">
            <h2 className="text-4xl font-extrabold text-gray-800">{t('expositorySermonTitle', lang)}</h2>
            <p className="text-lg text-gray-600 mb-4">{t('expositoryDescription', lang)}</p>
            
            {userSubscription !== 'premium' && (
                <p className="text-sm text-gray-500 mb-4">
                    {t('commentaryLimit', lang)(Math.max(0, SUBSCRIPTION_LIMITS[userSubscription].commentary - commentaryCount))}
                </p>
            )}

            <div className="w-full flex space-x-2">
                <input
                    type="text"
                    value={scriptureInput}
                    onChange={(e) => setScriptureInput(e.target.value)}
                    placeholder={t('scripturePlaceholder', lang)}
                    className="flex-grow p-4 rounded-xl bg-white border border-gray-300 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    onClick={handleGetScripture}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg transition duration-300 disabled:bg-gray-400"
                    disabled={scriptureInput.trim() === ''}
                >
                    {t('getScripture', lang)}
                </button>
            </div>

            {scriptureText && (
                <div className="w-full p-4 rounded-xl bg-white border border-gray-300 text-left whitespace-pre-wrap">
                    <p className="font-semibold text-gray-800 mb-2">{t('scriptureTitle', lang)}</p>
                    <p className="text-gray-600" onMouseUp={() => handleAddSelectedText(window.getSelection().toString())}>{scriptureText}</p>
                    <button
                        onClick={handleGetCommentaryAndReferences}
                        className="mt-4 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-lg transition duration-300 disabled:bg-gray-400 w-full"
                        disabled={!canGenerateCommentary || commentaryLoading}
                    >
                        {commentaryLoading ? t('generating', lang) : t('getCommentary', lang)}
                    </button>
                </div>
            )}
            
            {crossReferences.length > 0 && (
                <div className="w-full p-4 rounded-xl bg-white border border-gray-300 text-left">
                    <p className="font-semibold text-gray-800 mb-2">{t('crossReferencesTitle', lang)}</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                        {crossReferences.map((ref, index) => (
                            <li key={index}>{ref}</li>
                        ))}
                    </ul>
                </div>
            )}
            
            {commentary && (
                <div className="w-full p-4 rounded-xl bg-white border border-gray-300 text-left whitespace-pre-wrap">
                    <p className="font-semibold text-gray-800 mb-2">{t('aiCommentaryTitle', lang)}</p>
                    <p className="text-gray-600">{commentary}</p>
                    <button
                        onClick={async () => {
                            if (!user) { openLoginModal(); return; }
                            const promptText = `Based on the following commentary, write a detailed sermon in ${lang === 'ko' ? 'Korean' : 'English'}. Note: "${commentary}"`;
                            await generateSermon(promptText, 'sermon');
                        }}
                        className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg transition duration-300 disabled:bg-gray-400 w-full"
                        disabled={!canGenerateSermon || sermonIsLoading || commentary.trim() === ''}
                    >
                        {sermonIsLoading ? t('generating', lang) : t('generateSermonFromMemo', lang)}
                    </button>
                </div>
            )}
            
            {setSermonDraft && (
                 <button
                    onClick={() => reviseDraft(window.getSelection().toString().trim())}
                    className="mt-4 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-xl shadow-lg transition duration-300 w-full"
                    disabled={sermonIsLoading}
                   >
                    {t('editWithAiTitle', lang)}
                   </button>
            )}
        </div>
    );
};

// RealLifeSermon component
const RealLifeSermonComponent = ({ setSermonDraft, userId, sermonCount, userSubscription, setErrorMessage, lang, user, openLoginModal, onLimitReached, canGenerateSermon }) => {
    const [topicInput, setTopicInput] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [selectedSuggestion, setSelectedSuggestion] = useState(null);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    
    const { generateSermon, reviseDraft, isLoading: sermonIsLoading } = useSermonGeneration(userId, setSermonDraft, setErrorMessage, canGenerateSermon, true, lang, user, openLoginModal, onLimitReached, sermonCount, null);

    const handleSuggest = useCallback(async () => {
        if (!user) { openLoginModal(); return; }
        if (!canGenerateSermon) { setErrorMessage(t('sermonLimitError', lang)); onLimitReached(); return; }
        if (topicInput.trim() === '') { setErrorMessage(t('enterTopic', lang)); return; }
        
        setSuggestionsLoading(true);
        setSermonDraft(t('generatingSuggestions', lang));
        setSuggestions([]);
        setErrorMessage('');
        try {
            const promptText = `Based on the following real-life topic, suggest 3 relevant scripture verses and 3 sermon themes in a JSON array format. The JSON array should contain objects with keys "verse" and "theme". Topic: "${topicInput}"`;
            const generationConfig = {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            "verse": { "type": "STRING" },
                            "theme": { "type": "STRING" }
                        },
                        "propertyOrdering": ["verse", "theme"]
                    }
                }
            };
            const jsonText = await callGeminiAPI(promptText, generationConfig);
            const parsedJson = JSON.parse(jsonText);
            setSuggestions(parsedJson);
            setSermonDraft('');
        } catch (error) {
            setSermonDraft(t('generationFailed', lang));
            console.error(error);
        } finally {
            setSuggestionsLoading(false);
        }
    }, [topicInput, setSermonDraft, setErrorMessage, canGenerateSermon, lang, user, openLoginModal, onLimitReached]);

    const handleGenerateSermon = useCallback(async () => {
        if (!user) { openLoginModal(); return; }
        if (!selectedSuggestion) { setErrorMessage(t('selectSuggestionFirst', lang)); return; }
        const promptText = `Write a detailed sermon based on the following suggestion: "${selectedSuggestion.verse}" and theme: "${selectedSuggestion.theme}". The sermon should be written in ${lang === 'ko' ? 'Korean' : 'English'}.`;
        await generateSermon(promptText, 'sermon');
    }, [selectedSuggestion, generateSermon, setErrorMessage, user, openLoginModal, lang]);
    
    return (
        <div className="flex flex-col items-center space-y-4 max-w-2xl mx-auto w-full">
            <h2 className="text-4xl font-extrabold text-gray-800">{t('realLifeSermonTitle', lang)}</h2>
            <p className="text-lg text-gray-600 mb-4">{t('realLifeDescription', lang)}</p>

            {userSubscription !== 'premium' && (
                <p className="text-sm text-gray-500 mb-4">
                    {t('sermonLimit', lang)(Math.max(0, SUBSCRIPTION_LIMITS[userSubscription].sermon - sermonCount))}
                </p>
            )}

            <div className="w-full flex space-x-2">
                <input
                    type="text"
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    placeholder={t('scripturePlaceholder', lang)}
                    className="flex-grow p-4 rounded-xl bg-white border border-gray-300 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    onClick={handleSuggest}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg transition duration-300 disabled:bg-gray-400"
                    disabled={topicInput.trim() === '' || suggestionsLoading}
                >
                    {suggestionsLoading ? t('generating', lang) : t('suggestScriptureAndThemes', lang)}
                </button>
            </div>

            {suggestions.length > 0 && (
                <div className="w-full p-4 rounded-xl bg-white border border-gray-300 text-left">
                    <p className="font-semibold text-gray-800 mb-2">{t('aiSuggestions', lang)}</p>
                    <ul className="space-y-2">
                        {suggestions.map((sug, index) => (
                            <li key={index} className={`p-3 rounded-lg cursor-pointer transition ${selectedSuggestion && selectedSuggestion.verse === sug.verse ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                                onClick={() => setSelectedSuggestion(sug)}>
                                <p className="font-semibold">{sug.verse}</p>
                                <p className="text-sm">{sug.theme}</p>
                            </li>
                        ))}
                    </ul>
                    <button
                        onClick={handleGetCommentary}
                        className="mt-4 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-lg transition duration-300 disabled:bg-gray-400 w-full"
                        disabled={!selectedSuggestion || commentaryLoading}
                    >
                        {commentaryLoading ? t('generating', lang) : t('getCommentary', lang)}
                    </button>
                </div>
            )}
            
            {commentary && (
                <div className="w-full p-4 rounded-xl bg-white border border-gray-300 text-left whitespace-pre-wrap">
                    <p className="font-semibold text-gray-800 mb-2">{t('aiCommentaryTitle', lang)}</p>
                    <p className="text-gray-600">{commentary}</p>
                    <button
                        onClick={async () => {
                            if (!user) { openLoginModal(); return; }
                            const promptText = `Based on the following commentary, write a detailed sermon in ${lang === 'ko' ? 'Korean' : 'English'}. Note: "${commentary}"`;
                            await generateSermon(promptText, 'sermon');
                        }}
                        className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg transition duration-300 disabled:bg-gray-400 w-full"
                        disabled={!canGenerateSermon || sermonIsLoading || commentary.trim() === ''}
                    >
                        {sermonIsLoading ? t('generating', lang) : t('generateSermonFromMemo', lang)}
                    </button>
                </div>
            )}
            
            {setSermonDraft && (
                 <button
                    onClick={() => reviseDraft(window.getSelection().toString().trim())}
                    className="mt-4 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-xl shadow-lg transition duration-300 w-full"
                    disabled={sermonIsLoading}
                   >
                    {t('editWithAiTitle', lang)}
                   </button>
            )}
        </div>
    );
};

// QuickMemoSermon component
const QuickMemoSermonComponent = ({ setSermonDraft, userId, sermonCount, userSubscription, setErrorMessage, lang, user, openLoginModal, onLimitReached, memos, commentaryCount, canGenerateSermon, canGenerateCommentary }) => {
    const [selectedMemo, setSelectedMemo] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [selectedSuggestion, setSelectedSuggestion] = useState(null);
    const [commentary, setCommentary] = useState('');
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const [commentaryLoading, setCommentaryLoading] = useState(false);
    
    const { generateSermon, reviseDraft, isLoading: sermonIsLoading } = useSermonGeneration(userId, setSermonDraft, setErrorMessage, canGenerateSermon, canGenerateCommentary, lang, user, openLoginModal, onLimitReached, sermonCount, commentaryCount);

    const handleToggleMemo = useCallback(async (memo) => {
        if (!user) { openLoginModal(); return; }
        
        if (selectedMemo && selectedMemo.id === memo.id) {
            setSelectedMemo(null);
            setSuggestions([]);
            setSelectedSuggestion(null);
            setCommentary('');
            setErrorMessage('');
            setSermonDraft('');
        } else {
            setSelectedMemo(memo);
            setSuggestions([]);
            setSelectedSuggestion(null);
            setCommentary('');
            
            setSuggestionsLoading(true);
            setSermonDraft(t('generating', lang));
            setErrorMessage('');

            try {
                const promptText = `Based on the following note, suggest 3 relevant scripture verses and 3 sermon themes in a JSON array format. The JSON array should contain objects with keys "verse" and "theme". Note: "${memo.content}". The response should be in ${lang === 'ko' ? 'Korean' : 'English'}.`;
                const generationConfig = {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "ARRAY",
                        items: {
                            type: "OBJECT",
                            properties: {
                                "verse": { "type": "STRING" },
                                "theme": { "type": "STRING" }
                            },
                            "propertyOrdering": ["verse", "theme"]
                        }
                    }
                };
                const jsonText = await callGeminiAPI(promptText, generationConfig);
                const parsedJson = JSON.parse(jsonText);
                setSuggestions(parsedJson);
                setSermonDraft('');
            } catch (error) {
                setSermonDraft(t('generationFailed', lang));
                console.error(error);
            } finally {
                setSuggestionsLoading(false);
            }
        }
    }, [selectedMemo, setSermonDraft, setErrorMessage, user, openLoginModal, lang]);

    const handleGetCommentary = useCallback(async () => {
        if (!user) { openLoginModal(); return; }
        if (!selectedMemo || !selectedSuggestion) { setErrorMessage(t('selectMemoAndSuggestion', lang)); return; }
        if (!canGenerateCommentary) { setErrorMessage(t('commentaryLimitError', lang)); onLimitReached(); return; }

        setCommentaryLoading(true);
        setCommentary(t('generating', lang));
        setErrorMessage('');
        try {
            const promptText = `Based on the following note and scripture, provide a detailed expository commentary in ${lang === 'ko' ? 'Korean' : 'English'}. Note: "${selectedMemo.content}". Scripture: "${selectedSuggestion.verse}"`;
            const text = await callGeminiAPI(promptText);
            setCommentary(text);
            await incrementUsageCount('commentary', userId, commentaryCount, setErrorMessage);
        } catch (error) {
            setCommentary(t('generationFailed', lang));
            console.error(error);
        } finally {
            setCommentaryLoading(false);
        }
    }, [selectedMemo, selectedSuggestion, canGenerateCommentary, setCommentary, setErrorMessage, lang, onLimitReached, user, openLoginModal, userId, commentaryCount]);

    const handleGenerateSermon = useCallback(async () => {
        if (!user) { openLoginModal(); return; }
        if (!selectedMemo || !selectedSuggestion || commentary.trim() === '') { setErrorMessage(t('missingMemoAndCommentary', lang)); return; }

        const promptText = `Based on the following memo, scripture, and commentary, write a detailed sermon in ${lang === 'ko' ? 'Korean' : 'English'}. Memo: "${selectedMemo.content}". Scripture: "${selectedSuggestion.verse}". Commentary: "${commentary}"`;
        await generateSermon(promptText, 'sermon');
    }, [selectedMemo, selectedSuggestion, commentary, generateSermon, setErrorMessage, user, openLoginModal, lang]);

    return (
        <div className="flex flex-col items-center space-y-4 max-w-2xl mx-auto w-full">
            <h2 className="text-4xl font-extrabold text-gray-800">{t('quickMemoSermonTitle', lang)}</h2>
            <p className="text-lg text-gray-600 mb-4">{t('quickMemoDescription', lang)}</p>

            {userSubscription !== 'premium' && (
                <p className="text-sm text-gray-500 mb-4">
                    {t('sermonLimit', lang)(Math.max(0, SUBSCRIPTION_LIMITS[userSubscription].sermon - sermonCount))}
                </p>
            )}

            <div className="w-full p-4 rounded-xl bg-white border border-gray-300 text-left">
                <p className="font-semibold text-gray-800 mb-2">{t('myMemos', lang)}</p>
                <ul className="space-y-2">
                    {memos.length > 0 ? (
                        memos.map(memo => (
                            <li key={memo.id} className={`p-3 rounded-lg cursor-pointer transition ${selectedMemo && selectedMemo.id === memo.id ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                                onClick={() => handleToggleMemo(memo)}>
                                {memo.content}
                            </li>
                        ))
                    ) : (
                        <p className="text-gray-500">{t('noMemos', lang)}</p>
                    )}
                </ul>
            </div>

            {selectedMemo && suggestionsLoading && (
                <div className="w-full p-4 rounded-xl bg-gray-100 text-center">
                    <p className="text-gray-600">{t('generating', lang)}</p>
                </div>
            )}
            
            {suggestions.length > 0 && (
                <div className="w-full p-4 rounded-xl bg-white border border-gray-300 text-left">
                    <p className="font-semibold text-gray-800 mb-2">{t('aiSuggestions', lang)}</p>
                    <ul className="space-y-2">
                        {suggestions.map((sug, index) => (
                            <li key={index} className={`p-3 rounded-lg cursor-pointer transition ${selectedSuggestion && selectedSuggestion.verse === sug.verse ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                                onClick={() => setSelectedSuggestion(sug)}>
                                <p className="font-semibold">{sug.verse}</p>
                                <p className="text-sm">{sug.theme}</p>
                            </li>
                        ))}
                    </ul>
                    <button
                        onClick={handleGetCommentary}
                        className="mt-4 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-lg transition duration-300 disabled:bg-gray-400 w-full"
                        disabled={!selectedSuggestion || commentaryLoading}
                    >
                        {commentaryLoading ? t('generating', lang) : t('getCommentary', lang)}
                    </button>
                </div>
            )}
            
            {commentary && (
                <div className="w-full p-4 rounded-xl bg-white border border-gray-300 text-left whitespace-pre-wrap">
                    <p className="font-semibold text-gray-800 mb-2">{t('aiCommentaryTitle', lang)}</p>
                    <p className="text-gray-600">{commentary}</p>
                    <button
                        onClick={async () => {
                            if (!user) { openLoginModal(); return; }
                            const promptText = `Based on the following commentary, write a detailed sermon in ${lang === 'ko' ? 'Korean' : 'English'}. Note: "${commentary}"`;
                            await generateSermon(promptText, 'sermon');
                        }}
                        className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg transition duration-300 disabled:bg-gray-400 w-full"
                        disabled={!canGenerateSermon || sermonIsLoading || commentary.trim() === ''}
                    >
                        {sermonIsLoading ? t('generating', lang) : t('generateSermonFromMemo', lang)}
                    </button>
                </div>
            )}
            
            {setSermonDraft && (
                 <button
                    onClick={() => reviseDraft(window.getSelection().toString().trim())}
                    className="mt-4 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-xl shadow-lg transition duration-300 w-full"
                    disabled={sermonIsLoading}
                   >
                    {t('editWithAiTitle', lang)}
                   </button>
            )}
        </div>
    );
};

// SermonAssistantComponent (main component)
const SermonAssistantComponent = ({ sermonInput, setSermonInput, sermonDraft, setSermonDraft, errorMessage, setErrorMessage, toggleFullscreen, userSubscription, commentaryCount, sermonCount, userId, lang, setLang, selectedSermonType, setSelectedSermonType, openLoginModal, user }) => {
    
    const [memos, setMemos] = useState([]);
    const [quickMemoModalOpen, setQuickMemoModalOpen] = useState(false);
    const [memoCountToday, setMemoCountToday] = useState(0);

    const currentLang = lang;

    useEffect(() => {
        if (!user) return;
        const memosCollection = collection(db, 'quickMemos');
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const q = query(
            memosCollection,
            where('userId', '==', user.uid),
            where('timestamp', '>=', startOfToday),
            orderBy('timestamp', 'desc')
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const memosList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMemos(memosList);
            setMemoCountToday(memosList.length);
        });
        return () => unsubscribe();
    }, [user]);

    const canGenerateCommentary = userSubscription === 'premium' || commentaryCount < SUBSCRIPTION_LIMITS[userSubscription].commentary;
    const canGenerateSermon = userSubscription === 'premium' || sermonCount < SUBSCRIPTION_LIMITS[userSubscription].sermon;
    const [chatHistory, setChatHistory] = useState([]);
    const sermonRef = useRef(null);

    const { generateSermon, reviseDraft, isLoading } = useSermonGeneration(userId, setSermonDraft, setErrorMessage, canGenerateSermon, canGenerateCommentary, currentLang, user, openLoginModal, () => setSelectedSermonType('premium-subscription'), sermonCount, commentaryCount);

    useEffect(() => {
        if (sermonDraft && sermonRef.current) {
            sermonRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [sermonDraft]);

    const handleSendMessage = useCallback(async () => {
        if (!user) { openLoginModal(); return; }
        if (!canGenerateCommentary) { setErrorMessage(t('commentaryLimitError', currentLang)); setSelectedSermonType('premium-subscription'); return; }
        if (sermonInput.trim() === '') { setErrorMessage(t('enterMessage', currentLang)); return; }

        const newChatHistory = [...chatHistory, { role: 'user', text: sermonInput }];
        setChatHistory(newChatHistory);
        setSermonInput('');
        setErrorMessage('');

        try {
            const fullChatPrompt = newChatHistory.map(chat => `${chat.role === 'user' ? 'User' : 'Assistant'}: ${chat.text}`).join('\n');
            const promptText = `${fullChatPrompt}\nAssistant:`;

            const text = await callGeminiAPI(promptText);

            if (text && typeof text === 'string') {
                setChatHistory(prev => [...prev, { role: 'assistant', text: text }]);
                await incrementUsageCount('commentary', userId, commentaryCount, setErrorMessage);
            } else {
                setChatHistory(prev => [...prev, { role: 'assistant', text: t('generationFailed', currentLang) }]);
            }
        } catch (error) {
            setChatHistory(prev => [...prev, { role: 'assistant', text: t('generationFailed', currentLang) }]);
            console.error(error);
        }
    }, [sermonInput, setSermonInput, setErrorMessage, canGenerateCommentary, chatHistory, currentLang, openLoginModal, user, setSelectedSermonType, userId, commentaryCount]);

    const handleGenerateSermonFromChat = useCallback(async () => {
        if (chatHistory.length === 0) { setErrorMessage(t('noConversationError', currentLang)); return; }
        
        const fullChatPrompt = chatHistory.map(chat => `${chat.role === 'user' ? 'User' : 'Assistant'}: ${chat.text}`).join('\n');
        const promptText = `Based on the following conversation, write a detailed sermon: "${fullChatPrompt}"`;

        await generateSermon(promptText, 'sermon');
        
    }, [chatHistory, generateSermon, setErrorMessage, currentLang]);

    const handleSelectText = useCallback(() => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        if (selectedText.length > 0) {
            setSermonDraft(prevDraft =>
                prevDraft ? prevDraft + '\n\n' + selectedText : selectedText
            );
        }
    }, [setSermonDraft]);
    
    const handleLimitReached = useCallback(() => {
        setSelectedSermonType('premium-subscription');
    }, [setSelectedSermonType]);
    
    const handleAddMemo = useCallback(async (content) => {
        if (!user) { openLoginModal(); return; }
        const isLimited = await checkDailyMemoLimit(user.uid, 5);
        if (isLimited >= 5) { setErrorMessage(t('memoLimitReached', currentLang)(5, memoCountToday)); return; }
        try {
            await addQuickMemo(user.uid, content);
            setSelectedSermonType('quick-memo-sermon');
        } catch (error) {
            setErrorMessage(t('failedToSaveMemo', currentLang));
            console.error(error);
        }
    }, [user, openLoginModal, setErrorMessage, currentLang, setSelectedSermonType, memoCountToday]);

    const renderSermonType = () => {
        switch (selectedSermonType) {
            case 'sermon-assistant':
                return (
                    <div className="text-center">
                        <h2 className="text-4xl font-extrabold text-gray-800">{t('sermonAssistantTitle', currentLang)}</h2>
                        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">{t('assistantDescription', currentLang)}</p>
                        {userSubscription !== 'premium' && (
                            <p className="text-sm text-gray-500 mb-4">
                                {t('commentaryLimit', currentLang)(Math.max(0, SUBSCRIPTION_LIMITS[userSubscription].commentary - commentaryCount))}
                            </p>
                        )}
                        {errorMessage && (
                            <div className="bg-red-200 text-red-800 p-4 rounded-xl mb-4 max-w-2xl mx-auto">
                                {t('errorMessage', currentLang)(errorMessage)}
                            </div>
                        )}
                        <div className="flex flex-col items-center space-y-4 max-w-2xl mx-auto w-full">
                            <div className="w-full p-4 rounded-xl bg-gray-200 border border-gray-300 h-96 overflow-y-auto text-left whitespace-pre-wrap">
                                {chatHistory.length === 0 ? (
                                    <p className="text-gray-500">{t('initialPrompt', currentLang)}</p>
                                ) : (
                                    chatHistory.map((chat, index) => (
                                        <div key={index} className={`mb-4 p-3 rounded-lg ${chat.role === 'user' ? 'bg-blue-100 text-right text-gray-800' : 'bg-white text-left text-gray-800'}`}
                                            onMouseUp={chat.role === 'assistant' ? handleSelectText : undefined}>
                                            <p className="font-semibold">{chat.role === 'user' ? (currentLang === 'ko' ? '나:' : 'You:') : (currentLang === 'ko' ? 'AI:' : 'AI:')}</p>
                                            <p>{chat.text}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="w-full flex space-x-2">
                                <textarea
                                    value={sermonInput}
                                    onChange={(e) => setSermonInput(e.target.value)}
                                    placeholder={t('inputPlaceholder', currentLang)}
                                    className="flex-grow p-4 rounded-xl bg-white border border-gray-300 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    rows="2"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg transition duration-300 disabled:bg-gray-400"
                                    disabled={!canGenerateCommentary || sermonInput.trim() === ''}
                                >
                                    {t('sendButton', currentLang)}
                                </button>
                            </div>
                            <button
                                onClick={handleGenerateSermonFromChat}
                                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-lg transition duration-300 w-full"
                                disabled={!canGenerateSermon || chatHistory.length === 0 || isLoading}
                            >
                                {isLoading ? t('generating', currentLang) : t('generateSermonFromChat', currentLang)}
                            </button>
                        </div>
                    </div>
                );
            case 'expository-sermon':
                return <ExpositorySermonComponent {...{ setSermonDraft, userId, commentaryCount, userSubscription, setErrorMessage, lang: currentLang, user, openLoginModal, onLimitReached: handleLimitReached, sermonCount, canGenerateSermon, canGenerateCommentary }} />;
            case 'real-life-sermon':
                return <RealLifeSermonComponent {...{ setSermonDraft, userId, sermonCount, userSubscription, setErrorMessage, lang: currentLang, user, openLoginModal, onLimitReached: handleLimitReached, canGenerateSermon }} />;
            case 'quick-memo-sermon':
                return <QuickMemoSermonComponent {...{ setSermonDraft, userId, sermonCount, userSubscription, setErrorMessage, lang: currentLang, user, openLoginModal, onLimitReached: handleLimitReached, memos, commentaryCount, canGenerateSermon, canGenerateCommentary }} />;
            case 'premium-subscription':
                return <PremiumSubscriptionPage onGoBack={() => setSelectedSermonType('sermon-selection')} />;
            case 'sermon-selection':
                return (
                    <div className="text-center space-y-8">
                        <h2 className="text-4xl font-extrabold text-gray-800">{t('chooseSermonType', currentLang)}</h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">{t('chooseSermonTypeDescription', currentLang)}</p>
                        <div className="bg-blue-100 p-6 rounded-xl text-gray-800 max-w-3xl mx-auto border border-blue-200 shadow-md">
                            <p className="text-lg font-semibold">{t('multilingualPromo', currentLang)}</p>
                            <p className="text-sm text-gray-600 mt-2">
                                ({t('language', currentLang)}: {t('korean', currentLang)}, {t('english', currentLang)}, {t('chinese', currentLang)}, {t('japanese', currentLang)}, {t('russian', currentLang)}, {t('vietnamese', currentLang)})
                            </p>
                        </div>
                        <div className="flex flex-col items-center gap-6 max-w-md mx-auto">
                            <button onClick={user ? () => setSelectedSermonType('sermon-assistant') : openLoginModal} className="w-full p-8 bg-white rounded-2xl transition duration-300 transform hover:scale-105 shadow-md group hover:bg-gray-50 flex items-center space-x-6 border border-gray-200">
                                <PlusCircleIcon className="w-12 h-12 text-blue-500 group-hover:text-blue-600 transition-colors flex-shrink-0"/>
                                <div className="text-left">
                                    <h3 className="text-2xl font-bold text-gray-800">{t('sermonAssistantTitle', currentLang)}</h3>
                                    <p className="mt-1 text-sm text-gray-600">{t('sermonAssistantIntro', currentLang)}</p>
                                </div>
                            </button>
                            <button onClick={user ? () => setSelectedSermonType('expository-sermon') : openLoginModal} className="w-full p-8 bg-white rounded-2xl transition duration-300 transform hover:scale-105 shadow-md group hover:bg-gray-50 flex items-center space-x-6 border border-gray-200">
                                <SearchIcon className="w-12 h-12 text-green-500 group-hover:text-green-600 transition-colors flex-shrink-0"/>
                                <div className="text-left">
                                    <h3 className="mt-1 text-2xl font-bold text-gray-800">{t('expositorySermonTitle', currentLang)}</h3>
                                    <p className="mt-1 text-sm text-gray-600">{t('expositoryIntro', currentLang)}</p>
                                </div>
                            </button>
                            <button onClick={user ? () => setSelectedSermonType('real-life-sermon') : openLoginModal} className="w-full p-8 bg-white rounded-2xl transition duration-300 transform hover:scale-105 shadow-md group hover:bg-gray-50 flex items-center space-x-6 border border-gray-200">
                                <RealLifeIcon className="w-12 h-12 text-purple-500 group-hover:text-purple-600 transition-colors flex-shrink-0"/>
                                <div className="text-left">
                                    <h3 className="mt-1 text-2xl font-bold text-gray-800">{t('realLifeSermonTitle', currentLang)}</h3>
                                    <p className="mt-1 text-sm text-gray-600">{t('realLifeIntro', currentLang)}</p>
                                </div>
                            </button>
                            <button onClick={user ? () => setSelectedSermonType('quick-memo-sermon') : openLoginModal} className="w-full p-8 bg-white rounded-2xl transition duration-300 transform hover:scale-105 shadow-md group hover:bg-gray-50 flex items-center space-x-6 border border-gray-200">
                                <QuickMemoIcon className="w-12 h-12 text-yellow-500 group-hover:text-yellow-600 transition-colors flex-shrink-0"/>
                                <div className="text-left">
                                    <h3 className="mt-1 text-2xl font-bold text-gray-800">{t('quickMemoSermonTitle', currentLang)}</h3>
                                    <p className="mt-1 text-sm text-gray-600">{t('quickMemoIntro', currentLang)}</p>
                                </div>
                            </button>
                        </div>
                        <div className="mt-12">
                                <button
                                    onClick={user ? () => setSelectedSermonType('premium-subscription') : openLoginModal}
                                    className="px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition duration-300 text-2xl"
                                >
                                    {t('upgradeToPremium', currentLang)}
                                </button>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-100 text-gray-800 font-sans">
            <header className="p-6 bg-white border-b border-gray-200 flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-4">
                    <Link href="/sermon-selection" passHref>
                        <h1 className="text-3xl font-extrabold text-gray-900 cursor-pointer">SermonNote</h1>
                    </Link>
                </div>
                <div className="flex items-center space-x-4">
                    {user && (
                        <p className="text-sm text-gray-600 hidden sm:block">{t('welcome', currentLang)(user.email)}</p>
                    )}
                    <select
                        onChange={(e) => setLang(e.target.value)}
                        value={currentLang}
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
            <main className="container mx-auto p-8">
                {renderSermonType()}
                {sermonDraft && (
                    <div ref={sermonRef} className="mt-12 text-left max-w-3xl mx-auto w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-2xl font-bold text-gray-900">{t('generatedSermonTitle', currentLang)}</h3>
                            <button onClick={() => toggleFullscreen(sermonDraft)} className="text-gray-500 hover:text-gray-900 transition">
                                <FullscreenIcon />
                            </button>
                        </div>
                        <textarea
                            value={sermonDraft}
                            onChange={(e) => setSermonDraft(e.target.value)}
                            rows={15}
                            className="w-full p-6 rounded-2xl bg-white border border-gray-300 text-gray-800 resize-none shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                )}
            </main>

            <button
                onClick={() => setQuickMemoModalOpen(true)}
                className="fixed bottom-8 right-8 p-5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full shadow-2xl transition z-40 transform hover:scale-110"
            >
                <QuickMemoIcon className="w-6 h-6" />
            </button>

            <QuickMemoModal
                isOpen={quickMemoModalOpen}
                onClose={() => setQuickMemoModalOpen(false)}
                onAddMemo={handleAddMemo}
                memoCount={memoCountToday}
                memoLimit={5}
                lang={currentLang}
                openLoginModal={openLoginModal}
                user={user}
                onMemoAdded={() => setSelectedSermonType('quick-memo-sermon')}
            />
        </div>
    );
};
export default SermonAssistantComponent;