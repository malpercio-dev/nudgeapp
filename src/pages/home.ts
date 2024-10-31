import type { Nudge } from "#/db";
import { html } from "../lib/view";
import { shell } from "./shell";

type Props = {
  nudges: Nudge[];
  didHandleMap: Record<string, string>;
  profile?: { displayName?: string };
};

export function home(props: Props) {
  return shell({
    title: "Home",
    content: content(props),
  });
}

function content({ nudges, didHandleMap, profile }: Props) {
  return html`<div id="root">
    <div class="error"></div>
    <div id="header">
      <h1>Nudge</h1>
      <p>Give your friends a nudge on the Atmosphere!</p>
    </div>
    <div class="container">
      <div class="card">
        ${profile
          ? html`<form action="/logout" method="post" class="session-form">
              <div>
                Hi, <strong>${profile.displayName || "friend"}</strong>. Who
                needs a nudge?
              </div>
              <div>
                <button type="submit">Log out</button>
              </div>
            </form>`
          : html`<div class="session-form">
              <div><a href="/login">Log in</a> to nudge!</div>
              <div>
                <a href="/login" class="button">Log in</a>
              </div>
            </div>`}
      </div>
      <form action="/nudge" method="post">
        <input type="text" name="subject" />
        <button type="submit" />
      </form>
      ${nudges.map((nudge, i) => {
        const authorHandle = didHandleMap[nudge.authorDid] || nudge.authorDid;
        const subjectHandle = didHandleMap[nudge.subject] || nudge.subject;
        return html`<div class=${i === 0 ? "nudge-line no-line" : "nudge-line"}>
          <div>
            <div class="nudge">
              <a href=${toBskyLink(nudge.subject)}>${subjectHandle}</a> was
              nudged by
              <a href=${toBskyLink(nudge.authorDid)}>${authorHandle}</a> at ${ts(nudge)}.
            </div>
          </div>
        </div>`;
      })}
    </div>
  </div>`;
}

function toBskyLink(did: string) {
  return `https://bsky.app/profile/${did}`;
}

function ts(status: Nudge) {
  const createdAt = new Date(status.createdAt);
  const indexedAt = new Date(status.indexedAt);
  if (createdAt < indexedAt) return createdAt.toDateString();
  return indexedAt.toDateString();
}
