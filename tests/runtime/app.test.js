import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";

import { createRuntimeApp } from "../../src/runtime/app.js";

async function withRuntimeServer(run) {
  const app = createRuntimeApp();
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const address = server.address();
  const port = address && typeof address === "object" ? address.port : null;

  try {
    await run(port);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("runtime health endpoint returns service status", async () => {
  await withRuntimeServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/health`);
    assert.equal(response.status, 200);

    const payload = await response.json();
    assert.equal(payload.status, "ok");
    assert.equal(payload.service, "koraos-runtime");
  });
});

test("runtime scenarios endpoint returns scenario catalog", async () => {
  await withRuntimeServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/v1/scenarios`);
    assert.equal(response.status, 200);

    const payload = await response.json();
    assert.ok(Array.isArray(payload.scenarios));
    assert.ok(payload.scenarios.some((item) => item.id === "o1.dispatch.validate"));
  });
});

test("runtime executes registered scenario successfully", async () => {
  await withRuntimeServer(async (port) => {
    const response = await fetch(
      `http://127.0.0.1:${port}/v1/scenarios/o3.redis_drill.run/execute`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          input: {
            correlationId: "corr-runtime-test-1",
          },
        }),
      }
    );
    assert.equal(response.status, 200);

    const payload = await response.json();
    assert.equal(payload.scenarioId, "o3.redis_drill.run");
    assert.ok(payload.result.terminalState);
  });
});

test("runtime returns 404 for unknown scenario", async () => {
  await withRuntimeServer(async (port) => {
    const response = await fetch(
      `http://127.0.0.1:${port}/v1/scenarios/unknown.scenario/execute`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input: {} }),
      }
    );
    assert.equal(response.status, 404);
    const payload = await response.json();
    assert.equal(payload.error, "scenario_not_found");
  });
});
