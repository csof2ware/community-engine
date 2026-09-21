const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const signers = await ethers.getSigners();
  const alice = signers[3];
  const bob = signers[4];
  const badges = JSON.parse(fs.readFileSync("backend/badges.json"));
  const c = new ethers.Contract(badges.address, [
    "function safeTransferFrom(address,address,uint256,uint256,bytes)"
  ], alice);
  try {
    await c.safeTransferFrom.staticCall(alice.address, bob.address, 7, 1, "0x");
    console.log("ALERTA: transferencia NAO foi bloqueada!");
    process.exit(1);
  } catch (e) {
    console.log("SOULBOUND OK: transferencia revertida como esperado");
    process.exit(0);
  }
}
main().catch(function (e) { console.error(e); process.exit(1); });
