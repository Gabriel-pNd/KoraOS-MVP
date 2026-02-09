# Handoff - Phase 01 UX -> Phase 02 Architecture

## 1) Metadata
- Projeto: KoraOS MVP
- Fase atual: Phase 01-UX (encerrada)
- Data/Hora (UTC-3): 2026-02-09 19:23:24 -03:00
- Autor(a): Codex + PO
- Repositorio/Branch: Gabriel-pNd/KoraOS-MVP / main
- Issue/PR relacionados: a definir no merge deste pacote
- Status geral: on-track

## 2) Executive Summary
- Objetivo desta etapa:
  - Fechar mapa de fluxo UX P0 e especificacao de wireframe para liberar fase de arquitetura.
- Concluido:
  - Fluxos P0 aprovados pelo PO.
  - Excecoes criticas incorporadas:
    - takeover
    - contingencia WhatsApp + replay
    - safe mode por falta de ACK em 15 min
  - Especificacao de wireframe P0 criada.
- Pendente:
  - Traducao de fluxos UX em contratos tecnicos e componentes de arquitetura.
- Impacto no roadmap:
  - Libera inicio da Phase 02-Architecture sem bloqueio de definicao funcional P0.

## 3) Essential Context
- Problema de negocio:
  - Operar jornada critica de atendimento e agenda com seguranca operacional sob alta carga.
- Premissas ativas:
  - prioridade de fila congelada
  - SLA humano congelado
  - D-1 congelado
  - guardians deny-by-default
  - contingencia/replay obrigatorios
  - fail-safe sem ACK em 15 min obrigatorio
- Restricoes:
  - Sem exigencia de equipe clinica 24/7.
  - Dashboard gestor sem foco de infra detalhada.
- Fora de escopo:
  - High-fidelity UI
  - Design system final
  - Fluxos P1/P2

## 4) Decisions Taken
| ID | Decisao | Motivo | Alternativas consideradas | Dono | Data |
|----|---------|--------|---------------------------|------|------|
| D-UX-001 | Encerrar Fase 01 com Flow Map P0 + Wireframe Spec P0 | Reduzir ambiguidade antes da arquitetura | Ir direto para arquitetura sem spec UX | PO | 2026-02-09 |
| D-UX-002 | Tornar `safe_mode_restricted` estado global visivel no UX | Evitar side-effect em incidente sem ACK | Bloqueio silencioso em backend apenas | PO + UX | 2026-02-09 |
| D-UX-003 | Manter contingencia/replay como fluxo explicito de tela | Garantir operabilidade humana em degradação | Tratar somente em runbook tecnico | PO + UX | 2026-02-09 |

## 5) Changes Executed
| ID | Tipo | Artefato | Descricao | Evidencia |
|----|------|----------|-----------|-----------|
| C-UX-001 | doc | `Docs/Phases/01-UX/UX_FLOW_MAP_P0_v1.md` | Mapa de fluxos P0 com estados e excecoes | arquivo no repositorio |
| C-UX-002 | doc | `Docs/Phases/01-UX/UX_WIREFRAME_SPEC_P0_v1.md` | Especificacao de wireframes P0 por tela | arquivo no repositorio |

## 6) Risks and Mitigations
| ID | Risco | Severidade | Probabilidade | Mitigacao | Trigger de acao |
|----|-------|------------|---------------|-----------|-----------------|
| R-UX-001 | Contrato tecnico nao refletir ordem causal vs prioridade | alto | media | Definir no kickoff da arquitetura | divergencia entre desenho e execucao |
| R-UX-002 | Replay sem fences tecnicos causar efeitos tardios | alto | media | TTL por intent + revalidacao de versao | side-effect em evento expirado |
| R-UX-003 | Safe mode sem criterio tecnico de retorno | alto | media | Definir requisitos de ACK + acao auditavel no backend | retorno sem trilha auditavel |

## 7) Pending Items and Next Steps
| Ordem | Acao | Dono | Criterio de pronto | Prazo |
|------:|------|------|--------------------|-------|
| 1 | Arquitetar contratos de evento por fluxo F-01..F-06 | Architect | contratos revisados | proxima sessao |
| 2 | Definir modelo tecnico de safe mode + retomada | Architect + DevOps | ADR e estados fechados | proxima sessao |
| 3 | Definir fences de replay | Architect + Backend | estrategia TTL/version pronta | proxima sessao |
| 4 | Mapear observabilidade por fluxo UX | Architect + QA | metricas/eventos minimos definidos | proxima sessao |

## 8) Quality and Validation
- Testes executados:
  - revisao funcional manual dos fluxos P0
- Resultado de checks:
  - nao aplicavel (artefato documental)
- Criterios de aceite validados:
  - Flow map P0 aprovado pelo PO
  - Wireframe spec P0 alinhada com regras congeladas
- Gaps:
  - Sem prototipo navegavel ainda

## 9) Instructions for Next Agent/LLM
- Leia primeiro:
  - `Docs/Phases/01-UX/UX_FLOW_MAP_P0_v1.md`
  - `Docs/Phases/01-UX/UX_WIREFRAME_SPEC_P0_v1.md`
  - `Docs/PRD/12_prd_koraos_mvp_v1.0.md`
  - `Docs/PRD/13_prd_review_blindspots_v1.3.md`
- Nao alterar sem alinhamento:
  - Regras congeladas de fila, SLA humano, D-1, guardians e fail-safe ACK
- Perguntas abertas:
  - Contrato final de ordenacao causal vs prioridade
  - Politica tecnica de replay expirado
  - Criterio tecnico de saida de safe mode
- Ordem recomendada:
  1) Architecture
  2) Product consolidation
  3) PO sharding

## 10) References
- PRD:
  - `Docs/PRD/12_prd_koraos_mvp_v1.0.md`
- Review:
  - `Docs/PRD/13_prd_review_blindspots_v1.3.md`
- UX artifacts:
  - `Docs/Phases/01-UX/UX_FLOW_MAP_P0_v1.md`
  - `Docs/Phases/01-UX/UX_WIREFRAME_SPEC_P0_v1.md`
- Previous handoff:
  - `Docs/Handoffs/HANDOFF_2026-02-09_PHASE-00-PRD-CANONICAL_v1.md`
