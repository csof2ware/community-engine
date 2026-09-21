const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const signers = await ethers.getSigners();
  const authority = signers[1];
  const F = await ethers.getContractFactory("ChallengeBadge");
  const c = await F.deploy(authority.address);
  await c.waitForDeployment();
  const addr = await c.getAddress();
  fs.writeFileSync("backend/badges.json", JSON.stringify({ address: addr, authority: authority.address }, null, 2));
  console.log("ChallengeBadge: " + addr + " | authority: " + authority.address);
}
main().catch(function (e) { console.error(e); process.exit(1); });
