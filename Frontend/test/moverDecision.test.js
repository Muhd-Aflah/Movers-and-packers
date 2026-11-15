import assert from "node:assert/strict";
import { test } from "node:test";
import { getMoverDecisionButtonState, runMoverDecision } from "../src/pages/admin/moverDecision.js";

const createState = () => ({
  approvingMoverId: null,
  rejectingMoverId: null,
  error: "old error",
  message: "old message",
  refreshes: 0,
});

const stateSetter = (state, key) => (value) => { state[key] = value; };

test("approval uses only its loading state, succeeds, and refreshes the list", async () => {
  const state = createState();
  const succeeded = await runMoverDecision({
    moverId: "mover-1",
    setLoadingId: stateSetter(state, "approvingMoverId"),
    setError: stateSetter(state, "error"),
    setMessage: stateSetter(state, "message"),
    request: async () => {
      assert.equal(state.approvingMoverId, "mover-1");
      assert.equal(state.rejectingMoverId, null);
      return { message: "Mover approved" };
    },
    refresh: async () => { state.refreshes += 1; },
    successFallback: "Mover approved",
    errorFallback: "Could not approve mover",
  });

  assert.equal(succeeded, true);
  assert.equal(state.approvingMoverId, null);
  assert.equal(state.rejectingMoverId, null);
  assert.equal(state.error, "");
  assert.equal(state.message, "Mover approved");
  assert.equal(state.refreshes, 1);
});

test("approval failure is displayed, clears success, and resets its loading state", async () => {
  const state = createState();
  const succeeded = await runMoverDecision({
    moverId: "mover-1",
    setLoadingId: stateSetter(state, "approvingMoverId"),
    setError: stateSetter(state, "error"),
    setMessage: stateSetter(state, "message"),
    request: async () => {
      assert.equal(state.approvingMoverId, "mover-1");
      assert.equal(state.rejectingMoverId, null);
      throw new Error("Approval failed");
    },
    refresh: async () => { state.refreshes += 1; },
    successFallback: "Mover approved",
    errorFallback: "Could not approve mover",
  });

  assert.equal(succeeded, false);
  assert.equal(state.approvingMoverId, null);
  assert.equal(state.rejectingMoverId, null);
  assert.equal(state.error, "Approval failed");
  assert.equal(state.message, "");
  assert.equal(state.refreshes, 0);
});

test("rejection uses only its loading state, succeeds, and refreshes the list", async () => {
  const state = createState();
  const succeeded = await runMoverDecision({
    moverId: "mover-2",
    setLoadingId: stateSetter(state, "rejectingMoverId"),
    setError: stateSetter(state, "error"),
    setMessage: stateSetter(state, "message"),
    request: async () => {
      assert.equal(state.approvingMoverId, null);
      assert.equal(state.rejectingMoverId, "mover-2");
      return { message: "Mover rejected" };
    },
    refresh: async () => { state.refreshes += 1; },
    successFallback: "Mover application rejected",
    errorFallback: "Could not reject mover",
  });

  assert.equal(succeeded, true);
  assert.equal(state.approvingMoverId, null);
  assert.equal(state.rejectingMoverId, null);
  assert.equal(state.error, "");
  assert.equal(state.message, "Mover rejected");
  assert.equal(state.refreshes, 1);
});

test("rejection failure is displayed, cannot show success, and resets its loading state", async () => {
  const state = createState();
  const succeeded = await runMoverDecision({
    moverId: "mover-2",
    setLoadingId: stateSetter(state, "rejectingMoverId"),
    setError: stateSetter(state, "error"),
    setMessage: stateSetter(state, "message"),
    request: async () => {
      assert.equal(state.approvingMoverId, null);
      assert.equal(state.rejectingMoverId, "mover-2");
      throw new Error("Rejection failed");
    },
    refresh: async () => { state.refreshes += 1; },
    successFallback: "Mover application rejected",
    errorFallback: "Could not reject mover",
  });

  assert.equal(succeeded, false);
  assert.equal(state.approvingMoverId, null);
  assert.equal(state.rejectingMoverId, null);
  assert.equal(state.error, "Rejection failed");
  assert.equal(state.message, "");
  assert.equal(state.refreshes, 0);
});

test("approval success is preserved when refreshing the list fails", async () => {
  const state = createState();
  const succeeded = await runMoverDecision({
    moverId: "mover-1",
    setLoadingId: stateSetter(state, "approvingMoverId"),
    setError: stateSetter(state, "error"),
    setMessage: stateSetter(state, "message"),
    request: async () => ({ message: "Mover approved" }),
    refresh: async () => {
      state.refreshes += 1;
      throw new Error("List refresh failed");
    },
    successFallback: "Mover approved",
    errorFallback: "Could not approve mover",
  });

  assert.equal(succeeded, true);
  assert.equal(state.approvingMoverId, null);
  assert.equal(state.rejectingMoverId, null);
  assert.equal(state.message, "Mover approved");
  assert.match(state.error, /decision succeeded, but the list could not be refreshed/i);
  assert.equal(state.refreshes, 1);
});

test("rejection success is preserved when refreshing the list fails", async () => {
  const state = createState();
  const succeeded = await runMoverDecision({
    moverId: "mover-2",
    setLoadingId: stateSetter(state, "rejectingMoverId"),
    setError: stateSetter(state, "error"),
    setMessage: stateSetter(state, "message"),
    request: async () => ({ message: "Mover rejected" }),
    refresh: async () => {
      state.refreshes += 1;
      throw new Error("List refresh failed");
    },
    successFallback: "Mover application rejected",
    errorFallback: "Could not reject mover",
  });

  assert.equal(succeeded, true);
  assert.equal(state.approvingMoverId, null);
  assert.equal(state.rejectingMoverId, null);
  assert.equal(state.message, "Mover rejected");
  assert.match(state.error, /decision succeeded, but the list could not be refreshed/i);
  assert.equal(state.refreshes, 1);
});

test("approval and rejection show distinct labels while disabling duplicate actions for that mover", () => {
  const rejectingApprovalButton = getMoverDecisionButtonState("approve", "mover-2", null, "mover-2");
  const rejectingRejectionButton = getMoverDecisionButtonState("reject", "mover-2", null, "mover-2");
  const approvingApprovalButton = getMoverDecisionButtonState("approve", "mover-1", "mover-1", null);
  const approvingRejectionButton = getMoverDecisionButtonState("reject", "mover-1", "mover-1", null);
  const otherMoverButton = getMoverDecisionButtonState("reject", "mover-3", null, "mover-2");

  assert.deepEqual(rejectingApprovalButton, { disabled: true, label: "Approve mover" });
  assert.deepEqual(rejectingRejectionButton, { disabled: true, label: "Rejecting..." });
  assert.deepEqual(approvingApprovalButton, { disabled: true, label: "Saving..." });
  assert.deepEqual(approvingRejectionButton, { disabled: true, label: "Reject application" });
  assert.deepEqual(otherMoverButton, { disabled: false, label: "Reject application" });
});
