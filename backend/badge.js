const express = require('express');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { ethers } = require('ethers');
const Redis = require('ioredis');
const fs = require('fs');

const badges = JSON.parse(fs.readFileSync(path.join(__dirname, 'badges.json')));
const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
const authority = new ethers.Wallet(process.env.AUTHORITY_KEY, provider);
const relayer = new ethers.Wallet(process.env.RELAYER_KEY, provider);
const redis = new Redis('redis://redis:6379');

const contract = new ethers.Contract(badges.address, [
  'function claimBadge(address,uint256,uint256,bytes)',
  'function balanceOf(address,uint256) view returns (uint256)'
], relayer);

const domain = { name: 'MintPassBadges', version: '1', chainId: 31337, verifyingContract: badges.address };
const types = { Badge: [
  { name: 'claimant', type: 'address' },
  { name: 'badgeId', type: 'uint256' },
  { name: 'nonce', type: 'uint256' }
] };

// FILA: uma tx por vez -> nunca mais corrida de nonce
let chain = Promise.resolve();

const app = express();
app.use(express.json());

app.post('/mint-badge', function (req, res) {
  chain = chain.then(function () { return handleMint(req, res); }).catch(function () {});
});

async function handleMint(req, res) {
  const claimant = req.body.claimant;
  const badgeId = Number(req.body.badgeId);
  if (!ethers.isAddress(claimant)) return res.status(400).json({ error: 'claimant invalido' });
  if (![7, 14, 21].includes(badgeId)) return res.status(400).json({ error: 'badgeId deve ser 7, 14 ou 21' });
  try {
    // IDEMPOTENTE: se o badge ja existe, nao manda tx de novo
    const existing = await contract.balanceOf(claimant, badgeId);
    if (existing > 0n) {
      console.log('Badge ' + badgeId + ' ja existe para ' + claimant.slice(0, 10) + ' (idempotente, sem tx)');
      return res.json({ txHash: 'already-minted', blockNumber: 0, balance: existing.toString() });
    }
    const nonce = await redis.incr('badge-nonce');
    const sig = await authority.signTypedData(domain, types, { claimant: claimant, badgeId: badgeId, nonce: nonce });
    const txNonce = await provider.getTransactionCount(relayer.address, 'pending');
    const tx = await contract.claimBadge(claimant, badgeId, nonce, sig, { nonce: txNonce });
    const r = await tx.wait();
    const bal = await contract.balanceOf(claimant, badgeId);
    console.log('Badge ' + badgeId + ' -> ' + claimant.slice(0, 10) + ' tx ' + r.hash.slice(0, 18));
    res.json({ txHash: r.hash, blockNumber: r.blockNumber, balance: bal.toString() });
  } catch (e) {
    res.status(500).json({ error: 'revert: ' + (e.reason || e.message) });
  }
}

app.get('/health', function (req, res) { res.json({ ok: true, badge: badges.address }); });
app.listen(3003, function () { console.log('Badge service v2 no ar: http://localhost:3003'); });
