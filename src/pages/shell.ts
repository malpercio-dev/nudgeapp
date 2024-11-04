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
            <p>Give your friends a nudge on the ATmosphere!</p>
            <sub>Real friends know each other's DIDs. 😝</p>
          </div>
          <div class="main">
            <div class="content-container">${content}</div>
            <div class="right-bar">
              <ul>
                <li><a href="/">Home</a></li>
                <li><a href="https://bsky.app/profile/malpercio.dev">@malpercio.dev</a></li>
                <li><a href="https://github.com/malpercio-dev/nudgeapp">GitHub</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </body>
  </html>`;
}
