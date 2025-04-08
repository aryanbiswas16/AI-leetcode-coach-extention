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
    const inputElement = document.getElementById('hint-input');
    const userQuestion = inputElement.value.trim();

    messageElement.value = 'Loading...';

    chrome.runtime.sendMessage({ 
        action: 'getAIResponse',
        question: userQuestion 
    }, (response) => {
        if (chrome.runtime.lastError) {
            messageElement.value = `Error: ${chrome.runtime.lastError.message}`;
        } else {
            messageElement.value = response;
        }
        inputElement.value = ''; 
    });
});

// Notes button functionality
document.getElementById('SaveNotesButton').addEventListener('click', function() {
    const notesInput = document.getElementById('notes-input');
    notesInput.value = 'Loading study notes...';

    chrome.runtime.sendMessage({ 
        action: 'getNotes'
    }, (notes) => {
        if (chrome.runtime.lastError) {
            notesInput.value = `Error: ${chrome.runtime.lastError.message}`;
        } else {
            notesInput.value = notes;
            // Send the notes to content script to add to LeetCode
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'addToLeetCodeNotes',
                    notes: notes
                }, function(response) {
                    if (response && response.success) {
                        notesInput.value += '\n\nNotes successfully added to LeetCode!';
                    } else {
                        notesInput.value += '\n\nCouldn\'t find LeetCode notes section. Please make sure you\'re on a problem page.';
                    }
                });
            });
        }
    });
});


