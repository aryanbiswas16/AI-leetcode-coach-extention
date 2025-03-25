// Tab switching functionality
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all tabs and contents
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding content
        button.classList.add('active');
        document.getElementById(`${button.dataset.tab}-tab`).classList.add('active');
    });
});

// Hint button functionality
document.getElementById('HintButton').addEventListener('click', async function() {
    const messageElement = document.getElementById('message');
    messageElement.value = 'Loading...';

    chrome.runtime.sendMessage({ action: 'getAIResponse' }, (response) => {
        if (chrome.runtime.lastError) {
            messageElement.value = `Error: ${chrome.runtime.lastError.message}`;
        } else {
            messageElement.value = response;
        }
    });
});

// Solution button functionality
document.getElementById('SolutionButton').addEventListener('click', async function() {
    const messageElement = document.getElementById('solution-message');
    messageElement.value = 'Loading solution...';

    chrome.runtime.sendMessage({ action: 'getSolution' }, (response) => {
        if (chrome.runtime.lastError) {
            messageElement.value = `Error: ${chrome.runtime.lastError.message}`;
        } else {
            messageElement.value = response;
        }
    });
});
