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
    // Updated selectors for latest LeetCode UI
    const titleElement = document.querySelector('div[data-cy="question-title"]') || 
                        document.querySelector('.mr-2.text-lg.font-medium') ||
                        document.querySelector('div[class*="title"]');
    
    const descriptionElement = document.querySelector('div[data-cy="question-content"]') ||
                              document.querySelector('div[class*="description"]') ||
                              document.querySelector('.content__u3I1.question-content__JfgR');
    
    const difficultyElement = document.querySelector('div[data-cy="question-difficulty"]') ||
                             document.querySelector('div[diff]') ||
                             document.querySelector('.difficulty-label');
    
    // Extract examples using updated selectors
    const exampleBlocks = Array.from(document.querySelectorAll('pre[class*="example-"]') || 
                                   document.querySelectorAll('.example-testcase'));
    
    const examples = exampleBlocks.map(block => block.textContent).join('\n\n');
    
    // Clean up the extracted text
    const title = titleElement ? titleElement.textContent.trim() : 'Unknown Title';
    const description = descriptionElement ? 
        descriptionElement.textContent.replace(/\s+/g, ' ').trim() : 
        'No description found';
    const difficulty = difficultyElement ? difficultyElement.textContent.trim() : 'Unknown Difficulty';
    
    console.log('Scraped Problem Data:', { title, description, difficulty, examples });
    return { title, description, difficulty, examples };
}

// Function to extract the user's code snippet
function getCodeSnippet() {
    try {
        // Try Monaco editor first (current LeetCode editor)
        if (window.monaco && window.monaco.editor) {
            const editor = window.monaco.editor.getModels()[0] || 
                          window.monaco.editor.getEditors()[0];
            if (editor) {
                const code = typeof editor.getValue === 'function' ? 
                    editor.getValue() : editor.getModel().getValue();
                console.log('Scraped Code from Monaco editor:', code);
                return code;
            }
        }
        
        // Try getting the code from the ace editor element
        const aceEditor = document.querySelector('.ace_content');
        if (aceEditor) {
            const code = Array.from(aceEditor.querySelectorAll('.ace_line'))
                .map(line => line.textContent)
                .join('\n');
            console.log('Scraped Code from Ace editor:', code);
            return code;
        }
        
        // Try getting from code mirror
        const cmEditor = document.querySelector('.CodeMirror');
        if (cmEditor && cmEditor.CodeMirror) {
            const code = cmEditor.CodeMirror.getValue();
            console.log('Scraped Code from CodeMirror:', code);
            return code;
        }
        
        // Last resort - try to find any code block
        const codeBlock = document.querySelector('code[class*="language-"]') ||
                         document.querySelector('.CodeRunner-wrapper pre');
        if (codeBlock) {
            const code = codeBlock.textContent;
            console.log('Scraped Code from code block:', code);
            return code;
        }
        
        throw new Error('No code editor found');
    } catch (error) {
        console.error('Error getting code snippet:', error);
        return 'No code found';
    }
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