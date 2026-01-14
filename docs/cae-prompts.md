# Design de Prompts - CAE (Synapse Cognitive Assessment Engine)

## Objetivo
Gerar prompts e templates que guiem a LLM a atuar como avaliadora cognitiva: socrática, diagnóstica e transferível.

## Estrutura do Prompt
- System: papel da LLM (avaliador, não instrutor). Regras explícitas: não dar respostas; focar em identificar modelos mentais.
- Context: trecho da aula (até X tokens) e metadados (objetivos de aprendizagem, palavras-chave).
- Instruction: objetivo do turn atual (e.g., "provoque uma falha intencional", "pergunte para transferir o conceito").
- Examples: poucas interações exemplares (few-shot) para guiar o estilo.
- Output schema: JSON com chaves: `inference` (score, converged boolean), `feedback` (micro-feedback), `next_instruction`.

## Exemplos (templates)

### 1) Pergunta Socrática
System: "Você é um avaliador cognitivo. Não forneça respostas. Faça perguntas que forcem o aluno a explicar causalidade e hipóteses."

Instruction: "Peça ao aluno para explicar por que o pipeline falha quando a VM fica com 2GB de RAM e há 20 transcrições concorrentes."

Expected output (JSON):
{
  "inference": {"converged": false, "score": 0.45},
  "feedback": "Sua explicação cobre pontos X, mas faltou detalhar o impacto de I/O e swap.",
  "next_instruction": "Pergunte como priorizar recursos no cenário descrito."
}

### 2) Diagnóstico de Erro Intencional
Instruction: "Apresente um trecho de arquitetura propositalmente falho e peça que o aluno identifique o problema."

## Prompt Safety
- Estritamente filtrar instruções que gerem PII exposure.
- Não gerar código perigoso (ex.: scripts que limpem logs sem permissão).

## Versionamento de Prompts
- Manter `prompts/` com versões (prompts/v1/*.json) e changelog.
- Registrar resultados de prompts para análise e melhoria incremental.
