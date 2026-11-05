# Verificação da revisão de manutenção

- Sintaxe: todos os arquivos JavaScript aprovados pelo Node.
- Testes de regras: `node tests/regressao.cjs` aprovado.
- Compatibilidade: leitura e salvamento V2 preservam campos desconhecidos e metadados de anexos; cópia V1 mantém a chave antiga; falhas de leitura bloqueiam gravação.
- Integração: HTML real carregado em DOM simulado (LinkeDOM), todos os scripts inicializados, criação de agenda, resumo e histórico conferidos.
- Arquivos de anexos: código do IndexedDB mantido, com mudanças apenas de formatação; não houve migração dos blobs.
- Limite: esta revisão não incluiu navegador gráfico real nem teste visual/responsivo. O roteiro manual está em MANUTENCAO.md.
- Publicação: nenhuma alteração enviada ao site online.
