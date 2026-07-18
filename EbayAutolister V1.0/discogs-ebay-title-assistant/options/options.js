
"use strict";

const DEFAULT_SUFFIX = "JAZZ - GREAT COPY!";
const DEFAULT_AUTOFILL_DESCRIPTION = true;
const MAX_EBAY_TITLE_LENGTH = 80;
const EXAMPLE_BASE_TITLE =
  "Miles Davis - Kind Of Blue - Columbia - CL 1355 - LP";

const form = document.getElementById("settings-form");
const suffixInput = document.getElementById("suffix");
const autofillDescriptionInput =
  document.getElementById("autofill-description");
const resetButton = document.getElementById("reset-button");
const preview = document.getElementById("preview");
const lengthMessage = document.getElementById("length-message");
const status = document.getElementById("status");

initialise();

async function initialise() {
  const stored = await browser.storage.local.get([
    "suffix",
    "autofillDescription"
  ]);

  suffixInput.value =
    typeof stored.suffix === "string"
      ? stored.suffix
      : DEFAULT_SUFFIX;

  autofillDescriptionInput.checked =
    typeof stored.autofillDescription === "boolean"
      ? stored.autofillDescription
      : DEFAULT_AUTOFILL_DESCRIPTION;

  updatePreview();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const suffix = cleanText(suffixInput.value);
  const autofillDescription =
    autofillDescriptionInput.checked;

  await browser.storage.local.set({
    suffix,
    autofillDescription
  });

  suffixInput.value = suffix;
  status.textContent = "Settings saved.";

  updatePreview();
  clearStatusLater();
});

resetButton.addEventListener("click", async () => {
  suffixInput.value = DEFAULT_SUFFIX;
  autofillDescriptionInput.checked =
    DEFAULT_AUTOFILL_DESCRIPTION;

  await browser.storage.local.set({
    suffix: DEFAULT_SUFFIX,
    autofillDescription: DEFAULT_AUTOFILL_DESCRIPTION
  });

  status.textContent = "Settings reset to defaults.";
  updatePreview();
  clearStatusLater();
});

suffixInput.addEventListener("input", updatePreview);

function updatePreview() {
  const suffix = cleanText(suffixInput.value);
  const completeTitle = suffix
    ? `${EXAMPLE_BASE_TITLE} - ${suffix}`
    : EXAMPLE_BASE_TITLE;

  if (completeTitle.length <= MAX_EBAY_TITLE_LENGTH) {
    preview.textContent = completeTitle;
    lengthMessage.textContent =
      `${completeTitle.length}/80 characters — the suffix fits.`;
    return;
  }

  preview.textContent = EXAMPLE_BASE_TITLE;
  lengthMessage.textContent =
    `${completeTitle.length}/80 characters — on a title this length, ` +
    "the suffix would be omitted automatically.";
}

function cleanText(value) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clearStatusLater() {
  window.setTimeout(() => {
    status.textContent = "";
  }, 3500);
}
