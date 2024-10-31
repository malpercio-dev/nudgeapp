import express from "express";
import { TID } from "@atproto/common";

import { handler } from ".";
import { AppContext } from "#/server";
import { getSessionAgent } from "#/lib/util";
import * as Nudge from "#/lexicon/types/com/nudgeapp/nudge";

export const createNudgeRouter = (ctx: AppContext) => {
  const router = express.Router();

  router.post(
    "/nudge",
    handler(async (req, res) => {
      const agent = await getSessionAgent(req, res, ctx);
      if (!agent) {
        res.status(401);
        return;
      }
      const subject = req.body?.subject;
      const record = {
        $type: "com.nudgeapp.nudge",
        subject,
        createdAt: new Date().toISOString(),
      };

      if (!Nudge.validateRecord(record).success) {
        res.status(400);
        return;
      }

      let uri;
      try {
        const res = await agent.com.atproto.repo.putRecord({
          repo: agent.assertDid,
          collection: "com.nudgeapp.nudge",
          rkey: TID.nextStr(),
          record,
        });
        uri = res.data.uri;
      } catch (err) {
        ctx.logger.error({ err }, "failed to write record");
        res.status(500);
        return;
      }

      try {
        await ctx.db
          .insertInto("nudge")
          .values({
            uri,
            authorDid: agent.assertDid,
            subject: record.subject!,
            createdAt: record.createdAt,
            indexedAt: new Date().toISOString(),
          })
          .execute();
      } catch (err) {
        ctx.logger.error({ err }, "failed to update db from endpoint");
      }

      res.redirect("/");
      return;
    })
  );
  return router;
};
