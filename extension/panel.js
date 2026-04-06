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

  const grouped = groupByDomain(links);

  // Flatten but keep grouped ordering
  const ordered = Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([_, items]) => items);

  resultsEl.innerHTML = ordered
    .map((link, index) => {
      const href = link.href || "";
      const label = link.label || "Link";
      const domain = getDomain(href);

      return `
        <div class="item">
          <a
            class="item-link"
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

          <button
            class="copy-btn"
            type="button"
            data-copy="${escapeAttr(href)}"
            data-copy-id="${index}"
          >
            Copy
          </button>
        </div>
      `;
    })
    .join("");

  wireCopyButtons();
}

function wireCopyButtons() {
  document.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const href = btn.getAttribute("data-copy");
      if (!href) return;

      try {
        await navigator.clipboard.writeText(href);

        const original = btn.textContent;
        btn.textContent = "Copied";
        btn.classList.add("copied");

        setTimeout(() => {
          btn.textContent = original;
          btn.classList.remove("copied");
        }, 1000);
      } catch {
        btn.textContent = "Failed";

        setTimeout(() => {
          btn.textContent = "Copy";
        }, 1000);
      }
    });
  });
}

function groupByDomain(links) {
  const grouped = {};

  for (const link of links) {
    const domain = getDomain(link.href || "");

    if (!grouped[domain]) {
      grouped[domain] = [];
    }

    grouped[domain].push(link);
  }

  return grouped;
}

function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "") || "other";
  } catch {
    return "other";
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
      const domain = getDomain(link.href || "").toLowerCase();

      return (
        label.includes(q) ||
        href.includes(q) ||
        domain.includes(q)
      );
    });

    renderLinks(filtered);
  });

  loadLinks();
});
