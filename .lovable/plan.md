# Perguntas reais por produto

## Objetivo
Substituir o conteúdo repetido da página de produto por perguntas e respostas reais do anúncio correspondente, mantendo um formato compatível com parceiros futuros.

## Sincronização diária
- Definir um tipo comum de pergunta com `question`, `answer`, `date` e `source`.
- Criar um adaptador isolado `fetchQA_MercadoLivre(itemId)` que consulta a API de perguntas v4 somente para IDs de anúncio no formato MLB.
- Durante a coleta de cada produto, usar o ID MLB da oferta escolhida para buscar as perguntas mais recentes.
- Salvar `qa` em cada registro do índice já usado pelo site; ausência de perguntas ou parceiro sem esse recurso produz `qa: []` sem interromper a sincronização.
- Limitar e ordenar os dados no momento da coleta para controlar o tamanho dos registros e o volume diário de chamadas.

## Página do produto
- Ler o registro correspondente diretamente do índice para obter o `qa` já sincronizado, sem consultar a API parceira durante a visita.
- Incorporar `qa` ao modelo de detalhes com sua origem preservada.
- Remover integralmente as perguntas estáticas.
- Exibir a seção somente quando houver perguntas reais, em acordeão, ordenadas da mais recente para a mais antiga, com data e resposta quando disponível.
- Gerar o JSON-LD de FAQ somente a partir de perguntas reais que possuam resposta; sem Q&A, não publicar esse bloco.

## Validação
- Confirmar que a sincronização grava `qa: []` e arrays preenchidos no mesmo formato.
- Validar uma página com perguntas e outra sem perguntas, incluindo a ausência do bloco inteiro no segundo caso.
- Confirmar que não restou texto estático repetido no código.

## Fora de escopo
Não unir opiniões de parceiros nem tentar identificar produtos equivalentes entre lojas nesta etapa.
