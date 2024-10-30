import assert from "node:assert";
import type { APIRoute } from "astro";
import type { RequestContext } from "../../../server";
import { getIronSession } from "iron-session";
import { env } from "process";

type Session = { did: string };

export const GET: APIRoute = async ({ cookies, request, locals, redirect }) => {
  const ctx: RequestContext = locals as RequestContext;
  const params = new URLSearchParams(request.url.split("?")[1]);
  try {
    const { session } = await ctx.oauthClient.callback(params);
    const clientSession = await getIronSession<Session>(ctx.req, ctx.res, {
      cookieName: "sid",
      password: env.COOKIE_SECRET ?? "",
    });
    assert(!clientSession.did, "session already exists");
    clientSession.did = session.did;
    await clientSession.save();
  } catch (err) {
    ctx.logger.error({ err }, "oauth callback failed");
    return redirect("/?error");
  }
  return redirect("/");
};
