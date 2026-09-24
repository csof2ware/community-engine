# Módulo 5 — Arquitetura Final, Apêndices e Runbook

Este e o mapa completo. Se voce chegar neste repo daqui a dois anos
(sem lembrar de nada), este modulo te reconstrói o contexto em uma
leitura. E tambem o encerramento do curso.

---

## 1. Arquitetura final

![Arquitetura do MintPass](../../assets/architecture.svg)

| Componente | Porta | Papel |
|---|---|---|
| API | 3000 | holders, stats, proofs, health, metrics |
| Signer | 3001 | assina claims EIP-712 (AUTHORITY_KEY) |
| Relayer | 3002 | paga o gas e envia tx (RELAYER_KEY) |
| Badge | 3003 | mint soulbound idempotente + fila serial |
| Worker | — | batches + fila de claims + indexer |
| Discord bot | — | fachada social + moderacao |
| Telegram bot | — | segunda fachada, mesma chain |
| Chain | 8545 | Hardhat (dev) / Amoy (testnet) |
| Graph | 8000 | subgraph airdrop-v2 |
| Redis | 6379 | progresso, links, nonces |
| Postgres | 5432 | estado do indexer |

Fluxo claim gasless: usuario pede -> Signer assina typed data com
nonce -> Relayer envia -> contrato confere assinatura e consome nonce
-> TransferSingle -> Graph indexa -> fachada mostra a tx.

Fluxo badge: mod aprova dia -> set em Redis -> ao bater 7/14/21 com
wallet vinculada -> badge service assina e minta (idempotente, fila
serial) -> bot concede cargo abaixo dele na hierarquia.

Fluxo batch: worker agrupa claims validados -> batchClaim -> N
TransferSingle em 1 tx -> indexer e Graph atualizam juntos.

---

## 2. Runbook consolidado

SUBIR TUDO
    docker compose up -d
    docker compose exec dev sh
    sh boot.sh
    nohup node backend/badge.js > /tmp/badge.log 2>&1 &
    cd backend/discord-bot && nohup node index.js > /tmp/bot.log 2>&1 &
    cd /app && nohup node backend/telegram-bot.js > /tmp/tg.log 2>&1 &

SAUDE
    wget -qO- http://localhost:3000/health
    wget -qO- http://localhost:3003/health
    pgrep -af "node backend"

REINICIAR UM SERVICO
    pkill -f "backend/server.js"
    nohup node backend/server.js > /tmp/server.log 2>&1 &

LOGS
    tail -f /tmp/server.log /tmp/bot.log /tmp/badge.log /tmp/tg.log

RESET COMPLETO (DEV)
    docker compose down -v
    sh boot.sh
    npx hardhat run scripts/setupBadges.js --network localhost
    (reset troca enderecos: regenere config.json e badges.json e
    reinicie os servicos)

---

## 3. Apêndice A — Cheatsheet de comandos essenciais

    curl localhost:3000/health          # saude geral com checks
    curl localhost:3000/config          # enderecos dos contratos
    curl localhost:3000/stats           # holders e total mintado
    curl localhost:3000/proof/0x...     # sua proof merkle
    npx hardhat test                    # 22 testes
    npx hardhat test --grep "Badge"     # so uma suite
    CLAIMANT=0x... BADGE_ID=7 npx hardhat run scripts/mintBadge.js --network localhost
    git log --oneline -10               # historia recente
    pgrep -af "node backend"            # quem esta vivo

---

## 4. Apêndice B — Variáveis de ambiente

| Variavel | Quem usa | Se faltar |
|---|---|---|
| DISCORD_TOKEN | bot Discord | bot nao sobe (fail-fast) |
| DISCORD_CLIENT_ID / GUILD_ID | bot Discord | comandos nao registram |
| TELEGRAM_TOKEN | bot Telegram | bot telegram nao sobe |
| AUTHORITY_KEY | signer + badge | assinatura impossivel |
| RELAYER_KEY | relayer + badge | tx nao vai |
| (demais) | compose/docker | ver .env.example |

Regra do projeto: servico nao sobe com variavel faltando — falhar
cedo e falhar barulhento.

---

## 5. Apêndice C — Glossário de uma linha

gasless: usuario assina off-chain, operador paga o gas.
EIP-712: assinatura de dados estruturados com dominio e tipos.
nonce: numero de uso unico que mata replay.
soulbound: token que nao se transfere (override de _update).
merkle root/proof: compromisso da lista + caminho de verificacao.
subgraph: indice consultavel de eventos da chain (The Graph).
indexer: processo que espelha a chain em banco relacional.
relayer: conta que paga gas em nome do usuario.
authority: conta que assina autorizacoes (nunca paga gas).
slash command: comando nativo do Discord com autocomplete.
deferReply: pacto dos 3 segundos — reconhece antes de trabalhar.
MCP: protocolo para agentes de IA chamarem tools do seu sistema.
RAG: resposta de LLM aumentada com dados reais recuperados.
branch protection: regra que transforma main em zona protegida.
allowlist: excecao assinada e documentada no caca-chaves.
testnet: rede publica de teste (Amoy) antes de mainnet.

---

## 6. Apêndice D — As 10 cicatrizes que mais ensinaram

| # | Incidente | Licao |
|---|---|---|
| 1 | "Expected token to be set" | dotenv le .env do CWD: path absoluto sempre |
| 2 | "A interacao falhou" (3s) | deferReply antes de trabalho pesado |
| 3 | Unknown interaction 10062 | interacao expirada se loga, nao se crasha |
| 4 | nonce too low / underpriced | uma conta relayer = fila serial + nonce explicito |
| 5 | Missing Permissions no cargo | bot so concede cargo abaixo dele |
| 6 | Cargo duplicado | nome de cargo e contrato: match exato |
| 7 | graph genesis hash zero | chain reiniciou = subgraph se re-deploya |
| 8 | HH308/HH305 | hardhat nao aceita posicionais: use env vars |
| 9 | Chave em script de teste | segredo em teste tambem e segredo |
| 10 | Paste comia cercas de codigo | blocos indentados e imagens SVG |

---

## 7. Graduação e o que vem depois

Voce terminou os 21 dias. Seu badge ouro e uma transacao: nao existe
cartorio que a desminta. O cargo no Discord e so o lembrete visual de
algo que ja e verdade na chain.

Roadmap MVP2 (quando quiser voltar):
- MCP server profundo + tutor agent em producao
- Amoy -> mainnet com auditoria externa
- CD de verdade (deploy automatico apos tag)
- App mobile (Expo) lendo o mesmo Graph
- Engine multi-comunidade: um motor, N servidores Discord/Telegram

---

Fim do curso 21 Dias On-Chain.
Construido ao vivo, quebrado ao vivo, documentado com as cicatrizes.
Se este material te economizou uma semana de bugs: plante uma
comunidade. E assim que o ecossistema anda.
