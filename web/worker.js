// Thin entry in front of the static assets: force HTTP -> HTTPS + set HSTS
// so the browser never shows a "Not Secure" warning, then hand everything
// else to the Static Assets binding (the Next.js static export in ./out).
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.protocol === "http:") {
      url.protocol = "https:";
      return Response.redirect(url.toString(), 301);
    }
    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    return new Response(response.body, { status: response.status, headers });
  },
};
