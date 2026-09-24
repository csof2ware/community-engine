# Módulo 1 — Arco 1: Fundamentos (Dias 1-7)

Objetivo do arco: sair do zero e terminar com um claim gasless minerado
na sua chain local. Marco: badge bronze Day-7 · Initiate.

---

## Dia 1 — Subir o stack

O QUE FAZ
Sobe o engine local inteiro: chain Hardhat, Redis, Postgres, graph-node,
IPFS e o container dev com Node 22 + Hardhat.

COMO FAZ
docker compose orquestra os containers; boot.sh (dentro do dev) espera o
RPC aceitar conexoes, deploya os contratos base e grava config.json.
Nada se instala no host: a sala de aula eh o container.

COMANDOS FINAIS
    docker compose up -d
    docker compose exec dev sh
    sh boot.sh
    curl http://localhost:3000/health

SAIDA ESPERADA
    {"healthy":true,"checks":{"redis":"ok","postgres":"ok","rpc":"ok"}}

ERROS REAIS DA SAGA
Servicos gritavam "Expected token to be set" mesmo com .env existente.
Causa: dotenv procura .env no diretorio atual, e os servicos rodavam de
subpastas. Fix final: path absoluto em todo servico
(config com path.join(__dirname, '..', '.env')).

PROVA
/health com 3 oks + containers saudaveis. Mod aprova: /approve-day day:1

---

## Dia 2 — Primeiro contrato: AirdropToken (ERC1155)

O QUE FAZ
Token do curso: um id unico, mint restrito ao dono, URI de metadata
configuravel.

COMO FAZ
ERC1155 do OpenZeppelin com onlyOwner em mint e setURI. A suite testa
batch mint, airdrop multi-carteiras e bloqueio de estranhos.

COMANDOS FINAIS
    npx hardhat compile
    npx hardhat test --grep "AirdropToken"

SAIDA ESPERADA
Compiled 1 Solidity file successfully + testes passando
(batch, airdrop varias carteiras, bloqueio de estranhos)

ERROS REAIS DA SAGA
Sem incidente grave — mas a revisao do dia criou o teste "bloquear
estranhos": mint sem onlyOwner deixaria qualquer um emitir token.
A restricao entrou ANTES do deploy, nao depois do susto.

PROVA
Compile limpo + suite verde. Mod aprova: /approve-day day:2

---

## Dia 3 — Deploy local

O QUE FAZ
Contratos saem do compile e ganham endereco na chain local.

COMO FAZ
boot.sh roda os scripts de deploy em ordem (AirdropToken, MerkleAirdrop,
SignedAirdrop) e grava config.json, consumido pela API e pelos servicos.

COMANDOS FINAIS
    sh boot.sh
    curl http://localhost:3000/config

SAIDA ESPERADA
    {"airdropAddress":"0x...","root":"0x...","signedAddress":"0x..."}

ERROS REAIS DA SAGA
Passar argumento posicional em script (npx hardhat run x.js 0xabc)
quebra com HH308/HH305: o hardhat nao aceita posicionais livres.
Padrao final do projeto: argumentos via variavel de ambiente, ex.:
CLAIMANT=0x... BADGE_ID=7 npx hardhat run scripts/mintBadge.js --network localhost

PROVA
/config retorna 3 enderecos validos com codigo na chain.
Mod aprova: /approve-day day:3

---

## Dia 4 — Airdrop Merkle (allowlist justa)

O QUE FAZ
Lista de elegiveis com verificacao O(log n): so quem esta na arvore
consegue claimar, e o contrato guarda apenas a root.

COMO FAZ
Root gerada off-chain com folhas (address, amount); o aluno envia a
proof; mapping de claim bloqueia double-claim.

COMANDOS FINAIS
    curl http://localhost:3000/proof/0x<seu-endereco-minusculo>
    npx hardhat test --grep "Merkle"

SAIDA ESPERADA
Proof como array de bytes32 + 3 testes passando
(claim valido, duplo claim bloqueado, fora da lista bloqueado)

ERROS REAIS DA SAGA
Licao de construcao: endereco com maiusculas na folha quebra a proof —
a arvore foi normalizada para minusculas; por isso a API serve a proof
do endereco lowercase.

