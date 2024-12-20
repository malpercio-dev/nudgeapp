import type { Nudge } from "#/db";
import { html } from "../lib/view";
import { shell } from "./shell";
import { ProfileViewDetailed } from "@atproto/api/dist/client/types/app/bsky/actor/defs";

type Props = {
  nudges: Nudge[];
  didHandleMap: Record<string, string>;
  didProfileMap?: Map<string, ProfileViewDetailed>;
  selfDid?: string;
};

export function home(props: Props) {
  return shell({
    title: "Home",
    content: content(props),
  });
}

function content({ nudges, didHandleMap, didProfileMap, selfDid }: Props) {
  const profile = selfDid ? didProfileMap?.get(selfDid) : null;
  return html` <div class="card">
      ${profile
        ? html`<form action="/logout" method="post" class="session-form">
            <div>
              Hi, <strong>${profile.displayName || "friend"}</strong>. Who needs
              a nudge?
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
    <div class="card">
      <form action="/nudge" method="post">
        <input
          type="text"
          class="subject-input"
          name="subject"
          placeholder="Enter your friend's DID (eg did:plc:j5plnthc7pawnzs35ioujdkk)"
        />
        <button type="submit">👉</button>
      </form>
    </div>
    ${nudges.map((nudge, i) => {
      const authorProfile = didProfileMap?.get(nudge.authorDid);
      const subjectProfile = didProfileMap?.get(nudge.subject);
      return html`<div class=${i === 0 ? "nudge-line no-line" : "nudge-line"}>
        <div class="nudge-container">
          <div class="nudge">
            <a class="author" href=${toBskyLink(nudge.authorDid)}>
              ${
                nudge.authorDid === selfDid
                  ? html`<span class="fingers">🫵</span>`
                  : authorProfile
                    ? html`<img
                        class="avatar"
                        src=${authorProfile.avatar}
                        alt=${authorProfile.handle}
                        title=${authorProfile.handle}
                        onerror="this.onerror=null;this.src='public/generic_avatar.jpg';"
                      />`
                    : html`<img
                        class="avatar"
                        src="public/generic_avatar.jpg"
                        alt=${nudge.authorDid}
                        title=${nudge.authorDid}
                      />`
              }
            </a>
            <span class="fingers">👉</span>
            <a class="subject" href=${toBskyLink(nudge.subject)}>
            ${
              nudge.subject === selfDid
                ? html`<span class="fingers">🫵</span>`
                : subjectProfile
                  ? html`<img
                      class="avatar"
                      src=${subjectProfile.avatar}
                      alt=${subjectProfile.handle}
                      title=${subjectProfile.handle}
                      onerror="this.onerror=null;this.src='public/generic_avatar.jpg';"
                    />`
                  : html`<img
                      class="avatar"
                      src="public/generic_avatar.jpg"
                      alt=${nudge.subject}
                      title=${nudge.subject}
                    />`
            }
          </div>
          <span class="timestamp">on ${ts(nudge)}</span>
        </div>
      </div>`;
    })}`;
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
