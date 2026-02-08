# Meta Prompt para Síntese de Múltiplos LLMs

## Instruções para o Gabriel (User)
1. Abra uma nova conversa no **Claude.ai** (ou no seu LLM mais forte).
2. Não precisa anexar todos os documentos do projeto novamente, a menos que queira (o contexto está nos outputs).
3. **Cole o prompt abaixo**.
4. Abaixo do prompt, cole os 5 outputs que você gerou, separando-os claramente (ex: "--- OUTPUT 1 ---", "--- OUTPUT 2 ---").

---

## 🤖 COPIE O PROMPT ABAIXO

```markdown
# Role & Objective
You are a Lead Solutions Architect responsible for consolidating a "Red Team" analysis report.
I have run a deep blind spot analysis for the KoraOS project using 5 different advanced LLMs. Each one provided a list of "10 Critical Blind Spots" with proposed solutions.

**Your goal is to synthesize these 5 reports (totaling ~50 potential points) into a single, definitive "Master Blind Spot Report" containing the Top 15 Most Critical Issues.**

# Instructions for Synthesis

1. **De-duplicate**:
   - If multiple LLMs identified the same issue (e.g., "Race condition in N8N" and "Parallel execution concurrency"), MERGE them into a single entry.
   - Keep the most descriptive title.

2. **Consolidate Solutions**:
   - If LLM A suggested "Use Redis Lock" and LLM B suggested "Use Optimistic Concurrency Control" for the same problem, list **BOTH** as "Solution Options".
   - Label them clearly (e.g., "Option A: Redis... | Option B: Optimistic...").

3. **Prioritize**:
   - Rank the final list by **Severity** (Data Loss > Security Breach > Operational Deadlock > UX Annoyance).
   - If an issue was mentioned by 3+ LLMs, mark it as **[HIGH CONFIDENCE]**.

4. **Filter Noise**:
   - Discard basic or generic advice (e.g., "Add unit tests", "monitor logs") unless it points to a specific broken logic in our architecture.
   - We focus on *logic gaps*, *race conditions*, *state machine failures*, and *security vulnerabilities*.

5. **Output Format**:
   Produce a clean Markdown report:

   ## 🚨 Top 15 Consolidated Blind Spots

   ### 1. [Title of Blind Spot] {[HIGH CONFIDENCE] if applicable}
   **The Risk**: Synthesized description of what goes wrong.
   **Why it matters**: The business/technical impact.
   **Proposed Solutions**:
   - **Approach A**: [Details from LLM X]
   - **Approach B**: [Details from LLM Y]
   *(Your recommendation on which is better and why)*

   ... (repeat for top 15)

   ## 📉 Discarded/Low Priority (Summary)
   - List issues you filtered out and why (e.g., "Already handled in v3.1", "Too generic").

---

# INPUTS TO ANALYZE

(Paste the 5 LLM outputs below this line)
```
