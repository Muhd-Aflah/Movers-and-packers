import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { usePaginatedData } from "../src/hooks/usePaginatedData.js";

test("usePaginatedData exposes a callable setError that updates error state", () => {
  let setterCalled = false;

  function HookProbe() {
    const { error, setError } = usePaginatedData(async () => ({ data: [] }));

    // Trigger one render-phase update so this test can exercise the hook without
    // adding a DOM renderer dependency to the frontend test setup.
    if (!setterCalled) {
      setterCalled = true;
      assert.equal(typeof setError, "function");
      setError("Example pagination error");
    }

    return React.createElement("output", null, error);
  }

  const markup = renderToStaticMarkup(React.createElement(HookProbe));
  assert.match(markup, /Example pagination error/);
});