PROVA
GET /proof retorna sua proof; POST /claim a consome uma unica vez.
Mod aprova: /approve-day day:4

---

## Dia 5 — API com rate limit

O QUE FAZ
A cara HTTP do curso: /health /config /stats /holders /proof /metrics,
com antispam.

COMO FAZ
Express + limitador por IP; /metrics expoe contadores no estilo
Prometheus. Seis dos 22 testes do projeto cobrem exatamente este
contrato HTTP.

COMANDOS FINAIS
    curl http://localhost:3000/stats
    for i in $(seq 1 40); do curl -s -o /dev/null -w "%{http_code} " http://localhost:3000/health; done

SAIDA ESPERADA
    {"holders":"2","totalMinted":"12","lastBlock":"7"}
e uma sequencia de 200 que termina em 429 429 429

ERROS REAIS DA SAGA
Nenhum incidente — aqui o 429 EH o sucesso: prova de que o limitador
esta vivo antes de qualquer abuso real.

PROVA
/stats coerente com a chain; 429 aparece sob spam.
Mod aprova: /approve-day day:5

---

## Dia 6 — The Graph indexando a chain

O QUE FAZ
Indexador consultavel: quem segura quanto, com quantos transfers —
sem varrer blocos na mao.

COMO FAZ
O subgraph escuta TransferSingle do AirdropToken e mantem
holder { id, balance, transferCount }; graph-node serve GraphQL na :8000.

COMANDOS FINAIS
    curl -X POST http://graph-node:8000/subgraphs/name/airdrop-v2 -H 'Content-Type: application/json' -d '{"query":"{ holders(first: 5, orderBy: balance, orderDirection: desc) { id balance transferCount } }"}'

SAIDA ESPERADA
JSON com os holders reais (voce entre eles, balance > 0)

ERROS REAIS DA SAGA
Depois de um restart da chain, o graph-node logou "genesis hash zero"
e indexou nada: o indexador apontava para uma chain que nao existia
mais. Fix: re-deploy do subgraph com startBlock 0 contra a chain nova.

PROVA
A query retorna seu endereco com balance > 0.
Mod aprova: /approve-day day:6

---

## Dia 7 — Claim gasless EIP-712 (MARCO BRONZE)

O QUE FAZ
Usuario com ZERO ETH recebe token: assinatura off-chain, gas pago pelo
operador. A aula que define o produto.

COMO FAZ
Tres atores: Signer (:3001) guarda AUTHORITY_KEY e assina o typed data
Claim(claimant, amount, nonce); Relayer (:3002) guarda RELAYER_KEY e
envia SignedAirdrop.claim; o contrato recupera a assinatura, consome o
nonce (anti-replay) e minta. TransferSingle fecha o ciclo e o Graph
indexa.

COMANDOS FINAIS
    curl -X POST http://localhost:3001/sign -H 'Content-Type: application/json' -d '{"claimant":"0x<seu-endereco>","amount":"1"}'
    (copie o JSON retornado e entao:)
    curl -X POST http://localhost:3002/relay -H 'Content-Type: application/json' -d '<cole-o-json-aqui>'

SAIDA ESPERADA
    {"txHash":"0x...","blockNumber":N,"newBalance":"1"}

ERROS REAIS DA SAGA
(a) Replay da mesma assinatura morre no contrato com "nonce used" —
eh o sistema funcionando, nao bug.
(b) Duas txs do mesmo relayer quase juntas: "nonce too low /
replacement transaction underpriced". Fix: fila serial + nonce pending
explicito em todo servico que envia tx (padrao adotado no badge.js v2).

PROVA
TransferSingle para o seu endereco emitido pelo SignedAirdrop, gas pago
pelo relayer. Mod aprova: /approve-day day:7 -> BADGE BRONZE mintado
on-chain + cargo Day-7 · Initiate no Discord.

---

Fim do Arco 1. Voce agora eh Initiate: tem chain propria, API viva,
indexador consultavel e um claim gasless com seu nome na chain.
Proximo modulo: frontend, batches, testes, CI — a prata.
