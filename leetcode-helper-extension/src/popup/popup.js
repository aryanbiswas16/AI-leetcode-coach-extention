document.getElementById('helloButton').addEventListener('click', async function() {
    const messageElement = document.getElementById('message');
    messageElement.value = 'Loading...';

    // Send a message to the background script
    chrome.runtime.sendMessage({ action: 'getAIResponse' }, (response) => {
        if (chrome.runtime.lastError) {
            messageElement.value = `Error: ${chrome.runtime.lastError.message}`;
        } else {
            messageElement.value = response;
        }
    });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Received message:', request);
    if (request.action === 'getProblemData') {
        const problemData = getProblemData();
        console.log('Sending problem data:', problemData);
        sendResponse(problemData);
    } else if (request.action === 'getCodeSnippet') {
        const codeSnippet = getCodeSnippet();
        console.log('Sending code snippet:', codeSnippet);
        sendResponse({ code: codeSnippet });
    }
    return true;
});
