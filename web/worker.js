// Thin entry in front of the static assets: force HTTP -> HTTPS so the
// browser never shows a "Not Secure" warning, then hand everything else
// to the Static Assets binding (the Next.js static export in ./out).
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.protocol === "http:") {
      url.protocol = "https:";
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
