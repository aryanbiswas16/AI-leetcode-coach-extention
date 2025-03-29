const OPENAI_API_KEY = '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';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getAIResponse') {
        getLeetCodeDataAndFetchAIResponse().then(sendResponse);
        return true; 
    }
    if (request.action === 'getSolution') {
        getLeetCodeDataAndFetchSolution().then(sendResponse);
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
        return true; // Keep the message channel open for async response
    }
});

async function getLeetCodeDataAndFetchAIResponse() {
    try {
        // Get the active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Fetch LeetCode data from content script
        const leetCodeData = await new Promise((resolve) => {
            chrome.tabs.sendMessage(tab.id, { action: 'getLeetCodeData' }, resolve);
        });

        // Now use this data to create the AI prompt
        const prompt = createPromptFromLeetCodeData(leetCodeData);
        
        return await fetchAIResponse(prompt);
    } catch (error) {
        console.error('Error:', error);
        return `Error: ${error.message}`;
    }
}

// Add new function for solution
async function getLeetCodeDataAndFetchSolution() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const leetCodeData = await new Promise((resolve) => {
            chrome.tabs.sendMessage(tab.id, { action: 'getLeetCodeData' }, resolve);
        });
        
        const prompt = createSolutionPrompt(leetCodeData);
        return await fetchAIResponse(prompt);
    } catch (error) {
        console.error('Error:', error);
        return `Error: ${error.message}`;
    }
}

function createPromptFromLeetCodeData(leetCodeData) {
    const { problemData, codeSnippet } = leetCodeData;
    return `
        LeetCode Problem:
        Title: ${problemData.title}
        Difficulty: ${problemData.difficulty}
        Description: ${problemData.description}
        
        Current Code:
        ${codeSnippet}
        
        tell me the title, a brief description for the problem (as provided by previous description) and if you have recieved the current code
       print it.
    `;
}

function createSolutionPrompt(leetCodeData) {
    const { problemData } = leetCodeData;
    return `
        Please provide a detailed solution for this LeetCode problem:
        Title: ${problemData.title}
        Difficulty: ${problemData.difficulty}
        Description: ${problemData.description}
        
        Explain the solution approach and provide the code implementation.
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
