/*
  CATÁLOGO DO MÊS
  ----------------
  Este arquivo é atualizado a cada nova revista.
  - "config": seus dados (nome e WhatsApp com DDI 55 + DDD + número, só dígitos).
  - "ciclos": o período de cada revista.
  - "produtos": um item por produto. Se "promo" estiver vazio (null), o produto
    aparece só no Catálogo completo, com o preço normal.
  - Ofertas com desconto a partir de "limiteImperdivel" (%) ganham o selo
    "Oferta imperdível" e o aviso para confirmar o estoque com a vendedora.

  ATENÇÃO: os produtos abaixo são EXEMPLOS para demonstrar o app.
  Eles serão trocados pelos produtos reais da revista.
*/
window.CATALOGO = {
  config: {
    nomeVendedora: "Diana Ribeiro",
    whatsapp: "5500000000000",
    limiteImperdivel: 40,
    exemplo: true
  },

  ciclos: {
    "Boticário": { nome: "Ciclo 17", validoAte: "2026-12-07" },
    "Natura":    { nome: "Ciclo 18", validoAte: "2026-12-10" },
    "Eudora":    { nome: "Ciclo 17", validoAte: "2026-12-07" },
    "Avon":      { nome: "Campanha 18", validoAte: "2026-12-12" }
  },

  produtos: [
    { codigo: "71520", marca: "Boticário", nome: "Malbec Desodorante Colônia 100 ml", categoria: "Perfumaria", preco: 229.90, promo: 129.90 },
    { codigo: "48223", marca: "Boticário", nome: "Lily Eau de Parfum 75 ml", categoria: "Perfumaria", preco: 289.90, promo: 199.90 },
    { codigo: "83011", marca: "Boticário", nome: "Nativa SPA Loção Hidratante Ameixa 400 ml", categoria: "Corpo e banho", preco: 74.90, promo: 39.90 },
    { codigo: "90412", marca: "Boticário", nome: "Make B. Base Matte 26 g", categoria: "Maquiagem", preco: 99.90, promo: 69.90 },
    { codigo: "62007", marca: "Boticário", nome: "Cuide-se Bem Sabonete Líquido 250 ml", categoria: "Corpo e banho", preco: 34.90, promo: null },
    { codigo: "55190", marca: "Boticário", nome: "Match Shampoo Força e Crescimento 250 ml", categoria: "Cabelos", preco: 49.90, promo: null },

    { codigo: "104512", marca: "Natura", nome: "Kaiak Clássico Masculino 100 ml", categoria: "Perfumaria", preco: 179.90, promo: 119.90 },
    { codigo: "91873", marca: "Natura", nome: "Ekos Castanha Polpa Hidratante 400 ml", categoria: "Corpo e banho", preco: 89.90, promo: 49.90 },
    { codigo: "88214", marca: "Natura", nome: "Tododia Sabonete em Barra 5 un.", categoria: "Corpo e banho", preco: 39.90, promo: 27.90 },
    { codigo: "73390", marca: "Natura", nome: "Chronos Sérum Antissinais 30 ml", categoria: "Rosto", preco: 149.90, promo: 104.90 },
    { codigo: "60125", marca: "Natura", nome: "Una Batom Matte 3,5 g", categoria: "Maquiagem", preco: 64.90, promo: null },
    { codigo: "51288", marca: "Natura", nome: "Lumina Condicionador 300 ml", categoria: "Cabelos", preco: 54.90, promo: null },

    { codigo: "50317", marca: "Eudora", nome: "Siàge Shampoo Cica Therapy 250 ml", categoria: "Cabelos", preco: 59.90, promo: 34.90 },
    { codigo: "47722", marca: "Eudora", nome: "Club 6 Voyage Desodorante Colônia 95 ml", categoria: "Perfumaria", preco: 199.90, promo: 139.90 },
    { codigo: "42091", marca: "Eudora", nome: "Niina Secrets Paleta de Sombras", categoria: "Maquiagem", preco: 89.90, promo: 44.90 },
    { codigo: "38810", marca: "Eudora", nome: "Instance Creme Hidratante Corporal 200 ml", categoria: "Corpo e banho", preco: 44.90, promo: null },

    { codigo: "1340-2", marca: "Avon", nome: "Renew Creme Facial Reversalist 50 g", categoria: "Rosto", preco: 109.90, promo: 59.90 },
    { codigo: "8823-1", marca: "Avon", nome: "Far Away Deo Parfum 50 ml", categoria: "Perfumaria", preco: 99.90, promo: 69.90 },
    { codigo: "5571-4", marca: "Avon", nome: "Power Stay Base Líquida 30 ml", categoria: "Maquiagem", preco: 59.90, promo: 41.90 },
    { codigo: "2210-9", marca: "Avon", nome: "Senses Sabonete Líquido 250 ml", categoria: "Corpo e banho", preco: 24.90, promo: null }
  ]
};
