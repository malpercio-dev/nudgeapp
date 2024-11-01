import path from "node:path";
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

  router.use("/public", express.static(path.join(__dirname, "public")));

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

      const authorDids = new Set(nudges.map((n) => n.authorDid));
      const subjectDids = new Set(nudges.map((n) => n.subject));

      const uniqueDids = authorDids.union(subjectDids);

      const didHandleMap =
        await ctx.resolver.resolveUniqueDidsToHandles(uniqueDids);

      if (!agent) {
        res.type("html").send(page(home({ nudges, didHandleMap })));
        return;
      }

      const profiles = await agent.getProfiles({ actors: [...uniqueDids] });

      const didProfileMap = new Map(
        profiles.data.profiles.map((p) => [p.did, p])
      );

      res
        .type("html")
        .send(
          page(
            home({ nudges, didHandleMap, didProfileMap, selfDid: agent.assertDid })
          )
        );
      return;
    })
  );
  return router;
};
