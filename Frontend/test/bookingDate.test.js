import test from "node:test";
import assert from "node:assert/strict";
import { getLocalToday, isValidDateOnly, validateStep } from "../src/components/booking/bookingContract.js";

test("local today uses the user's calendar date rather than UTC", () => {
  const localDate = new Date(2026, 10, 21, 0, 15);
  assert.equal(getLocalToday(localDate), "2026-11-21");
});

test("booking date validation accepts today and tomorrow and rejects yesterday or invalid dates", () => {
  const today = getLocalToday(new Date(2026, 10, 21, 12));
  const tomorrow = "2026-11-22";
  const yesterday = "2026-11-20";
  const draft = { moveType: "home_move", propertyType: "apartment_flat", approximateSize: { value: 2 }, moveDate: today };
  assert.equal(validateStep(0, draft).moveDate, undefined);
  assert.equal(validateStep(0, { ...draft, moveDate: tomorrow }).moveDate, undefined);
  assert.equal(validateStep(0, { ...draft, moveDate: yesterday }).moveDate, "Please select today or a future date.");
  assert.equal(isValidDateOnly("2026-02-30"), false);
  assert.equal(validateStep(0, { ...draft, moveDate: "21-11-2026" }).moveDate, "Please select today or a future date.");
});
