# Evidence - S-PC-02-001 (Cycle 02)

## 1. Story
- Story ID: S-PC-02-001
- Titulo: Validar TTL por intent antes de replay
- Status deste ciclo: implemented_ready_for_pr

## 2. Artefatos implementados
1. `src/koraos/o1/s_pc_02_001_replay_ttl_validation.js`
2. `tests/o1/s_pc_02_001_replay_ttl_validation.test.js`

## 3. Evidencias de aceite
| Cenario obrigatorio da story | Evidencia automatizada | Resultado |
|---|---|---|
| Replay dentro de TTL segue para execucao | teste `S-PC-02-001: replay inside TTL is ready for replay` | PASS |
| Replay expirado resulta em `expired_manual` | teste `S-PC-02-001: expired replay is routed to expired_manual` | PASS |
| Casos limite D-1 (`appointment_start - 30 min`) | teste `S-PC-02-001: D-1 boundary honors appointment_start minus 30 min` | PASS |
| Logs com `intent`, `event_age`, `ttl_limit`, `result` | teste `S-PC-02-001: structured logs include intent age and TTL fields` | PASS |

## 4. Contrato atendido neste ciclo
1. Tabela TTL implementada conforme secao 7 da consolidacao:
   - `schedule/reschedule/cancel = 120 min`
   - `D-1 confirmation = appointment_start - 30 min`
   - `follow-up non transactional = 24h`
2. Estados implementados: `ttl_valid_ready_for_replay`, `expired_manual`, `invalid_event_manual`.

## 5. Qualidade
1. Execucao local: `node --test tests/o1/*.test.js`
2. Resultado agregado: PASS (25 testes, 0 falhas).
