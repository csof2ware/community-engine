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
