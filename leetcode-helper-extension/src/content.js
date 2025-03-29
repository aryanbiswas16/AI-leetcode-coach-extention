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

function getProblemDataFromMeta() {
    const descriptionMeta = document.querySelector('meta[name="description"]');
    const titleMeta = document.querySelector('meta[property="og:title"]');
    
    if (descriptionMeta && titleMeta) {
        const title = titleMeta.getAttribute('content').replace(' - LeetCode', '');
        const description = descriptionMeta.getAttribute('content');
        
        // Parse difficulty and examples from the description if needed
        
        return { title, description };
    }
    
    // Fall back to DOM scraping if meta tags aren't available
    return getProblemData();
}



function getCodeSnippet() {
    const lines = document.querySelectorAll('.monaco-editor .view-line');
    const code = Array.from(lines).map(line => line.textContent).join('\n');
    console.log("Extracted code from DOM:", code);
    return code;
}

// Get both problem data and code snippet
function getLeetCodeData() {
    return {
        problemData: getProblemDataFromMeta(),
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
        if (immediateData.problemData.title && 
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

// Function to add a new tab for the extension
function addExtensionTab() {
    // Use MutationObserver to detect when the tab structure is loaded
    const observer = new MutationObserver((mutations, obs) => {
        // Try multiple possible selectors for the tab container
        const tabContainer = document.querySelector('.flexlayout__tabset_tabbar_inner_tab_container') || 
                            document.querySelector('[role="tablist"]') || 
                            document.querySelector('[data-cy="question-detail-tabs"]');
        
        if (tabContainer) {
            obs.disconnect(); // Stop observing once we find the tab container
            console.log('Tab container found:', tabContainer);
            
            // Create the new tab button following LeetCode's structure
            const existingTab = tabContainer.querySelector('div.flexlayout__tab_button') || 
                               tabContainer.querySelector('button[role="tab"]');
            
            if (!existingTab) {
                console.error('Could not find existing tab to copy styles from');
                return;
            }
            
            const extensionTab = document.createElement(existingTab.tagName); // Use same element type (div or button)
            extensionTab.className = existingTab.className;
            
            // Remove selected class if present and add unselected class
            extensionTab.className = extensionTab.className
                .replace('flexlayout__tab_button--selected', '')
                .replace('active', '') + ' flexlayout__tab_button--unselected';
            
            if (existingTab.hasAttribute('role')) {
                extensionTab.setAttribute('role', 'tab');
            }
            
            // Copy the inner structure but change the text
            extensionTab.innerHTML = existingTab.innerHTML;
            
            // Find the text element and replace it
            const textElement = extensionTab.querySelector('.normal') || 
                               extensionTab.querySelector('div:not([class])');
            
            if (textElement) {
                textElement.textContent = 'Extension';
            }
            
            // Also update any other text elements
            const otherTextElements = extensionTab.querySelectorAll('.medium, .whitespace-nowrap');
            otherTextElements.forEach(el => {
                el.textContent = 'Extension';
            });
            
            // Create content container
            const contentContainer = document.createElement('div');
            contentContainer.id = 'extension-content';
            
            // Copy attributes from existing tab panel
            const existingPanel = document.querySelector('[role="tabpanel"]') || 
                                 document.querySelector('.flexlayout__tabset_content');
            
            if (existingPanel) {
                contentContainer.className = existingPanel.className;
                
                if (existingPanel.hasAttribute('role')) {
                    contentContainer.setAttribute('role', 'tabpanel');
                }
                
                contentContainer.style.display = 'none';
                
                // Add initial content
                contentContainer.innerHTML = `
                    <div class="relative">
                        <div class="bg-layer-1 dark:bg-dark-layer-1 rounded-lg p-4">
                            <div class="text-label-1 dark:text-dark-label-1">
                                <h3 class="text-lg font-medium">AI Assistant</h3>
                                <div class="mt-4">
                                    <button class="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700">
                                        Get Hint
                                    </button>
                                    <button class="ml-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700">
                                        Get Solution
                                    </button>
                                </div>
                                <div class="mt-4 p-4 bg-gray-900 rounded">
                                    <pre class="text-white whitespace-pre-wrap"></pre>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                // Add click handler
                extensionTab.addEventListener('click', () => {
                    console.log('Extension tab clicked');
                    
                    // Find all tabs and deactivate them
                    const allTabs = tabContainer.querySelectorAll('div.flexlayout__tab_button, button[role="tab"]');
                    allTabs.forEach(tab => {
                        tab.classList.remove('flexlayout__tab_button--selected', 'active');
                        tab.classList.add('flexlayout__tab_button--unselected');
                        
                        if (tab.hasAttribute('aria-selected')) {
                            tab.setAttribute('aria-selected', 'false');
                        }
                    });
                    
                    // Activate our tab
                    extensionTab.classList.remove('flexlayout__tab_button--unselected');
                    extensionTab.classList.add('flexlayout__tab_button--selected', 'active');
                    
                    if (extensionTab.hasAttribute('aria-selected')) {
                        extensionTab.setAttribute('aria-selected', 'true');
                    }
                    
                    // Find all panels and hide them
                    const panelsContainer = existingPanel.parentNode;
                    const allPanels = panelsContainer.querySelectorAll('[role="tabpanel"], .flexlayout__tabset_content');
                    
                    allPanels.forEach(panel => {
                        panel.style.display = 'none';
                    });
                    
                    // Show our content
                    contentContainer.style.display = 'block';
                });
                
                // Add the tab to the page
                tabContainer.appendChild(extensionTab);
                
                // Add the content panel to the page
                panelsContainer = existingPanel.parentNode;
                panelsContainer.appendChild(contentContainer);
                
                console.log('Extension tab added successfully');
            } else {
                console.error('Could not find existing tab panel');
            }
        }
    });
    
    // Start observing the document with the configured parameters
    observer.observe(document.body, { childList: true, subtree: true });
    console.log('Observer started to find tab container');
}

// Call the function when the page loads
addExtensionTab();
