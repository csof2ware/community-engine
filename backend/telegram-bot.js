const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const Redis = require('ioredis');
const { ethers } = require('ethers');
const fs = require('fs');

const TOKEN = process.env.TELEGRAM_TOKEN;
if (!TOKEN) { console.error('[tg] TELEGRAM_TOKEN ausente no .env'); process.exit(1); }
const redis = new Redis('redis://redis:6379');
const SIGNER = 'http://localhost:3001';
const RELAYER = 'http://localhost:3002';
const GRAPH = 'http://graph-node:8000/subgraphs/name/airdrop-v2';
const ADDR_RE = /^0x[0-9a-fA-F]{40}$/;

let badgeC = null;
try {
  const badges = JSON.parse(fs.readFileSync(path.join(__dirname, 'badges.json')));
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  badgeC = new ethers.Contract(badges.address, ['function balanceOf(address,uint256) view returns (uint256)'], provider);
} catch (e) { console.error('[tg] badges indisponiveis:', e.message); }

process.on('unhandledRejection', (e) => console.error('[tg][unhandled]', e?.message || e));
process.on('uncaughtException', (e) => console.error('[tg][uncaught]', e?.message || e));

async function tg(method, body) {
  const r = await fetch('https://api.telegram.org/bot' + TOKEN + '/' + method, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {})
  });
  return r.json();
}
const send = (chat, text) => tg('sendMessage', { chat_id: chat, text: text, parse_mode: 'HTML' });

async function graph(q) {
  const r = await fetch(GRAPH, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: q }) });
  return (await r.json())?.data;
}

async function handle(msg) {
  const chat = msg.chat.id;
  const text = (msg.text || '').trim();
  const [cmd, ...args] = text.split(/\s+/);
  const c = cmd.split('@')[0];

  if (c === '/start') return send(chat, '🏛️ <b>MintPass Engine</b>\nComandos: /ping /claim /balance /leaderboard /link /badges\nAprovacoes de dias acontecem no Discord MintPass Lab.');
  if (c === '/ping') return send(chat, '🏓 pong · MintPass Engine v1');

  if (c === '/link') {
    const a = args[0];
    if (!ADDR_RE.test(a || '')) return send(chat, '❌ uso: /link 0x...');
    await redis.set('link:tg:' + msg.from.id, a);
    return send(chat, '🔗 wallet vinculada: <code>' + a + '</code>');
  }

  if (c === '/claim') {
    const a = args[0]; const amount = args[1] || '1';
    if (!ADDR_RE.test(a || '')) return send(chat, '❌ uso: /claim 0x... [quantidade]');
    const s = await fetch(SIGNER + '/sign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ claimant: a, amount }) });
    if (!s.ok) return send(chat, '❌ signer ' + s.status);
    const signed = await s.json();
    const r = await fetch(RELAYER + '/relay', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(signed) });
    if (!r.ok) return send(chat, '❌ relayer ' + r.status);
    const out = await r.json();
    return send(chat, '✅ claim minerada\nsaldo: <b>' + out.newBalance + '</b>\nbloco: ' + out.blockNumber + '\ntx: <code>' + out.txHash + '</code>');
  }

  if (c === '/balance') {
    const a = args[0];
    if (!ADDR_RE.test(a || '')) return send(chat, '❌ uso: /balance 0x...');
    const d = await graph('{ holder(id: "' + a.toLowerCase() + '") { balance transferCount } }');
    if (!d?.holder) return send(chat, '🔍 sem registro on-chain');
    return send(chat, '💼 balance: <b>' + d.holder.balance + '</b>\ntransfers: ' + d.holder.transferCount);
  }

  if (c === '/leaderboard') {
    const d = await graph('{ holders(first: 5, orderBy: balance, orderDirection: desc) { id balance } }');
    const hs = d?.holders || [];
    if (!hs.length) return send(chat, '🔍 nenhum holder ainda');
    const m = ['🥇','🥈','','4.','5.'];
    return send(chat, '🏆 Top 5\n' + hs.map((h, i) => m[i] + ' <code>' + h.id.slice(0, 6) + '..' + h.id.slice(-4) + '</code> · ' + h.balance).join('\n'));
  }

  if (c === '/badges') {
    const wallet = await redis.get('link:tg:' + msg.from.id);
    if (!wallet) return send(chat, '❌ primeiro use /link 0x...');
    if (!badgeC) return send(chat, '❌ contrato de badges indisponivel');
    const b7 = await badgeC.balanceOf(wallet, 7);
    const b14 = await badgeC.balanceOf(wallet, 14);
    const b21 = await badgeC.balanceOf(wallet, 21);
    const line = (n, b) => (b > 0n ? '✅' : '⬜') + ' ' + n;
    return send(chat, '🎖️ Seus badges on-chain:\n' + line('Day-7 · Initiate', b7) + '\n' + line('Day-14 · Builder', b14) + '\n' + line('Day-21 · On-Chain Master', b21));
  }

  if (c.startsWith('/')) return send(chat, '🤔 nao conheco esse comando. Tente /start');
}

let offset = 0;
async function loop() {
  while (true) {
    try {
      const res = await tg('getUpdates', { offset: offset, timeout: 25 });
      for (const u of res.result || []) {
        offset = u.update_id + 1;
        if (u.message) await handle(u.message).catch((e) => console.error('[tg] handler:', e.message));
      }
    } catch (e) {
      console.error('[tg] polling:', e.message);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}
console.log('[tg] Telegram bot no ar');
loop();
