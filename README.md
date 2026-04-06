# Link Finder Plugin

A browser extension that extracts and displays all links from the current web page using a Go-powered native messaging backend.

## How It Works

The extension is split into two parts:

1. **Browser Extension** (JavaScript + HTML) — A Manifest V3 Chrome extension with a side panel UI. When opened, it queries the active tab's HTML and sends it to a native host for parsing.
2. **Native Host** (Go) — A compiled Go binary that receives page HTML from the extension via [Native Messaging](https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging), parses all `<a href>` links using `golang.org/x/net/html`, and returns them as JSON.

```
Browser Extension  ──native message──►  Go Binary
      ▲                                     │
      └──────────── links (JSON) ───────────┘
```

## Project Structure

```
link-finder-plugin/
├── extension/
│   ├── manifest.json       # Manifest V3 extension config
│   ├── background.js       # Service worker; handles messaging between panel and native host
│   ├── panel.html          # Side panel UI
│   └── panel.js            # Side panel logic
├── go/
│   ├── main.go             # Entry point
│   ├── io.go               # Native messaging I/O (stdin/stdout framing)
│   └── parse_data.go       # HTML link extraction using golang.org/x/net/html
├── native-host-template.json  # Template for the native host manifest
├── go.mod
└── go.sum
```

## Requirements

- **Go** 1.21+
- **Google Chrome** (or any Chromium-based browser supporting Manifest V3)

## Setup

### 1. Build the Native Host

```bash
cd go
go build -o link-finder .
```

Move the compiled binary to a stable location (e.g., `/usr/local/bin/link-finder` on macOS/Linux or `C:\Program Files\link-finder\link-finder.exe` on Windows).

### 2. Register the Native Host

Copy `native-host-template.json` and fill in your details:

```json
{
  "name": "com.linkfinder.native",
  "description": "Link Finder Native Host",
  "path": "/absolute/path/to/link-finder",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://YOUR_EXTENSION_ID/"
  ]
}
```

Save the file as `com.linkfinder.native.json` and place it in the correct location for your OS:

| OS | Path |
|---|---|
| **macOS** | `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/` |
| **Linux** | `~/.config/google-chrome/NativeMessagingHosts/` |
| **Windows** | Register the path in the registry under `HKCU\Software\Google\Chrome\NativeMessagingHosts\com.linkfinder.native` |

### 3. Load the Extension

1. Open Chrome and go to `chrome://extensions/`.
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked** and select the `extension/` directory.
4. Copy the generated **Extension ID** and paste it into your native host manifest's `allowed_origins`.

## Usage

1. Click the **Link Finder** extension icon in Chrome's toolbar.
2. The side panel opens and automatically scans the active tab.
3. All links found on the page are listed with their label and URL.

> **Note:** The extension cannot scan internal browser pages (e.g., `chrome://`, `edge://`, `about:` URLs).

## Dependencies

- [`golang.org/x/net/html`](https://pkg.go.dev/golang.org/x/net/html) — HTML tokenizer/parser used by the native host.