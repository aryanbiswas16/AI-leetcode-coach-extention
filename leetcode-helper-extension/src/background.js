const OPENAI_API_KEY = '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';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getAIResponse') {
        getLeetCodeDataAndFetchAIResponse(request.question).then(sendResponse);
        return true; 
    }
    if (request.action === 'getSolution') {
        getLeetCodeDataAndFetchSolution(request.question).then(sendResponse);
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

async function getLeetCodeDataAndFetchSolution(userQuestion) {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const leetCodeData = await new Promise((resolve) => {
            chrome.tabs.sendMessage(tab.id, { action: 'getLeetCodeData' }, resolve);
        });
        
        leetCodeData.userQuestion = userQuestion;
        const prompt = createSolutionPrompt(leetCodeData);
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

function createSolutionPrompt(leetCodeData) {
    const { problemData, userQuestion } = leetCodeData;
    return `
        Please provide a detailed solution for this LeetCode problem:
        Title: ${problemData.title}
        Difficulty: ${problemData.difficulty}
        Description: ${problemData.description}
        
        User's Specific Question: ${userQuestion || 'Please provide a complete solution approach.'}
        
        ${userQuestion ? 'Focus on answering the user\'s specific question while providing relevant solution details.' : 'Explain the solution approach and provide the code implementation.'}
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
                max_tokens: 200
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
