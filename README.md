Site gerado pelo ChatGPT Plus - GPT-6 Astra (Leve)

SUPER AGENDA — ETAPA 2 (PRIMEIRA VERSÃO)

Extraia o ZIP e abra portable/index.html. Não exige instalação.
Para atualizar, substitua os arquivos dentro da mesma pasta usada anteriormente,
incluindo a pasta js inteira. Use o mesmo navegador e perfil: os cadastros ficam
no armazenamento desse navegador, não dentro do ZIP. Não apague os dados do site.

Fluxo: abra uma agenda > Preencher registros operacionais > Salvar rascunho
ou Salvar dados operacionais. Esta versão contempla um local, uma empresa,
vários VSPPs e vários trechos de transporte por agenda. A conclusão será definida na Etapa 3.

Antecedência: 48 horas corridas entre a abertura e o início previsto.
Exatamente 48 horas atende ao mínimo. Menos de 48 horas gera aviso sem bloquear.
Data e hora de criação são registradas para novas agendas. Agendas antigas
sem essa informação exibem resultado desconhecido, sem inventar uma data.
O cálculo usa o horário local do computador. Edição do início recalcula a
antecedência com a data de criação original. Não é uma contagem regressiva.
O resultado fica no resumo e está preparado para o futuro painel de conclusão.

Endereço: Cidade/Município é um único campo; UF identifica o estado.
CEP e CPF têm validação local; não há consulta externa de cadastro.
O botão Google Maps envia somente o endereço ao Google, após o clique,
e precisa de internet. Não há mapa incorporado ativo nesta versão.
Integração automática ao lado exige configurar Google Maps Embed API,
chave restrita, conta Google Cloud e acesso permitido pela rede.
https://developers.google.com/maps/documentation/embed/get-started

Teste com dados fictícios. O armazenamento local atual não possui autenticação
nem sincronização entre computadores. Identidade visual sujeita à homologação.

EQUIPE E TRANSPORTE POR TRECHOS
Use Adicionar VSPP para cadastrar profissionais da mesma empresa contratada.
Cada profissional tem nome, CPF e gênero próprios. CPF repetido na equipe
é rejeitado ao salvar os dados completos; rascunhos aceitam dados incompletos.
Use Adicionar trecho / veículo para cada carro, helicóptero ou voo utilizado.
Origem e destino são opcionais e ajudam a distinguir as etapas da viagem.
Tipos diferentes identificam o transporte como Híbrido automaticamente.
Dois carros podem ser cadastrados com placas e dados distintos em dois trechos.
Subir/Descer trecho altera a ordem da viagem. Remover exclui apenas o bloco
selecionado do formulário; salve para confirmar a alteração na agenda.
Cadastros antigos são abertos como VSPP 1 e Trecho 1, mantendo os dados.

CONTATOS IMPORTANTES
Na Etapa 2, adicione quantas unidades médicas, policiais/similares ou outros
contatos forem necessários. Outros contatos recebem um título próprio.
Nome e categoria são obrigatórios para cada contato adicionado; em Outro,
o título também é obrigatório. Telefone, ramal, pessoa/setor, endereço,
tempo de deslocamento, atendimento e observações são opcionais.
O tempo é informado manualmente em minutos a partir do local do evento;
não consulta trânsito nem estima rotas automaticamente. Os contatos ficam
salvos na agenda e aparecem agrupados no resumo. Rascunhos podem estar
incompletos. Agendas anteriores continuam válidas sem contatos cadastrados.
Os nomes e telefones da referência não foram importados automaticamente.

FOTOS E ANEXOS
Adicione vários arquivos na Etapa 2. Cada um tem título (preenchido inicialmente
com o nome do arquivo) e observação. Mover antes/depois organiza a sequência.
Fotos JPG/JPEG, PNG, WebP e GIF têm miniatura e ampliação. Também aceita PDF,
Word, Excel, TXT e arquivos de e-mail EML/MSG. Documentos e e-mails são baixados
como originais para abrir em aplicativo compatível, sem visualização interna
nem carregamento de conteúdo remoto de e-mails. Não se conecta ao Outlook.
Limites: 10 MB por arquivo e 50 MB por agenda, sujeitos ao espaço do navegador.
Salve o rascunho ou os dados operacionais para guardar os anexos.
Os arquivos ficam no IndexedDB local; a descrição e o vínculo ficam junto
à agenda. Não há envio a servidor, sincronização ou inclusão dos seus anexos
neste ZIP. Mantenha os originais como cópia. Use a mesma pasta, navegador e
perfil ao atualizar. Limpar dados do navegador pode apagar agendas e anexos.
Remover do formulário só altera o cadastro após salvar. Cancelar mantém os
anexos do último salvamento. Falhas de gravação preservam o cadastro anterior.
