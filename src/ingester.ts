import pino from "pino";
import { Firehose } from "@atproto/sync";
import { IdResolver } from "@atproto/identity";
import * as Nudge from "./lexicon/types/com/nudgeapp/nudge";
import { Database } from "./db";

export function createIngester(db: Database, idResolver: IdResolver) {
  const logger = pino({ name: "firehose ingestion" });
  return new Firehose({
    filterCollections: ["com.nudgeapp.nudge"],
    idResolver,
    handleEvent: async (evt) => {
      if (evt.event === "create" || evt.event === "update") {
        const record = evt.record;

        if (
          evt.collection === "com.nudgeapp.nudge" &&
          Nudge.isRecord(record) &&
          Nudge.validateRecord(record).success
        ) {
          await db
            .insertInto("nudge")
            .values({
              uri: evt.uri.toString(),
              authorDid: evt.did,
              subject: record.subject,
              createdAt: record.createdAt,
              indexedAt: new Date().toISOString(),
            })
            .onConflict((oc) =>
              oc.column("uri").doUpdateSet({
                subject: record.subject,
                indexedAt: new Date().toISOString(),
              })
            )
            .execute();
        }
      }
    },
    onError: (err) => {
      logger.error({ err }, "error on firehose ingestion");
    },
  });
}
