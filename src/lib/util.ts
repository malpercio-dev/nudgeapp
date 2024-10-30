import { getIronSession } from "iron-session";
import { RequestContext } from "../../server";
import { env } from "./env";
import { Agent } from "@atproto/api";

type Session = { did: string };

export const getSessionAgent = async (ctx: RequestContext) => {
  const session = await getIronSession<Session>(ctx.req, ctx.res, {
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
