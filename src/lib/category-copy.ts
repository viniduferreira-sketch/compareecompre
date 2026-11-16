// Textos editoriais aprovados para páginas de categoria e /ofertas. Links no formato [texto](/caminho).
export type CategoryCopy = { introduction: string; more: string; checklistTitle: string; checklist: string[]; checklistNote: string | null; faq: { question: string; answer: string }[] };
export const CATEGORY_COPY: Record<string, CategoryCopy> = {
 "eletronicos": {
  "introduction": "Compare TVs, notebooks, monitores, fones de ouvido, caixas de som, periféricos e componentes de computador de lojas parceiras como KaBuM, LG e Mercado Livre, com os preços lado a lado. Use os filtros de marca e loja, ordene por menor preço ou por popularidade e abra a página da loja para ver o valor final antes de comprar.",
  "more": "Eletrônicos têm muitas versões parecidas do mesmo produto, e uma letra a mais no código do modelo pode indicar outro tamanho de tela, outro processador ou outro ano de lançamento. Por isso, compare sempre o código completo do modelo, e não só o nome. Preço, estoque e frete são definidos pelas lojas e podem mudar, então confirme tudo na página da loja.",
  "checklistTitle": "O que observar antes de comprar",
  "checklist": [
   "Código completo do modelo. Anote o código da ficha técnica e compare com o do anúncio em outra loja. Nomes parecidos podem esconder versões diferentes.",
   "Garantia e nota fiscal. Além da garantia do fabricante, o Código de Defesa do Consumidor dá 90 dias para reclamar de defeito em produto durável, contados da entrega. Guarde a nota fiscal.",
   "Homologação da Anatel. Aparelhos com Bluetooth, Wi-Fi ou outro sinal de rádio precisam de homologação. Procure o número na ficha técnica ou na embalagem.",
   "Voltagem. Confira se o aparelho é bivolt ou de voltagem fixa e se o plugue serve na sua tomada.",
   "Quem vende e quem entrega. Em loja oficial, o vendedor é a marca ou o varejista. Em marketplace, o vendedor pode ser um terceiro, então veja a reputação e a política de devolução.",
   "Custo total. Some frete e parcelas ao preço antes de comparar lojas."
  ],
  "checklistNote": "Se ainda não escolheu o modelo, veja os guias de [smart TV](/blog/como-escolher-smart-tv), [notebook](/blog/como-escolher-notebook-custo-beneficio), [monitor](/blog/como-escolher-monitor) e [fone de ouvido](/blog/como-escolher-fone-de-ouvido).",
  "faq": [
   {
    "question": "Como saber se o desconto de um eletrônico é real?",
    "answer": "Compare o preço entre lojas e com o menor valor que o produto teve nas últimas semanas. O histórico que mostramos em algumas páginas de produto começou a ser registrado em novembro de 2026 e ainda é curto, então anote os preços você mesmo. O passo a passo está em [Como saber se o desconto é real](/blog/como-saber-se-o-desconto-e-real)."
   },
   {
    "question": "Qual a garantia de um eletrônico comprado online?",
    "answer": "O Código de Defesa do Consumidor prevê 90 dias para reclamar de defeitos em produtos duráveis, contados da entrega (art. 26), e muitos fabricantes oferecem garantia adicional. Guarde a nota fiscal e o termo de garantia."
   },
   {
    "question": "Todo eletrônico com Bluetooth ou Wi-Fi precisa de homologação da Anatel?",
    "answer": "Sim. Aparelhos que emitem radiofrequência precisam ser homologados pela Anatel para serem vendidos no Brasil. Procure o selo ou o número de homologação na ficha técnica ou na embalagem. Se a loja não mostra, pergunte antes de comprar."
   },
   {
    "question": "Posso devolver um eletrônico se me arrepender da compra?",
    "answer": "Em compras pela internet, o Código de Defesa do Consumidor permite desistir em até 7 dias corridos após o recebimento (art. 49), com reembolso. Siga o procedimento indicado pela loja e guarde os comprovantes."
   },
   {
    "question": "Qual a diferença entre comprar na loja oficial e no marketplace?",
    "answer": "Na loja oficial, quem vende é a própria marca ou o varejista. No marketplace, o vendedor pode ser um terceiro. Veja quem vende e quem entrega, a reputação do vendedor e a política de devolução antes de pagar."
   }
  ]
 },
 "moda": {
  "introduction": "Compare tênis, roupas e acessórios de marcas esportivas e de moda, como adidas, Nike, Mizuno e Olympikus, em várias lojas, com os preços lado a lado. Filtre por marca, loja, tipo de produto e público, ordene pelo menor preço e confira o desconto em relação ao preço anterior informado pela loja.",
  "more": "Em moda, o erro mais comum é o tamanho. A numeração e a modelagem mudam de uma marca para outra, e até entre modelos da mesma marca, então use a tabela de medidas da loja, e não só o número que você costuma usar. Os preços e os descontos são informados pelas lojas e podem mudar, por isso confirme tudo na página da loja antes de comprar.",
  "checklistTitle": "O que observar antes de comprar",
  "checklist": [
   "Tamanho. Meça o comprimento do pé e compare com a tabela de medidas da marca. Para roupas, compare as medidas da peça com uma que já serve em você.",
   "Uso. Tênis de corrida, de treino e casuais têm propostas diferentes de amortecimento, peso e estabilidade. Escolha pelo uso principal.",
   "Modelagem e tecido. Veja a composição e a modelagem (justa, regular ou ampla) na descrição da peça.",
   "Preço anterior. O valor \"de\" é informado pela loja. Compare com modelos equivalentes e com outras lojas antes de decidir.",
   "Troca e devolução. Em compras online há 7 dias para desistir, a contar do recebimento (art. 49). A troca por outro tamanho segue a política da loja, então leia antes de comprar."
  ],
  "checklistNote": "Para escolher o modelo, veja [Nike ou adidas: como escolher tênis](/blog/nike-ou-adidas-como-escolher-tenis) e [como escolher tênis de corrida](/blog/como-escolher-tenis-de-corrida).",
  "faq": [
   {
    "question": "Como acertar o tamanho do tênis comprando online?",
    "answer": "Meça o comprimento do pé, compare com a tabela da marca e lembre que a numeração varia entre marcas e modelos. Se estiver entre dois tamanhos, veja se a descrição indica que o modelo calça menor ou maior. Antes de pagar, confira como a loja trata trocas."
   },
   {
    "question": "Posso trocar se não servir?",
    "answer": "Há dois caminhos. O direito de arrependimento permite desistir de compras online em até 7 dias após o recebimento (art. 49). A troca por outro tamanho depende da política da loja. Confira as regras na página da loja e guarde a nota fiscal."
   },
   {
    "question": "Por que o mesmo tênis aparece mais de uma vez?",
    "answer": "Algumas lojas cadastram cada tamanho ou cor como um produto separado. Nas lojas em que o agrupamento está ativo, reunimos os tamanhos e as cores do mesmo produto em um único cartão, sem misturar lojas diferentes."
   },
   {
    "question": "O desconto de uma peça é real?",
    "answer": "O percentual compara o preço atual com o preço anterior informado pela loja. Para ter mais segurança, compare com modelos equivalentes e com outras lojas, e veja o guia [Como saber se o desconto é real](/blog/como-saber-se-o-desconto-e-real)."
   }
  ]
 },
 "casa": {
  "introduction": "Reunimos eletroportáteis, utensílios de cozinha e itens para o lar de lojas parceiras como Brinox, Polishop e Mercado Livre, com os preços lado a lado. Use os filtros de marca e loja e ordene pelo menor preço.",
  "more": "Em eletroportáteis, dois modelos parecidos podem ter potência, capacidade e consumo bem diferentes, então confira voltagem, potência e capacidade na ficha técnica. Preço, estoque e frete são definidos pelas lojas e podem mudar. Itens grandes ou pesados costumam ter frete mais alto, por isso some o frete ao preço antes de comparar.",
  "checklistTitle": "O que observar antes de comprar",
  "checklist": [
   "Voltagem. Confira se o aparelho é 127 V (muitas vezes chamada de 110 V), 220 V ou bivolt. Ligar na tensão errada pode danificá-lo.",
   "Potência e capacidade. A potência é medida em watts e a capacidade, em litros ou em xícaras, conforme o produto. Maior nem sempre é melhor, porque ocupa mais espaço na bancada.",
   "Selo do Inmetro. Procure o selo de conformidade, que aparece em muitos eletrodomésticos e eletroportáteis, na embalagem ou na ficha técnica.",
   "Dimensões. Meça o espaço onde o produto vai ficar e compare com as medidas do anúncio.",
   "Assistência técnica e manual. Veja se há assistência autorizada na sua região e se o manual é em português."
  ],
  "checklistNote": "Para escolher o aparelho, veja os guias de [air fryer](/blog/como-escolher-air-fryer), [cafeteira](/blog/como-escolher-cafeteira), [batedeira](/blog/como-escolher-batedeira), [liquidificador](/blog/como-escolher-liquidificador), [panela elétrica de arroz](/blog/como-escolher-panela-eletrica-de-arroz) e [ventilador](/blog/como-escolher-ventilador).",
  "faq": [
   {
    "question": "O que acontece se eu ligar o aparelho na voltagem errada?",
    "answer": "Pode danificar o aparelho, e o fabricante pode negar a garantia nesse caso. Confira a voltagem na ficha técnica e na etiqueta do produto antes de ligar."
   },
   {
    "question": "Como comparar potência e capacidade entre dois modelos?",
    "answer": "Compare os mesmos itens nos dois anúncios: potência em watts, capacidade e dimensões. Uma potência maior pode aquecer mais rápido, e uma capacidade maior serve a mais pessoas, mas ocupa mais espaço."
   },
   {
    "question": "O produto chegou com defeito. O que fazer?",
    "answer": "Segundo a cartilha da Senacon, nos primeiros 7 dias de uma compra online é possível desistir. Depois disso, o fornecedor tem 30 dias para consertar e, se não conseguir, você pode escolher entre a troca, a devolução do dinheiro ou o abatimento do preço (art. 18). Guarde a nota fiscal e os protocolos."
   },
   {
    "question": "Qual a diferença entre a garantia legal e a do fabricante?",
    "answer": "A garantia legal é a prevista no Código de Defesa do Consumidor: 90 dias para reclamar de defeito em produto durável (art. 26). A garantia do fabricante é complementar e vale pelo prazo do termo de garantia que acompanha o produto."
   }
  ]
 },
 "celulares": {
  "introduction": "Compare celulares de várias faixas de preço em lojas parceiras como KaBuM e Mercado Livre, com os preços lado a lado. Filtre por marca e loja, ordene pelo menor preço e abra a página da loja para ver o valor final.",
  "more": "O mesmo celular costuma ter versões com armazenamento e memória diferentes, e a diferença de preço entre elas pode ser grande, então compare a mesma versão. Confira também o que acompanha na caixa, se o aparelho é novo ou recondicionado, a homologação da Anatel e a garantia no Brasil. Preço, estoque e frete são definidos pelas lojas e podem mudar.",
  "checklistTitle": "O que observar antes de comprar",
  "checklist": [
   "Armazenamento e memória. O armazenamento guarda fotos, vídeos e aplicativos, e a memória RAM ajuda no desempenho. Os dois aparecem no nome da versão.",
   "Tela e bateria. Veja o tamanho e o tipo da tela e a capacidade da bateria, em mAh, que ajuda a comparar modelos de tamanho parecido.",
   "Atualizações. Quando o fabricante informar, confira por quanto tempo o modelo recebe atualizações de sistema.",
   "Homologação da Anatel. Procure o número na caixa ou no anúncio e consulte na página da Anatel.",
   "Novo ou recondicionado. Leia o título e a descrição para saber o estado do aparelho.",
   "Garantia no Brasil. Pergunte se a garantia é do fabricante no país e guarde a nota fiscal."
  ],
  "checklistNote": "Para decidir entre modelos, veja [como escolher celular com bom custo-benefício](/blog/como-escolher-celular-custo-beneficio) e [como escolher smartwatch](/blog/como-escolher-smartwatch).",
  "faq": [
   {
    "question": "Quanto armazenamento escolher?",
    "answer": "Depende do uso. Fotos, vídeos, jogos e muitos aplicativos ocupam espaço, e vários modelos não aceitam cartão de memória. Se você guarda muita coisa no aparelho, vale pagar por mais armazenamento em vez de depender só da nuvem."
   },
   {
    "question": "Como conferir a homologação da Anatel?",
    "answer": "Procure o número de homologação na caixa ou no anúncio e consulte na página da Anatel. Se a loja não informa, pergunte antes de comprar."
   },
   {
    "question": "O carregador vem na caixa?",
    "answer": "Depende do modelo e da marca. Confira a lista do que acompanha o aparelho no anúncio ou na ficha técnica e inclua no cálculo o custo de um carregador, se ele não vier."
   },
   {
    "question": "Vale comprar um celular de outro país?",
    "answer": "Pode custar menos, mas o aparelho pode não ter a homologação da Anatel nem a garantia no Brasil. Pergunte à loja antes de comprar."
   }
  ]
 },
 "games": {
  "introduction": "Encontre controles, acessórios, periféricos e itens para jogar, além de componentes para PC gamer, como placas de vídeo, em lojas parceiras como KaBuM e Mercado Livre, com os preços lado a lado. Filtre por marca e loja e ordene pelo menor preço.",
  "more": "Em games, a compatibilidade vem antes do preço. Um controle ou acessório feito para uma plataforma pode não funcionar em outra, e uma placa de vídeo precisa caber no gabinete e ter fonte de energia suficiente. Preço, estoque e frete são definidos pelas lojas e podem mudar.",
  "checklistTitle": "O que observar antes de comprar",
  "checklist": [
   "Plataforma e compatibilidade. Confira na ficha técnica com quais plataformas o produto funciona.",
   "Placa de vídeo. Veja a memória de vídeo, o tamanho físico, os conectores de energia e a potência de fonte indicada pelo fabricante.",
   "Monitor e taxa de atualização. A taxa, em Hz, só aparece na tela se a placa de vídeo entregar essa quantidade de quadros por segundo e se o monitor e o cabo suportarem.",
   "Conexão do controle. Veja se ele funciona por cabo, Bluetooth ou adaptador e se o adaptador vem na caixa.",
   "Estado ao receber. Placas de vídeo e periféricos são sensíveis, então confira o produto ao receber e guarde a embalagem enquanto estiver no prazo de desistência."
  ],
  "checklistNote": "Para escolher, veja os guias de [headset gamer](/blog/como-escolher-headset-gamer), [mouse gamer](/blog/como-escolher-mouse-gamer), [cadeira gamer](/blog/como-escolher-cadeira-gamer), [monitor](/blog/como-escolher-monitor) e [videogame console ou PC gamer](/blog/como-escolher-videogame-console-ou-pc-gamer).",
  "faq": [
   {
    "question": "Qual fonte preciso para uma placa de vídeo nova?",
    "answer": "Veja no site do fabricante da placa a potência de fonte recomendada e os conectores de energia necessários. Confira também se a placa cabe no seu gabinete."
   },
   {
    "question": "O que é taxa de atualização e preciso de 144 Hz?",
    "answer": "É quantas vezes por segundo a tela renova a imagem. Valores altos só fazem diferença se o jogo rodar com essa quantidade de quadros por segundo e se o monitor e o cabo suportarem."
   },
   {
    "question": "Este controle funciona no meu console ou no PC?",
    "answer": "Depende do modelo. Confira na ficha técnica as plataformas compatíveis e a forma de conexão, e pergunte à loja se houver dúvida."
   },
   {
    "question": "Vale esperar a Black Friday para comprar hardware?",
    "answer": "Depende do seu preço-teto. Se o produto já estiver no valor que você definiu, não há motivo para esperar. Veja o plano em [Como comprar na Black Friday 2026](/blog/como-comprar-na-black-friday-2026)."
   }
  ]
 },
 "beleza": {
  "introduction": "Compare maquiagem, perfumes, pincéis e aparelhos de cabelo, como secadores, pranchas e escovas, de lojas parceiras como Mercado Livre, PromoFarma e Amakha Paris, com os preços lado a lado. Filtre por loja, ordene pelo menor preço e abra a página da loja para ver o valor final.",
  "more": "Em cosméticos e perfumes, a validade, o lote e a identificação do fabricante importam tanto quanto o preço, e o Procon-SP orienta ler a embalagem para conferir essas informações. Preço, estoque e frete são definidos pelas lojas e podem mudar, então confirme tudo na página da loja antes de comprar.",
  "checklistTitle": "O que observar antes de comprar",
  "checklist": [
   "Validade e lote. Confira a data de validade e o lote na embalagem ou no anúncio quando a loja informar.",
   "Composição. Se você tem alergia a algum ingrediente, leia a composição antes de comprar.",
   "Preço por quantidade. Compare o preço por ml ou por grama, e não só o preço da embalagem, porque os tamanhos variam.",
   "Vendedor. Em perfumes e cosméticos, prefira loja oficial ou vendedor com boa reputação.",
   "Aparelhos de cabelo. Veja voltagem, potência e se há garantia e assistência técnica."
  ],
  "checklistNote": null,
  "faq": [
   {
    "question": "Como comparar o preço de produtos de tamanhos diferentes?",
    "answer": "Divida o preço pela quantidade (ml ou g) de cada embalagem. O menor preço por unidade mostra qual compensa mais, mesmo que a embalagem maior custe mais."
   },
   {
    "question": "Como saber se um perfume é original?",
    "answer": "Compre de loja oficial ou de vendedor com boa reputação, confira lote e fabricante na embalagem e desconfie de preço muito abaixo do praticado em outras lojas. A Senacon alerta que descontos muito acima da média podem indicar falsificação."
   },
   {
    "question": "Posso devolver um produto de beleza se me arrepender?",
    "answer": "Em compras pela internet há 7 dias para desistir, a contar do recebimento (art. 49). Confirme com a loja como fazer a devolução e guarde a nota fiscal e a embalagem original."
   },
   {
    "question": "Secadores e pranchas são bivolt?",
    "answer": "Muitos aparelhos de cabelo são bivolt, mas nem todos. Confira a voltagem na ficha técnica e na etiqueta antes de ligar."
   }
  ]
 },
 "esportes": {
  "introduction": "Compare tênis esportivos, roupas de treino, relógios esportivos e acessórios de lojas parceiras como Olympikus e Mercado Livre, com os preços lado a lado. Filtre por marca e loja, ordene pelo menor preço e confira o desconto em relação ao preço anterior informado pela loja.",
  "more": "Em esportes, o uso decide a escolha: um tênis, uma roupa ou um relógio feito para corrida pode não servir para outro treino. Confira o tamanho na tabela de medidas da loja e a descrição do produto. Os preços e os descontos são informados pelas lojas e podem mudar, por isso confirme tudo na página da loja antes de comprar.",
  "checklistTitle": "O que observar antes de comprar",
  "checklist": [
   "Atividade principal. Defina se o uso é corrida, caminhada, treino de academia ou esporte coletivo, e escolha o produto pensado para isso.",
   "Tamanho. Meça o pé e use a tabela da marca, porque a numeração varia entre modelos.",
   "Roupas de treino. Veja a composição do tecido e prefira peças leves e confortáveis para o movimento.",
   "Relógios esportivos. Confira GPS, bateria durante o uso do GPS, resistência à água e compatibilidade com o seu celular.",
   "Troca e devolução. Em compras online há 7 dias para desistir, a contar do recebimento (art. 49). A troca por outro tamanho segue a política da loja."
  ],
  "checklistNote": "Para escolher, veja [como escolher tênis de corrida](/blog/como-escolher-tenis-de-corrida), [Nike ou adidas](/blog/nike-ou-adidas-como-escolher-tenis) e [como escolher smartwatch](/blog/como-escolher-smartwatch).",
  "faq": [
   {
    "question": "Como escolher um tênis para corrida ou caminhada?",
    "answer": "Pense no uso, na frequência e no tipo de piso, e priorize o conforto ao calçar. Nosso guia [Como escolher tênis de corrida](/blog/como-escolher-tenis-de-corrida) detalha os critérios."
   },
   {
    "question": "Por que o mesmo tênis aparece várias vezes, uma para cada numeração?",
    "answer": "Algumas lojas cadastram cada tamanho como um produto separado. Nas lojas em que o agrupamento está ativo, reunimos os tamanhos e as cores do mesmo produto em um único cartão."
   },
   {
    "question": "O que conferir em um relógio esportivo com GPS?",
    "answer": "Veja a duração da bateria com o GPS ligado, a resistência à água, os sensores e se o relógio funciona com o seu celular. Veja também o guia de [smartwatch](/blog/como-escolher-smartwatch)."
   },
   {
    "question": "Nike ou adidas?",
    "answer": "Depende do modelo, do uso e do formato do seu pé. Veja a comparação em [Nike ou adidas: como escolher tênis](/blog/nike-ou-adidas-como-escolher-tenis)."
   }
  ]
 },
 "ofertas": {
  "introduction": "Aqui reunimos produtos que lojas parceiras estão vendendo com desconto em relação ao preço anterior que elas informam. Você pode filtrar por loja e categoria e ordenar por maior desconto, menor preço ou popularidade.",
  "more": "Desconto alto no anúncio não quer dizer boa compra. O percentual vem do preço anterior informado pela loja, então compare o preço final, com frete, com o de outras lojas e com o menor valor que você viu nas últimas semanas. Preço, estoque e frete mudam, e a compra é concluída na página da loja.",
  "checklistTitle": "Como usar esta página",
  "checklist": [
   "Filtre pela categoria que interessa para não comparar produtos diferentes.",
   "Abra a página da loja e confirme o preço final, o frete e o prazo de entrega.",
   "Veja os [cupons](/cupons) das lojas parceiras e leia as condições de cada um.",
   "Para saber se o desconto é verdadeiro, use o guia [Como saber se o desconto é real](/blog/como-saber-se-o-desconto-e-real).",
   "Antes da Black Friday, veja o plano em [Como comprar na Black Friday 2026](/blog/como-comprar-na-black-friday-2026)."
  ],
  "checklistNote": null,
  "faq": [
   {
    "question": "O que significa o percentual de desconto?",
    "answer": "É a diferença entre o preço atual e o preço anterior informado pela loja. Ele não prova que o produto estava mais caro de fato, então confirme comparando com outras lojas."
   },
   {
    "question": "Por que o preço na loja pode ser diferente do mostrado aqui?",
    "answer": "Atualizamos os preços periodicamente nas sincronizações com as lojas, e preço, estoque e frete podem mudar entre uma atualização e outra. O valor que vale é o da página da loja, no momento da compra."
   },
   {
    "question": "Como saber se uma oferta é boa?",
    "answer": "Some o frete ao preço, compare com outras lojas e com o menor valor que você anotou nas últimas semanas, e confira o modelo exato. O guia [Como saber se o desconto é real](/blog/como-saber-se-o-desconto-e-real) mostra o passo a passo."
   }
  ]
 }
};
export function stripCopyLinks(text: string) { return text.replace(/\[([^\]]+)\]\((\/[^)\s]*)\)/g, '$1'); }
export function copySegments(text: string) {
  const parts: ({ text: string; href?: string })[] = []; let last = 0;
  for (const m of text.matchAll(/\[([^\]]+)\]\((\/[^)\s]*)\)/g)) { if (m.index! > last) parts.push({ text: text.slice(last, m.index) }); parts.push({ text: m[1] ?? "", href: m[2] ?? "" }); last = m.index! + m[0].length; }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}
export function copyFaqHead(copy: CategoryCopy | undefined) {
  return copy?.faq.length ? [{ type: 'application/ld+json', children: JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: copy.faq.map(item => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: stripCopyLinks(item.answer) } })) }).replace(/</g, '\\u003c') }] : [];
}
export const OFFERS_COPY = CATEGORY_COPY["ofertas"] as CategoryCopy;
