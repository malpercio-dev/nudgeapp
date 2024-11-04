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
        <input type="text" class="subject-input" name="subject" placeholder="alice.bsky.social" />
        <button type="submit">👉</button>
      </form>
    </div>
    ${nudges.map((nudge, i) => {
      const authorHandle = didHandleMap[nudge.authorDid] || nudge.authorDid;
      const subjectHandle = didHandleMap[nudge.subject] || nudge.subject;
      const authorProfile = didProfileMap?.get(nudge.authorDid);
      const subjectProfile = didProfileMap?.get(nudge.subject);
      return html`<div class=${i === 0 ? "nudge-line no-line" : "nudge-line"}>
        <div class="nudge-container">
          <div class="nudge">
            <a class="author" href=${toBskyLink(nudge.authorDid)}>
              ${authorProfile
                ? html`<img
                    class="avatar"
                    src=${authorProfile.avatar}
                    alt=${authorProfile.handle}
                  />`
                : html`<a class="author" href=${toBskyLink(nudge.authorDid)}
                    >${authorHandle}</a
                  >`}
            </a>
            <span class="the-nudge">👉</span>
            ${subjectProfile
              ? html`<img
                  class="avatar"
                  src=${subjectProfile.avatar}
                  alt=${subjectProfile.handle}
                />`
              : html`<a class="author" href=${toBskyLink(nudge.subject)}
                  >${subjectHandle}</a
                >`}
            <span>at ${ts(nudge)}.</span>
          </div>
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
