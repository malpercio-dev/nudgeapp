import { getIronSession } from "iron-session";
import { env } from "./env";
import { Agent } from "@atproto/api";
import { Request, Response } from "express";
import { AppContext } from "#/server";

type Session = { did: string };

export const getSessionAgent = async (
  req: Request,
  res: Response,
  ctx: AppContext
) => {
  const session = await getIronSession<Session>(req, res, {
    cookieName: "sid",
    password: env.COOKIE_SECRET,
  });
  if (!session.did) return null;
  try {
    const oauthSession = await ctx.oauthClient.restore(session.did);
    return oauthSession ? new Agent(oauthSession) : null;
  } catch (err) {
    ctx.logger.error({ err }, "oauth restore failed");
    session.destroy();
    return null;
  }
};
