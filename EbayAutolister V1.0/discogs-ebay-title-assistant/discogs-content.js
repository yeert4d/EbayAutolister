"use strict";

const MAX_EBAY_TITLE_LENGTH = 80;
const DEFAULT_SUFFIX = "JAZZ - GREAT COPY!";
const DEFAULT_FORMAT = "LP";

browser.runtime.onMessage.addListener((message) => {
  if (message?.type === "GENERATE_EBAY_TITLE") {
    generateAndCopyTitle();
  }
});

async function generateAndCopyTitle() {
  try {
    if (!location.pathname.startsWith("/release/")) {
      throw new Error(
        "Open a specific Discogs release page rather than a master release."
      );
    }

    const { artist, releaseTitle } = extractArtistAndTitle();
    const labelData = extractLabelAndCatalogue();

    // Standard vinyl listings default to LP. Discogs data is used only
    // to detect a multi-disc LP such as 2xLP or 3xLP.
    const format = extractFormat() || DEFAULT_FORMAT;

    if (!artist || !releaseTitle) {
      throw new Error("Could not find the artist and release title.");
    }

    if (!labelData?.label || !labelData?.catalogue) {
      throw new Error(
        "Could not find both the label and catalogue number on this page."
      );
    }

    const titleParts = [
      artist,
      releaseTitle,
      labelData.label,
      labelData.catalogue,
      format
    ];

    const baseTitle = titleParts.join(" - ");

    // LP / 2xLP is part of the base title, so it is always included in
    // the character calculation before deciding whether the suffix fits.
    if (baseTitle.length > MAX_EBAY_TITLE_LENGTH) {
      throw new Error(
        `The base title including ${format} is ` +
        `${baseTitle.length} characters. Create this one manually.`
      );
    }

    const suffix = await getConfiguredSuffix();
    const titleWithSuffix = suffix
      ? `${baseTitle} - ${suffix}`
      : baseTitle;

    const finalTitle =
      titleWithSuffix.length <= MAX_EBAY_TITLE_LENGTH
        ? titleWithSuffix
        : baseTitle;

    const releaseData = {
      artist,
      releaseTitle,
      label: labelData.label,
      catalogue: labelData.catalogue,
      format,
      ebayTitle: finalTitle,
      sourceUrl: location.href,
      savedAt: Date.now()
    };

    await browser.storage.local.set({
      latestDiscogsRelease: releaseData
    });

    await copyToClipboard(finalTitle);

    const suffixMessage =
      suffix && finalTitle === baseTitle
        ? " The suffix was omitted because it would exceed 80 characters."
        : "";

    showToast(
      `Copied and saved (${finalTitle.length}/80): ` +
      `${finalTitle}${suffixMessage}`,
      "success"
    );

    console.log("Discogs metadata saved:", releaseData);
  } catch (error) {
    showToast(error.message || "Unable to generate the title.", "error");
    console.error(error);
  }
}

function extractArtistAndTitle() {
  const heading =
    document.querySelector("h1")?.textContent ||
    document.querySelector('meta[property="og:title"]')?.content ||
    document.title;

  const value = cleanText(heading)
    .replace(/\s*\|\s*Discogs.*$/i, "")
    .replace(/\s*\|\s*Releases.*$/i, "");

  const separators = [" – ", " — ", " - "];

  for (const separator of separators) {
    const index = value.indexOf(separator);

    if (index > 0) {
      return {
        artist: cleanText(value.slice(0, index)),
        releaseTitle: cleanText(value.slice(index + separator.length))
      };
    }
  }

  return {
    artist: "",
    releaseTitle: ""
  };
}

function extractLabelAndCatalogue() {
  const lines = getVisibleLines();

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (/^labels?:?$/i.test(line)) {
      const parsed = parseFirstLabelEntry(lines[index + 1] || "");

      if (parsed) {
        return parsed;
      }
    }

    const inlineMatch = line.match(/^labels?:\s*(.+)$/i);

    if (inlineMatch) {
      const parsed = parseFirstLabelEntry(inlineMatch[1]);

      if (parsed) {
        return parsed;
      }
    }
  }

  return null;
}

function parseFirstLabelEntry(value) {
  // Example:
  // Realm – RM 191, Realm Jazz – RM-191
  // Only the first label/catalogue pair is used.
  const firstEntry = cleanText(value).split(/\s*,\s*/)[0];

  let match = firstEntry.match(/^(.+?)\s+[–—]\s+(.+)$/);

  if (!match) {
    match = firstEntry.match(/^(.+?)\s+-\s+(.+)$/);
  }

  if (!match) {
    return null;
  }

  const label = cleanText(match[1]);
  const catalogue = cleanText(match[2]);

  if (!label || !catalogue) {
    return null;
  }

  return {
    label,
    catalogue
  };
}

function extractFormat() {
  const lines = getVisibleLines();
  let rawFormat = "";

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (/^format:?$/i.test(line)) {
      rawFormat = lines[index + 1] || "";
      break;
    }

    const inlineMatch = line.match(/^format:\s*(.+)$/i);

    if (inlineMatch) {
      rawFormat = inlineMatch[1];
      break;
    }
  }

  return normaliseLpFormat(rawFormat);
}

function normaliseLpFormat(rawFormat) {
  const value = cleanText(rawFormat);

  // Detect common Discogs multi-disc forms:
  // 2 × Vinyl, LP
  // 2 x Vinyl, LP
  // 2xVinyl, LP
  // 2 × LP
  const quantityPatterns = [
    /\b(\d+)\s*(?:×|x)\s*Vinyl\b/i,
    /\b(\d+)\s*(?:×|x)\s*LP\b/i
  ];

  for (const pattern of quantityPatterns) {
    const match = value.match(pattern);

    if (match) {
      const quantity = Number(match[1]);

      if (Number.isInteger(quantity) && quantity > 1) {
        return `${quantity}xLP`;
      }
    }
  }

  // This tool is for LP listing work, so a normal release defaults to LP
  // even when Discogs' rendered format field is missing or incomplete.
  return DEFAULT_FORMAT;
}

function getVisibleLines() {
  return document.body.innerText
    .split("\n")
    .map(cleanText)
    .filter(Boolean);
}

async function getConfiguredSuffix() {
  try {
    const stored = await browser.storage.local.get("suffix");

    if (typeof stored.suffix === "string") {
      return cleanText(stored.suffix);
    }
  } catch (error) {
    console.warn("Could not read the saved suffix:", error);
  }

  return DEFAULT_SUFFIX;
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch (clipboardError) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.setAttribute("readonly", "");
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    textArea.style.pointerEvents = "none";

    document.body.appendChild(textArea);
    textArea.select();

    const copied = document.execCommand("copy");
    textArea.remove();

    if (!copied) {
      throw clipboardError;
    }
  }
}

function cleanText(value) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function showToast(message, type) {
  document.getElementById("discogs-ebay-title-toast")?.remove();

  const toast = document.createElement("div");
  toast.id = "discogs-ebay-title-toast";
  toast.textContent = message;

  Object.assign(toast.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    zIndex: "2147483647",
    maxWidth: "600px",
    padding: "14px 18px",
    borderRadius: "8px",
    background: type === "success" ? "#173d2b" : "#5a1f1f",
    color: "#ffffff",
    fontFamily: "Arial, sans-serif",
    fontSize: "14px",
    lineHeight: "1.4",
    boxShadow: "0 6px 24px rgba(0, 0, 0, 0.3)"
  });

  document.body.appendChild(toast);

  window.setTimeout(() => {
    toast.remove();
  }, type === "success" ? 5500 : 8000);
}
