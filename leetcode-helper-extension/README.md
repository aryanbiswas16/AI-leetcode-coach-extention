# LeetCode Helper Extension

A Chrome extension that provides AI-powered hints and study notes for LeetCode problems using the Kimi API.

## Features

- **Get Hints**: Ask for help with specific problems without getting the full solution
- **Quick Hint Buttons**: Common questions like "What approach should I use?" or "Help me find a bug"
- **Study Notes**: Generate comprehensive study notes for any problem
- **Auto-Save**: Notes can be saved directly to LeetCode's notes section
- **Modern UI**: Clean, gradient-based interface with tab navigation

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `leetcode-helper-extension` folder
5. The extension icon will appear in your toolbar

## Usage

1. Navigate to any LeetCode problem page
2. Click the extension icon in your toolbar
3. Use the "Get Hint" tab to ask questions or click quick hint buttons
4. Use the "Study Notes" tab to generate comprehensive notes for the problem

## How It Works

The extension extracts problem data (title, description, difficulty) and your current code from the LeetCode page, then sends it to the Kimi AI API with context to provide helpful hints and explanations.

## Configuration

The API key is set in `src/background.js`. To use your own API key, replace:

```javascript
const KIMI_API_KEY = 'your-api-key-here';
```

## File Structure

```
leetcode-helper-extension/
├── manifest.json          # Chrome extension manifest
├── src/
│   ├── background.js      # Service worker - API integration
│   ├── content.js         # Content script - LeetCode data extraction
│   ├── popup/
│   │   ├── popup.html    # Extension popup UI
│   │   ├── popup.css     # Styling
│   │   └── popup.js      # Popup functionality
│   └── utils/
│       └── helpers.js    # Utility functions
└── README.md
```

## Technical Details

- **API**: Moonshot AI (Kimi)
- **Model**: moonshot-v1-8k
- **Manifest Version**: 3
- **Permissions**: scripting, storage, leetcode.com

## Troubleshooting

**Extension not working?**
- Make sure you're on a LeetCode problem page (URL contains `leetcode.com/problems/`)
- Wait for the page to fully load
- Check that your API key is valid

**Can't extract problem data?**
- Try refreshing the page
- The extension tries multiple methods to find LeetCode elements
- Some UI updates may require code changes

## Future Improvements

- Settings page for API key input
- Support for LeetCode contests
- Code execution suggestions
- Dark mode
- Keyboard shortcuts
- History of previous hints

## License

MIT License

---

Built for personal use and learning. Feel free to fork and modify!