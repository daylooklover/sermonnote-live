// src/components/LoginModal.js
'use client';
import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase'; // <-- 이 줄만 남겨둡니다.
import { CloseIcon } from './IconComponents';

export default function LoginModal({ isOpen, onClose, onLoginSuccess, errorMessage, setErrorMessage }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);

    const handleAuth = async () => {
        setErrorMessage('');
        try {
            if (isSignUp) {
                await createUserWithEmailAndPassword(auth, email, password);
                alert("회원가입에 성공했습니다! 자동으로 로그인됩니다.");
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            onLoginSuccess();
            onClose();
        } catch (error) {
            setErrorMessage(`인증 실패: ${error.message}`);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75">
            <div className="bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4 text-white">{isSignUp ? '회원가입' : '로그인'}</h2>
                {errorMessage && <div className="bg-red-900 text-red-300 p-3 rounded-md mb-4">{errorMessage}</div>}
                <input
                    type="email"
                    placeholder="이메일"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 mb-4 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                    type="password"
                    placeholder="비밀번호"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 mb-6 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex justify-between items-center">
                    <button onClick={() => setIsSignUp(!isSignUp)} className="text-blue-400 hover:underline">
                        {isSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
                    </button>
                    <div className="flex space-x-4">
                        <button onClick={onClose} className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-full transition duration-300">
                            취소
                        </button>
                        <button onClick={handleAuth} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full transition duration-300">
                            {isSignUp ? '회원가입' : '로그인'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}