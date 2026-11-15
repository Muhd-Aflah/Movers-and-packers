const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const { authenticateSocketToken, userRoom, ADMIN_ROOM } = require("../src/realtime/socket");

const secret = "a-verified-test-secret-that-is-longer-than-32-bytes";

const tokenFor = (id = "customer-1", options = {}) => jwt.sign(
  { id, role: options.claimedRole || "user" },
  secret,
  { algorithm: "HS256", expiresIn: options.expiresIn || "5m" },
);

test("socket authentication uses the current database role and user ID", async () => {
  const identity = await authenticateSocketToken(tokenFor("customer-1", { claimedRole: "admin" }), {
    secret,
    findUser: async () => ({ _id: "customer-1", role: "user", isActive: true }),
  });

  assert.equal(identity.id, "customer-1");
  assert.equal(identity.role, "user");
  assert.equal(Number.isSafeInteger(identity.expiresAt), true);
});

test("socket authentication rejects missing, invalid, and expired tokens", async () => {
  await assert.rejects(() => authenticateSocketToken(null, { secret }), { data: { code: "TOKEN_INVALID" } });
  await assert.rejects(() => authenticateSocketToken("not-a-jwt", { secret }), { data: { code: "TOKEN_INVALID" } });
  await assert.rejects(() => authenticateSocketToken(tokenFor("user-1", { expiresIn: "-1s" }), { secret }), { data: { code: "TOKEN_INVALID" } });
});

test("socket authentication rejects disabled accounts and non-approved movers", async () => {
  const disabled = tokenFor("disabled-user");
  await assert.rejects(() => authenticateSocketToken(disabled, {
    secret,
    findUser: async () => ({ _id: "disabled-user", role: "user", isActive: false }),
  }), { data: { code: "ACCOUNT_UNAVAILABLE" } });

  const mover = tokenFor("pending-mover");
  await assert.rejects(() => authenticateSocketToken(mover, {
    secret,
    findUser: async () => ({ _id: "pending-mover", role: "mover", isActive: true, moverApprovalStatus: "pending" }),
  }), { data: { code: "MOVER_NOT_APPROVED" } });
});

test("socket rooms are server-derived and keep admins separate", () => {
  assert.equal(userRoom("verified-user-id"), "user:verified-user-id");
  assert.equal(ADMIN_ROOM, "role:admin");
});
