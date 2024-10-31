import express from "express";

import { AppContext } from "#/server";
import { handler } from "#/routes";
import { page } from "#/lib/view";
import { login } from "./login";
import { getSessionAgent } from "#/lib/util";
import * as Profile from "#/lexicon/types/app/bsky/actor/profile";
import { home } from "./home";

export const createPagesRouter = (ctx: AppContext) => {
  const router = express.Router();
  router.get(
    "/login",
    handler(async (_req, res) => {
      res.type("html").send(page(login({})));
      return;
    })
  );
  router.get(
    "/",
    handler(async (req, res) => {
      const agent = await getSessionAgent(req, res, ctx);

      const nudges = await ctx.db
        .selectFrom("nudge")
        .selectAll()
        .orderBy("indexedAt", "desc")
        .limit(10)
        .execute();

      const didHandleMap = await ctx.resolver.resolveDidsToHandles(
        nudges.map((n) => n.authorDid)
      );

      if (!agent) {
        res.type("html").send(page(home({ nudges, didHandleMap })));
        return;
      }

      const { data: profileRecord } = await agent?.com.atproto.repo.getRecord({
        repo: agent.assertDid,
        collection: "app.bsky.actor.profile",
        rkey: "self",
      });

      const profile =
        Profile.isRecord(profileRecord.value) &&
        Profile.validateRecord(profileRecord.value).success
          ? profileRecord.value
          : {};

      res.type("html").send(page(home({ nudges, didHandleMap, profile })));
      return;
    })
  );
  return router;
};
