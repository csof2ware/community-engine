# 21 Dias On-Chain
## Engenharia de Comunidades Web3 com Prova On-Chain

![Capa](../../assets/curso/capa.png)

MintPass Community Engine · v1.0.0-mintpass · Csoftware · 2026

---

## 1. O nome

- Curso: 21 Dias On-Chain
- Engine: MintPass Community Engine (repo community-engine)
- Comunidade: MintPass Lab (Discord + Telegram)
- Certificado: badge soulbound ERC1155 (bronze 7 / prata 14 / ouro 21)

## 2. O motivo

Educacao web3 tradicional entrega video e PDF. Nenhum dos dois prova
que o aluno construiu algo. Ao mesmo tempo:

| Dor do ecossistema | Resposta do engine |
|---|---|
| Aluno sem ETH nao consegue praticar airdrop/claim | Relayer gasless: assinatura EIP-712, tx paga pelo operador |
| Certificado de curso e falsificavel | Badge soulbound on-chain: auditavel por qualquer um, para sempre |
| Comunidade morre quando o Discord morre | Estado vive na chain; Discord e Telegram sao fachadas |
| Projetos nascem sem higiene de segredos | CI com gitleaks + allowlist documentada desde o dia 1 |

## 3. Os diferenciais

1. Prova on-chain por aula: cada missao termina em transacao verificavel
2. Badge soulbound: credencial que nao se compra, vende ou empresta
3. Gasless: barreira de entrada zero (sem ETH na carteira)
4. Sala de aula viva: mod aprova, bot minta, cargo cai no Discord
5. Saga real documentada: cada bug que derrubou a construcao virou
   linha de tabela neste material (aprende-se com cicatriz, nao com teoria)
6. Engine reutilizavel: qualquer comunidade deploya o mesmo motor
7. Multi-fachada desde o inicio: Discord e Telegram lendo a MESMA chain

## 4. Por que o metodo guiado gera entendimento real

- Execucao obrigatoria: nao se assiste, se roda (retrieval practice)
- Feedback imediato: cada comando tem saida esperada para conferir
- Erro produtivo: incidentes reais viram tabela de diagnostico
- Repeticao espacada: 21 dias, 3 arcos, marcos cumulativos 7/14/21
- Verificacao externa dupla: moderador humano + contrato na chain
- Portfolio como efeito colateral: repo publico, CI verde, txs e badges

## 5. Como usar este material

O loop de cada aula:

    LER (o que faz / como faz)
    -> RODAR (comandos finais atualizados)
    -> CONFERIR (saida esperada)
    -> PROVAR (proof on-chain / criterio de aprovacao)
    -> LOGAR (poste no canal dia-a-dia da sua comunidade)

Convencoes dos blocos:
- O QUE FAZ: o resultado observavel do passo
- COMO FAZ: o mecanismo por tras (contrato, servico, protocolo)
- COMANDOS FINAIS: a versao atualizada (v1.0.0-mintpass), nao o historico
- SAIDA ESPERADA: o que voce deve ver para avancar
- ERROS REAIS: o que quebrou na construcao original e como diagnosticar
- PROVA: como um moderador (ou a chain) valida seu dia

Pre-requisitos: Docker + WSL2 (ou Linux/mac), Git, conta Discord,
2-4h por dia. Tudo roda dentro do container dev; nada se instala no host.

## 6. Mapa da obra

| Modulo | Conteudo | Marco |
|---|---|---|
| 0 | Esta abertura | — |
| 1 | Arco 1 Fundamentos (dias 1-7) | Badge bronze |
| 2 | Arco 2 Infraestrutura (dias 8-14) | Badge prata |
| 3 | Arco 3 Produto (dias 15-21) | Badge ouro |
| 4 | Discord, GitHub Actions e seguranca | CI verde |
| 5 | Arquitetura final, apendices e runbook | Graduacao |

