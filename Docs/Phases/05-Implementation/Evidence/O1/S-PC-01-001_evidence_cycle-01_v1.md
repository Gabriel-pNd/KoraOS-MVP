# Evidence - S-PC-01-001 (Cycle 01)

## 1. Story
- Story ID: S-PC-01-001
- Titulo: Separar `dispatch_priority` de `commit_order` no fluxo de fila
- Status deste ciclo: implemented_ready_for_pr

## 2. Artefatos implementados
1. `src/koraos/o1/s_pc_01_001_dispatch_priority_vs_commit_order.js`
2. `tests/o1/s_pc_01_001_dispatch_priority_vs_commit_order.test.js`

## 3. Evidencias de aceite
| Cenario obrigatorio da story | Evidencia automatizada | Resultado |
|---|---|---|
| Duas mensagens com prioridades diferentes para o mesmo contato | teste `S-PC-01-001: dispatch_priority does not alter commit_order` | PASS |
| Violacao de ordem com bloqueio seguro | teste `S-PC-01-001: commit order violation is blocked safely` | PASS |
| Alta concorrencia por contato | teste `S-PC-01-001: concurrent events by contact remain queue-safe` | PASS |
| Log com `correlation_id`, `dispatch_priority`, `commit_order` | teste `S-PC-01-001: structured logs include correlation fields` | PASS |

## 4. Contrato atendido neste ciclo
1. Estados terminais implementados: `queued_for_dispatch`, `blocked_commit_order_violation`, `invalid_payload_manual`.
2. Regra de separacao preservada: ordenacao de despacho nao altera campo de commit.
3. Tratamento de payload invalido aplicado para ausencia de `contact_id`.

## 5. Qualidade
1. Execucao local: `node --test tests/o1/*.test.js`
2. Resultado agregado: PASS (13 testes, 0 falhas).
