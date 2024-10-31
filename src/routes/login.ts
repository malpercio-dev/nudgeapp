import express from "express";
import { isValidHandle } from "@atproto/syntax";

import { handler } from ".";
import { AppContext } from "#/server";
import { OAuthResolverError } from "@atproto/oauth-client-node";
import { page } from "#/lib/view";
import { login } from "#/pages/login";

export const createLoginRouter = (ctx: AppContext) => {
  const router = express.Router();
  router.post(
    "/login",
    handler(async (req, res) => {
      // Validate
      const handle = req.body?.handle;
      if (typeof handle !== "string" || !isValidHandle(handle)) {
        res.type("html").send(page(login({ error: "invalid handle" })));
        return;
      }

      // Initiate the OAuth flow
      try {
        const url = await ctx.oauthClient.authorize(handle, {
          scope: "atproto transition:generic",
        });
        res.redirect(url.toString());
        return;
      } catch (err) {
        ctx.logger.error({ err }, "oauth authorize failed");
        res.type("html").send(
          page(
            login({
              error:
                err instanceof OAuthResolverError
                  ? err.message
                  : "couldn't initiate login",
            })
          )
        );
        return;
      }
    })
  );

  return router;
};
