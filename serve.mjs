import { createServer } from "node:http";
import { Readable } from "node:stream";

const { default: handler } = await import("./dist/server/server.js");
const PORT = process.env.PORT || 3000;

createServer(async (req, res) => {
  try {
    const host = req.headers.host || "localhost";
    const url = `http://${host}${req.url}`;

    const headers = {};
    for (const [k, v] of Object.entries(req.headers)) {
      if (v != null) headers[k] = Array.isArray(v) ? v.join(", ") : v;
    }

    let body = undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
      body = Readable.toWeb(req);
    }

    const request = new Request(url, {
      method: req.method,
      headers,
      body,
      // @ts-ignore
      duplex: body ? "half" : undefined,
    });

    const response = await handler.fetch(request, {}, {});

    res.statusCode = response.status;
    for (const [k, v] of response.headers.entries()) {
      res.setHeader(k, v);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    res.end(buffer);
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
}).listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
