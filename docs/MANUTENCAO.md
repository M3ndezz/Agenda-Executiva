# Manutenção da Assessoria e Proteção Executiva

Aplicação HTML/CSS/JavaScript sem instalação para o usuário. Abra `index.html`; mantenha as pastas `js` e `css` ao lado. Esta revisão é local e não foi publicada.

## Mapa dos arquivos

| Arquivo                 | Responsabilidade                                         |
| ----------------------- | -------------------------------------------------------- |
| index.html              | Estrutura, campos e ordem dos scripts                    |
| css/estilos.css         | Aparência e regras responsivas                           |
| js/aplicativo.js        | Coordenação das telas, abertura e registros operacionais |
| js/armazenamento.js     | Leitura, migração V1 e salvamento das agendas            |
| js/dominio.js           | Identificadores, data local e situação da agenda         |
| js/operacao.js          | Prazo de preparação, CPF e endereço                      |
| js/valores.js           | Conversão BRL e cálculo exato em centavos                |
| js/conclusao.js         | Formulário financeiro                                    |
| js/servico-conclusao.js | Preparação do registro financeiro e histórico            |
| js/resumo-conclusao.js  | Resumo financeiro e progresso das etapas                 |
| js/equipe-transporte.js | Profissionais e trechos                                  |
| js/contatos.js          | Contatos de apoio                                        |
| js/galeria.js           | Metadados e arquivos no IndexedDB                        |
| js/historico.js         | Eventos e apresentação da linha do tempo                 |
| js/relatorios.js        | Filtros, agregações e tela de relatórios                 |

Os scripts usam objetos globais e funções encapsuladas para continuar abrindo via `file://`. Não converter para módulos ES sem revisar essa compatibilidade. As regras compartilhadas carregam antes das telas; `aplicativo.js` é o último script.

## Regras

- `receivedDate` é a **Data de início da preparação**; `start` é a **Data da execução**. Os nomes internos são preservados para compatibilidade.
- Preparação: diferença entre datas de calendário, mínimo de 2 dias corridos. Horários não entram no cálculo. Sem data, mostrar não informado, nunca inventar.
- `end` e `startTime` são campos legados. Novos cadastros têm `end = start` e horário vazio. Registros antigos mantêm seus dados até uma edição. A classificação ainda respeita o período final legado.
- Situação: conclusão financeira completa tem precedência; depois, execução futura, período encerrado e em andamento.
- A visão geral conta conclusões pelo mês de `completedAt`; Relatórios filtra pelo dia de execução (`start`). São critérios diferentes e intencionais.
- Valores são inteiros em centavos. Vazio é `null`; zero é um valor informado. Rascunhos não entram no custo final nem na média.
- Uma agenda com vários protegidos conta uma vez, com seu custo integral, ao filtrar por um deles.
- Operação completa libera conclusão. Correções financeiras preservam a primeira data de conclusão.

## Dados e compatibilidade

`localStorage.superAgendaPrototypeV2` contém um array de agendas. Cada agenda guarda id, title, receivedDate, start, end, startTime, vips, notes, createdAt, leadTime, operation, conclusion, history e historyLegacy, quando presentes.

`operation` guarda fields, staff, legs, contacts, attachments, schemaVersion, status e updatedAt. `conclusion` guarda staffCents, transportCents, extras (title/amountCents), totalCents, notes, currency, status, completedAt e updatedAt. Histórico: at, title e changes.

A chave antiga `superAgendaPrototypeV1` contém uma agenda individual. A migração copia para V2 somente quando V2 não existe, preservando V1. Não altera datas nem descarta campos desconhecidos. Falha de leitura bloqueia novos salvamentos nessa sessão e deixa o conteúdo original intacto.

Fotos e arquivos ficam no IndexedDB `superAgendaAttachments`, object store `files`; o vínculo usa o ID do anexo e o da agenda. Não renomear banco, store, chaves ou IDs sem uma migração explícita. Os arquivos não estão no ZIP e não se transferem automaticamente entre navegadores, computadores ou endereço local e online.

Ao alterar o formato dos dados: criar migração aditiva, testar amostras antigas e preservar campos desconhecidos. Nunca usar limpeza do navegador como rotina de atualização. O usuário deve substituir os arquivos na mesma pasta e manter o mesmo navegador.

## Verificação

Execute `node tests/regressao.cjs` na pasta do projeto para verificar regras e compatibilidade de armazenamento. Node é necessário apenas para desenvolvimento, não para usar o aplicativo.

Antes de entregar, verificar no navegador: criar duas agendas e conferir IDs; editar e reabrir; salvar rascunho e operação completa; incluir/remover anexos; concluir e corrigir custos; consultar histórico; filtrar relatórios; recarregar; conferir celular e teclado. Testes de lógica não substituem a verificação visual.

## Limites atuais

Armazenamento local, sem sincronização ou autenticação própria. O histórico não é uma trilha de auditoria inviolável. O arquivo principal ainda coordena abertura e operações; essa divisão foi mantida para evitar uma reconstrução desnecessária. Identidade visual continua sujeita à validação interna do banco.
