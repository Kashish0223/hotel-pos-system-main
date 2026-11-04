// Server-Sent Events endpoint for real-time updates without extra deps
// import { ROLE_PERMISSIONS } from "@/lib/rbac";
// import { jwtVerify } from "jose";
// import { headers } from "next/headers";

// const secret = new TextEncoder().encode(process.env.JWT_SECRET);

// const canManagePermissions = (role, isSuperAdmin) =>
//   role === "superadmin" || isSuperAdmin;

export async function GET(request) {
      // const headerList = await headers();
      // const authHeader = headerList.get("Authorization");
      // // console.log("STaff get header:---",authHeader);
  
      // if (!authHeader || !authHeader.startsWith("Bearer ")) {
      //   return Response.json({ error: "No token provided" }, { status: 401 });
      // }
  
      // const token = authHeader.split("Bearer ")[1];
      // try {
      //   const verified = await jwtVerify(token, secret);
      //   const payload = verified.payload;
      //   if (!payload.role)
      //     return Response.json(
      //       { error: "Invalid token (missing role)" },
      //       { status: 401 }
      //     );
      // } catch (e) {
      //   // console.error("JWT verification failed:", e);
      //   return Response.json(
      //     { error: "Invalid or expired token" },
      //     { status: 401 }
      //   );
      // }
  
  const encoder = new TextEncoder();

  // Keep a global registry of connected clients in this server process
  globalThis.sseClients = globalThis.sseClients || new Set();

  const stream = new ReadableStream({
    start(controller) {
      const send = (msg) => {
        controller.enqueue(encoder.encode(msg))
      };
      const client = { send };

      // Register client
      globalThis.sseClients.add(client);

      // Initial hello
      send(`event: connected\n` + `data: ${JSON.stringify({ time: Date.now() })}\n\n`);

      // Keep-alive ping to avoid proxies closing the stream
      const ping = setInterval(() => {
        try { send(`event: ping\n` + `data: ${Date.now()}\n\n`); } catch {}
      }, 25000);    

      // When client disconnects
      request.signal.addEventListener("abort", () => {
        clearInterval(ping);
        globalThis.sseClients.delete(client);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
} 