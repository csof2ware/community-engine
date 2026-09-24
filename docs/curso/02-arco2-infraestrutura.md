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
