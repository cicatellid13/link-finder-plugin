let allLinks = [];

function loadLinks() {
  const statusEl = document.getElementById("status");
  const resultsEl = document.getElementById("results");
  const countPill = document.getElementById("countPill");

  statusEl.textContent = "Loading...";
  resultsEl.innerHTML = "";
  countPill.textContent = "…";

  chrome.runtime.sendMessage({ type: "GET_LINKS" }, (response) => {
    if (chrome.runtime.lastError) {
      statusEl.textContent = chrome.runtime.lastError.message;
      countPill.textContent = "0";
      return;
    }

    const links = response?.links || [];
    const error = response?.error;

    if (error) {
      statusEl.textContent = error;
      countPill.textContent = "0";
      return;
    }

    allLinks = links;
    statusEl.textContent = `${links.length} links found`;
    countPill.textContent = String(links.length);
    renderLinks(links);
  });
}

function renderLinks(links) {
  const resultsEl = document.getElementById("results");

  if (!links.length) {
    resultsEl.innerHTML = `<div class="empty">No links found</div>`;
    return;
  }

  resultsEl.innerHTML = links
    .map((link) => {
      const href = link.href || "";
      const label = link.label || "Link";
      const domain = getDomain(href);

      return `
        <a
          class="item"
          href="${escapeAttr(href)}"
          target="_blank"
          rel="noopener noreferrer"
          title="${escapeAttr(href)}"
        >
          <div class="item-top">
            <div class="text">${escapeHtml(label)}</div>
            <div class="domain">${escapeHtml(domain)}</div>
          </div>
          <div class="href">${escapeHtml(href)}</div>
        </a>
      `;
    })
    .join("");
}

function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "link";
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

document.addEventListener("DOMContentLoaded", () => {
  const searchBox = document.getElementById("searchBox");

  searchBox.addEventListener("input", (e) => {
    const q = e.target.value.trim().toLowerCase();

    if (!q) {
      renderLinks(allLinks);
      return;
    }

    const filtered = allLinks.filter((link) => {
      const label = (link.label || "").toLowerCase();
      const href = (link.href || "").toLowerCase();
      return label.includes(q) || href.includes(q);
    });

    renderLinks(filtered);
  });

  loadLinks();
});
