const HOST = "com.linkfinder.native";

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type !== "GET_LINKS") return;

  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const tab = tabs && tabs[0];

    if (!tab || !tab.id || !tab.url) {
      sendResponse({ success: false, links: [], error: "No active tab" });
      return;
    }

    if (
      tab.url.startsWith("chrome://") ||
      tab.url.startsWith("edge://") ||
      tab.url.startsWith("about:")
    ) {
      sendResponse({ success: false, links: [], error: "Unsupported page" });
      return;
    }

    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => ({
          html: document.documentElement.outerHTML,
          url: window.location.href
        })
      });

      const page = results?.[0]?.result;

      if (!page || !page.html) {
        sendResponse({
          success: false,
          links: [],
          error: "Could not read page HTML"
        });
        return;
      }

      chrome.runtime.sendNativeMessage(
        HOST,
        {
          type: "html",
          url: page.url,
          html: page.html
        },
        (response) => {
          if (chrome.runtime.lastError) {
            sendResponse({
              success: false,
              links: [],
              error: chrome.runtime.lastError.message
            });
            return;
          }

          sendResponse({
            success: !!response?.success,
            links: response?.links || [],
            error: response?.success ? null : "Backend returned no links"
          });
        }
      );
    } catch (err) {
      console.error("Extract failed:", err);
      sendResponse({
        success: false,
        links: [],
        error: String(err)
      });
    }
  });

  return true;
});
