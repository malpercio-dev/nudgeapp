import assert from "node:assert";
import express from "express";
import { getIronSession } from "iron-session";

import { handler } from ".";
import { AppContext } from "#/server";
import { env } from "#/lib/env";
import { Session } from "#/models";

export const createOAuthRouter = (ctx: AppContext) => {
  const router = express.Router();
  router.get(
    "/client-metadata.json",
    handler((_req, res) => {
      res.json(ctx.oauthClient.clientMetadata);
    })
  );

  router.get(
    "/oauth/callback",
    handler(async (req, res) => {
      const params = new URLSearchParams(req.originalUrl.split("?")[1]);
      try {
        const { session } = await ctx.oauthClient.callback(params);
        const clientSession = await getIronSession<Session>(req, res, {
          cookieName: "sid",
          password: env.COOKIE_SECRET,
        });
        assert(!clientSession.did, "session already exists");
        clientSession.did = session.did;
        await clientSession.save();
      } catch (err) {
        ctx.logger.error({ err }, "oauth callback failed");
        return res.redirect("/?error");
      }
      return res.redirect("/");
    })
  );

  return router;
};
