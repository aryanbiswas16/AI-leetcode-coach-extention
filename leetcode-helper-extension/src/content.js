console.log('LeetCode Helper Extension loaded');

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
            console.log(`Element with selector "${selector}" not found after ${timeout}ms`);
            callback(null);
        }
    };
    
    checkElement();
}

function getProblemData() {
    const titleElement = document.querySelector('div[data-cy="question-title"]') || 
                        document.querySelector('.mr-2.text-lg.font-medium') ||
                        document.querySelector('div[class*="title"]');
    
    const descriptionElement = document.querySelector('div[data-cy="question-content"]') ||
                              document.querySelector('div[class*="description"]') ||
                              document.querySelector('.content__u3I1.question-content__JfgR');
    
    const difficultyElement = document.querySelector('div[data-cy="question-difficulty"]') ||
                             document.querySelector('div[diff]') ||
                             document.querySelector('.difficulty-label');
    
    const exampleBlocks = Array.from(document.querySelectorAll('pre[class*="example-"]') || 
                                   document.querySelectorAll('.example-testcase'));
    
    const examples = exampleBlocks.map(block => block.textContent).join('\n\n');
    
    const title = titleElement ? titleElement.textContent.trim() : 'Unknown Title';
    const description = descriptionElement ? 
        descriptionElement.textContent.replace(/\s+/g, ' ').trim() : 
        'No description found';
    const difficulty = difficultyElement ? difficultyElement.textContent.trim() : 'Unknown Difficulty';
    
    console.log('Scraped Problem Data:', { title, description, difficulty, examples });
    return { title, description, difficulty, examples };
}

function getProblemDataFromMeta() {
    const descriptionMeta = document.querySelector('meta[name="description"]');
    const titleMeta = document.querySelector('meta[property="og:title"]');
    
    if (descriptionMeta && titleMeta) {
        const title = titleMeta.getAttribute('content').replace(' - LeetCode', '');
        const description = descriptionMeta.getAttribute('content');
        return { title, description };
    }
    
    return getProblemData();
}

function getCodeSnippet() {
    const lines = document.querySelectorAll('.monaco-editor .view-line');
    const code = Array.from(lines).map(line => line.textContent).join('\n');
    console.log("Extracted code from DOM:", code);
    return code;
}

function getLeetCodeData() {
    return {
        problemData: getProblemDataFromMeta(),
        codeSnippet: getCodeSnippet()
    };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Received message:', request);
    
    if (request.action === 'getLeetCodeData') {
        const immediateData = getLeetCodeData();
        
        if (immediateData.problemData.title && 
            immediateData.codeSnippet !== 'No code found') {
            console.log('Sending immediate data:', immediateData);
            sendResponse(immediateData);
            return true;
        }
        
        waitForElement('[data-cy="question-title"], .css-v3d350, .question-title', (element) => {
            if (element) {
                setTimeout(() => {
                    const data = getLeetCodeData();
                    console.log('Sending delayed data:', data);
                    sendResponse(data);
                }, 1000);
            } else {
                console.log('Sending fallback data:', immediateData);
                sendResponse(immediateData);
            }
        });
        
        return true;
    }
    
    if (request.action === 'getProblemData') {
        waitForElement('[data-cy="question-title"], .css-v3d350, .question-title', () => {
            const problemData = getProblemDataFromMeta();
            console.log('Sending problem data:', problemData);
            sendResponse(problemData);
        });
        return true;
    } 
    
    if (request.action === 'getCodeSnippet') {
        waitForElement('.monaco-editor, .CodeMirror', () => {
            const codeSnippet = getCodeSnippet();
            console.log('Sending code snippet:', codeSnippet);
            sendResponse({ code: codeSnippet });
        });
        return true;
    }

    if (request.action === 'addToLeetCodeNotes') {
        setTimeout(() => {
            const success = addToLeetCodeNotes(request.notes);
            sendResponse({ success });
        }, 500);
        return true;
    }
});

let currentUrl = window.location.href;
setInterval(() => {
    if (currentUrl !== window.location.href) {
        currentUrl = window.location.href;
        console.log('URL changed, new page detected:', currentUrl);
        
        setTimeout(() => {
            const data = getLeetCodeData();
            console.log('New problem data:', data);
        }, 2000);
    }
}, 1000);

setTimeout(() => {
    const initialData = getLeetCodeData();
    console.log('Initial page data:', initialData);
}, 3000);

function addToLeetCodeNotes(notes) {
    const notesTab = document.querySelector('[data-cy="notes-tab"]') ||
                    document.querySelector('button[data-track-target="Notes"]');
    
    if (notesTab) {
        notesTab.click();
        setTimeout(() => {
            const notesTextArea = document.querySelector('[data-cy="note-area"]') || 
                                document.querySelector('textarea[placeholder*="note"]') ||
                                document.querySelector('.notewrap textarea');
            
            if (notesTextArea) {
                notesTextArea.value = notes;
                
                const inputEvent = new Event('input', { bubbles: true });
                notesTextArea.dispatchEvent(inputEvent);
                
                const saveButton = document.querySelector('[data-cy="note-save-btn"]') ||
                                 document.querySelector('button[data-track-target="saveNote"]');
                if (saveButton) {
                    saveButton.click();
                }
                
                return true;
            }
        }, 1000);
    }
    
    return false;
}


