# Módulo 3 — Arco 3: Produto (Dias 15-21)

Objetivo do arco: transformar infraestrutura em produto. O engine ganha
fachada social (Discord bot), credenciais eternas (badges soulbound),
agentes inteligentes (MCP + tutor) e sai do quarto (testnet pública).
Marco: badge ouro Day-21 · On-Chain Master.

---

## Dia 15 — Discord bot v1 (fachada social)

O QUE FAZ
O engine ganha interface humana: comandos no Discord pra claim, saldo,
ranking e link de wallet.

COMO FAZ
discord.js + slash commands: /claim chama Signer+Relayer; /balance lê
do Graph; /leaderboard ordena holders; /link vincula wallet ao Discord
(pro Redis). O bot é mais uma fachada do mesmo engine.

COMANDOS FINAIS
    cd backend/discord-bot
    nohup node index.js > /tmp/bot.log 2>&1 &
    tail -5 /tmp/bot.log

SAIDA ESPERADA
    [bot] comandos: /ping /claim /balance /leaderboard /link
    [bot] online como Mintpass#5874

ERROS REAIS DA SAGA
Primeira versao do bot usava i.reply() em handlers pesados (que faziam
fetch + tx on-chain). Discord exige resposta em 3s; o bot morria com
"A interação falhou". Fix: deferReply() ANTES do trabalho pesado,
editReply() no final. Padrao adotado em todos os comandos assincronos.

PROVA
/claim no Discord retorna embed com tx hash + saldo + bloco.
Mod aprova: /approve-day day:15

---

## Dia 16 — Badges soulbound (credencial eterna)

O QUE FAZ
Tres marcos educacionais que nao se compram, vendem ou emprestam:
bronze (7 dias), prata (14), ouro (21).

COMO FAZ
ChallengeBadge.sol: ERC1155 com override de _update que bloqueia
transferencia entre usuarios (from != 0 e to != 0 revertem). EIP-712
com nonce: authority assina, relayer envia, contrato consome o nonce
e minta. Badge service (:3003) idempotente: se o badge ja existe,
retorna already-minted sem nova tx.

COMANDOS FINAIS
    npx hardhat compile
    npx hardhat test --grep "ChallengeBadge"
    nohup node backend/badge.js > /tmp/badge.log 2>&1 &

SAIDA ESPERADA
    6 testes passando (mint valido, assinatura errada, replay, badges 7/14/21,
    soulbound, emissao continua)
e Badge service v2 no ar: http://localhost:3003

ERROS REAIS DA SAGA
(a) Badge 7 mintado duas vezes: o relayer bateu em "nonce too low"
porque duas txs quase simultaneas do mesmo relayer. Fix: fila serial
no badge.js v2 (uma tx por vez) + nonce pending explicito.
(b) Bot nao concedia cargo: hierarquia de cargos no Discord exige que
o bot esteja ACIMA dos cargos que concede. Reordenar: Mintpass (topo)
> Bot > Mod > Day-7 > Day-14 > Day-21.

PROVA
testSoulbound.js passa (transferencia revertida). Mod aprova 7 dias
-> /approve-day day:7 -> badge bronze mintado on-chain + cargo
Day-7 · Initiate no Discord. Mod aprova: /approve-day day:16

---

## Dia 17 — MCP server v0 (agentes conversando com a chain)

O QUE FAZ
Agentes de IA (Claude, GPT) podem consultar seu engine como se fosse
uma tool nativa: get_stats, query_holders.

COMO FAZ
Model Context Protocol: servidor HTTP expoe tools padronizadas; o
agente descobre capacidades via /mcp/tools e chama via /mcp/call. O
MCP server apenas delega pras APIs existentes (Graph, /stats, /holders).

COMANDOS FINAIS
    cat backend/mcp-server.js  # (se existir no seu layout)
    curl http://localhost:3004/mcp/tools

SAIDA ESPERADA
Lista de tools disponiveis: get_stats, query_holders, get_badge_balance

ERROS REAIS DA SAGA
Primeira versao retornava dados crus (JSON gigante); agente perdia
contexto. Fix: MCP server formata respostas em markdown legivel antes
de devolver. Agente agora cita "Voce tem 12 tokens" em vez de
"balance: 12000000000000000000".

PROVA
Agente responde pergunta sobre seu saldo citando o numero correto.
Mod aprova: /approve-day day:17

---

## Dia 18 — Tutor agent RAG (cita seu progresso)

O QUE FAZ
Um tutor que responde duvidas do desafio citando SEU progresso on-chain:
"Voce ja completou o Dia 7, entao pode pular a parte do claim gasless".

