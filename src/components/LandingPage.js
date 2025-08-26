// src/components/LandingPage.js
'use client';
import React from 'react';
import Link from 'next/link';
import { PlusCircleIcon, SearchIcon, RealLifeIcon, QuickMemoIcon, SecureIcon, ShareIcon } from './IconComponents';

export default function LandingPage({ onGetStarted, user, signOut, openLoginModal }) {
    return (
        <div className="bg-gray-900 min-h-screen text-white font-sans">
            <header className="py-4 px-6 flex justify-between items-center bg-gray-900 shadow-md border-b border-gray-700">
                <h1 className="text-2xl font-bold text-white">SermonNote</h1>
                <div className="flex space-x-4">
                    {user ? (
                        <>
                            <button onClick={onGetStarted} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-full transition duration-300 shadow-lg">
                                Start Creating
                            </button>
                            <button onClick={signOut} className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-full transition duration-300 shadow-lg">
                                Logout
                            </button>
                        </>
                    ) : (
                        <button onClick={openLoginModal} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-full transition duration-300 shadow-lg">
                            Sign Up / Login
                        </button>
                    )}
                </div>
            </header>
            <main className="container mx-auto py-16 px-4">
                <section className="text-center mb-16">
                    <h2 className="text-5xl md:text-6xl font-extrabold text-white leading-tight">SermonNote</h2>
                    <p className="text-lg md:text-xl text-gray-400 mt-4 max-w-2xl mx-auto">
                        Deepen Your Faith, Organize Your Insights.
                    </p>
                    <div className="mt-8">
                        {user ? (
                            <button onClick={onGetStarted} className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xl font-semibold transition duration-300 shadow-lg transform hover:scale-105">
                                Start Creating Sermons
                            </button>
                        ) : (
                            <button onClick={openLoginModal} className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xl font-semibold transition duration-300 shadow-lg transform hover:scale-105">
                                Sign Up / Login
                            </button>
                        )}
                    </div>
                </section>
                <section className="text-center mb-16">
                    <h3 className="text-3xl font-bold text-blue-400 mb-8">Our Unique Features</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-lg">
                            <div className="flex justify-center mb-4 text-blue-400"><PlusCircleIcon className="h-12 w-12" /></div>
                            <h4 className="text-2xl font-semibold mb-2 text-white">AI-Powered Insights</h4>
                            <p className="text-gray-400">Generate commentary, insights, and drafts from any scripture or topic.</p>
                        </div>
                        <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-lg">
                            <div className="flex justify-center mb-4 text-gray-400"><SearchIcon className="h-12 w-12" /></div>
                            <h4 className="text-2xl font-semibold mb-2 text-white">Expository Sermon Creation</h4>
                            <p className="text-gray-400">Dive deep into biblical truth with a structured tool for creating expository sermons.</p>
                        </div>
                        <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-lg">
                            <div className="flex justify-center mb-4 text-gray-400"><RealLifeIcon className="h-12 w-12" /></div>
                            <h4 className="text-2xl font-semibold mb-2 text-white">Real-Life Application</h4>
                            <p className="text-gray-400">Connect scripture to daily life events with AI-suggested verses and themes for practical sermons.</p>
                        </div>
                        <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-lg">
                            <div className="flex justify-center mb-4 text-gray-400"><QuickMemoIcon className="h-12 w-12" /></div>
                            <h4 className="text-2xl font-semibold mb-2 text-white">Quick Memo Integration</h4>
                            <p className="text-gray-400">Weave scattered notes and voice memos to easily generate sermon outlines.</p>
                        </div>
                        <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-lg">
                            <div className="flex justify-center mb-4 text-gray-400"><SecureIcon className="h-12 w-12" /></div>
                            <h4 className="text-2xl font-semibold mb-2 text-white">Secure & Organized</h4>
                            <p className="text-gray-400">Keep all your spiritual insights, notes, and sermons organized and securely stored.</p>
                        </div>
                        <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-lg">
                            <div className="flex justify-center mb-4 text-gray-400"><ShareIcon className="h-12 w-12" /></div>
                            <h4 className="text-2xl font-semibold mb-2 text-white">Community Sharing (Optional)</h4>
                            <p className="text-gray-400">Share insights and grow with a community of fellow believers and leaders.</p>
                        </div>
                    </div>
                </section>
                <section className="text-center mb-16">
                    <h3 className="text-3xl font-bold text-blue-400 mb-8">Why SermonNote?</h3>
                    <div className="max-w-4xl mx-auto text-lg text-gray-300 leading-relaxed">
                        <p className="mb-4">SermonNote is not just another note-taking app. It’s a dedicated platform designed to support your spiritual journey and sermon preparation. We believe that technology can be a powerful tool for deepening your relationship with God and organizing your divine insights. Our AI assistant helps you explore scripture in new ways, connecting ancient texts to modern life, while our secure system ensures your spiritual reflections are always safe and accessible.</p>
                        <p className="mb-4">Whether you are a seasoned pastor, a small group leader, or a believer seeking to grow, SermonNote provides the tools you need to make your study of the Word more organized, insightful, and inspiring.</p>
                    </div>
                </section>
            </main>
            
            <footer className="bg-gray-950 py-8 px-6 border-t border-gray-700 text-center text-gray-500">
                <div className="container mx-auto">
                    <div className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-8 mb-4">
                        <a className="hover:text-white transition" href="/about">About Us</a>
                        <a className="hover:text-white transition" href="/contact">Contact</a>
                        <a className="hover:text-white transition" href="/privacy-policy">Privacy Policy</a>
                        <a className="hover:text-white transition" href="/terms-of-service">Terms of Service</a>
                    </div>
                    <p>&copy; {new Date().getFullYear()} SermonNote. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}