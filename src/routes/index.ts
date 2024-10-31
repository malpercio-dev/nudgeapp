import express from "express";

import { AppContext } from "#/server";
import { createPagesRouter } from "#/pages";
import { createOAuthRouter } from "./oauth";
import { createLoginRouter } from "./login";
import { createNudgeRouter } from "./nudge";

export const createRouter = (ctx: AppContext) => {
  const router = express.Router();
  router.use("/public", express.static("../public"));
  router.use(createPagesRouter(ctx));
  router.use(createOAuthRouter(ctx));
  router.use(createLoginRouter(ctx));
  router.use(createNudgeRouter(ctx));
  return router;
};

export const handler =
  (fn: express.Handler) =>
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      await fn(req, res, next);
    } catch (err) {
      next(err);
    }
  };
