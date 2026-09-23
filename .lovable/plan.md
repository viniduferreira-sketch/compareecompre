# Categorias 3D e cabeçalho fixo

## Objetivo
Substituir somente as fotos dos sete atalhos por ilustrações 3D vetoriais consistentes e aprimorar o comportamento fixo do cabeçalho durante a rolagem.

## Alterações
- Criar sete componentes SVG inline, acessíveis e reutilizáveis: headphone, camiseta, poltrona, smartphone, controle, perfume e bola esportiva.
- Centralizar nome, termo de busca, ícone e estilo de destaque das categorias em uma única configuração tipada.
- Adaptar o card para aceitar um ícone ou, futuramente, um caminho de imagem transparente, mantendo o mesmo clique de busca existente.
- Aplicar fundos pastel discretos, borda e sombra atuais, animação de flutuação, elevação no desktop e feedback de toque no celular.
- Manter sete cards na mesma linha em telas grandes e rolagem horizontal com encaixe e prévia do próximo card em telas menores.
- Manter o cabeçalho fixo no topo, adicionando sombra somente após 8 px de rolagem e preservando busca, links e dimensões atuais.
- Definir margem segura de rolagem para seções e desativar movimentos quando o sistema solicitar animações reduzidas.

## Detalhes técnicos
- Os SVGs usarão gradientes, brilhos, sombras vetoriais e identificadores únicos para evitar conflitos quando renderizados juntos.
- O efeito translúcido usará apenas `backdrop-filter` padrão por meio das classes existentes.
- Como o cabeçalho já usa `sticky`, não será necessário reservar espaço adicional nem alterar o restante da página.

## Validação
- Conferir os sete ícones sem corte e com escala consistente em desktop e celular.
- Testar clique/toque em todas as categorias e confirmar as mesmas buscas atuais.
- Testar cabeçalho no topo e após rolagem, incluindo sombra, busca e navegação horizontal.
- Confirmar ausência de movimentos com `prefers-reduced-motion` e ausência de erros no navegador.
