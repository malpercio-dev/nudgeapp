import path from "node:path";
import express from "express";

import { AppContext } from "#/server";
import { handler } from "#/routes";
import { page } from "#/lib/view";
import { login } from "./login";
import { getSessionAgent } from "#/lib/util";
import { home } from "./home";

export const createPagesRouter = (ctx: AppContext) => {
  const router = express.Router();
  const publicAssets = path.join(path.dirname(require.main!.filename), "public");
  ctx.logger.info(publicAssets);

  router.use(
    "/public",
    express.static(path.join(path.dirname(require.main!.filename), "public"))
  );

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

      const uniqueDids = new Set([...authorDids, ...subjectDids]);

      if (agent) uniqueDids.add(agent.assertDid);

      const didHandleMap =
        await ctx.resolver.resolveUniqueDidsToHandles(uniqueDids);

      if (!agent) {
        res.type("html").send(page(home({ nudges, didHandleMap })));
        return;
      }

      const profiles = uniqueDids.size
        ? await agent.getProfiles({ actors: [...uniqueDids] })
        : null;

      const didProfileMap = new Map(
        profiles?.data.profiles?.map((p) => [p.did, p])
      );

      res.type("html").send(
        page(
          home({
            nudges,
            didHandleMap,
            didProfileMap,
            selfDid: agent.assertDid,
          })
        )
      );
      return;
    })
  );
  return router;
};
