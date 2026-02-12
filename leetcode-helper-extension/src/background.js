// Modernized Background Script for Kimi (Moonshot) API
// LeetCode Helper Extension v2.0

// API key - add your Kimi API key here
const KIMI_API_KEY = 'YOUR_KIMI_API_KEY_HERE';
const KIMI_BASE_URL = 'https://api.moonshot.cn/v1';

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
                world: 'MAIN',
                func: () => {
                    // Try multiple methods to get code from Monaco editor
                    const editor = window.monaco?.editor;
                    if (editor) {
                        const models = editor.getModels();
                        if (models.length) {
                            return models[0].getValue();
                        }
                    }
                    
                    // Fallback: try to get from CodeMirror
                    const cm = document.querySelector('.CodeMirror');
                    if (cm && cm.CodeMirror) {
                        return cm.CodeMirror.getValue();
                    }
                    
                    // Last resort: try getting from textarea
                    const textarea = document.querySelector('textarea[data-cy="code-editor"]');
                    if (textarea) {
                        return textarea.value;
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
        
        // Check if we're on LeetCode
        if (!tab.url.includes('leetcode.com')) {
            return 'Error: Please navigate to a LeetCode problem page first.';
        }
        
        const leetCodeData = await new Promise((resolve) => {
            chrome.tabs.sendMessage(tab.id, { action: 'getLeetCodeData' }, resolve);
        });

        if (!leetCodeData || !leetCodeData.problemData) {
            return 'Error: Could not extract problem data. Make sure you\'re on a problem page.';
        }

        // Add user question to leetCodeData
        leetCodeData.userQuestion = userQuestion;
        const prompt = createPromptFromLeetCodeData(leetCodeData);
        
        return await fetchKimiResponse(prompt);
    } catch (error) {
        console.error('Error:', error);
        return `Error: ${error.message}`;
    }
}

async function getLeetCodeDataAndFetchNotes() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab.url.includes('leetcode.com')) {
            return 'Error: Please navigate to a LeetCode problem page first.';
        }
        
        const leetCodeData = await new Promise((resolve) => {
            chrome.tabs.sendMessage(tab.id, { action: 'getLeetCodeData' }, resolve);
        });
        
        if (!leetCodeData || !leetCodeData.problemData) {
            return 'Error: Could not extract problem data.';
        }
        
        const prompt = createNotesPrompt(leetCodeData);
        return await fetchKimiResponse(prompt);
    } catch (error) {
        console.error('Error:', error);
        return `Error: ${error.message}`;
    }
}

function createPromptFromLeetCodeData(leetCodeData) {
    const { problemData, codeSnippet, userQuestion } = leetCodeData;
    
    return `You are a helpful coding assistant helping with LeetCode problems.

LeetCode Problem:
Title: ${problemData.title || 'Unknown'}
Difficulty: ${problemData.difficulty || 'Unknown'}
Description: ${problemData.description || 'No description'}

${problemData.examples ? `Examples:\n${problemData.examples}\n` : ''}

Current Code:
${codeSnippet || 'No code written yet'}

${userQuestion ? `User's Question: ${userQuestion}` : 'Please provide a helpful hint for solving this LeetCode problem. Give me a nudge in the right direction without giving away the full solution.'}

Instructions:
- Provide a clear, concise hint or explanation
- Don't give the complete solution code
- Focus on the algorithm/approach
- If there's a bug in the code, point it out gently
- Keep it encouraging and educational`;
}

function createNotesPrompt(leetCodeData) {
    const { problemData, codeSnippet } = leetCodeData;
    
    return `Create structured study notes for this LeetCode problem:

Title: ${problemData.title || 'Unknown'}
Difficulty: ${problemData.difficulty || 'Unknown'}
Description: ${problemData.description || 'No description'}

${problemData.examples ? `Examples:\n${problemData.examples}\n` : ''}

Current Code:
${codeSnippet || 'No code provided'}

Please format the notes as follows:

🎯 PROBLEM PATTERN/CATEGORY
What type of problem is this? (e.g., Two Pointers, Dynamic Programming, Graph, etc.)

💡 KEY INSIGHTS
What are the important observations to solve this?

📝 STEP-BY-STEP APPROACH
Break down the solution logic

⏱️ TIME & SPACE COMPLEXITY
Expected complexity

⚠️ COMMON PITFALLS
What mistakes to avoid?

🔍 SIMILAR PROBLEMS
Other problems to practice

Keep it concise but comprehensive for future reference.`;
}

async function fetchKimiResponse(prompt) {
    try {
        const response = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${KIMI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'moonshot-v1-8k',  // Kimi model - good balance of speed and capability
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful coding assistant specializing in LeetCode problems. Provide hints and guidance without giving away complete solutions. Be encouraging and educational.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 1500,
                temperature: 0.7
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
        console.error('Kimi API Error:', error);
        
        // Provide helpful error messages
        if (error.message.includes('401')) {
            return 'Error: Invalid API key. Please check your Kimi API key.';
        } else if (error.message.includes('429')) {
            return 'Error: Rate limit exceeded. Please wait a moment and try again.';
        } else if (error.message.includes('network')) {
            return 'Error: Network issue. Please check your internet connection.';
        }
        
        return `Error: ${error.message}`;
    }
}