'use client';

import React from 'react';

// Check icon component
const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check text-green-500"><path d="M20 6 9 17l-5-5"/></svg>
);

// Plan data definition
const plans = [
    {
        name: 'Free Member',
        monthlyPrice: 'Free',
        annualPrice: 'Free',
        description: 'Try SermonNote\'s basic features for free.',
        features: [
            'Sermon Generation 5 times/month',
            'AI Annotation 5 times/month',
            'Text Editor',
        ],
        buttonText: 'Get Started',
        buttonAction: () => alert('You are now using the service as a free member.'),
        isPrimary: false,
    },
    {
        name: 'Standard Member',
        monthlyPrice: '25 $/month',
        annualPrice: '270 $/year (10% off)', // $25 * 12 * 0.9 = $270
        description: 'Provides core features to enhance sermon preparation efficiency.',
        features: [
            'Sermon Generation 100 times/month',
            'AI Annotation 100 times/month',
            'Advanced AI Text Editor',
            'Priority Tech Support (limited)',
        ],
        buttonText: 'Subscribe Now',
        buttonAction: () => alert('Standard membership subscription is not yet implemented. Please try again later.'),
        isPrimary: false,
    },
    {
        name: 'Premium Member',
        monthlyPrice: '45 $/month',
        annualPrice: '486 $/year (10% off)', // $45 * 12 * 0.9 = $486
        description: 'The all-in-one solution for the ultimate sermon experience.',
        features: [
            'Unlimited Sermon Generation',
            'Unlimited AI Annotation',
            'Advanced AI Text Editor',
            'Priority Tech Support (unlimited)',
        ],
        buttonText: 'Subscribe Now',
        buttonAction: () => alert('Premium membership subscription is not yet implemented. Please try again later.'),
        isPrimary: true, // Emphasize this plan
    },
];

const PremiumSubscriptionPage = ({ onGoBack }) => {
    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-extrabold text-white">Choose Your Plan</h2>
                <p className="text-lg text-gray-400 mt-2 max-w-3xl mx-auto">
                    SermonNote offers a variety of plans optimized for every user.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
                {plans.map((plan, index) => (
                    <div 
                        key={index}
                        className={`
                            bg-gray-800 p-8 rounded-2xl shadow-xl border 
                            ${plan.isPrimary ? 'border-blue-500' : 'border-gray-700'} 
                            flex flex-col transform transition-all duration-300 hover:scale-105
                        `}
                    >
                        <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                        {/* 월별 가격과 연간 할인 가격을 동시에 표시 */}
                        <p className="text-4xl font-extrabold text-blue-400 mb-1">{plan.monthlyPrice}</p>
                        <p className="text-sm text-gray-400 mb-6">or {plan.annualPrice}</p>
                        
                        <div className="flex-grow">
                            <ul className="text-left space-y-3 mb-8 text-gray-300">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-center space-x-3">
                                        <CheckIcon />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        
                        <button
                            onClick={plan.buttonAction}
                            className={`
                                w-full px-6 py-3 font-semibold rounded-xl shadow-lg transition duration-300
                                ${plan.isPrimary ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}
                            `}
                        >
                            {plan.buttonText}
                        </button>
                    </div>
                ))}
            </div>
            
            <button
                onClick={onGoBack}
                className="mt-12 text-gray-400 hover:text-white transition duration-300"
            >
                Go Back
            </button>
        </div>
    );
};

export default PremiumSubscriptionPage;