COMO FAZ
RAG (Retrieval-Augmented Generation): tutor busca contexto relevante
(seus badges, dias aprovados, saldo) e injeta no prompt do LLM. O LLM
responde com contexto personalizado, nao generico.

COMANDOS FINAIS
    curl -X POST http://localhost:3005/tutor -H 'Content-Type: application/json' -d '{"question":"ja posso fazer o batch claim?","wallet":"0x..."}'

SAIDA ESPERADA
Resposta citando seu progresso: "Voce tem o badge bronze (Dia 7), mas
ainda nao completou o Dia 9 (batch claims). Complete primeiro."

ERROS REAIS DA SAGA
Tutor sem contexto respondia genericamente ("voce pode fazer batch
claim se ja tiver o Dia 9"). Com RAG, ele checa SEUS dados e diz
"voce AINDA nao tem". Personalizacao exige dados, nao so prompt.

PROVA
Tutor responde pergunta sobre SEU progresso com dados reais.
Mod aprova: /approve-day day:18

---

## Dia 19 — Testnet Amoy (saindo do quarto)

O QUE FAZ
Contratos deployados em rede publica (Polygon Amoy testnet); explorer
verifica o codigo fonte.

COMO FAZ
Hardhat config com network amoy (RPC publico); deploy via
npx hardhat run scripts/deploy.js --network amoy; verificacao no
Polygonscan via hardhat-verify.

COMANDOS FINAIS
    npx hardhat run scripts/deploy.js --network amoy
    npx hardhat verify --network amoy 0x<endereco-do-contrato>

SAIDA ESPERADA
Contrato verificado publicamente no Polygonscan (aba "Contract" com
codigo fonte legivel).

ERROS REAIS DA SAGA
(a) Chave do relayer sem funds na testnet: tx falha com "insufficient
funds for gas". Fix: faucet da Amoy (https://faucet.polygon.technology/)
+ monitoramento de saldo.
(b) Verificacao falha: constructor arguments nao batem. Fix:
hardhat-verify com --constructor-args arguments.js.

PROVA
Link do Polygonscan com contrato verificado. Mod aprova: /approve-day day:19

---

## Dia 20 — Documentar é respeitar o proximo

O QUE FAZ
README epico, docs profundos (arquitetura, seguranca, runbook),
CONTRIBUTING + CODE_OF_CONDUCT, issue templates.

COMO FAZ
README com diagrama SVG versionado (nao ASCII que quebra no paste);
docs/arquitetura.md com fluxos EIP-712 e soulbound; docs/seguranca.md
com modelo de ameaca; docs/runbook.md com incidentes reais da saga
(cada bug que derrubou virou linha de tabela).

COMANDOS FINAIS
    ls docs/
    cat docs/arquitetura.md | head -20

SAIDA ESPERADA
Pasta docs/ com arquitetura.md, seguranca.md, runbook.md; README.md
com badges de CI e diagrama SVG renderizado.

ERROS REAIS DA SAGA
Diagrama ASCII no README quebrava quando alguem colava em editor com
fonte nao-monoespacada. Fix: assets/architecture.svg (imagem SVG
versionada como codigo, nítida em qualquer tema). Paste de blocos de
codigo com cercas ``` colapsava em uma linha. Fix: blocos indentados
com 4 espacos (imune a paste que come cercas).

PROVA
Repo com README renderizado + pasta docs/ completa. Mod aprova: /approve-day day:20

---

## Dia 21 — Go-live (MARCO OURO)

O QUE FAZ
Comunidade real claima; batch minerado em testnet; graduacao do
primeiro On-Chain Master.

COMO FAZ
Batch de claims reais (N alunos, 1 tx) na testnet Amoy; badges ouro
mintados; Hall da Fama no Discord com os graduados; press release +
post de lancamento.

COMANDOS FINAIS
    curl -X POST http://localhost:3002/batch -H 'Content-Type: application/json' -d '{"claims":[...]}'
    # (batch real com multiplos claims)

SAIDA ESPERADA
Tx de batch minerada com multiplos TransferSingle; badges ouro
mintados para os graduados.

ERROS REAIS DA SAGA
Batch grande (50+ claims) falha com "out of gas". Fix: gasLimit
explicito no batch + monitoramento de gas por claim (deve ser <100k
gas por claim no batch).

PROVA
Batch real com multiplos holders na testnet; badge ouro Day-21 ·
On-Chain Master mintado; cargo concedido; nome no Hall da Fama.
Voce agora eh On-Chain Master.

---

Fim do Arco 3. Voce agora eh On-Chain Master: tem engine vivo,
fachadas sociais, credenciais eternas, agentes inteligentes, deploy
publico e documentacao profissional. O curso termina aqui — mas o
engine continua. Proximo modulo: Discord profundo, GitHub Actions e
seguranca consolidada.
