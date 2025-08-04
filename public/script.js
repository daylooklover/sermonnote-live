const apiKey = "";

/**
 * Checks if the given input is a valid Bible verse reference.
 * @param {string} input - The string to check.
 * @returns {boolean}
 */
function isBibleVerse(input) {
    const regex = /^[a-zA-Z]+\s+\d{1,3}(:\d{1,3})?(-\d{1,3})?$/;
    return regex.test(input.trim());
}

/**
 * A utility function to show loading state on a button.
 * @param {HTMLButtonElement} button - The button to update.
 * @param {boolean} isLoading - Whether to show the loading state.
 */
function showLoading(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        button.textContent = 'Generating...';
        button.classList.add('loading-animation');
    } else {
        button.disabled = false;
        if (button.id.includes('lookup')) {
            button.textContent = 'Get Commentary';
        } else if (button.id.includes('expository-lookup')) {
            button.textContent = 'Lookup Scripture';
        } else if (button.id.includes('generate')) {
            button.textContent = 'Generate Sermon with AI';
        } else if (button.id.includes('suggest')) {
            button.textContent = 'Suggest Scripture & Themes';
        }
        button.classList.remove('loading-animation');
    }
}

/**
 * Calls the Gemini API to generate text based on a prompt.
 * @param {string} prompt - The text prompt for the AI.
 * @returns {Promise<string>} - The generated response text.
 */
