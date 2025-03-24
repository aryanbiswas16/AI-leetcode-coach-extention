document.getElementById('helloButton').addEventListener('click', async function() {
    const messageElement = document.getElementById('message');
    messageElement.value = 'Loading...';

    chrome.runtime.sendMessage({action: 'getAIResponse'}, (response) => {
        messageElement.value = response;
    });
});