# Refinar as imagens das categorias

## Objetivo
Eliminar as camadas claras empilhadas nos cards e garantir que a capa de Moda represente vestuário ou calçado.

## Alterações
- Fazer cada foto preencher toda a área superior do card, de borda a borda e sem espaçamento interno.
- Manter a imagem e o nome em áreas separadas; o nome ficará em uma faixa cinza sólida com texto escuro.
- Preservar cantos arredondados, dimensões, nomes e o comportamento atual de seleção das sete categorias.
- Para Moda, consultar o mesmo catálogo usando termos de vestuário/calçado e escolher uma oferta válida com imagem, evitando acessórios como chaveiros e pingentes.

## Detalhes técnicos
- O componente continuará recebendo capas dinâmicas do catálogo e acionando os mesmos termos de busca.
- A busca de capa terá uma consulta específica para Moda, sem alterar o índice, as categorias ou as rotas.

## Validação
- Conferir desktop e celular para garantir preenchimento da imagem, faixa cinza legível e cantos preservados.
- Confirmar que Moda mostra vestuário ou calçado e que todos os sete atalhos mantêm o comportamento atual.
