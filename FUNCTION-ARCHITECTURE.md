# Function Return Architecture

The dashboard follows a simple modular SAHA rule:

> Every page, card, chart, modal, and component should be built by a function that returns a result.

The result can be:

- an HTML string,
- a text string,
- a data object,
- an action result object,
- or a chart instance.

DOM injection should happen after the function result is produced.

## Flow

```text
User action
  -> event listener
  -> data/API function
  -> metrics/filter function
  -> render function returns HTML
  -> inject function writes HTML to DOM
  -> page updates without reload
```

## Current implemented pattern

### Dashboard renderer

`js/render-dashboard.js`

- `getStatsCardsHtml(stats)` returns KPI HTML.
- `getProgressHtml(stats)` returns progress bar HTML.
- `getPrioritiesHtml(stats)` returns priority HTML.
- `getDashboardHtml(stats)` returns an object of HTML strings.
- `inject(html)` writes the returned HTML to the page.
- `render()` orchestrates get + inject and returns the HTML object.

### Campaign renderer

`js/render-campaigns.js`

- `getRowHtml(row)` returns one table row HTML string.
- `getTableHtml(pageRows)` returns the full table body HTML.
- `getPaginationState()` returns pagination data.
- `getCampaignsHtml()` returns row HTML and pagination data.
- `inject(html)` writes rows and pagination state to DOM.
- `render()` orchestrates get + inject and returns the HTML object.

### Analytics renderer

`js/render-analytics.js`

- `getPartyAnalyticsHtml()` returns party analytics HTML.
- `getInsightsHtml(stats)` returns insight HTML.
- `getReportText(stats)` returns report text.
- `getAnalyticsHtml(stats)` returns all analytics outputs.
- `inject(html)` writes results to DOM.
- `render()` orchestrates get + inject and returns the HTML object.

## Module result types

| Module | Returns |
|---|---|
| `config.js` | Configuration object |
| `api.js` | Data arrays or action result objects |
| `utils.js` | Formatted strings or HTML snippets |
| `filters.js` | Filtered record arrays |
| `metrics.js` | Statistics object |
| `render-dashboard.js` | HTML strings / HTML object |
| `render-campaigns.js` | Table HTML / pagination object |
| `render-analytics.js` | HTML strings and report text |
| `actions.js` | Action results or exported file |
| `share.js` | Share URLs or copy result |
| `modals.js` | Modal HTML or modal actions |
| `app.js` | Orchestration only |

## Rule for future code

Do not write large render functions that directly mutate the DOM only.

Preferred pattern:

```javascript
function getCardHtml(data) {
  return `<div class="card">${data.title}</div>`;
}

function injectCard(html) {
  document.getElementById('target').innerHTML = html;
}

function renderCard(data) {
  const html = getCardHtml(data);
  injectCard(html);
  return html;
}
```

This makes every section easy to debug, test, replace, and reuse.
