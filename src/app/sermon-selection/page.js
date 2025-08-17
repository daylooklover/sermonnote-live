'use client';

import SermonAssistantComponent from '@/components/SermonAssistantComponent';
import { app, auth, db, incrementUsageCount, SUBSCRIPTION_LIMITS, addQuickMemo, checkDailyMemoLimit } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import React, { useState, useEffect } from 'react';
import { callGeminiAPI } from '@/lib/gemini';
import PremiumSubscriptionPage from '@/components/PremiumSubscriptionPage';

export default function SermonSelectionPage() {
  const [user, setUser] = useState(null);
  const [userSubscription, setUserSubscription] = useState('free');
  const [sermonCount, setSermonCount] = useState(0);
  const [commentaryCount, setCommentaryCount] = useState(0);
  const [sermonInput, setSermonInput] = useState('');
  const [sermonDraft, setSermonDraft] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedSermonType, setSelectedSermonType] = useState('sermon-selection');
  
  // All other component logic goes in SermonAssistantComponent
  return (
    <SermonAssistantComponent
      user={user}
      userSubscription={userSubscription}
      sermonCount={sermonCount}
      commentaryCount={commentaryCount}
      sermonInput={sermonInput}
      setSermonInput={setSermonInput}
      sermonDraft={sermonDraft}
      setSermonDraft={setSermonDraft}
      errorMessage={errorMessage}
      setErrorMessage={setErrorMessage}
      selectedSermonType={selectedSermonType}
      setSelectedSermonType={setSelectedSermonType}
    />
  );
}