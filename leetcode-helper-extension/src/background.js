const OPENAI_API_KEY = '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';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getAIResponse') {
        getLeetCodeDataAndFetchAIResponse(request.question).then(sendResponse);
        return true; 
    }
    if (request.action === 'getNotes') {
        getLeetCodeDataAndFetchNotes().then(sendResponse);
        return true;
    }
    if (request.action === 'executeScriptForCode') {
        chrome.scripting.executeScript(
            {
                target: { tabId: sender.tab.id },
                world: 'MAIN', // Run in the page's context
                func: () => {
                    const editor = window.monaco?.editor;
                    if (editor) {
                        const models = editor.getModels();
                        return models.length ? models[0].getValue() : null;
                    }
                    return null;
                }
            },
            (results) => {
                if (chrome.runtime.lastError) {
                    console.error('Error executing script:', chrome.runtime.lastError.message);
                    sendResponse({ code: null });
                } else {
                    const code = results && results[0]?.result;
                    sendResponse({ code });
                }
            }
        );
        return true; 
    }
});

async function getLeetCodeDataAndFetchAIResponse(userQuestion) {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const leetCodeData = await new Promise((resolve) => {
            chrome.tabs.sendMessage(tab.id, { action: 'getLeetCodeData' }, resolve);
        });

        // Add user question to leetCodeData
        leetCodeData.userQuestion = userQuestion;
        const prompt = createPromptFromLeetCodeData(leetCodeData);
        
        return await fetchAIResponse(prompt);
    } catch (error) {
        console.error('Error:', error);
        return `Error: ${error.message}`;
    }
}

async function getLeetCodeDataAndFetchNotes() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const leetCodeData = await new Promise((resolve) => {
            chrome.tabs.sendMessage(tab.id, { action: 'getLeetCodeData' }, resolve);
        });
        
        const prompt = createNotesPrompt(leetCodeData);
        return await fetchAIResponse(prompt);
    } catch (error) {
        console.error('Error:', error);
        return `Error: ${error.message}`;
    }
}

function createPromptFromLeetCodeData(leetCodeData) {
    const { problemData, codeSnippet, userQuestion } = leetCodeData;
    return `
        LeetCode Problem:
        Title: ${problemData.title}
        Difficulty: ${problemData.difficulty}
        Description: ${problemData.description}
        
        Current Code:
        ${codeSnippet}
        
        User's Question:
        ${userQuestion || 'No specific question asked. Please provide a general hint for this problem.'}

        Please provide a ${userQuestion ? 'specific answer to the user\'s question' : 'helpful hint'} for solving this LeetCode problem.
    `;
}

function createNotesPrompt(leetCodeData) {
    const { problemData, codeSnippet } = leetCodeData;  // Add codeSnippet
    return `
        Please create structured study notes for this LeetCode problem that I can reference in the future:
        Title: ${problemData.title}
        Difficulty: ${problemData.difficulty}
        Description: ${problemData.description}
        
        Current Code:
        ${codeSnippet || 'No code provided'}
        
        Format the notes as follows:
        1. Problem Pattern/Category
        2. Key Insights
        3. Step-by-Step Solution Approach
        4. Time and Space Complexity
        5. Common Pitfalls to Avoid
        6. Similar Problems to Practice

        Keep the notes focused on the logical approach to solving this type of problem.
    `;
}

async function fetchAIResponse(prompt) {
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [{
                    role: 'user',
                    content: prompt
                }],
                max_tokens: 1000,  // Increased from 200 to 1000 for more detailed notes
                temperature: 0.7   // Added for more consistent responses
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(`API Error: ${data.error?.message || 'Unknown error'}`);
        }

        if (!data.choices || data.choices.length === 0) {
            throw new Error('No response choices returned from API');
        }

        return data.choices[0].message.content;
    } catch (error) {
        console.error('Error details:', error);
        return `Error: ${error.message}`;
    }
}
