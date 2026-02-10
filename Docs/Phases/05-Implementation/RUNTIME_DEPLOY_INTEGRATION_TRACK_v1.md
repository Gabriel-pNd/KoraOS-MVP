# Runtime/Deploy Integration Track v1

## 1. Objetivo
Iniciar trilha de integracao runtime/deploy sobre os contratos de dominio da Fase 05 ja mergeados.

## 2. Escopo deste ciclo
1. Runtime HTTP para executar cenarios de contrato por API.
2. Smoke test automatizado do runtime.
3. Base de deploy local com Docker e `docker-compose`.
4. CI atualizado para validar testes + smoke runtime.

## 3. Artefatos criados
1. `package.json`
2. `src/runtime/app.js`
3. `src/runtime/server.js`
4. `src/runtime/scenario_registry.js`
5. `tests/runtime/app.test.js`
6. `scripts/smoke/runtime-smoke.js`
7. `Dockerfile`
8. `docker-compose.yml`
9. `.dockerignore`
10. `.github/workflows/ci.yml` (test + smoke)

## 4. Cenarios de runtime expostos
1. `o1.dispatch.validate`
2. `o2.safe_mode.exit`
3. `o3.evidence_pack.generate`
4. `o3.redis_drill.run`

## 5. Proximos passos da trilha
1. adicionar adaptadores de persistencia/queue reais (DB, Redis, mensageria).
2. definir pipeline de deploy para ambiente alvo (staging/prod).
3. conectar observabilidade operacional real (logs/metrics/alerting stack).
