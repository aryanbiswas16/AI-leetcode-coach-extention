// Modernized Content Script for LeetCode Helper Extension v2.0
// Updated selectors for latest LeetCode UI

console.log('✅ LeetCode Helper Extension v2.0 loaded');

// Utility function to wait for elements
function waitForElement(selector, callback, timeout = 10000) {
    const startTime = Date.now();
    
    const checkElement = () => {
        const element = document.querySelector(selector);
        
        if (element) {
            callback(element);
            return;
        }
        
        if (Date.now() - startTime < timeout) {
            setTimeout(checkElement, 500);
        } else {
            console.log(`⚠️ Element with selector "${selector}" not found after ${timeout}ms`);
            callback(null);
        }
    };
    
    checkElement();
}

// Get problem data with updated selectors for modern LeetCode
function getProblemData() {
    // Try multiple selectors for title (LeetCode changes these often)
    const titleSelectors = [
        '[data-cy="question-title"]',
        '.text-title-large',
        'div[class*="title"] h1',
        'div[class*="title"]',
        '[class*="question-title"]',
        'h1[class*="title"]',
        '.mr-2.text-lg.font-medium'
    ];
    
    let titleElement = null;
    for (const selector of titleSelectors) {
        titleElement = document.querySelector(selector);
        if (titleElement) break;
    }
    
    // Try multiple selectors for description
    const descriptionSelectors = [
        '[data-cy="question-content"]',
        '.elfjS',
        '[class*="question-content"]',
        '[class*="description"]',
        '.content__u3I1',
        'div[data-track-load="description_content"]'
    ];
    
    let descriptionElement = null;
    for (const selector of descriptionSelectors) {
        descriptionElement = document.querySelector(selector);
        if (descriptionElement) break;
    }
    
    // Try multiple selectors for difficulty
    const difficultySelectors = [
        '[data-cy="question-difficulty"]',
        '[class*="difficulty"]',
        'div[diff]',
        '.text-difficulty',
        '[class*="text-"][class*="difficulty"]'
    ];
    
    let difficultyElement = null;
    for (const selector of difficultySelectors) {
        difficultyElement = document.querySelector(selector);
        if (difficultyElement) break;
    }
    
    // Try to get examples
    const exampleSelectors = [
        'pre[class*="example"]',
        '.example-testcase',
        '[class*="example"] pre',
        '.elfjS pre'
    ];
    
    let examples = '';
    for (const selector of exampleSelectors) {
        const blocks = document.querySelectorAll(selector);
        if (blocks.length > 0) {
            examples = Array.from(blocks).map(block => block.textContent).join('\n\n');
            break;
        }
    }
    
    // Clean up the text
    const title = titleElement ? titleElement.textContent.trim() : 'Unknown Title';
    const description = descriptionElement ? 
        descriptionElement.textContent.replace(/\s+/g, ' ').trim().substring(0, 1000) : 
        'No description found';
    const difficulty = difficultyElement ? difficultyElement.textContent.trim() : 'Unknown';
    
    console.log('📋 Scraped Problem Data:', { title, difficulty, descriptionLength: description.length });
    
    return { title, description, difficulty, examples };
}

// Get code from Monaco editor or other sources
function getCodeSnippet() {
    // Method 1: Try Monaco editor (most common)
    if (window.monaco && window.monaco.editor) {
        try {
            const models = window.monaco.editor.getModels();
            if (models.length > 0) {
                const code = models[0].getValue();
                if (code && code.trim().length > 0) {
                    console.log('✅ Got code from Monaco editor');
                    return code;
                }
            }
        } catch (e) {
            console.log('Monaco access failed:', e);
        }
    }
    
    // Method 2: Try CodeMirror
    const cmElement = document.querySelector('.CodeMirror');
    if (cmElement && cmElement.CodeMirror) {
        try {
            const code = cmElement.CodeMirror.getValue();
            if (code && code.trim().length > 0) {
                console.log('✅ Got code from CodeMirror');
                return code;
            }
        } catch (e) {
            console.log('CodeMirror access failed:', e);
        }
    }
    
    // Method 3: Try getting from view lines (Monaco DOM)
    const viewLines = document.querySelectorAll('.monaco-editor .view-line');
    if (viewLines.length > 0) {
        const code = Array.from(viewLines).map(line => line.textContent).join('\n');
        if (code.trim().length > 0) {
            console.log('✅ Got code from Monaco DOM');
            return code;
        }
    }
    
    // Method 4: Try textarea
    const textarea = document.querySelector('textarea[data-cy="code-editor"]') || 
                    document.querySelector('.ace_text-input') ||
                    document.querySelector('textarea[class*="editor"]');
    if (textarea && textarea.value) {
        console.log('✅ Got code from textarea');
        return textarea.value;
    }
    
    console.log('⚠️ Could not extract code from any source');
    return '// No code found - please make sure the editor is visible';
}

