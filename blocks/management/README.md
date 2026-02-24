# Management Block

## Overview

The Management block renders structured records from a JSON feed (typically an EDS spreadsheet JSON endpoint) into cards.

- `Project Name` is rendered as the card title
- `Task Name` is rendered as the card subtitle
- all remaining non-empty fields are rendered as details rows

This block is intended for data-driven status or management dashboards authored in spreadsheet form.

## Configuration

The block reads key-value configuration via `readBlockConfig(block)`.

### Supported Options

- `source` (optional): JSON endpoint to fetch records from.
  - Default: `/management.json`
  - Recommended spreadsheet usage: `/management.json?sheet=data`

If `source` is not provided, the block uses the default relative path.

## Integration Details

### Data Source and Shape

The block supports these JSON payload shapes:

1. Root array: `[{...}, {...}]`
2. Object with `data`: `{ "data": [{...}] }`
3. Object with `items`: `{ "items": [{...}] }`

### URL Parameters

This block does not read page URL parameters directly.  
Any feed query parameters should be provided in the `source` value.

### Local Storage

This block does not use `localStorage` or `sessionStorage`.

### Events

This block does not publish or subscribe to the Drop-ins event bus.

## Behavior Patterns

### Rendering Flow

1. Read `source` from block config (or use default).
2. Fetch JSON from `source`.
3. Resolve rows from `data`, `items`, or array root.
4. For each row:
   - map `Project Name` to title
   - map `Task Name` to subtitle
   - render remaining fields in a `<dl>` details section

### Value Handling

- Arrays are joined with comma separation.
- Nested objects are flattened as `key: value` pairs.
- URL values are rendered as clickable links.
- Empty/null values are skipped.

## Error Handling

- If fetch fails or response is not `ok`, the block logs the error and shows:
  - `Unable to load management records.`
- If request succeeds but no rows are found, the block shows:
  - `No management records found.`
- Internal keys such as `path`, `url`, `source`, and `image` are excluded from details output.