Nota de versao: todo comando deste material reflete o estado final
taggeado v1.0.0-mintpass. Tentativas intermediarias da construcao
aparecem apenas como licao nos blocos ERROS REAIS.
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
# Módulo 2 — Arco 2: Infraestrutura (Dias 8-14)

Objetivo do arco: transformar o brinquedo do Arco 1 em infraestrutura
de verdade: frontend vivo, batches eficientes, testes obrigatorios,
indexador duplo, observabilidade e CI caca-chaves.
Marco: badge prata Day-14 · Builder.

---

## Dia 8 — Frontend que le da chain, nao de mim

O QUE FAZ
Uma pagina que mostra os holders em tempo real e dispara o claim
gasless com um clique.

COMO FAZ
Polling: a cada poucos segundos a pagina refaz a query GraphQL no
subgraph; o botao de claim chama Signer e Relayer exatamente como o
Dia 7 — a UI eh so mais uma fachada do mesmo engine.

COMANDOS FINAIS
    cd frontend          # pasta do frontend do Dia 8 (ajuste o nome se o seu layout diferir)
    python3 -m http.server 8080
    # abra http://localhost:8080 no navegador

SAIDA ESPERADA
Lista de holders carregando sozinha; novo claim aparece sem F5.

ERROS REAIS DA SAGA
UI que mostra dado "do backend proprio" mente quando o indexador
atrasa. Decisao do projeto: a unica fonte da UI eh o Graph — se a chain
mudou, a tela muda.

PROVA
Pagina aberta ao lado do explorer: mesmo saldo, mesma hora.
Mod aprova: /approve-day day:8

---

## Dia 9 — Batch claims: N claims, 1 tx

O QUE FAZ
Dez alunos claimam pagando gas de UMA transacao.

COMO FAZ
SignedAirdrop.batchClaim itera assinaturas validas e minta em loop
dentro da mesma tx; o worker alimenta a fila que vira batch.

COMANDOS FINAIS
    npx hardhat test --grep "varias carteiras"

SAIDA ESPERADA
Teste "Deve fazer airdrop para varias carteiras em 1 tx" passando.

ERROS REAIS DA SAGA
Batch sem verificacao por item transforma um claim invalido em revert
total (todos pagam o erro de um). Padrao final: valida cada assinatura
antes de entrar no lote.

PROVA
Uma tx com multiplos TransferSingle no mesmo bloco.
Mod aprova: /approve-day day:9

---

## Dia 10 — Testes nao sao opcionais

O QUE FAZ
Suite automatizada que protege contratos E a API: 22 testes.

COMO FAZ
hardhat + mocha/chai para contratos; testes de API via fetch real com
skip elegante quando os servicos nao estao no ar (before com this.skip).

COMANDOS FINAIS
    npx hardhat test

SAIDA ESPERADA
    22 passing

ERROS REAIS DA SAGA
Primeira versao dos testes de API deu ECONNREFUSED e derrubou o CI em
maquina sem stack. Fix: antes de testar, o before() verifica /health;
sem servicos, os testes viram "pending" em vez de "failing".
Segunda versao falhou por suposicoes erradas de formato (/ok vs
/healthy, totalHolders vs holders) — os testes foram reescritos contra
o contrato REAL da API. Teste bom documenta a realidade.

PROVA
22 passing local + job build-test verde no GitHub.
Mod aprova: /approve-day day:10

---

## Dia 11 — Indexador Postgres (segunda opiniao)

O QUE FAZ
Os mesmos holders, agora em banco relacional: /stats bate com o Graph.

COMO FAZ
O indexer escuta os eventos da chain e escreve no Postgres; a API le do
banco. Duas fontes independentes = auditoria cruzada.

COMANDOS FINAIS
    curl http://localhost:3000/stats
    curl -X POST http://graph-node:8000/subgraphs/name/airdrop-v2 -H 'Content-Type: application/json' -d '{"query":"{ holders(first: 100) { id balance } }"}'

SAIDA ESPERADA
Mesmo numero de holders e total mintado nas duas saidas.