// Get all LeetCode data
function getLeetCodeData() {
    return {
        problemData: getProblemData(),
        codeSnippet: getCodeSnippet(),
        url: window.location.href
    };
}

// Add notes to LeetCode notes section
function addToLeetCodeNotes(notes) {
    // Try multiple selectors for notes tab
    const notesTabSelectors = [
        '[data-cy="notes-tab"]',
        'button[data-track-target="Notes"]',
        '[class*="notes-tab"]',
        'button:contains("Note")'
    ];
    
    let notesTab = null;
    for (const selector of notesTabSelectors) {
        notesTab = document.querySelector(selector);
        if (notesTab) break;
    }
    
    if (notesTab) {
        notesTab.click();
        
        setTimeout(() => {
            // Try multiple selectors for notes textarea
            const textareaSelectors = [
                '[data-cy="note-area"]',
                'textarea[placeholder*="note"]',
                '.notewrap textarea',
                '[class*="note"] textarea'
            ];
            
            let notesTextArea = null;
            for (const selector of textareaSelectors) {
                notesTextArea = document.querySelector(selector);
                if (notesTextArea) break;
            }
            
            if (notesTextArea) {
                notesTextArea.value = notes;
                
                // Trigger input event
                const inputEvent = new Event('input', { bubbles: true });
                notesTextArea.dispatchEvent(inputEvent);
                
                // Try to find save button
                const saveButtonSelectors = [
                    '[data-cy="note-save-btn"]',
                    'button[data-track-target="saveNote"]',
                    'button:contains("Save")',
                    '[class*="save"] button'
                ];
                
                let saveButton = null;
                for (const selector of saveButtonSelectors) {
                    saveButton = document.querySelector(selector);
                    if (saveButton) break;
                }
                
                if (saveButton) {
                    saveButton.click();
                    console.log('✅ Notes saved successfully');
                    return true;
                }
            }
            
            console.log('⚠️ Could not find notes textarea or save button');
            return false;
        }, 1500);
    }
    
    console.log('⚠️ Could not find notes tab');
    return false;
}

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📨 Received message:', request);
    
    if (request.action === 'getLeetCodeData') {
        const data = getLeetCodeData();
        sendResponse(data);
        return true;
    }
    
    if (request.action === 'getProblemData') {
        const data = getProblemData();
        sendResponse(data);
        return true;
    }
    
    if (request.action === 'getCodeSnippet') {
        const code = getCodeSnippet();
        sendResponse({ code });
        return true;
    }
    
    if (request.action === 'addToLeetCodeNotes') {
        const success = addToLeetCodeNotes(request.notes);
        sendResponse({ success });
        return true;
    }
});

// Detect page changes (for SPA navigation)
let currentUrl = window.location.href;
setInterval(() => {
    if (currentUrl !== window.location.href) {
        currentUrl = window.location.href;
        console.log('🔄 URL changed, new problem detected:', currentUrl);
        
        // Wait for new problem to load
        setTimeout(() => {
            const data = getLeetCodeData();
            console.log('📋 New problem data:', data);
        }, 3000);
    }
}, 1000);

// Initial load
setTimeout(() => {
    const data = getLeetCodeData();
    console.log('📋 Initial problem data:', data);
}, 2000);