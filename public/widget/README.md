# RAG Chat Widget

An embeddable chat widget that allows you to add AI-powered chat functionality to any website.

## Quick Start

### 1. Basic Integration

Add this code to your website before the closing `</body>` tag:

```html
<script>
  window.RagChatConfig = {
    apiKey: "your-api-key-here",
    // author: "custom-user-id",  // Optional: Will auto-generate UUID if not provided
    position: "bottom-right",
    primaryColor: "#007bff",
  };
</script>
<script
  src="https://yourapp.com/widget/loader.js"
  async
></script>
```

### 2. Configuration Options

| Option         | Type   | Default               | Description                                            |
| -------------- | ------ | --------------------- | ------------------------------------------------------ |
| `apiKey`       | string | **required**          | Your RAG Chat API key                                  |
| `author`       | string | `auto-generated UUID` | Visitor identifier (unique ID generated automatically) |
| `position`     | string | `'bottom-right'`      | Widget position: `'bottom-right'` or `'bottom-left'`   |
| `primaryColor` | string | `'#000000'`           | Chat button color (any valid CSS color)                |
| `baseUrl`      | string | `auto-detected`       | Your RAG Chat domain                                   |

### 3. JavaScript API

Once loaded, the widget exposes a global `RagChatWidget` object:

```javascript
// Open the chat
RagChatWidget.open();

// Close the chat
RagChatWidget.close();

// Toggle the chat
RagChatWidget.toggle();

// Check if chat is open
const isOpen = RagChatWidget.isOpen();

// Remove widget from page
RagChatWidget.destroy();
```

## Features

- 🎨 **Intercom-style design** - Familiar floating chat button
- 📱 **Mobile responsive** - Works on all device sizes
- ⚡ **Fast loading** - Async script loading, minimal impact
- 🔒 **Secure** - Iframe isolation protects your site
- 🎛️ **Customizable** - Colors, position, and behavior
- ♿ **Accessible** - Keyboard navigation and screen reader support
- 🌐 **Cross-origin safe** - Works on any domain

## Advanced Usage

### Custom Styling

You can override the chat button appearance with CSS:

```css
/* Target the chat button */
button[aria-label="Open chat"] {
  /* Your custom styles */
}
```

### Event Handling

Listen for widget events:

```javascript
// Check when widget loads
document.addEventListener("DOMContentLoaded", function () {
  if (window.RagChatWidget) {
    console.log("RAG Chat Widget loaded");
  }
});
```

### Conditional Loading

Load the widget based on conditions:

```javascript
// Only load for certain pages
if (window.location.pathname === "/support") {
  window.RagChatConfig = {
    /* config */
  };
  // Load script dynamically
}
```

## Troubleshooting

### Widget Not Appearing

1. Check that `apiKey` is provided in `RagChatConfig`
2. Verify the script URL is correct
3. Check browser console for errors
4. Ensure no CSS is hiding the widget (z-index issues)

### iframe Issues

1. Check Content Security Policy (CSP) settings
2. Verify `X-Frame-Options` allows embedding
3. Check for CORS issues in browser console

### Performance

- The widget loads asynchronously and won't block your page
- First load downloads ~15KB, subsequent loads are cached
- iframe is created only when first opened

## Support

For issues or questions:

- Check the browser console for error messages
- Verify your API key is valid and active
- Contact support with your domain and error details

## Files

- `loader.js` - Main widget script (add this to your site)
- `demo.html` - Interactive demo and documentation
- `README.md` - This documentation file
