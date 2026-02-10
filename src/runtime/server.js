import { createServer } from "node:http";

import { createRuntimeApp } from "./app.js";

const port = normalizePort(process.env.PORT, 3000);
const app = createRuntimeApp();
const server = createServer(app);

server.listen(port, () => {
  process.stdout.write(`koraos-runtime listening on port ${port}\n`);
});

function shutdown(signal) {
  process.stdout.write(`koraos-runtime shutdown signal: ${signal}\n`);
  server.close((error) => {
    if (error) {
      process.stderr.write(`${error.message}\n`);
      process.exit(1);
      return;
    }
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

function normalizePort(value, fallback) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    return fallback;
  }
  return parsed;
}