async function callGeminiApi(prompt) {
    console.log("Sending prompt to Gemini API:", prompt);
    const payload = {
        contents: [{
            parts: [{ text: prompt }]
        }]
    };
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Gemini API error:", errorData);
            throw new Error(`API call failed: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            return result.candidates[0].content.parts[0].text;
        } else {
            throw new Error("Invalid response format from API.");
        }
    } catch (error) {
        console.error("Error in callGeminiApi:", error);
        throw error;
    }
}

/**
 * This function handles screen transitions and updates the main header
 * @param {string} screenId - The ID of the screen to display.
 */
function showScreen(screenId) {
    const screens = ['sermon-selection-screen', 'sermon-assistant-screen', 'expository-sermon-screen', 'real-life-sermon-screen', 'quick-memo-sermon-screen'];
    screens.forEach(id => {
        const screen = document.getElementById(id);
        if (screen) {
            if (id === screenId) {
                screen.classList.remove('hidden');
            } else {
                screen.classList.add('hidden');
            }
        }
    });

    const mainTitle = document.getElementById('main-title');
    const mainDescription = document.getElementById('main-description');

    if (mainTitle && mainDescription) {
        if (screenId === 'sermon-selection-screen') {
            mainTitle.textContent = 'Choose Sermon Type';
            mainDescription.textContent = 'Select the type of sermon you want to create.';
        } else if (screenId === 'sermon-assistant-screen') {
            mainTitle.textContent = 'Sermon Assistant';
            mainDescription.textContent = 'Get AI-powered commentary and sermon drafts instantly.';
        } else if (screenId === 'expository-sermon-screen') {
            mainTitle.textContent = 'Expository Sermon';
            mainDescription.textContent = 'Deep exploration of biblical truth and precise interpretation.';
        } else if (screenId === 'real-life-sermon-screen') {
            mainTitle.textContent = 'Real-Life Application Sermon';
            mainDescription.textContent = 'The power of God\'s Word permeating daily life.';
        } else if (screenId === 'quick-memo-sermon-screen') {
            mainTitle.textContent = 'Quick Memo Linked Sermon';
            mainDescription.textContent = 'Weaving scattered pieces of inspiration into a cohesive whole.';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Sermon Selection Buttons
    const assistantButton = document.getElementById('btn-assistant');
    const expositoryButton = document.getElementById('btn-expository');
    const realLifeButton = document.getElementById('btn-real-life');
    const linkedButton = document.getElementById('btn-linked');

    // Back Buttons
    const backButtonAssistant = document.getElementById('back-button-assistant');
    const backButtonExpository = document.getElementById('back-button-expository');
    const backButtonRealLife = document.getElementById('back-button-real-life');
    const backButtonMemo = document.getElementById('back-button-memo');

    // Sermon Assistant Elements
    const aiInput = document.getElementById('ai-input');
    const getCommentaryButton = document.getElementById('get-commentary-button');
    const generateSermonButton = document.getElementById('generate-sermon-button');
    const commentaryOutput = document.getElementById('commentary-output');
    const sermonOutput = document.getElementById('sermon-output');

    // Expository Sermon Elements
    const expositoryVerseInput = document.getElementById('expository-verse-input');
    const expositoryLookupButton = document.getElementById('expository-lookup-button');
    const expositoryGenerateButton = document.getElementById('expository-generate-button');
    const expositoryScriptureOutput = document.getElementById('expository-scripture-output');
    const expositoryCommentaryOutput = document.getElementById('expository-commentary-output');
    const expositorySermonOutput = document.getElementById('expository-sermon-output');

    // Real-Life Sermon Elements
    const realLifeNotesInput = document.getElementById('real-life-notes-input');
    const realLifeSuggestionsOutput = document.getElementById('real-life-suggestions-output');
    const getRealLifeSuggestionsButton = document.getElementById('real-life-suggest-button');
    const realLifeGenerateButton = document.getElementById('real-life-generate-button');
    const realLifeSermonOutput = document.getElementById('real-life-sermon-output');

    // Quick Memo Sermon Elements
    const memoList = document.getElementById('memo-list');
    const memoSermonOutput = document.getElementById('memo-sermon-output');
    const suggestedVersesList = document.getElementById('suggested-verses');
    const suggestedTitlesList = document.getElementById('suggested-titles');
    const generateSermonButtonMemo = document.getElementById('generate-sermon-button-memo');

    // Event listeners for sermon type selection
    if (assistantButton) {
        assistantButton.addEventListener('click', () => {
            showScreen('sermon-assistant-screen');
        });
    }
    if (expositoryButton) {
        expositoryButton.addEventListener('click', () => {
            showScreen('expository-sermon-screen');
        });
    }
    if (realLifeButton) {
        realLifeButton.addEventListener('click', () => {
            showScreen('real-life-sermon-screen');
        });
    }
    if (linkedButton) {
        linkedButton.addEventListener('click', () => {
            showScreen('quick-memo-sermon-screen');
            renderMemos(); // Render memos on screen switch
        });
    }

    // Back buttons
    if (backButtonAssistant) {
        backButtonAssistant.addEventListener('click', () => {
            showScreen('sermon-selection-screen');
        });
    }
    if (backButtonExpository) {
        backButtonExpository.addEventListener('click', () => {
            showScreen('sermon-selection-screen');
        });
    }
    if (backButtonRealLife) {
        backButtonRealLife.addEventListener('click', () => {
            showScreen('sermon-selection-screen');
        });
    }
    if (backButtonMemo) {
        backButtonMemo.addEventListener('click', () => {
            showScreen('sermon-selection-screen');
        });
    }

    // Event listener for Sermon Assistant - Get Commentary button
    if (getCommentaryButton) {
        getCommentaryButton.addEventListener('click', async () => {
            const input = aiInput.value.trim();
            if (!input) {
                commentaryOutput.value = 'Please enter some content.';
                return;
            }

            showLoading(getCommentaryButton, true);
            commentaryOutput.value = 'Fetching commentary...';

            try {
                let prompt = "";
                if (isBibleVerse(input)) {
                    const verseResponse = await fetch(`https://bible-api.com/${input}?translation=kjv`);
                    const verseData = await verseResponse.json();

                    if (verseResponse.ok && verseData.verses && verseData.verses.length > 0) {
                        const verseText = verseData.verses.map(v => `${v.book_name} ${v.chapter}:${v.verse} ${v.text}`).join(' ');
                        prompt = `Provide a detailed commentary in English for the verse: "${verseText}".`;
                    } else {
                        commentaryOutput.value = 'Verse not found.';
                        return;
                    }
                } else {
                    prompt = `Provide a detailed commentary in English for the topic or question: "${input}".`;
                }

                const commentary = await callGeminiApi(prompt);
                commentaryOutput.value = commentary;

            } catch (error) {
                console.error('Error fetching commentary:', error);
                commentaryOutput.value = 'An error occurred while fetching commentary.';
            } finally {
                showLoading(getCommentaryButton, false);
            }
        });
    }

    // Event listener for Sermon Assistant - Generate Sermon with AI button
    if (generateSermonButton) {
        generateSermonButton.addEventListener('click', async () => {
            const input = aiInput.value.trim();
            const commentary = commentaryOutput.value.trim();
            if (!input || !commentary || commentary.startsWith('Fetching commentary')) {
                sermonOutput.value = 'Please get commentary first.';
                return;
            }

            showLoading(generateSermonButton, true);
            sermonOutput.value = 'Generating sermon...';

            try {
                let prompt = "";
                if (isBibleVerse(input)) {
                    prompt = `Write a comprehensive sermon draft in English based on the following Bible verse and commentary. [Verse] ${input} [Commentary] ${commentary}`;
                } else {
                    prompt = `Write a comprehensive sermon draft in English based on the following topic and commentary. [Topic] ${input} [Commentary] ${commentary}`;
                }

                const sermon = await callGeminiApi(prompt);
                sermonOutput.value = sermon;
            } catch (error) {
                console.error('Error generating sermon:', error);
                sermonOutput.value = 'An error occurred while generating the sermon.';
            } finally {
                showLoading(generateSermonButton, false);
            }
        });
    }

    // Event listener for Expository Sermon - Lookup Scripture button
    if (expositoryLookupButton) {
        expositoryLookupButton.addEventListener('click', async () => {
            const input = expositoryVerseInput.value.trim();
            if (!input) {
                expositoryScriptureOutput.value = 'Please enter a Bible verse.';
                return;
            }

            showLoading(expositoryLookupButton, true);
            expositoryScriptureOutput.value = 'Fetching scripture...';
            expositoryCommentaryOutput.value = '';

            try {
                const verseResponse = await fetch(`https://bible-api.com/${input}?translation=kjv`);
                const verseData = await verseResponse.json();

                if (verseResponse.ok && verseData.verses && verseData.verses.length > 0) {
                    const verseText = verseData.verses.map(v => `${v.book_name} ${v.chapter}:${v.verse} ${v.text}`).join(' ');
                    expositoryScriptureOutput.value = verseText;

                    const prompt = `Provide a detailed commentary in English for the verse: "${verseText}".`;
                    const commentary = await callGeminiApi(prompt);
                    expositoryCommentaryOutput.value = commentary;
                } else {
                    expositoryScriptureOutput.value = 'Verse not found.';
                }
            } catch (error) {
                console.error('Error fetching scripture or commentary:', error);
                expositoryScriptureOutput.value = 'An error occurred while fetching the scripture.';
            } finally {
                showLoading(expositoryLookupButton, false);
            }
        });
    }

    // Event listener for Expository Sermon - Generate Sermon button
    if (expositoryGenerateButton) {
        expositoryGenerateButton.addEventListener('click', async () => {
            const scripture = expositoryScriptureOutput.value.trim();
            const commentary = expositoryCommentaryOutput.value.trim();
            if (!scripture || scripture.startsWith('Fetching scripture') || !commentary || commentary.startsWith('Fetching commentary')) {
                expositorySermonOutput.value = 'Please lookup scripture and get commentary first.';
                return;
            }

            showLoading(expositoryGenerateButton, true);
            expositorySermonOutput.value = 'Generating sermon...';

            try {
                const prompt = `Write a comprehensive expository sermon draft in English based on the following scripture and commentary. [Scripture] ${scripture} [Commentary] ${commentary}`;
                const sermon = await callGeminiApi(prompt);
                expositorySermonOutput.value = sermon;
            } catch (error) {
                console.error('Error generating sermon:', error);
                expositorySermonOutput.value = 'An error occurred while generating the sermon.';
            } finally {
                showLoading(expositoryGenerateButton, false);
            }
        });
    }

    // Event listener for Real-Life Sermon - Suggest Scripture & Themes button
    if (getRealLifeSuggestionsButton) {
        getRealLifeSuggestionsButton.addEventListener('click', async () => {
            const notes = realLifeNotesInput.value.trim();
            if (!notes) {
                realLifeSuggestionsOutput.value = 'Please enter a real-life event or topic.';
                return;
            }

            showLoading(getRealLifeSuggestionsButton, true);
            realLifeSuggestionsOutput.value = 'Suggesting scripture & themes...';

            try {
                const prompt = `Based on the following real-life event or topic, suggest 3 highly relevant Bible verses (reference and full text) and 3 sermon themes.
Event/Topic: "${notes}"
Please format the response clearly with headings for "Suggested Verses" and "Suggested Themes".`;

                const suggestions = await callGeminiApi(prompt);
                realLifeSuggestionsOutput.value = suggestions;

            } catch (error) {
                console.error('Error suggesting scripture or themes:', error);
                realLifeSuggestionsOutput.value = 'An error occurred while suggesting scripture & themes.';
            } finally {
                showLoading(getRealLifeSuggestionsButton, false);
            }
        });
    }

    // Event listener for Real-Life Sermon - Generate Sermon button
    if (realLifeGenerateButton) {
        realLifeGenerateButton.addEventListener('click', async () => {
            const notes = realLifeNotesInput.value.trim();
            const suggestions = realLifeSuggestionsOutput.value.trim();
            if (!notes || !suggestions || suggestions.startsWith('Suggesting scripture')) {
                realLifeSermonOutput.value = 'Please get suggestions first.';
                return;
            }

            showLoading(realLifeGenerateButton, true);
            realLifeSermonOutput.value = 'Generating sermon...';

            try {
                const prompt = `Write a comprehensive real-life application sermon draft in English based on the following event/topic and AI suggestions.
Event/Topic: "${notes}"
Suggestions: "${suggestions}"`;
                const sermon = await callGeminiApi(prompt);
                realLifeSermonOutput.value = sermon;
            } catch (error) {
                console.error('Error generating sermon:', error);
                realLifeSermonOutput.value = 'An error occurred while generating the sermon.';
            } finally {
                showLoading(realLifeGenerateButton, false);
            }
        });
    }

    // Mock renderMemos function
    function renderMemos() {
        const memoList = document.getElementById('memo-list');
        const suggestedVersesList = document.getElementById('suggested-verses');
        const suggestedTitlesList = document.getElementById('suggested-titles');

        if (!memoList || !suggestedVersesList || !suggestedTitlesList) {
            console.warn('Memo list elements not found.');
            return;
        }

        // Mock data for memos
        const mockMemos = [
            { id: '1', content: 'What is the nature of Christian joy?', selected: false },
            { id: '2', content: 'The power of forgiveness.', selected: false },
            { id: '3', content: 'How do we find strength in times of weakness?', selected: false },
            { id: '4', content: 'The meaning of the resurrection.', selected: false },
            { id: '5', content: 'The importance of prayer in daily life.', selected: false },
        ];

        memoList.innerHTML = '';
        suggestedVersesList.innerHTML = '';
        suggestedTitlesList.innerHTML = '';

        mockMemos.forEach(memo => {
            const li = document.createElement('li');
            li.id = `memo-${memo.id}`;
            li.className = 'memo-list-item p-4 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-pointer transition';
            li.textContent = memo.content;
            li.dataset.content = memo.content;

            li.addEventListener('click', async () => {
                document.querySelectorAll('.memo-list-item').forEach(item => item.classList.remove('selected'));
                li.classList.add('selected');

                const selectedMemoContent = li.dataset.content;

                // Show loading state
                const generateButtonMemo = document.getElementById('generate-sermon-button-memo');
                showLoading(generateButtonMemo, true);
                generateButtonMemo.textContent = 'Getting AI suggestions...';

                try {
                    const prompt = `Based on the following memo, suggest 3 highly relevant Bible verses (reference and full text) and 3 sermon titles.
Memo: "${selectedMemoContent}"
Format the response clearly with headings for "Suggested Verses" and "Suggested Titles".`;

                    const aiResponse = await callGeminiApi(prompt);

                    // Clear previous suggestions
                    suggestedVersesList.innerHTML = '';
                    suggestedTitlesList.innerHTML = '';

                    const [versesSection, titlesSection] = aiResponse.split('Suggested Titles:');
                    const suggestedVerses = versesSection.replace('Suggested Verses:', '').split('\n').filter(line => line.trim() !== '');
                    const suggestedTitles = titlesSection.split('\n').filter(line => line.trim() !== '');

                    suggestedVerses.forEach(verse => {
                        const li = document.createElement('li');
                        li.className = 'text-gray-300';
                        li.textContent = verse.trim();
                        suggestedVersesList.appendChild(li);
                    });

                    suggestedTitles.forEach(title => {
                        const li = document.createElement('li');
                        li.className = 'suggestion-item p-2 bg-gray-700 hover:bg-gray-600 rounded cursor-pointer transition';
                        li.textContent = title.trim();
                        li.dataset.title = title.trim();
                        li.addEventListener('click', () => {
                            document.querySelectorAll('.suggestion-item').forEach(item => item.classList.remove('selected'));
                            li.classList.add('selected');
                        });
                        suggestedTitlesList.appendChild(li);
                    });

                } catch (error) {
                    console.error('Error getting AI suggestions:', error);
                    suggestedVersesList.innerHTML = `<li class="text-red-400">Error: Failed to get AI suggestions.</li>`;
                    suggestedTitlesList.innerHTML = '';
                } finally {
                    showLoading(generateButtonMemo, false);
                }
            });
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        // Sermon Selection Buttons
        const assistantButton = document.getElementById('btn-assistant');
        const expositoryButton = document.getElementById('btn-expository');
        const realLifeButton = document.getElementById('btn-real-life');
        const linkedButton = document.getElementById('btn-linked');
        
        // Back Buttons
        const backButtonAssistant = document.getElementById('back-button-assistant');
        const backButtonExpository = document.getElementById('back-button-expository');
        const backButtonRealLife = document.getElementById('back-button-real-life');
        const backButtonMemo = document.getElementById('back-button-memo');

        // Sermon Assistant Elements
        const aiInput = document.getElementById('ai-input');
        const getCommentaryButton = document.getElementById('get-commentary-button');
        const generateSermonButton = document.getElementById('generate-sermon-button');
        const commentaryOutput = document.getElementById('commentary-output');
        const sermonOutput = document.getElementById('sermon-output');
        
        // Expository Sermon Elements
        const expositoryVerseInput = document.getElementById('expository-verse-input');
        const expositoryLookupButton = document.getElementById('expository-lookup-button');
        const expositoryGenerateButton = document.getElementById('expository-generate-button');
        const expositoryScriptureOutput = document.getElementById('expository-scripture-output');
        const expositoryCommentaryOutput = document.getElementById('expository-commentary-output');
        const expositorySermonOutput = document.getElementById('expository-sermon-output');
        
        // Real-Life Sermon Elements
        const realLifeNotesInput = document.getElementById('real-life-notes-input');
        const realLifeSuggestionsOutput = document.getElementById('real-life-suggestions-output');
        const getRealLifeSuggestionsButton = document.getElementById('real-life-suggest-button');
        const realLifeGenerateButton = document.getElementById('real-life-generate-button');
        const realLifeSermonOutput = document.getElementById('real-life-sermon-output');
        
        // Quick Memo Sermon Elements
        const memoList = document.getElementById('memo-list');
        const memoSermonOutput = document.getElementById('memo-sermon-output');
        const suggestedVersesList = document.getElementById('suggested-verses');
        const suggestedTitlesList = document.getElementById('suggested-titles');
        const generateSermonButtonMemo = document.getElementById('generate-sermon-button-memo');

        // Event listeners for sermon type selection
        if(assistantButton) {
            assistantButton.addEventListener('click', () => {
                showScreen('sermon-assistant-screen');
            });
        }
        if(expositoryButton) {
            expositoryButton.addEventListener('click', () => {
                showScreen('expository-sermon-screen');
            });
        }
        if(realLifeButton) {
            realLifeButton.addEventListener('click', () => {
                showScreen('real-life-sermon-screen');
            });
        }
        if(linkedButton) {
            linkedButton.addEventListener('click', () => {
                showScreen('quick-memo-sermon-screen');
                renderMemos(); // Render memos on screen switch
            });
        }
        
        // Back buttons
        if(backButtonAssistant) {
            backButtonAssistant.addEventListener('click', () => {
                showScreen('sermon-selection-screen');
            });
        }
        if(backButtonExpository) {
            backButtonExpository.addEventListener('click', () => {
                showScreen('sermon-selection-screen');
            });
        }
        if(backButtonRealLife) {
            backButtonRealLife.addEventListener('click', () => {
                showScreen('sermon-selection-screen');
            });
        }
        if(backButtonMemo) {
            backButtonMemo.addEventListener('click', () => {
                showScreen('sermon-selection-screen');
            });
        }

        // Event listener for Sermon Assistant - Get Commentary button
        if(getCommentaryButton) {
            getCommentaryButton.addEventListener('click', async () => {
                const input = aiInput.value.trim();
                if (!input) {
                    commentaryOutput.value = 'Please enter some content.';
                    return;
                }
                
                showLoading(getCommentaryButton, true);
                commentaryOutput.value = 'Fetching commentary...';

                try {
                    let prompt = "";
                    if (isBibleVerse(input)) {
                        const verseResponse = await fetch(`https://bible-api.com/${input}?translation=kjv`);
                        const verseData = await verseResponse.json();
                        
                        if (verseResponse.ok && verseData.verses && verseData.verses.length > 0) {
                            const verseText = verseData.verses.map(v => `${v.book_name} ${v.chapter}:${v.verse} ${v.text}`).join(' ');
                            prompt = `Provide a detailed commentary in English for the verse: "${verseText}".`;
                        } else {
                            commentaryOutput.value = 'Verse not found.';
                            return;
                        }
                    } else {
                        prompt = `Provide a detailed commentary in English for the topic or question: "${input}".`;
                    }
                    
                    const commentary = await callGeminiApi(prompt);
                    commentaryOutput.value = commentary;

                } catch (error) {
                    console.error('Error fetching commentary:', error);
                    commentaryOutput.value = 'An error occurred while fetching commentary.';
                } finally {
                    showLoading(getCommentaryButton, false);
                }
            });
        }

        // Event listener for Sermon Assistant - Generate Sermon with AI button
        if(generateSermonButton) {
            generateSermonButton.addEventListener('click', async () => {
                const input = aiInput.value.trim();
                const commentary = commentaryOutput.value.trim();
                if (!input || !commentary || commentary.startsWith('Fetching commentary')) {
                    sermonOutput.value = 'Please get commentary first.';
                    return;
                }

                showLoading(generateSermonButton, true);
                sermonOutput.value = 'Generating sermon...';
                
                try {
                    let prompt = "";
                    if (isBibleVerse(input)) {
                        prompt = `Write a comprehensive sermon draft in English based on the following Bible verse and commentary. [Verse] ${input} [Commentary] ${commentary}`;
                    } else {
                        prompt = `Write a comprehensive sermon draft in English based on the following topic and commentary. [Topic] ${input} [Commentary] ${commentary}`;
                    }

                    const sermon = await callGeminiApi(prompt);
                    sermonOutput.value = sermon;
                } catch (error) {
                    console.error('Error generating sermon:', error);
                    sermonOutput.value = 'An error occurred while generating the sermon.';
                } finally {
                    showLoading(generateSermonButton, false);
                }
            });
        }

        // Event listener for Expository Sermon - Lookup Scripture button
        if(expositoryLookupButton) {
            expositoryLookupButton.addEventListener('click', async () => {
                const input = expositoryVerseInput.value.trim();
                if (!input) {
                    expositoryScriptureOutput.value = 'Please enter a Bible verse.';
                    return;
                }
                
                showLoading(expositoryLookupButton, true);
                expositoryScriptureOutput.value = 'Fetching scripture...';
                expositoryCommentaryOutput.value = '';

                try {
                    const verseResponse = await fetch(`https://bible-api.com/${input}?translation=kjv`);
                    const verseData = await verseResponse.json();
                    
                    if (verseResponse.ok && verseData.verses && verseData.verses.length > 0) {
                        const verseText = verseData.verses.map(v => `${v.book_name} ${v.chapter}:${v.verse} ${v.text}`).join(' ');
                        expositoryScriptureOutput.value = verseText;
                        
                        const prompt = `Provide a detailed commentary in English for the verse: "${verseText}".`;
                        const commentary = await callGeminiApi(prompt);
                        expositoryCommentaryOutput.value = commentary;
                    } else {
                        expositoryScriptureOutput.value = 'Verse not found.';
                    }
                } catch (error) {
                    console.error('Error fetching scripture or commentary:', error);
                    expositoryScriptureOutput.value = 'An error occurred while fetching the scripture.';
                } finally {
                    showLoading(expositoryLookupButton, false);
                }
            });
        }

        // Event listener for Expository Sermon - Generate Sermon button
        if(expositoryGenerateButton) {
            expositoryGenerateButton.addEventListener('click', async () => {
                const scripture = expositoryScriptureOutput.value.trim();
                const commentary = expositoryCommentaryOutput.value.trim();
                if (!scripture || scripture.startsWith('Fetching scripture') || !commentary || commentary.startsWith('Fetching commentary')) {
                    expositorySermonOutput.value = 'Please lookup scripture and get commentary first.';
                    return;
                }

                showLoading(expositoryGenerateButton, true);
                expositorySermonOutput.value = 'Generating sermon...';
                
                try {
                    const prompt = `Write a comprehensive expository sermon draft in English based on the following scripture and commentary. [Scripture] ${scripture} [Commentary] ${commentary}`;
                    const sermon = await callGeminiApi(prompt);
                    expositorySermonOutput.value = sermon;
                } catch (error) {
                    console.error('Error generating sermon:', error);
                    expositorySermonOutput.value = 'An error occurred while generating the sermon.';
                } finally {
                    showLoading(expositoryGenerateButton, false);
                }
            });
        }

        // Event listener for Real-Life Sermon - Suggest Scripture & Themes button
        if(getRealLifeSuggestionsButton) {
            getRealLifeSuggestionsButton.addEventListener('click', async () => {
                const notes = realLifeNotesInput.value.trim();
                if (!notes) {
                    realLifeSuggestionsOutput.value = 'Please enter a real-life event or topic.';
                    return;
                }
                
                showLoading(getRealLifeSuggestionsButton, true);
                realLifeSuggestionsOutput.value = 'Suggesting scripture & themes...';

                try {
                    const prompt = `Based on the following real-life event or topic, suggest 3 highly relevant Bible verses (reference and full text) and 3 sermon themes.
Event/Topic: "${notes}"
Please format the response clearly with headings for "Suggested Verses" and "Suggested Themes".`;
                    
                    const suggestions = await callGeminiApi(prompt);
                    realLifeSuggestionsOutput.value = suggestions;

                } catch (error) {
                    console.error('Error suggesting scripture or themes:', error);
                    realLifeSuggestionsOutput.value = 'An error occurred while suggesting scripture & themes.';
                } finally {
                    showLoading(getRealLifeSuggestionsButton, false);
                }
            });
        }

        // Event listener for Real-Life Sermon - Generate Sermon button
        if(realLifeGenerateButton) {
            realLifeGenerateButton.addEventListener('click', async () => {
                const notes = realLifeNotesInput.value.trim();
                const suggestions = realLifeSuggestionsOutput.value.trim();
                if (!notes || !suggestions || suggestions.startsWith('Suggesting scripture')) {
                    realLifeSermonOutput.value = 'Please get suggestions first.';
                    return;
                }

                showLoading(realLifeGenerateButton, true);
                realLifeSermonOutput.value = 'Generating sermon...';
                
                try {
                    const prompt = `Write a comprehensive real-life application sermon draft in English based on the following event/topic and AI suggestions.
Event/Topic: "${notes}"
Suggestions: "${suggestions}"`;
                    const sermon = await callGeminiApi(prompt);
                    realLifeSermonOutput.value = sermon;
                } catch (error) {
                    console.error('Error generating sermon:', error);
                    realLifeSermonOutput.value = 'An error occurred while generating the sermon.';
                } finally {
                    showLoading(realLifeGenerateButton, false);
                }
            });
        }

        // Mock renderMemos function
        function renderMemos() {
            const memoList = document.getElementById('memo-list');
            const suggestedVersesList = document.getElementById('suggested-verses');
            const suggestedTitlesList = document.getElementById('suggested-titles');
            
            if (!memoList || !suggestedVersesList || !suggestedTitlesList) {
                console.warn('Memo list elements not found.');
                return;
            }

            // Mock data for memos
            const mockMemos = [
                { id: '1', content: 'What is the nature of Christian joy?', selected: false },
                { id: '2', content: 'The power of forgiveness.', selected: false },
                { id: '3', content: 'How do we find strength in times of weakness?', selected: false },
                { id: '4', content: 'The meaning of the resurrection.', selected: false },
                { id: '5', content: 'The importance of prayer in daily life.', selected: false },
            ];

            memoList.innerHTML = '';
            suggestedVersesList.innerHTML = '';
            suggestedTitlesList.innerHTML = '';

            mockMemos.forEach(memo => {
                const li = document.createElement('li');
                li.id = `memo-${memo.id}`;
                li.className = 'memo-list-item p-4 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-pointer transition';
                li.textContent = memo.content;
                li.dataset.content = memo.content;

                li.addEventListener('click', async () => {
                    document.querySelectorAll('.memo-list-item').forEach(item => item.classList.remove('selected'));
                    li.classList.add('selected');

                    const selectedMemoContent = li.dataset.content;
                    
                    // Show loading state
                    const generateButtonMemo = document.getElementById('generate-sermon-button-memo');
                    showLoading(generateButtonMemo, true);
                    generateButtonMemo.textContent = 'Getting AI suggestions...';

                    try {
                        const prompt = `Based on the following memo, suggest 3 highly relevant Bible verses (reference and full text) and 3 sermon titles.
Memo: "${selectedMemoContent}"
Format the response clearly with headings for "Suggested Verses" and "Suggested Titles".`;
                        
                        const aiResponse = await callGeminiApi(prompt);
                        
                        // Clear previous suggestions
                        suggestedVersesList.innerHTML = '';
                        suggestedTitlesList.innerHTML = '';

                        const [versesSection, titlesSection] = aiResponse.split('Suggested Titles:');
                        const suggestedVerses = versesSection.replace('Suggested Verses:', '').split('\n').filter(line => line.trim() !== '');
                        const suggestedTitles = titlesSection.split('\n').filter(line => line.trim() !== '');
                        
                        suggestedVerses.forEach(verse => {
                            const li = document.createElement('li');
                            li.className = 'text-gray-300';
                            li.textContent = verse.trim();
                            suggestedVersesList.appendChild(li);
                        });
                        
                        suggestedTitles.forEach(title => {
                            const li = document.createElement('li');
                            li.className = 'suggestion-item p-2 bg-gray-700 hover:bg-gray-600 rounded cursor-pointer transition';
                            li.textContent = title.trim();
                            li.dataset.title = title.trim();
                            li.addEventListener('click', () => {
                                document.querySelectorAll('.suggestion-item').forEach(item => item.classList.remove('selected'));
                                li.classList.add('selected');
                            });
                            suggestedTitlesList.appendChild(li);
                        });
                        
                    } catch (error) {
                        console.error('Error getting AI suggestions:', error);
                        suggestedVersesList.innerHTML = `<li class="text-red-400">Error: Failed to get AI suggestions.</li>`;
                        suggestedTitlesList.innerHTML = '';
                    } finally {
                        showLoading(generateButtonMemo, false);
                    }
                });
            });

            if (memoList) {
                // Initial render
                renderMemos();
            }
        }
        
        document.addEventListener('DOMContentLoaded', () => {
            // Sermon Selection Buttons
            const assistantButton = document.getElementById('btn-assistant');
            const expositoryButton = document.getElementById('btn-expository');
            const realLifeButton = document.getElementById('btn-real-life');
            const linkedButton = document.getElementById('btn-linked');
            
            // Back Buttons
            const backButtonAssistant = document.getElementById('back-button-assistant');
            const backButtonExpository = document.getElementById('back-button-expository');
            const backButtonRealLife = document.getElementById('back-button-real-life');
            const backButtonMemo = document.getElementById('back-button-memo');

            // Sermon Assistant Elements
            const aiInput = document.getElementById('ai-input');
            const getCommentaryButton = document.getElementById('get-commentary-button');
            const generateSermonButton = document.getElementById('generate-sermon-button');
            const commentaryOutput = document.getElementById('commentary-output');
            const sermonOutput = document.getElementById('sermon-output');
            
            // Expository Sermon Elements
            const expositoryVerseInput = document.getElementById('expository-verse-input');
            const expositoryLookupButton = document.getElementById('expository-lookup-button');
            const expositoryGenerateButton = document.getElementById('expository-generate-button');
            const expositoryScriptureOutput = document.getElementById('expository-scripture-output');
            const expositoryCommentaryOutput = document.getElementById('expository-commentary-output');
            const expositorySermonOutput = document.getElementById('expository-sermon-output');
            
            // Real-Life Sermon Elements
            const realLifeNotesInput = document.getElementById('real-life-notes-input');
            const realLifeSuggestionsOutput = document.getElementById('real-life-suggestions-output');
            const getRealLifeSuggestionsButton = document.getElementById('real-life-suggest-button');
            const realLifeGenerateButton = document.getElementById('real-life-generate-button');
            const realLifeSermonOutput = document.getElementById('real-life-sermon-output');
            
            // Quick Memo Sermon Elements
            const memoList = document.getElementById('memo-list');
            const memoSermonOutput = document.getElementById('memo-sermon-output');
            const suggestedVersesList = document.getElementById('suggested-verses');
            const suggestedTitlesList = document.getElementById('suggested-titles');
            const generateSermonButtonMemo = document.getElementById('generate-sermon-button-memo');

            // Event listeners for sermon type selection
            if(assistantButton) {
                assistantButton.addEventListener('click', () => {
                    showScreen('sermon-assistant-screen');
                });
            }
            if(expositoryButton) {
                expositoryButton.addEventListener('click', () => {
                    showScreen('expository-sermon-screen');
                });
            }
            if(realLifeButton) {
                realLifeButton.addEventListener('click', () => {
                    showScreen('real-life-sermon-screen');
                });
            }
            if(linkedButton) {
                linkedButton.addEventListener('click', () => {
                    showScreen('quick-memo-sermon-screen');
                    renderMemos(); // Render memos on screen switch
                });
            }
            
            // Back buttons
            if(backButtonAssistant) {
                backButtonAssistant.addEventListener('click', () => {
                    showScreen('sermon-selection-screen');
                });
            }
            if(backButtonExpository) {
                backButtonExpository.addEventListener('click', () => {
                    showScreen('sermon-selection-screen');
                });
            }
            if(backButtonRealLife) {
                backButtonRealLife.addEventListener('click', () => {
                    showScreen('sermon-selection-screen');
                });
            }
            if(backButtonMemo) {
                backButtonMemo.addEventListener('click', () => {
                    showScreen('sermon-selection-screen');
                });
            }

            // Event listener for Sermon Assistant - Get Commentary button
            if(getCommentaryButton) {
                getCommentaryButton.addEventListener('click', async () => {
                    const input = aiInput.value.trim();
                    if (!input) {
                        commentaryOutput.value = 'Please enter some content.';
                        return;
                    }
                    
                    showLoading(getCommentaryButton, true);
                    commentaryOutput.value = 'Fetching commentary...';

                    try {
                        let prompt = "";
                        if (isBibleVerse(input)) {
                            const verseResponse = await fetch(`https://bible-api.com/${input}?translation=kjv`);
                            const verseData = await verseResponse.json();
                            
                            if (verseResponse.ok && verseData.verses && verseData.verses.length > 0) {
                                const verseText = verseData.verses.map(v => `${v.book_name} ${v.chapter}:${v.verse} ${v.text}`).join(' ');
                                prompt = `Provide a detailed commentary in English for the verse: "${verseText}".`;
                            } else {
                                commentaryOutput.value = 'Verse not found.';
                                return;
                            }
                        } else {
                            prompt = `Provide a detailed commentary in English for the topic or question: "${input}".`;
                        }
                        
                        const commentary = await callGeminiApi(prompt);
                        commentaryOutput.value = commentary;

                    } catch (error) {
                        console.error('Error fetching commentary:', error);
                        commentaryOutput.value = 'An error occurred while fetching commentary.';
                    } finally {
                        showLoading(getCommentaryButton, false);
                    }
                });
            }

            // Event listener for Sermon Assistant - Generate Sermon with AI button
            if(generateSermonButton) {
                generateSermonButton.addEventListener('click', async () => {
                    const input = aiInput.value.trim();
                    const commentary = commentaryOutput.value.trim();
                    if (!input || !commentary || commentary.startsWith('Fetching commentary')) {
                        sermonOutput.value = 'Please get commentary first.';
                        return;
                    }

                    showLoading(generateSermonButton, true);
                    sermonOutput.value = 'Generating sermon...';
                    
                    try {
                        let prompt = "";
                        if (isBibleVerse(input)) {
                            prompt = `Write a comprehensive sermon draft in English based on the following Bible verse and commentary. [Verse] ${input} [Commentary] ${commentary}`;
                        } else {
                            prompt = `Write a comprehensive sermon draft in English based on the following topic and commentary. [Topic] ${input} [Commentary] ${commentary}`;
                        }

                        const sermon = await callGeminiApi(prompt);
                        sermonOutput.value = sermon;
                    } catch (error) {
                        console.error('Error generating sermon:', error);
                        sermonOutput.value = 'An error occurred while generating the sermon.';
                    } finally {
                        showLoading(generateSermonButton, false);
                    }
                });
            }

            // Event listener for Expository Sermon - Lookup Scripture button
            if(expositoryLookupButton) {
                expositoryLookupButton.addEventListener('click', async () => {
                    const input = expositoryVerseInput.value.trim();
                    if (!input) {
                        expositoryScriptureOutput.value = 'Please enter a Bible verse.';
                        return;
                    }
                    
                    showLoading(expositoryLookupButton, true);
                    expositoryScriptureOutput.value = 'Fetching scripture...';
                    expositoryCommentaryOutput.value = '';

                    try {
                        const verseResponse = await fetch(`https://bible-api.com/${input}?translation=kjv`);
                        const verseData = await verseResponse.json();
                        
                        if (verseResponse.ok && verseData.verses && verseData.verses.length > 0) {
                            const verseText = verseData.verses.map(v => `${v.book_name} ${v.chapter}:${v.verse} ${v.text}`).join(' ');
                            expositoryScriptureOutput.value = verseText;
                            
                            const prompt = `Provide a detailed commentary in English for the verse: "${verseText}".`;
                            const commentary = await callGeminiApi(prompt);
                            expositoryCommentaryOutput.value = commentary;
                        } else {
                            expositoryScriptureOutput.value = 'Verse not found.';
                        }
                    } catch (error) {
                        console.error('Error fetching scripture or commentary:', error);
                        expositoryScriptureOutput.value = 'An error occurred while fetching the scripture.';
                    } finally {
                        showLoading(expositoryLookupButton, false);
                    }
                });
            }

            // Event listener for Expository Sermon - Generate Sermon button
            if(expositoryGenerateButton) {
                expositoryGenerateButton.addEventListener('click', async () => {
                    const scripture = expositoryScriptureOutput.value.trim();
                    const commentary = expositoryCommentaryOutput.value.trim();
                    if (!scripture || scripture.startsWith('Fetching scripture') || !commentary || commentary.startsWith('Fetching commentary')) {
                        expositorySermonOutput.value = 'Please lookup scripture and get commentary first.';
                        return;
                    }

                    showLoading(expositoryGenerateButton, true);
                    expositorySermonOutput.value = 'Generating sermon...';
                    
                    try {
                        const prompt = `Write a comprehensive expository sermon draft in English based on the following scripture and commentary. [Scripture] ${scripture} [Commentary] ${commentary}`;
                        const sermon = await callGeminiApi(prompt);
                        expositorySermonOutput.value = sermon;
                    } catch (error) {
                        console.error('Error generating sermon:', error);
                        expositorySermonOutput.value = 'An error occurred while generating the sermon.';
                    } finally {
                        showLoading(expositoryGenerateButton, false);
                    }
                });
            }

            // Event listener for Real-Life Sermon - Suggest Scripture & Themes button
            if(getRealLifeSuggestionsButton) {
                getRealLifeSuggestionsButton.addEventListener('click', async () => {
                    const notes = realLifeNotesInput.value.trim();
                    if (!notes) {
                        realLifeSuggestionsOutput.value = 'Please enter a real-life event or topic.';
                        return;
                    }
                    
                    showLoading(getRealLifeSuggestionsButton, true);
                    realLifeSuggestionsOutput.value = 'Suggesting scripture & themes...';

                    try {
                        const prompt = `Based on the following real-life event or topic, suggest 3 highly relevant Bible verses (reference and full text) and 3 sermon themes.
Event/Topic: "${notes}"
Please format the response clearly with headings for "Suggested Verses" and "Suggested Themes".`;
                        
                        const suggestions = await callGeminiApi(prompt);
                        realLifeSuggestionsOutput.value = suggestions;

                    } catch (error) {
                        console.error('Error suggesting scripture or themes:', error);
                        realLifeSuggestionsOutput.value = 'An error occurred while suggesting scripture & themes.';
                    } finally {
                        showLoading(getRealLifeSuggestionsButton, false);
                    }
                });
            }

            // Event listener for Real-Life Sermon - Generate Sermon button
            if(realLifeGenerateButton) {
                realLifeGenerateButton.addEventListener('click', async () => {
                    const notes = realLifeNotesInput.value.trim();
                    const suggestions = realLifeSuggestionsOutput.value.trim();
                    if (!notes || !suggestions || suggestions.startsWith('Suggesting scripture')) {
                        realLifeSermonOutput.value = 'Please get suggestions first.';
                        return;
                    }

                    showLoading(realLifeGenerateButton, true);
                    realLifeSermonOutput.value = 'Generating sermon...';
                    
                    try {
                        const prompt = `Write a comprehensive real-life application sermon draft in English based on the following event/topic and AI suggestions.
Event/Topic: "${notes}"
Suggestions: "${suggestions}"`;
                        const sermon = await callGeminiApi(prompt);
                        realLifeSermonOutput.value = sermon;
                    } catch (error) {
                        console.error('Error generating sermon:', error);
                        realLifeSermonOutput.value = 'An error occurred while generating the sermon.';
                    } finally {
                        showLoading(realLifeGenerateButton, false);
                    }
                });
            }

            // Mock renderMemos function
            function renderMemos() {
                const memoList = document.getElementById('memo-list');
                const suggestedVersesList = document.getElementById('suggested-verses');
                const suggestedTitlesList = document.getElementById('suggested-titles');
                
                if (!memoList || !suggestedVersesList || !suggestedTitlesList) {
                    console.warn('Memo list elements not found.');
                    return;
                }

                // Mock data for memos
                const mockMemos = [
                    { id: '1', content: 'What is the nature of Christian joy?', selected: false },
                    { id: '2', content: 'The power of forgiveness.', selected: false },
                    { id: '3', content: 'How do we find strength in times of weakness?', selected: false },
                    { id: '4', content: 'The meaning of the resurrection.', selected: false },
                    { id: '5', content: 'The importance of prayer in daily life.', selected: false },
                ];

                memoList.innerHTML = '';
                suggestedVersesList.innerHTML = '';
                suggestedTitlesList.innerHTML = '';

                mockMemos.forEach(memo => {
                    const li = document.createElement('li');
                    li.id = `memo-${memo.id}`;
                    li.className = 'memo-list-item p-4 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-pointer transition';
                    li.textContent = memo.content;
                    li.dataset.content = memo.content;

                    li.addEventListener('click', async () => {
                        document.querySelectorAll('.memo-list-item').forEach(item => item.classList.remove('selected'));
                        li.classList.add('selected');

                        const selectedMemoContent = li.dataset.content;
                        
                        // Show loading state
                        const generateButtonMemo = document.getElementById('generate-sermon-button-memo');
                        showLoading(generateButtonMemo, true);
                        generateButtonMemo.textContent = 'Getting AI suggestions...';

                        try {
                            const prompt = `Based on the following memo, suggest 3 highly relevant Bible verses (reference and full text) and 3 sermon titles.
Memo: "${selectedMemoContent}"
Format the response clearly with headings for "Suggested Verses" and "Suggested Titles".`;
                            
                            const aiResponse = await callGeminiApi(prompt);
                            
                            // Clear previous suggestions
                            suggestedVersesList.innerHTML = '';
                            suggestedTitlesList.innerHTML = '';

                            const [versesSection, titlesSection] = aiResponse.split('Suggested Titles:');
                            const suggestedVerses = versesSection.replace('Suggested Verses:', '').split('\n').filter(line => line.trim() !== '');
                            const suggestedTitles = titlesSection.split('\n').filter(line => line.trim() !== '');
                            
                            suggestedVerses.forEach(verse => {
                                const li = document.createElement('li');
                                li.className = 'text-gray-300';
                                li.textContent = verse.trim();
                                suggestedVersesList.appendChild(li);
                            });
                            
                            suggestedTitles.forEach(title => {
                                const li = document.createElement('li');
                                li.className = 'suggestion-item p-2 bg-gray-700 hover:bg-gray-600 rounded cursor-pointer transition';
                                li.textContent = title.trim();
                                li.dataset.title = title.trim();
                                li.addEventListener('click', () => {
                                    document.querySelectorAll('.suggestion-item').forEach(item => item.classList.remove('selected'));
                                    li.classList.add('selected');
                                });
                                suggestedTitlesList.appendChild(li);
                            });
                            
                        } catch (error) {
                            console.error('Error getting AI suggestions:', error);
                            suggestedVersesList.innerHTML = `<li class="text-red-400">Error: Failed to get AI suggestions.</li>`;
                            suggestedTitlesList.innerHTML = '';
                        } finally {
                            showLoading(generateButtonMemo, false);
                        }
                    });
                });
            }
        });
    </script>
</body>
</html>
