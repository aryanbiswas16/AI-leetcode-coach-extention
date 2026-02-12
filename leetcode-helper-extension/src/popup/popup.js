// Modernized Popup Script for LeetCode Helper Extension v2.0

document.addEventListener('DOMContentLoaded', () => {
    // Tab switching
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            button.classList.add('active');
            document.getElementById(`${button.dataset.tab}-tab`).classList.add('active');
        });
    });

    // Hint button functionality
    document.getElementById('HintButton').addEventListener('click', async function() {
        const messageElement = document.getElementById('message');
        const inputElement = document.getElementById('hint-input');
        const userQuestion = inputElement.value.trim();

        if (!userQuestion) {
            messageElement.value = 'Please enter a question first!';
            return;
        }

        messageElement.value = '🤔 Thinking...';
        
        // Disable button while loading
        this.disabled = true;
        this.textContent = 'Loading...';

        chrome.runtime.sendMessage({ 
            action: 'getAIResponse',
            question: userQuestion 
        }, (response) => {
            // Re-enable button
            this.disabled = false;
            this.textContent = 'Send';
            
            if (chrome.runtime.lastError) {
                messageElement.value = `❌ Error: ${chrome.runtime.lastError.message}`;
            } else {
                messageElement.value = response;
            }
            inputElement.value = ''; 
        });
    });

    // Allow Enter key to submit
    document.getElementById('hint-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('HintButton').click();
        }
    });

    // Notes button functionality
    document.getElementById('SaveNotesButton').addEventListener('click', async function() {
        const notesInput = document.getElementById('notes-input');
        
        notesInput.value = '📝 Generating study notes...';
        this.disabled = true;
        this.textContent = 'Generating...';

        chrome.runtime.sendMessage({ 
            action: 'getNotes'
        }, (notes) => {
            this.disabled = false;
            this.textContent = 'Generate Notes';
            
            if (chrome.runtime.lastError) {
                notesInput.value = `❌ Error: ${chrome.runtime.lastError.message}`;
            } else {
                notesInput.value = notes;
                
                // Auto-save to LeetCode notes
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    if (tabs[0].url.includes('leetcode.com')) {
                        chrome.tabs.sendMessage(tabs[0].id, {
                            action: 'addToLeetCodeNotes',
                            notes: notes
                        }, function(response) {
                            if (response && response.success) {
                                notesInput.value += '\n\n✅ Notes saved to LeetCode!';
                            } else {
                                notesInput.value += '\n\n⚠️ Could not auto-save to LeetCode. You can copy these notes manually.';
                            }
                        });
                    }
                });
            }
        });
    });

    // Copy to clipboard functionality
    document.getElementById('CopyNotesButton').addEventListener('click', function() {
        const notesInput = document.getElementById('notes-input');
        notesInput.select();
        document.execCommand('copy');
        
        const originalText = this.textContent;
        this.textContent = 'Copied!';
        setTimeout(() => {
            this.textContent = originalText;
        }, 2000);
    });

    // Quick hint buttons
    document.querySelectorAll('.quick-hint').forEach(button => {
        button.addEventListener('click', function() {
            const hintType = this.dataset.hint;
            const inputElement = document.getElementById('hint-input');
            
            const prompts = {
                'approach': 'What approach should I use for this problem?',
                'bug': 'Can you help me find a bug in my code?',
                'optimize': 'How can I optimize my solution?',
                'explain': 'Can you explain the problem in simpler terms?'
            };
            
            inputElement.value = prompts[hintType] || '';
            inputElement.focus();
        });
    });
});