console.log('LeetCode Helper Extension loaded');

// Wait for elements to be available in the DOM
// makes sure user is on a problems page
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
            callback(null); // Call the callback with null to indicate failure
        }
    };
    
    checkElement();
}

// Function to extract problem data
function getProblemData() {
    // Try multiple possible selectors
    const titleElement = document.querySelector('[data-cy="question-title"]') || 
                         document.querySelector('.css-v3d350') ||
                         document.querySelector('.question-title');
    
    const descriptionElement = document.querySelector('[data-cy="question-content"]') || 
                               document.querySelector('.content__u3I1') ||
                               document.querySelector('.question-content');
    
    const difficultyElement = document.querySelector('.css-10o4wqw') || 
                              document.querySelector('[diff]');
    
    // Extract constraints and examples
    const exampleBlocks = Array.from(document.querySelectorAll('.example-block') || 
                                    document.querySelectorAll('.example'));
    
    const examples = exampleBlocks.map(block => block.innerText).join('\n\n');
    
    const title = titleElement ? titleElement.innerText : 'Unknown Title';
    const description = descriptionElement ? descriptionElement.innerText : 'No description found';
    const difficulty = difficultyElement ? difficultyElement.innerText : 'Unknown Difficulty';
    
    console.log('Scraped Problem Data:', { title, description, difficulty, examples });
    return { title, description, difficulty, examples };
}

// Function to extract the user's code snippet
// apparently leetcode uses monaco so we can manipulate using that 
// most complex part tries a bunch of different shit to get the code snippet
function getCodeSnippet() {
    // Try to access Monaco editor directly
    if (window.monaco && window.monaco.editor) {
        const editors = window.monaco.editor.getEditors();
        if (editors.length > 0) {
            const code = editors[0].getValue();
            console.log('Scraped Code from Monaco editor:', code);
            return code;
        }
    }
    
    // Try to access the editor through the LeetCode global object
    if (window.leetcode && window.leetcode.getEditor) {
        const editor = window.leetcode.getEditor();
        if (editor && editor.getValue) {
            const code = editor.getValue();
            console.log('Scraped Code from LeetCode editor:', code);
            return code;
        }
    }
    
    // Fallback methods
    const codeElements = document.querySelectorAll('pre[class*="language-"]');
    if (codeElements.length > 0) {
        const code = codeElements[0].textContent;
        console.log('Scraped Code from pre element:', code);
        return code;
    }
    
    // Last resort - try to find the textarea
    const codeEditor = document.querySelector('.monaco-editor textarea');
    if (codeEditor) {
        const code = codeEditor.value;
        console.log('Scraped Code from textarea:', code);
        return code;
    }
    
    // Try to find code in the CodeMirror editor (older LeetCode interface)
    const codeMirrorLines = document.querySelectorAll('.CodeMirror-line');
    if (codeMirrorLines.length > 0) {
        const code = Array.from(codeMirrorLines).map(line => line.textContent).join('\n');
        console.log('Scraped Code from CodeMirror:', code);
        return code;
    }
    
    console.log('No code found');
    return 'No code found';
}

// Get both problem data and code snippet
function getLeetCodeData() {
    return {
        problemData: getProblemData(),
        codeSnippet: getCodeSnippet()
    };
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Received message:', request);
    
    if (request.action === 'getLeetCodeData') {
        // First try to get data immediately
        const immediateData = getLeetCodeData();
        
        // If we got meaningful data, send it back
        if (immediateData.problemData.title !== 'Unknown Title' && 
            immediateData.codeSnippet !== 'No code found') {
            console.log('Sending immediate data:', immediateData);
            sendResponse(immediateData);
            return true;
        }
        
        // Otherwise, wait for elements to load
        waitForElement('[data-cy="question-title"], .css-v3d350, .question-title', (element) => {
            if (element) {
                // Wait a bit more for the editor to initialize
                setTimeout(() => {
                    const data = getLeetCodeData();
                    console.log('Sending delayed data:', data);
                    sendResponse(data);
                }, 1000);
            } else {
                // If we still can't find the elements, send what we have
                console.log('Sending fallback data:', immediateData);
                sendResponse(immediateData);
            }
        });
        
        return true; // Indicate that the response will be sent asynchronously
    }
    
    // Handle individual data requests too
    if (request.action === 'getProblemData') {
        waitForElement('[data-cy="question-title"], .css-v3d350, .question-title', () => {
            const problemData = getProblemData();
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
});

// Additional code to handle LeetCode's SPA behavior
// This helps detect when the user navigates to a new problem
let currentUrl = window.location.href;
setInterval(() => {
    if (currentUrl !== window.location.href) {
        currentUrl = window.location.href;
        console.log('URL changed, new page detected:', currentUrl);
        
        // Wait for the new problem to load
        setTimeout(() => {
            const data = getLeetCodeData();
            console.log('New problem data:', data);
            
            // You could send this to the background script if needed
            // chrome.runtime.sendMessage({ action: 'newProblemLoaded', data });
        }, 2000);
    }
}, 1000);

// Initial data collection on page load
setTimeout(() => {
    const initialData = getLeetCodeData();
    console.log('Initial page data:', initialData);
}, 3000);