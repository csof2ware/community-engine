# Módulo 4 — Discord, GitHub Actions e Segurança

Este modulo nao segue dias: ele consolida a camada de COMUNIDADE e
PROCESSO que fez o engine sobreviver ao mundo real. Seis aulas
tematicas, mesmo formato: o que faz / como faz / passos finais /
saida esperada / erros reais / prova.

---

## Aula 1 — O servidor como sala de aula

O QUE FAZ
Um Discord onde um novato sabe exatamente onde pisar: categorias por
funcao, canais com proposito escrito, onboarding com 3 portas.

COMO FAZ
Categorias agrupam canais e herdam permissoes; topics funcionam como
placa de sinalizacao dentro de cada canal; a tela de onboarding
empurra o novato para regras, trilha e apresentacoes antes do caos.

PASSOS FINAIS
    Criar 7 categorias:
    BOAS-VINDAS / DESAFIO 21-DAYS / MINTPASS LAB / BADGES / BOTS /
    COMUNIDADE / STAFF
    Canais: quase todos TEXTO; anuncios = ANUNCIO; duvidas = FORUM;
    2 canais de VOZ opcionais (sala-geral, workshop)
    Onboarding: 3 opcoes (regras, trilha, apresentacoes) + mensagem
    de boas-vindas

SAIDA ESPERADA
Novato entra, ve 3 portas, le regras, acha a trilha e se apresenta
sem perguntar nada a ninguem.

ERROS REAIS DA SAGA
Canal de duvidas criado como texto virou mural baguncado em uma
semana de comunidade ativa. Forum nao converte de/para texto depois:
decida no nascimento. Aqui virou forum.

PROVA
Tour completo: cada canal com topic preenchido; onboarding ativo.

---

## Aula 2 — Cargos: cores, hierarquia e a regra de ouro

O QUE FAZ
Identidade visual de progresso (bronze/prata/ouro) + limites mecanicos
de quem pode conceder o que.

COMO FAZ
Discord so permite conceder cargos ABAIXO do seu cargo mais alto. Por
isso o bot mora no topo: Mintpass > Bot > Mod > marcos. Cores hex
fixas por marco viram a paleta da comunidade inteira.

PASSOS FINAIS
    Cores: Mod #E74C3C | Day-21 #FFD700 | Day-14 #C0C0C0 |
    Day-7 #CD7F32 | Builder #5865F2 | Bot #9B59B6
    Hierarquia: Mintpass, Bot, Mod, Day-21, Day-14, Day-7, Builder,
    @everyone (marcos acima do Mod = so o bot e o dono gerenciam)

SAIDA ESPERADA
Lista de cargos identica a tabela; nome dos graduados pintado na cor
do marco mais alto.

ERROS REAIS DA SAGA
(a) "Missing Permissions" ao conceder badge: o bot estava ABAIXO do
cargo na hierarquia. Reordenar resolveu na hora.
(b) Cargo duplicado: o bot procura nome EXATO ("Day-7 · Initiate");
existia um "Day-7 · Initiate bronze" renomeado na mao -> o bot criou
outro. Nomes de cargo sao contrato: nao improvisar sufixos.

PROVA
/approve-day concede cargo sem erro; perfil do graduado com cor certa.

---

## Aula 3 — Bot v3: o assistente de moderacao

O QUE FAZ
Sete comandos que ligam a comunidade ao engine: /ping /claim /balance
/leaderboard /link /approve-day /myprogress.

COMO FAZ
Slash commands discord.js; approve-day exige ManageGuild; progresso
em Redis (set por aluno); ao bater 7/14/21 o bot chama o badge service
e concede o cargo. deferReply antes de trabalho pesado, editReply no
fim — o pacto dos 3 segundos com o Discord.

PASSOS FINAIS
    cd backend/discord-bot
    nohup node index.js > /tmp/bot.log 2>&1 &
    tail -5 /tmp/bot.log

SAIDA ESPERADA
    [bot] comandos: /ping /claim /balance /leaderboard /link
    /approve-day /myprogress
    [bot] online como Mintpass#5874

