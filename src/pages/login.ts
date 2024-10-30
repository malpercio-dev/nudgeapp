import type { APIRoute } from "astro";
import type { AppContext } from "../../server";

export const POST: APIRoute = async ({ request, locals }) => {
  const ctx: AppContext = locals as AppContext;
  const formData = await request.formData();
  const handle = formData.get("handle");
  if (handle === null) {
    return Response.error();
  }
  const url = await ctx.oauthClient.authorize(handle.toString(), {
    scope: "atproto transition:generic",
  });
  return Response.redirect(url.toString());
};
