import { APIRoute } from "astro";
import { TID } from "@atproto/common";

import * as Nudge from "../lexicon/types/com/nudgeapp/nudge";
import { RequestContext } from "../../server";
import { getSessionAgent } from "../lib/util";

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const ctx = locals as RequestContext;
  const agent = await getSessionAgent(ctx);
  if (!agent) {
    return new Response(null, {
      status: 401,
    });
  }
  const formData = await request.formData();
  const subject = formData.get("subject")?.toString();
  const record = {
    $type: "com.nudgeapp.nudge",
    subject,
    createdAt: new Date().toISOString(),
  };

  if (!Nudge.validateRecord(record).success) {
    return new Response(null, {
      status: 400,
    });
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
    return new Response("Failed to write record", {
      status: 500,
    });
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

  return redirect("/");
};
