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
