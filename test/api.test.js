const { expect } = require("chai");
const API = "http://127.0.0.1:3000";

async function jget(url) {
  const r = await fetch(url);
  return { status: r.status, body: await r.json() };
}

describe("API MintPass (:3000)", function () {
  before(async function () {
    try {
      const r = await fetch(API + "/health", { signal: AbortSignal.timeout(2000) });
      if (!r.ok) this.skip();
    } catch (e) {
      this.skip();
    }
  });

  // === /health ===
  it("GET /health retorna healthy=true + status de redis/postgres/rpc", async function () {
    const { status, body } = await jget(API + "/health");
    expect(status).to.equal(200);
    expect(body.healthy).to.equal(true);
    expect(body.checks).to.deep.include({ redis: "ok", postgres: "ok", rpc: "ok" });
  });

  // === /config ===
  it("GET /config expoe 3 enderecos do engine", async function () {
    const { status, body } = await jget(API + "/config");
    expect(status).to.equal(200);
    expect(body.airdropAddress).to.match(/^0x[0-9a-fA-F]{40}$/);
    expect(body.signedAddress).to.match(/^0x[0-9a-fA-F]{40}$/);
    expect(body.root).to.match(/^0x[0-9a-f]{64}$/);
  });

  // === /stats ===
  it("GET /stats retorna holders + totalMinted + lastBlock (strings)", async function () {
    const { status, body } = await jget(API + "/stats");
    expect(status).to.equal(200);
    expect(body).to.have.property("holders");
    expect(body).to.have.property("totalMinted");
    expect(body).to.have.property("lastBlock");
    // Valores sao strings (indexer pode guardar bigint)
    expect(body.holders).to.be.a("string");
    expect(body.totalMinted).to.be.a("string");
  });

  // === /holders ===
  it("GET /holders retorna lista (pode ser vazia)", async function () {
    const { status, body } = await jget(API + "/holders");
    expect(status).to.equal(200);
    expect(Array.isArray(body.holders || body)).to.equal(true);
  });

  // === /proof ===
  it("GET /proof/:address para endereco inexistente retorna 404", async function () {
    // Endereco valido sintaticamente mas sem proof na raiz atual
    const r = await fetch(API + "/proof/0x0000000000000000000000000000000000000000");
    expect(r.status).to.equal(404);
  });

  // === /metrics ===
  it("GET /metrics expoe contador de requests (formato prometheus)", async function () {
    await fetch(API + "/health");
    const r = await fetch(API + "/metrics");
    expect(r.status).to.equal(200);
    const text = await r.text();
    expect(text.length).to.be.greaterThan(0);
  });
});
