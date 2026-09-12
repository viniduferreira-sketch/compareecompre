# Sincronização automática diária do Algolia

## Objetivo
Atualizar automaticamente o índice `produtos_mercado_livre` todos os dias, sem depender de botão manual, e executar uma carga inicial imediatamente.

## Implementação
- Extrair a rotina de carga para um módulo exclusivo do servidor, reutilizável pela tarefa agendada e pela função existente.
- Criar um endereço interno protegido por segredo para disparar a sincronização de até 800 produtos.
- Configurar uma tarefa diária em horário de baixo movimento, com uma única execução por dia para reduzir o risco de atingir limites do Mercado Livre.
- Manter a paginação por categorias, o descarte de itens sem preço e o envio em lotes ao Algolia.
- Remover qualquer controle manual de sincronização da interface, caso exista.
- Registrar resultado e falhas no servidor sem expor credenciais.

## Carga inicial e validação
- Executar o mesmo processo uma vez imediatamente após configurar a automação.
- Confirmar que o endpoint rejeita chamadas sem o segredo correto.
- Confirmar a execução inicial e a quantidade efetivamente indexada.
- Verificar que a tarefa diária ficou ativa e apontando para o endereço estável do aplicativo.

## Detalhes técnicos
- A tarefa será executada diariamente às 04:00 UTC (01:00 em São Paulo), com atraso máximo de 24 horas entre atualizações.
- O endpoint ficará em `/api/public/hooks/sync-algolia` e validará o segredo rotativo já suportado pelo projeto.
- A configuração específica do endereço e do segredo ficará no backend, não em migrations nem no código entregue ao navegador.