ERROS REAIS DA SAGA
Quando as duas fontes discordam, o bug eh seu amigo: foi assim que um
endereco maiusculo/minusculo no indice apareceu. Normalizou-se tudo
para lowercase.

PROVA
Conferencia manual das duas fontes sem divergencia.
Mod aprova: /approve-day day:11

---

## Dia 12 — Observabilidade: saber antes do usuario

O QUE FAZ
/health com checks por dependencia, /metrics com contadores, e logs
que sobrevivem ao terminal fechar.

COMO FAZ
/health testa redis, postgres e rpc de verdade (nao so "estou vivo");
/metrics expoe contadores estilo Prometheus; servicos rodam com nohup
gravando em /tmp/*.log.

COMANDOS FINAIS
    curl http://localhost:3000/health
    curl http://localhost:3000/metrics
    pgrep -af "node backend"
    tail -f /tmp/server.log

SAIDA ESPERADA
    {"healthy":true,"checks":{"redis":"ok","postgres":"ok","rpc":"ok"}}
lista de servicos vivos + log fluindo.

ERROS REAIS DA SAGA
Servico morria em silencio e so se descobria quando o usuario
reclamava. Padrao adotado: nohup + log nomeado + pgrep como rotina de
rounds; healthcheck com checks reais em vez de 200 fingido.

PROVA
Derrube um servico (pkill) e veja o check virar falha / o pgrep
esvaziar. Ressuba em seguida. Mod aprova: /approve-day day:12

---

## Dia 13 — Caca às chaves vazadas

O QUE FAZ
Garantia mecanica de que nenhuma chave privada entra no historico.

COMO FAZ
.env fora do git (.gitignore); job secret-scan roda gitleaks em todo o
historico a cada push; .gitleaks.toml com allowlist documentada contendo
APENAS as 3 chaves publicas do Hardhat — qualquer outra = CI vermelho.

COMANDOS FINAIS
    grep -rn "0xac09\|0x59c6\|0x5de4" backend/ || echo "LIMPO"
    cat .gitleaks.toml

SAIDA ESPERADA
    LIMPO
e a allowlist com as 3 chaves de dev comentadas como "proibidas em producao".

ERROS REAIS DA SAGA
A varredura manual achou uma chave hardcoded sobrevivendo num script de
teste antigo (vouchertest.js). Virou env var como todos os outros
servicos. Licao: segredo em arquivo de teste tambem eh segredo.

PROVA
grep LIMPO + job secret-scan verde no GitHub.
Mod aprova: /approve-day day:13

---

## Dia 14 — CI/CD: o porteiro do repo (MARCO PRATA)

O QUE FAZ
Todo push e todo PR passam por secret-scan + build + testes antes de
existirem como "pronto".

COMO FAZ
.github/workflows/ci.yml: job 1 roda gitleaks via docker no historico
completo; job 2 instala, compila e roda os 22 testes. Branch protection
na main bloqueia force push e delete.

COMANDOS FINAIS
    git push
    # acompanhe em: github.com/<seu-user>/<seu-repo>/actions

SAIDA ESPERADA
Run novo com secret-scan verde e build-test verde; badge de CI no
README brilhando.

ERROS REAIS DA SAGA
O historico antigo ainda continha as chaves de dev pre-FASE 0: gitleaks
com fetch-depth 0 ia reprovar tudo. Solucao honesta: allowlist
documentada das chaves PUBLICAS do hardhat — o scanner continua cego
apenas para elas e caca qualquer outra.

PROVA
Actions verde apos o push do dia. Mod aprova: /approve-day day:14 ->
BADGE PRATA mintado + cargo Day-14 · Builder no Discord.

---

Fim do Arco 2. Voce agora eh Builder: tem frontend vivo, batches,
suite obrigatoria, duas fontes de verdade, observabilidade e um
porteiro que nao dorme. Proximo modulo: produto — bot, badges,
MCP, tutor, testnet e go-live. Rumo ao ouro.
