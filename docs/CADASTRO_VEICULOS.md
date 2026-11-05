# Cadastro de veículos

Módulo: `js/cadastro-veiculos.js`. Dados locais na chave `apeVehicleRegistryV1`, separados dos profissionais e agendas. Base inicial vazia.

Cadastro, busca por placa/marca/modelo/empresa, edição e exclusão com confirmação. Placa brasileira e ano são validados; placas duplicadas são rejeitadas ignorando hífen, espaços e caixa. Empresa e foto são opcionais. Fotos JPG/PNG/WebP de até 5 MB são reduzidas para no máximo 480 px e armazenadas como JPEG.

Nos registros operacionais, o seletor aparece somente em Carro. Mantém a alternativa Preencher manualmente e os campos editáveis. Cada trecho guarda os dados, `vehicleId` e `vehiclePhoto`, sem atualizar automaticamente agendas antigas. A opção “salvo nesta agenda” mantém a cópia histórica mesmo se o cadastro tiver sido editado ou excluído. Voos e helicópteros continuam com seus campos próprios.

Não há sincronização entre computadores nem publicação automática. Os dados de teste usados durante a verificação no navegador não fazem parte do ZIP.

Verificação: `node tests/cadastro-veiculos.cjs` cobre criação, validação, busca, seleção, preenchimento manual, serialização por tipo, histórico, exclusão/cancelamento e falhas de armazenamento. Cadastro, seleção, rascunho e reabertura também foram conferidos no navegador. Upload de foto e dimensões mobile precisam de validação visual adicional.
