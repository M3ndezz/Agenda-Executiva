# Cards operacionais

Os seletores permanecem no topo. No VSPP, a foto de 120 × 150 px fica à esquerda dos campos Nome/CPF e Gênero/RG. Empresa e telefone do cadastro aparecem abaixo dos campos. RG é opcional, acompanha a seleção e é salvo na cópia da agenda; agendas antigas continuam com RG vazio.

No carro, foto de 180 × 120 px à esquerda dos dados editáveis. O tipo de transporte ocupa uma linha e origem/destino compartilham a próxima. O formulário manual mantém o espaço Sem foto. Em telas até 640 px, a foto fica acima dos campos.

Fotos usam object-fit contain, preservando a imagem inteira. Os resumos das listas de cadastros continuam com o desenho anterior. As ações permanecem no rodapé dos cards.

Verificação: sintaxe JavaScript e testes dos dois cadastros passaram; prévia visual indisponível nesta atualização.

## Fotos no preenchimento manual
O rodapé mostra Adicionar/Trocar/Remover foto à esquerda apenas no modo manual (veículos: somente Carro). As ações de remoção/reordenação ficam à direita. Fotos JPG/PNG/WebP de até 5 MB são reduzidas para até 480 px e copiadas para a agenda. Trocar a seleção descarta uma leitura pendente; não altera o cadastro central. Salvamento, navegação e relatório aguardam fotos em processamento. Testes: node tests/fotos-manuais.cjs. Conferência visual desta atualização ainda pendente.

As ações finais da operação têm Gerar relatório à esquerda, Salvar rascunho e Salvar dados operacionais à direita.

## Rodapés no celular
Até 640 px, as ações de foto ocupam uma linha alinhada; subir/descer trecho ficam em duas colunas e remover ocupa a largura abaixo. Remover contato foi movido para depois das observações e da orientação de deslocamento, com largura total no celular. Conferência visual no dispositivo permanece pendente.
