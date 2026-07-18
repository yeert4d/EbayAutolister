"use strict";

async function getActiveTab() {
  const tabs = await browser.tabs.query({
    active: true,
    currentWindow: true
  });

  return tabs[0];
}

async function sendToActiveTab(type) {
  const tab = await getActiveTab();

  if (!tab || typeof tab.id !== "number") {
    return;
  }

  try {
    await browser.tabs.sendMessage(tab.id, { type });
  } catch (error) {
    console.error(`Could not run ${type} on the active page:`, error);
  }
}

browser.commands.onCommand.addListener(async (command) => {
  if (command === "copy-ebay-title") {
    await sendToActiveTab("GENERATE_EBAY_TITLE");
    return;
  }

  if (command === "fill-ebay-listing") {
    await sendToActiveTab("FILL_EBAY_LISTING");
    return;
  }

  if (command === "open-options") {
    await browser.runtime.openOptionsPage();
  }
});

// One click remains immediate:
// - on Discogs it generates/copies;
// - on eBay it fills the listing.
browser.action.onClicked.addListener(async (tab) => {
  const url = String(tab?.url || "");

  if (/discogs\.com\/release\//i.test(url)) {
    await sendToActiveTab("GENERATE_EBAY_TITLE");
    return;
  }

  if (/ebay\.(co\.uk|com)\//i.test(url)) {
    await sendToActiveTab("FILL_EBAY_LISTING");
  }
});
