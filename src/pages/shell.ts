import { type Hole, html } from "#/lib/view";

export function shell({ title, content }: { title: string; content: Hole }) {
  return html`<html>
    <head>
      <title>${title}</title>
      <link rel="stylesheet" href="/public/styles.css" />
    </head>
    <body>
      <div id="root">
        <div class="error"></div>
        <div class="container">
          <div id="header">
            <h1>nudge</h1>
            <p>Give your friends a nudge on the Atmosphere!</p>
          </div>
          ${content}
        </div>
      </div>
    </body>
  </html>`;
}
