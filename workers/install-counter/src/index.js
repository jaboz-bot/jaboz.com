/**
 * Đếm lượt cài (chỉ tăng): POST /install-count-register { "installId": "..." }
 * GET /install-stats.json → { "totalDownloads": N }
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return cors();
    }
    const path = url.pathname.replace(/\/$/, "") || "/";

    if (path === "/install-stats.json" && request.method === "GET") {
      const raw = await env.INSTALL_KV.get("total");
      const total = Math.max(0, parseInt(raw || "0", 10) || 0);
      return json(200, { totalDownloads: total });
    }

    if (path === "/install-count-register" && request.method === "POST") {
      let body = {};
      try {
        body = await request.json();
      } catch {
        return json(400, { error: "invalid_json" });
      }
      const installId = typeof body.installId === "string" ? body.installId.trim() : "";
      if (!installId || installId.length > 128) {
        return json(400, { error: "missing_or_invalid_installId" });
      }
      const seenKey = `seen:${installId}`;
      const already = await env.INSTALL_KV.get(seenKey);
      if (already) {
        return json(200, { ok: true, duplicate: true });
      }
      const curRaw = await env.INSTALL_KV.get("total");
      const cur = Math.max(0, parseInt(curRaw || "0", 10) || 0);
      const next = cur + 1;
      await env.INSTALL_KV.put("total", String(next));
      await env.INSTALL_KV.put(seenKey, "1");
      return json(200, { ok: true, totalDownloads: next });
    }

    return new Response("Not found", { status: 404 });
  },
};

function cors() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}

function json(status, obj) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
    },
  });
}
