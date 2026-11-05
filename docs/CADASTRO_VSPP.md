# Cadastro de VSPPs

A aba VSPPs possui ícone de capivara e 30 perfis fictícios da planilha fornecida.
Os dados são armazenados neste navegador. O site publicado não foi atualizado.

## Uso

1. Abra VSPPs, busque por nome, RE ou empresa e clique em Abrir ficha.
2. Os blocos da ficha podem ser expandidos. Nome é obrigatório. Gênero e empresa podem ser complementados.
3. Inclua foto JPG, PNG ou WebP de até 5 MB. Ela é reduzida antes de salvar.
4. Salve o cadastro. Para desativar, altere Situação para Inativo.
5. Na etapa operacional, busque e selecione um profissional. A foto e os dados básicos são preenchidos. A alternativa Preencher manualmente continua disponível.
6. Salve a operação normalmente. A agenda conserva a cópia dos dados e foto daquele momento. Alterações futuras no cadastro não reescrevem agendas.

## Dados de teste e campos

Os CPFs fictícios fornecidos não possuem dígitos verificadores válidos. A exceção está restrita aos perfis de demonstração reconhecidos por ID, nome e CPF. Cadastros manuais e novos registros importados mantêm a validação normal.
Não há fotos reais no arquivo: o retrato inicial mostra as iniciais. Gênero fica como Não informado, sem inferência pelo nome. Empresa fica em branco.
Campos ambíguos, como ASO IDADE e VENCIMENTO, conservam seus títulos até definição pelo gestor. Tempos de serviço e função são textos da origem, não cálculos atualizados.
CNV PDF é uma referência textual nesta versão; não carrega um PDF automaticamente.

## Importação e backup

Exportar cadastros gera JSON com fichas e fotos. Importar JSON aceita esse backup, uma lista de objetos ou a estrutura planilhas/registros. Exibe confirmação antes de atualizar por RE ou CPF. Duplicidades e conflitos são recusados.
Importação direta de Excel ainda não faz parte da interface. A planilha recebida foi convertida para os exemplos incluídos.
Exporte um backup após alterações importantes. Limpar dados do navegador remove os cadastros locais. Fotos também ocupam espaço; uma falha de gravação mantém o cadastro anterior.

## Manutenção

- js/vspp-exemplos.js: base sintética.
- js/cadastro-vspp.js: fichas, persistência, fotos e seleção.
- Chave local independente: apeVsppRegistryV1.
- equipe-transporte.js mantém os campos legados e acrescenta registryId, company, phone e photo na cópia da equipe.
- Nenhum dado das agendas é migrado ou excluído por esta funcionalidade.

## Atualização: exclusão e base inicial
A base inicial agora é vazia. Na abertura, exemplos antigos identificados pela marca de demonstração e pela combinação original de ID, RE, CPF e nome são removidos. Registros importados e exemplos cuja identificação foi alterada são preservados.
Cada cartão oferece Excluir VSPP, com confirmação. A exclusão altera somente o cadastro; as cópias já salvas nas agendas são mantidas. Se a gravação falhar, a lista anterior é preservada.
