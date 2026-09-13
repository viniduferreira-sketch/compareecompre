# Sincronização equilibrada por categorias

## Objetivo
Preencher o Algolia com pelo menos 100 ofertas válidas de cada categoria do menu principal: Eletrônicos, Moda, Casa, Celulares, Games, Beleza e Esportes.

## Implementação
- Substituir a busca geral por um loop independente sobre as sete categorias.
- Paginar cada categoria no Mercado Livre até reunir 100 produtos com preço válido, respeitando um limite seguro para evitar loop infinito.
- Eliminar preço nulo ou zero, remover duplicados e registrar no Algolia a categoria principal correta.
- Substituir o conteúdo anterior do índice por uma carga equilibrada, evitando sobras de categorias antigas.
- Retornar o total e a quantidade salva por categoria para facilitar a conferência.
- Manter a tarefa diária às 04:00 UTC, equivalente a 01:00 em São Paulo.

## Validação e carga imediata
- Confirmar que a função protegida continua rejeitando chamadas sem autorização.
- Executar a sincronização imediatamente após a atualização.
- Conferir no resultado da execução pelo menos 100 ofertas válidas em cada categoria e aproximadamente 700 no total.
