const test = require("node:test");
const assert = require("node:assert/strict");
const paymentController = require("../src/controllers/payment.controller");
const { protect } = require("../src/middleware/auth.middleware");

const response = () => ({
  statusCode: 200,
  body: undefined,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

test("customer payment operations require authentication and the user role", async () => {
  const router = require("../src/routes/payment.routes");
  const routeExpectations = [
    ["/create-order", paymentController.createOrder],
    ["/verify", paymentController.verifyPayment],
    ["/my", paymentController.getMyPayments],
  ];
  const allowUser = require("../src/middleware/role.middleware")("user");

  for (const [path, controller] of routeExpectations) {
    const route = router.stack.find((layer) => layer.route?.path === path).route;
    assert.equal(route.stack[0].handle, protect);
    assert.equal(route.stack[1].handle.name, allowUser.name);
    assert.equal(route.stack.at(-1).handle, controller);

    const anonymous = response();
    await route.stack[0].handle({ headers: {} }, anonymous, () => assert.fail(`${path} must reject anonymous access`));
    assert.equal(anonymous.statusCode, 401);

    for (const role of ["mover", "admin"]) {
      const denied = response();
      route.stack[1].handle({ user: { id: "other-role", role } }, denied, () => assert.fail(`${role} must not access ${path}`));
      assert.equal(denied.statusCode, 403);
    }

    let customerAllowed = false;
    route.stack[1].handle({ user: { id: "customer", role: "user" } }, response(), () => { customerAllowed = true; });
    assert.equal(customerAllowed, true, `customers must reach ${path}`);
  }
});
