# Atualizar o catálogo

Scripts usados para ler as revistas em PDF e gerar `produtos.js` e as fotos em `img/`.

1. Coloque as partes da revista de cada marca em `<pasta>/<marca>/pdf/p1.pdf`, `p2.pdf`...
2. `python3 extract.py <pasta>/<marca>` lê códigos, nomes, preços e posição das fotos.
3. `python3 build.py <pasta> <pasta do app>` junta tudo, recorta as fotos e grava `produtos.js`.

O `build.py` hoje lê as subpastas `rev` (Boticário) e `eud` (Eudora). Nome, WhatsApp e ciclo ficam no fim do `build.py` (ou direto no topo do `produtos.js`).
