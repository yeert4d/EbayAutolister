# EbayAutolister

A Firefox extension designed to reduce repetitive data entry when creating vinyl listings on eBay.

PLEASE NOTE: This is not yet an approved firefox extension and therefore must be added as a "temporary extension", to do this, when opening firefox type "about:debugging" into the address bar, then click "this firefox", and finally "load temporary add-on" and select the "manifest.js" file. This will need to be repeated each time you close/launch firefox. Within the next week the extension should just be downloadable from the firefox store.

The extension extracts release metadata from Discogs, generates an eBay-ready title within the 80-character limit, fills matching fields in an existing shop description template, and provides a condition-grading panel for Seller Notes.

## Features

### Discogs metadata extraction

The extension extracts:

- Artist
- Release title
- First record label
- First catalogue number
- LP format

It deliberately ignores year, country and pressing information because these may not reliably match the physical copy being listed.

When Discogs shows multiple label and catalogue-number pairs, only the first pair is used.

### eBay title generation

Titles are generated in this format:

```text
Artist - Title - Label - Catalogue Number - Format - Optional Suffix
```

Example:

```text
Miles Davis - Bitches Brew - CBS - S 66236 - LP - JAZZ - GREAT COPY!
```

The format is included in the 80-character calculation before the suffix is considered.

- Standard LP releases are written as `LP`.
- Common multi-disc releases are written as `2xLP`, `3xLP`, and so on.
- The configured suffix is omitted automatically if it would exceed the title limit.
- Essential metadata is never silently truncated.

### Existing description-template autofill

The extension fills matching fields inside the existing shop description template rather than replacing the template.

Supported metadata labels include:

```text
Artist:
Title:
Format:
Label:
Cat. No.:
```

The rest of the description, including formatting, images, links and shop policies, remains in place.

### Condition-grading assistant

A floating panel appears in the top-left corner of eBay pages.

Vinyl and sleeve condition can each be configured with:

- Grade: `Good`, `Very Good` or `Excellent`
- Between zero and four plus signs
- A free-text condition note

The minus button never reduces the count below zero, and the plus button never increases it above four.

Example vinyl selection:

```text
Grade: Very Good
Pluses: 4
Description: light hairlines
```

Generated condition value:

```text
Very Good++++, light hairlines
```

When `Excellent` with four plus signs is selected, the grade becomes:

```text
Excellent++++ to Near Mint
```

The sleeve value always ends with:

```text
(see associated images)
```

For example:

```text
Very Good++, light shelf wear (see associated images)
```

### Seller Notes and description condition fields

Pressing **Apply condition** performs the following operations in order:

1. Finds the eBay Seller Notes or Condition Description field.
2. Updates the values following `Vinyl Grade:` and `Sleeve Grade:` without depending on capitalisation.
3. Copies the same generated values into `Condition of Record:` and `Condition of Sleeve:` inside the existing item-description template.

Example Seller Notes output:

```text
Vinyl Grade: Very Good++++, light hairlines.
Sleeve Grade: Very Good++, light shelf wear (see associated images).
```

Example item-description output:

```text
Condition of Record: Very Good++++, light hairlines
Condition of Sleeve: Very Good++, light shelf wear (see associated images)
```

The extension does not save, schedule or publish listings automatically.

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+Y` | Extract Discogs metadata, generate the eBay title, store the metadata and copy the title |
| `Ctrl+Shift+E` | Fill the active eBay draft using the saved Discogs metadata |
| `Ctrl+Shift+U` | Open extension settings |

The extension icon also performs the relevant immediate action:

- On Discogs, it generates and copies the title.
- On eBay, it fills the saved release metadata into the listing.

## Installation for development

1. Download or clone the repository.
2. Open Firefox.
3. Enter `about:debugging` in the address bar.
4. Select **This Firefox**.
5. Select **Load Temporary Add-on**.
6. Choose `manifest.json`.
7. Refresh any Discogs or eBay tabs that were already open.

Temporary installations remain active until Firefox is restarted.

## Usage

### Generate release data

1. Open a specific Discogs release page whose URL contains `/release/`.
2. Press `Ctrl+Shift+Y`.
3. Review the generated title shown in the notification.
4. Paste the copied title where required.

Master-release pages are not supported.

### Fill an eBay draft

1. Generate and store the release data on Discogs.
2. Open an unscheduled eBay draft.
3. Press `Ctrl+Shift+E`.
4. Review the title and description fields.

### Apply condition information

1. Use the floating panel on the eBay page.
2. Select vinyl and sleeve grades.
3. Add up to four plus signs for each.
4. Enter optional condition notes.
5. Press **Apply condition**.
6. Review Seller Notes and the item description before saving.

The condition-panel state is stored locally and remains available after the page is refreshed.

## Configuration

Press `Ctrl+Shift+U` to open the settings page.

Available settings:

- Listing suffix
- Existing description-template autofill enabled or disabled

Leaving the suffix blank disables suffix insertion.

## Project structure

```text
discogs-ebay-title-assistant/
├── manifest.json
├── background.js
├── discogs-content.js
├── ebay-content.js
├── options/
│   ├── options.html
│   ├── options.css
│   └── options.js
└── README.md
```

## Privacy

The extension does not collect or transmit personal data.

Release metadata, suffix preferences and condition-panel selections are stored locally in Firefox using extension storage.

## Limitations

- Discogs and eBay may change their page structure.
- Different eBay listing flows or shop templates may require additional field-label variants.
- The physical record and all generated listing information must be reviewed before saving.
- The extension assumes that standard records in this workflow are LPs unless Discogs clearly identifies a multi-disc LP.

## Development status

Version 1.0 is a working prototype built around a specific real-world record-shop listing workflow.
