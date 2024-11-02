import fs from "node:fs";
import WebSocket from "ws";
import pino from "pino";
import { Jetstream } from "@skyware/jetstream";

import * as Nudge from "./lexicon/types/com/nudgeapp/nudge";
import { Database } from "./db";

export function createIngester(db: Database) {
  const logger = pino({ name: "jetstream ingestion" });

  let intervalID: NodeJS.Timeout;
  let cursorFile;
  if (fs.existsSync("cursor.txt")) {
    cursorFile = fs.readFileSync("cursor.txt", "utf8");
    if (cursorFile) logger.info(`Initiate jetstream at cursor ${cursorFile}`);
  } else {
    fs.openSync("cursor.txt", "a");
    cursorFile = fs.readFileSync("cursor.txt", "utf8");
  }
  const jetstream = new Jetstream({
    ws: WebSocket,
    wantedCollections: ["com.nudgeapp.nudge"],
    cursor: Number(cursorFile),
  });

  jetstream.on("open", () => {
    intervalID = setInterval(() => {
      if (!jetstream.cursor) return;
      fs.writeFile("cursor.txt", jetstream.cursor.toString(), (err) => {
        if (err) console.log(err);
      });
    }, 60000);
  });

  jetstream.on("error", (err) => logger.error({ err }, "jetstream error"));
  jetstream.on("close", () => clearInterval(intervalID));

  jetstream.onCreate("com.nudgeapp.nudge", async (event) => {
    const record = event.commit.record;
    if (
      event.commit.collection === "com.nudgeapp.nudge" &&
      Nudge.isRecord(record) &&
      Nudge.validateRecord(record).success
    ) {
      await db
        .insertInto("nudge")
        .values({
          rkey: event.commit.rkey,
          authorDid: event.did,
          subject: record.subject,
          createdAt: record.createdAt,
          indexedAt: new Date().toISOString(),
        })
        .onConflict((oc) =>
          oc.column("rkey").doUpdateSet({
            subject: record.subject,
            indexedAt: new Date().toISOString(),
          })
        )
        .execute();
    }
  });

  jetstream.onUpdate("com.nudgeapp.nudge", async (event) => {
    const record = event.commit.record;
    if (
      event.commit.collection === "com.nudgeapp.nudge" &&
      Nudge.isRecord(record) &&
      Nudge.validateRecord(record).success
    ) {
      await db
        .insertInto("nudge")
        .values({
          rkey: event.commit.rkey,
          authorDid: event.did,
          subject: record.subject,
          createdAt: record.createdAt,
          indexedAt: new Date().toISOString(),
        })
        .onConflict((oc) =>
          oc.column("rkey").doUpdateSet({
            subject: record.subject,
            indexedAt: new Date().toISOString(),
          })
        )
        .execute();
    }
  });

  jetstream.onDelete("com.nudgeapp.nudge", async (event) => {
    const record = event.commit.rev;
    if (
      event.commit.collection === "com.nudgeapp.nudge" &&
      Nudge.isRecord(record) &&
      Nudge.validateRecord(record).success
    ) {
      await db
        .deleteFrom("nudge")
        .where("rkey", "=", event.commit.rkey)
        .execute();
    }
  });

  jetstream.start();

  return jetstream;
}
