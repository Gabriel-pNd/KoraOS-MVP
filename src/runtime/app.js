import { createScenarioRegistry } from "./scenario_registry.js";

const MAX_BODY_SIZE_BYTES = 1_000_000;

export function createRuntimeApp({
  scenarioRegistry = createScenarioRegistry(),
  now = () => new Date().toISOString(),
} = {}) {
  const scenarios = scenarioRegistry;

  return async function runtimeHandler(req, res) {
    try {
      const requestUrl = new URL(req.url, "http://localhost");
      const method = (req.method || "GET").toUpperCase();
      const pathname = requestUrl.pathname;

      if (method === "GET" && pathname === "/health") {
        return sendJson(res, 200, {
          status: "ok",
          service: "koraos-runtime",
          time: now(),
          version: process.env.APP_VERSION || "dev",
        });
      }

      if (method === "GET" && pathname === "/v1/scenarios") {
        const payload = Object.entries(scenarios).map(([id, definition]) => ({
          id,
          description: definition.description,
        }));
        return sendJson(res, 200, {
          service: "koraos-runtime",
          count: payload.length,
          scenarios: payload,
        });
      }

      if (method === "POST" && pathname.startsWith("/v1/scenarios/") && pathname.endsWith("/execute")) {
        const scenarioId = decodeURIComponent(
          pathname.slice("/v1/scenarios/".length, -"/execute".length)
        );

        const scenario = scenarios[scenarioId];
        if (!scenario) {
          return sendJson(res, 404, {
            error: "scenario_not_found",
            scenarioId,
          });
        }

        const requestBody = await readJsonBody(req);
        const input = requestBody && requestBody.input ? requestBody.input : {};
        const result = await scenario.execute(input);

        return sendJson(res, 200, {
          scenarioId,
          result,
        });
      }

      return sendJson(res, 404, {
        error: "not_found",
        path: pathname,
      });
    } catch (error) {
      return sendJson(res, 500, {
        error: "runtime_internal_error",
        message: normalizeErrorMessage(error),
      });
    }
  };
}

async function readJsonBody(req) {
  const chunks = [];
  let size = 0;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_BODY_SIZE_BYTES) {
      throw new Error("payload_too_large");
    }
    chunks.push(buffer);
  }

  if (chunks.length === 0) {
    return {};
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  if (rawBody.trim() === "") {
    return {};
  }
  return JSON.parse(rawBody);
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.statusCode = statusCode;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("content-length", Buffer.byteLength(body));
  res.end(body);
}

function normalizeErrorMessage(error) {
  if (!error || typeof error.message !== "string") {
    return "unknown_error";
  }
  return error.message;
}
