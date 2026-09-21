const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ChallengeBadge", function () {
  let badge, authority, relayer, alice, bob;
  const domain = { name: "MintPassBadges", version: "1" };
  const types = { Badge: [
    { name: "claimant", type: "address" },
    { name: "badgeId", type: "uint256" },
    { name: "nonce", type: "uint256" }
  ] };

  beforeEach(async function () {
    [, authority, relayer, alice, bob] = await ethers.getSigners();
    const F = await ethers.getContractFactory("ChallengeBadge");
    badge = await F.deploy(authority.address);
    const net = await ethers.provider.getNetwork();
    domain.chainId = Number(net.chainId);
    domain.verifyingContract = await badge.getAddress();
  });

  function signBadge(claimant, badgeId, nonce, signer) {
    return (signer || authority).signTypedData(domain, types, { claimant, badgeId, nonce });
  }

  it("minta badge com assinatura valida da authority", async function () {
    const sig = await signBadge(alice.address, 7, 1);
    await badge.connect(relayer).claimBadge(alice.address, 7, 1, sig);
    expect(await badge.balanceOf(alice.address, 7)).to.equal(1n);
  });

  it("rejeita assinatura de quem nao eh authority", async function () {
    const sig = await signBadge(alice.address, 7, 1, bob);
    await expect(badge.connect(relayer).claimBadge(alice.address, 7, 1, sig))
      .to.be.revertedWith("bad signature");
  });

  it("rejeita replay do mesmo nonce (anti-replay EIP-712)", async function () {
    const sig = await signBadge(alice.address, 7, 42);
    await badge.connect(relayer).claimBadge(alice.address, 7, 42, sig);
    await expect(badge.connect(relayer).claimBadge(alice.address, 7, 42, sig))
      .to.be.revertedWith("nonce used");
  });

  it("so aceita badges 7, 14 e 21", async function () {
    const sig = await signBadge(alice.address, 8, 1);
    await expect(badge.connect(relayer).claimBadge(alice.address, 8, 1, sig))
      .to.be.revertedWith("bad badge id");
  });

  it("soulbound: transferencia entre usuarios reverte", async function () {
    const sig = await signBadge(alice.address, 7, 1);
    await badge.connect(relayer).claimBadge(alice.address, 7, 1, sig);
    await expect(
      badge.connect(alice).safeTransferFrom(alice.address, bob.address, 7, 1, "0x")
    ).to.be.revertedWith("soulbound: no transfer");
  });

  it("emissao continua funcionando para os 3 marcos", async function () {
    for (const id of [7, 14, 21]) {
      const sig = await signBadge(alice.address, id, id);
      await badge.connect(relayer).claimBadge(alice.address, id, id, sig);
      expect(await badge.balanceOf(alice.address, id)).to.equal(1n);
    }
  });
});
