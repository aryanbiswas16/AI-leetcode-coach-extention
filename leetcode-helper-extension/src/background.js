const OPENAI_API_KEY = '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';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getAIResponse') {
        fetchAIResponse().then(sendResponse);
        return true; // Required for async response
    }
});

async function fetchAIResponse() {
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
                    content: 'Give me a leetcode problem solving tip'
                }],
                max_tokens: 150
            })
        });

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        return `Error: ${error.message}`;
    }
}
