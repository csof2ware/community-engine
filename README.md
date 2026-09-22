# 🏛️ MintPass · Community Engine

*Motor de comunidade on-chain gasless da Csoftware.* Distribui valor, reputação e credenciais educacionais verificáveis — rodando ao vivo no desafio [21-days-onchain](foundation/21-days-onchain/) e empacotado para qualquer comunidade Discord.

[![CI](https://github.com/csof2ware/community-engine/actions/workflows/ci.yml/badge.svg)](https://github.com/csof2ware/community-engine/actions/workflows/ci.yml)
![Tests](https://img.shields.io/badge/tests-22%20passing-brightgreen)
![Solidity](https://img.shields.io/badge/Solidity-0.8.24-blue)
![Node](https://img.shields.io/badge/Node-22-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

> Educação descentralizada com prova on-chain: cada conclusão de marco vira um badge soulbound auditável por qualquer pessoa, para sempre.

---

## 🎯 O problema que resolve

| Dor real | Solução no engine |
|---|---|
| Usuário sem ETH não consegue claimar | *Relayer gasless* — assinatura EIP-712 off-chain, tx paga pelo operador |
| Comunidade sem identidade on-chain | *Badges soulbound* ERC1155 não-transferíveis |
| Gamificação sem prova verificável | Progresso em Redis + *tx on-chain auditável* |
| Discord como único ponto de falha | Engine independente — Discord é fachada, o estado vive na chain |
| Replay de assinaturas | *Nonce único por claim* consumido no contrato |

## 🏗️ Arquitetura

        ┌──────────────────────────────────────────────┐
        │   DISCORD (fachada social)                   │
        │  /claim /balance /leaderboard /link          │
        │  /approve-day /myprogress /ping              │
        └───────────────────┬──────────────────────────┘
                            │
     ┌──────────┬───────────┼───────────┬──────────┐
     ▼          ▼           ▼           ▼          ▼
 ┌────────┐ ┌────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐
 │ API    │ │ Signer │ │ Relayer │ │ Badge   │ │ Worker │
 │ :3000  │ │ :3001  │ │ :3002   │ │ :3003   │ │ batch  │
 └───┬────┘ └───┬────┘ └───┬─────┘ └───┬─────┘ └───┬────┘
     │          │          │           │           │
     └──────────┴──────────┴─────┬────────────────┘
                                 ▼
                    ┌────────────────────────┐
                    │  Hardhat Chain :8545   │
                    │  AirdropToken (1155)   │
                    │  MerkleAirdrop         │
                    │  SignedAirdrop (712)   │
                    │  ChallengeBadge (SB)   │
                    └───────────┬────────────┘
                     ┌──────────┴──────────┐
                     ▼                     ▼
              ┌────────────┐        ┌────────────┐
              │ The Graph  │        │  Postgres  │
              │ analytics  │        │  + Redis   │
              └────────────┘        └────────────┘

*Fluxo do claim gasless:* usuário pede → Signer valida e assina (EIP-712 com nonce) → Relayer paga o gas e envia → contrato confere assinatura + nonce → TransferSingle → Graph indexa → Discord mostra embed com a tx.

*Fluxo do badge:* mod aprova dia no Discord → bot soma progresso (Redis) → ao bater 7/14/21 → Badge service assina e minta ERC1155 soulbound → bot concede cargo colorido no servidor.

## 🚀 Quickstart

    git clone https://github.com/csof2ware/community-engine.git
    cd community-engine
    cp .env.example .env        # edite com seus valores
    docker compose up -d
    docker compose exec dev sh
    sh boot.sh                  # chain, contratos, worker, API, signer, relayer

    curl http://localhost:3000/health
    # {"healthy":true,"checks":{"redis":"ok","postgres":"ok","rpc":"ok"}}

### Contratos (dev local)

| Contrato | Papel |
|---|---|
| AirdropToken | ERC1155 do airdrop (mint onlyOwner, URI configurável) |
| MerkleAirdrop | claim com prova Merkle, anti double-claim |
| SignedAirdrop | claim gasless EIP-712 + batchClaim (N claims, 1 tx) |
| ChallengeBadge | ERC1155 soulbound dos marcos 7/14/21 |
| EarlyAdopterNFT / ZKAirdrop | experimentos dos dias iniciais |

### API (:3000) — contrato documentado pelos testes

| Rota | Retorno |
|---|---|
| GET /health | healthy + checks (redis, postgres, rpc) |
| GET /config | airdropAddress, signedAddress, root |
| GET /stats | holders, totalMinted, lastBlock |
| GET /holders | lista de holders |
| GET /proof/:address | prova Merkle (404 se inexistente) |
| GET /metrics | métricas formato Prometheus |

## 🤖 Discord Bot

Comandos: /ping · /claim · /balance · /leaderboard · /link · /myprogress · /approve-day (mod).

Loop validado ao vivo: *mod aprova 7 dias → badge bronze mintado on-chain → cargo Day-7 · Initiate concedido automaticamente.*

## 🎖️ Badges Soulbound

| Marco | Badge | Cor no Discord |
|---|---|---|
| 7 dias | 🥉 Day-7 · Initiate | bronze |
| 14 dias | 🥈 Day-14 · Builder | prata |
| 21 dias | 🥇 Day-21 · On-Chain Master | ouro |

Não-transferíveis por design: credencial educacional não se compra, não se vende, não se empresta.

## 🧪 Testes

    npx hardhat test
    # 22 passing — 16 contratos + 6 API

Cobertura: batch mint, double-claim, replay EIP-712, assinatura inválida, soulbound, nullifier ZK, permissões onlyOwner e o contrato HTTP completo da API.

## 🛡️ Segurança & CI

- *Zero chaves versionadas* — .env fora do git; CI roda gitleaks em todo push/PR
- *Allowlist documentada* (.gitleaks.toml): apenas as 3 chaves públicas do Hardhat; qualquer outra chave = CI vermelho
- *Branch protection* na main: force push e delete bloqueados
- *EIP-712 com nonce* consumido on-chain (anti-replay)
- ⚠️ Chaves padrão são de desenvolvimento — *jamais* em produção

## 🗺️ Roadmap de módulos

| Módulo | Estado |
|---|---|
| MintPass (comunidade + educação) | ✅ MVP1 vivo |
| CondoDAO (condomínios) | 🔜 |
| AssetChain (ativos reais) | 🔜 |
| GreenLedger (energia) | 🔜 |

## 📚 Documentação

- [foundation/21-days-onchain/](foundation/21-days-onchain/) — as 21 missões do desafio (3 arcos)
- [CONTRIBUTING.md](CONTRIBUTING.md) — como contribuir
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) — conduta da comunidade
- docs/ (arquitetura profunda, modelo de ameaça, runbook) — em produção

## 🤝 Contribuindo

PRs bem-vindos: todo PR precisa passar no CI (secret-scan + build + 22 testes). Veja [CONTRIBUTING.md](CONTRIBUTING.md).

## 📄 Licença

MIT © Csoftware Studio

---

Construído ao vivo durante o desafio 21-days-onchain. Cada módulo deste repo foi ensinado, quebrado, consertado e validado em produção na comunidade MintPass Lab.
