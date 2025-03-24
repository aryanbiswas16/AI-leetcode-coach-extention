console.log('LeetCode Helper Extension loaded');

// Function to extract problem data
function getProblemData() {
    const titleElement = document.querySelector('.css-v3d350'); // Problem title
    const descriptionElement = document.querySelector('.content__u3I1'); // Problem description

    const title = titleElement ? titleElement.innerText : 'Unknown Title';
    const description = descriptionElement ? descriptionElement.innerText : 'No description found';

    console.log('Scraped Problem Data:', { title, description }); // Debugging log
    return { title, description };
}

// Function to extract the user's code snippet
function getCodeSnippet() {
    const codeEditor = document.querySelector('.monaco-editor textarea'); // Monaco editor textarea
    const code = codeEditor ? codeEditor.value : 'No code found';

    console.log('Scraped Code Snippet:', code); // Debugging log
    return code;
}

// Listen for messages from the background or popup script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Received message:', request);
    if (request.action === 'getProblemData') {
        const problemData = getProblemData();
        console.log('Sending problem data:', problemData);
        sendResponse(problemData);
    } else if (request.action === 'getCodeSnippet') {
        const codeSnippet = getCodeSnippet();
        console.log('Sending code snippet:', codeSnippet);
        sendResponse({ code: codeSnippet });
    }
    return true; // Indicate that the response will be sent asynchronously
});
