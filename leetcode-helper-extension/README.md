# LeetCode Helper Extension v2.0 - Modernized for Kimi AI

## 🆕 What's New in v2.0

### API Migration
- ✅ **Migrated from OpenAI to Kimi (Moonshot) API**
- ✅ Uses `moonshot-v1-8k` model - fast and capable
- ✅ Updated API endpoint and authentication headers
- ✅ Better error handling with specific error messages

### Modernized UI
- 🎨 **Fresh gradient design** (purple/blue theme)
- 🎨 **Quick hint buttons** for common questions
- 🎨 **Tab-based navigation** (Hint | Study Notes)
- 🎨 **Modern glass-morphism effects**
- 🎨 **Responsive and clean layout**

### Improved LeetCode Integration
- 🔧 **Updated selectors** for latest LeetCode UI (2025)
- 🔧 **Multiple fallback methods** for extracting code
- 🔧 **Better problem data scraping** with multiple selector attempts
- 🔧 **Works with Monaco editor, CodeMirror, and textarea**

### New Features
- 💡 **Quick Hint Buttons**: Approach, Find Bug, Optimize, Explain
- 💡 **Auto-save notes** to LeetCode notes section
- 💡 **Copy to clipboard** for generated notes
- 💡 **Keyboard support** (Enter to submit)
- 💡 **Status indicators** showing extension state

### Enhanced Error Handling
- ⚠️ **Specific error messages** for different failure scenarios
- ⚠️ **Network error detection**
- ⚠️ **API key validation**
- ⚠️ **Rate limit handling**

---

## 📁 File Structure

```
leetcode-helper-extension/
├── manifest.json          # Extension manifest (Manifest V3)
├── src/
│   ├── background.js      # Service worker - Kimi API integration
│   ├── content.js         # Content script - LeetCode data extraction
│   ├── popup/
│   │   ├── popup.html    # Modern popup UI
│   │   ├── popup.css     # Styling with gradients
│   │   └── popup.js      # Popup functionality
│   └── utils/
│       └── helpers.js    # Utility functions
└── README.md
```

---

## 🔑 Configuration

The API key is currently set in `background.js`:

```javascript
const KIMI_API_KEY = 'sk-UP5vtkez7n30C7aqFs0BKxeHtePfkm19Jo2jwiSGgT74L4w4';
```

**To make it user-configurable in the future**, you could:
1. Add a settings page
2. Store API key in Chrome storage
3. Let users input their own key

---

## 🚀 How to Install

### 1. Load Extension in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in top right)
3. Click **"Load unpacked"**
4. Select the `leetcode-helper-extension` folder
5. Extension is now installed!

### 2. Use the Extension
1. Navigate to any LeetCode problem page
2. Click the extension icon in the toolbar
3. Ask for hints or generate study notes!

---

## 🎯 How It Works

### Getting Hints
1. Click the extension icon while on a LeetCode problem
2. Type your question or click a quick hint button
3. Extension extracts problem data + your code
4. Sends to Kimi AI with context
5. Returns helpful hints without giving away the solution

### Generating Study Notes
1. Click "Generate Notes" button
2. Extension analyzes the problem
3. Creates structured notes covering:
   - Problem pattern/category
   - Key insights
   - Step-by-step approach
   - Time/space complexity
   - Common pitfalls
   - Similar problems
4. Auto-saves to LeetCode notes (if possible)

---

## 🛠 Technical Details

### API Configuration
- **Base URL**: `https://api.moonshot.cn/v1`
- **Model**: `moonshot-v1-8k`
- **Max Tokens**: 1500
- **Temperature**: 0.7

### Content Script Selectors
The extension tries multiple selectors to find LeetCode elements:

**Title:**
- `[data-cy="question-title"]`
- `.text-title-large`
- `div[class*="title"] h1`

**Description:**
- `[data-cy="question-content"]`
- `.elfjS`
- `div[data-track-load="description_content"]`

**Code Editor:**
- Monaco Editor (primary)
- CodeMirror (fallback)
- Textarea (fallback)

---

## 🐛 Troubleshooting

### "Could not extract problem data"
- Make sure you're on a LeetCode problem page (URL should contain `leetcode.com/problems/`)
- Wait for the page to fully load before using the extension
- Try refreshing the page

### "Error: Invalid API key"
- Check that the API key in `background.js` is correct
- The key should start with `sk-`

### "Error: Network issue"
- Check your internet connection
- Try again in a few moments

### Extension not working on LeetCode
- LeetCode may have updated their UI
- Check console for error messages
- The extension has multiple fallback selectors, but some updates may require code changes

---

## 📝 Future Improvements

- [ ] Add settings page for API key input
- [ ] Support for LeetCode contests
- [ ] Code execution suggestions
- [ ] Dark mode for popup
- [ ] Keyboard shortcuts
- [ ] History of previous hints

---

## 🤝 Credits

- **Original Extension**: You (Aryan Biswas)
- **Modernized by**: OpenClaw/Thor
- **AI Provider**: Moonshot AI (Kimi)

---

## 📄 License

MIT License

---

## 🎉 Ready to Use!

The extension is now modernized and ready. Just load it into Chrome and start getting AI-powered hints on LeetCode!