import assert from "node:assert/strict";
import { test } from "node:test";
import { runEstimateSubmission } from "../src/pages/admin/packingEstimateWorkflow.js";

const validForm = () => ({
  materials: [{ description: "Carton", quantity: "2", unit: "box", unitRate: "50" }],
  labor: {
    packing: { workers: "1", ratePerWorker: "100" },
    loading: { workers: "2", ratePerWorker: "75" },
    unloading: { workers: "1", ratePerWorker: "75" },
  },
  additionalCharges: [],
});

const createState = () => ({ savingId: "", error: "old error", notice: "old notice", updatedMove: null });

const workflowArgs = (state, overrides = {}) => ({
  moveId: "move-1",
  form: validForm(),
  setSavingId: (value) => { state.savingId = value; },
  setError: (value) => { state.error = value; },
  setNotice: (value) => { state.notice = value; },
  saveEstimate: async (_moveId, _payload) => ({ _id: "move-1", pricingStatus: "pending_acceptance" }),
  updateMove: (move) => { state.updatedMove = move; },
  ...overrides,
});

test("estimate validation reports incomplete materials without starting a save", async () => {
  const state = createState();
  const form = validForm();
  form.materials[0].unit = "";
  let requests = 0;

  const saved = await runEstimateSubmission(workflowArgs(state, {
    form,
    saveEstimate: async () => { requests += 1; },
  }));

  assert.equal(saved, false);
  assert.match(state.error, /material description, quantity, unit, and unit rate/);
  assert.equal(state.notice, "");
  assert.equal(state.savingId, "");
  assert.equal(requests, 0);
});

test("estimate submission exposes loading until the API request resolves", async () => {
  const state = createState();
  let resolveRequest;
  const pendingRequest = new Promise((resolve) => { resolveRequest = resolve; });

  const submission = runEstimateSubmission(workflowArgs(state, { saveEstimate: async () => pendingRequest }));
  assert.equal(state.savingId, "move-1");
  resolveRequest({ _id: "move-1" });
  assert.equal(await submission, true);
  assert.equal(state.savingId, "");
});

test("successful estimate submission sends the expected payload and updates the matching move", async () => {
  const state = createState();
  let requested;
  const result = await runEstimateSubmission(workflowArgs(state, {
    saveEstimate: async (moveId, payload) => {
      requested = { moveId, payload };
      return { _id: moveId, pricingStatus: "pending_acceptance", price: 500 };
    },
  }));

  assert.equal(result, true);
  assert.equal(requested.moveId, "move-1");
  assert.deepEqual(requested.payload, {
    materials: [{ description: "Carton", quantity: 2, unit: "box", unitRate: 50 }],
    labor: {
      packing: { workers: 1, ratePerWorker: 100 },
      loading: { workers: 2, ratePerWorker: 75 },
      unloading: { workers: 1, ratePerWorker: 75 },
    },
    additionalCharges: [],
  });
  assert.equal(state.updatedMove.pricingStatus, "pending_acceptance");
  assert.match(state.notice, /Estimate saved/);
  assert.equal(state.error, "");
  assert.equal(state.savingId, "");
});

test("API failure is displayed, does not show success, and always resets loading", async () => {
  const state = createState();
  const result = await runEstimateSubmission(workflowArgs(state, {
    saveEstimate: async () => { throw new Error("Estimate API failed"); },
  }));

  assert.equal(result, false);
  assert.equal(state.error, "Estimate API failed");
  assert.equal(state.notice, "");
  assert.equal(state.updatedMove, null);
  assert.equal(state.savingId, "");
});

test("incomplete API response is treated as a failure", async () => {
  const state = createState();
  const result = await runEstimateSubmission(workflowArgs(state, {
    saveEstimate: async () => ({ _id: "another-move" }),
  }));

  assert.equal(result, false);
  assert.match(state.error, /response was incomplete/);
  assert.equal(state.notice, "");
  assert.equal(state.savingId, "");
});
