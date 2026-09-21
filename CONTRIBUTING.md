# 🤝 Contribuindo

Obrigado por querer contribuir com o MintPass!

## 🚀 Setup rápido

bash
git clone https://github.com/csof2ware/community-engine.git
cd community-engine
cp .env.example .env
docker compose up -d
docker compose exec dev sh
sh boot.sh


## 🧪 Testes

bash
npx hardhat test
# 22 passing


Todo PR precisa passar no CI (secret-scan + build + test).

## 📝 Padrões

- *Commits:* mensagens em português, prefixo convencional (feat:, fix:, docs:, test:, chore:)
- *Branches:* feat/nome-da-feature, fix/nome-do-bug, docs/nome-da-doc
- *Chaves:* NUNCA commit chaves privadas. Use .env (já está no .gitignore)
- *Testes:* novos contratos precisam de testes; novas rotas de API precisam de testes

## 🔒 Segurança

Se achou vulnerabilidade, *não abra issue pública*. Envie email pra security@csoftware.dev.br.

## 📬 Pull Requests

1. Fork o repo
2. Crie branch: git checkout -b feat/minha-feature
3. Commit: git commit -m "feat: adiciona minha feature"
4. Push: git push origin feat/minha-feature
5. Abra PR no GitHub

Todo PR precisa:
- Passar no CI (secret-scan + build + test)
- Ter descrição clara do que muda
- Ter testes (se aplicável)

## 📜 Código de Conduta

Leia [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Respeito sempre.
