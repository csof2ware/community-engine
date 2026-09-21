const { ethers } = require("hardhat");
const fs = require("fs");
const Redis = require("ioredis");

async function main() {
  const signers = await ethers.getSigners();
  const authority = signers[1];
  const relayer = signers[2];
  const claimant = process.env.CLAIMANT;
  const badgeId = Number(process.env.BADGE_ID || 7);
  if (!claimant || !ethers.isAddress(claimant)) {
    console.error("uso: CLAIMANT=0x... BADGE_ID=7 npx hardhat run scripts/mintBadge.js --network localhost");
    process.exit(1);
  }
  const badges = JSON.parse(fs.readFileSync("backend/badges.json"));
  const redis = new Redis("redis://redis:6379");
  const nonce = await redis.incr("badge-nonce");
  const domain = { name: "MintPassBadges", version: "1", chainId: 31337, verifyingContract: badges.address };
  const types = { Badge: [
    { name: "claimant", type: "address" },
    { name: "badgeId", type: "uint256" },
    { name: "nonce", type: "uint256" }
  ] };
  const sig = await authority.signTypedData(domain, types, { claimant: claimant, badgeId: badgeId, nonce: nonce });
  const contract = new ethers.Contract(badges.address, [
    "function claimBadge(address,uint256,uint256,bytes)",
    "function balanceOf(address,uint256) view returns (uint256)"
  ], relayer);
  const tx = await contract.claimBadge(claimant, badgeId, nonce, sig);
  const r = await tx.wait();
  const bal = await contract.balanceOf(claimant, badgeId);
  console.log("Badge " + badgeId + " mintado para " + claimant.slice(0, 10) + "... | tx " + r.hash.slice(0, 18) + " | saldo: " + bal);
  process.exit(0);
}
main().catch(function (e) { console.error(e); process.exit(1); });
