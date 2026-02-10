import { createServer } from "node:http";

import { createRuntimeApp } from "../../src/runtime/app.js";

async function main() {
  const app = createRuntimeApp();
  const server = createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  const address = server.address();
  const port = address && typeof address === "object" ? address.port : null;
  if (!port) {
    throw new Error("runtime_port_not_available");
  }

  try {
    await assertHealth(port);
    await assertScenarioList(port);
    await assertScenarioExecution(port);
    process.stdout.write("runtime smoke test: PASS\n");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function assertHealth(port) {
  const response = await fetch(`http://127.0.0.1:${port}/health`);
  if (!response.ok) {
    throw new Error(`health_check_failed:${response.status}`);
  }
  const payload = await response.json();
  if (payload.status !== "ok") {
    throw new Error("health_payload_invalid");
  }
}

async function assertScenarioList(port) {
  const response = await fetch(`http://127.0.0.1:${port}/v1/scenarios`);
  if (!response.ok) {
    throw new Error(`scenario_list_failed:${response.status}`);
  }
  const payload = await response.json();
  if (!Array.isArray(payload.scenarios) || payload.scenarios.length < 1) {
    throw new Error("scenario_list_empty");
  }
}

async function assertScenarioExecution(port) {
  const response = await fetch(
    `http://127.0.0.1:${port}/v1/scenarios/o1.dispatch.validate/execute`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        input: {
          event: {
            contactId: "contact-smoke-1",
            commitOrder: 1,
            correlationId: "corr-smoke-1",
            dispatchPriority: 90,
          },
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`scenario_execution_failed:${response.status}`);
  }
  const payload = await response.json();
  if (!payload.result || !payload.result.terminalState) {
    throw new Error("scenario_execution_result_invalid");
  }
}

main().catch((error) => {
  process.stderr.write(`runtime smoke test: FAIL (${error.message})\n`);
  process.exit(1);
});