ERROS REAIS DA SAGA
(a) "A interacao falhou": handler pesado sem deferReply estourava os
3s do Discord. Padrao final: deferReply + editReply em tudo que toca
chain ou Redis.
(b) Unknown interaction 10062 derrubava o processo: resposta a
interacao ja expirada. Fix: try/catch por interacao + handlers de
unhandledRejection/uncaughtException que logam sem matar o bot.
(c) Replay de badge: mint duplicado morria em "nonce used" — correto;
o bug real era a corrida de nonce do relayer, resolvida com fila
serial no badge service.

PROVA
Sequencia completa: /link + 7x /approve-day -> badge bronze on-chain
+ cargo no Discord, sem timeout, sem crash.

---

## Aula 4 — GitHub Actions: o porteiro que nao dorme

O QUE FAZ
Todo push e todo PR passam por dois portoes: caca-chaves no historico
completo e build + 22 testes.

COMO FAZ
.github/workflows/ci.yml com dois jobs: secret-scan roda gitleaks via
docker com fetch-depth 0 (historico inteiro); build-test instala,
compila e roda a suite. Vermelho em qualquer um = nao existe "pronto".

PASSOS FINAIS
    cat .github/workflows/ci.yml
    git push
    # acompanhe em Settings do repo > Actions

SAIDA ESPERADA
Run com secret-scan verde e build-test verde; badge de CI no README.

ERROS REAIS DA SAGA
O historico antigo continha as chaves PUBLICAS do hardhat (pre-FASE 0).
Gitleaks com historico completo reprovaria tudo para sempre. Solucao
honesta: .gitleaks.toml com allowlist documentada dessas 3 chaves
publicas — e caca implacavel a qualquer outra. Allowlist nao eh
vista grossa: eh decisao assinada no repo.

PROVA
Push novo -> Actions verde em ~1min; README com badge brilhando.

---

## Aula 5 — Branch protection e fluxo de contribuicao

O QUE FAZ
A main vira zona protegida: sem force push, sem delete; e (quando a
equipe crescer) sem merge sem PR e checks verdes.

COMO FAZ
Settings > Branches > regra classica para main. Fase 1 (solo): bloqueia
force push e delete. Fase 2 (equipe): exige PR + status checks
(secret-scan, build-test). Ativar fase 2 cedo demais trava o proprio
dono: commit novo direto na main seria rejeitado ate o CI rodar nele.

PASSOS FINAIS
    Fase 1: pattern main + do-not-allow-force-push + do-not-allow-deletions
    Fase 2 (futuro): require PR + require status checks
    CONTRIBUTING.md: branch feat/* -> commit convencional -> PR
    Issue templates: bug / feature / quest

SAIDA ESPERADA
Regra ativa em Settings > Branches; PR de teste so mergea com CI verde
(quando a fase 2 entrar).

ERROS REAIS DA SAGA
Quase ativamos require-status-checks sendo solo: o primeiro push
direto teria sido rejeitado e a sensacao seria "o CI me travou".
Decisao consciente: fase 1 agora, fase 2 quando existir a primeira
outra pessoa. Processo serve ao time, nao o contrario.

PROVA
Regra visivel na UI; nenhum force push possivel na main.

---

## Aula 6 — Modelo de seguranca consolidado

O QUE FAZ
Uma pagina que responde: onde moram as chaves, por que assinatura nao
vira replay, por que badge nao se transfere, e o que muda em producao.

COMO FAZ
Chaves em .env fora do git com .env.example publico; EIP-712 com
dominios separados por contrato e nonce consumido on-chain; soulbound
por override de _update; rate limit na API; gate ManageGuild no
approve-day; hierarquia de cargos como controle de acesso social.

PASSOS FINAIS
    grep -rn "0xac09\|0x59c6\|0x5de4" backend/ || echo LIMPO
    cat docs/seguranca.md

SAIDA ESPERADA
    LIMPO
e o modelo de ameaca com mitigacoes uma a uma.

ERROS REAIS DA SAGA
A varredura manual achou chave hardcoded num script de teste antigo
(vouchertest.js). Segredo em arquivo de teste tambem eh segredo:
virou env var. Desde entao, todo script novo nasce lendo .env.

PROVA
grep LIMPO + secret-scan verde + checklist de producao revisado
(chaves novas, KMS, relayer com teto, testnet antes de mainnet).

---

Fim do Modulo 4. A comunidade agora tem sala de aula, assistente,
porteiro e cofre. Proximo e ultimo modulo: arquitetura final,
apendices e runbook — o mapa completo pra quem chegar depois de voce.
