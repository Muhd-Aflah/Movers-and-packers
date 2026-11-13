import { HomePage } from "./pages/HomePage";

// Backwards-compatible export for consumers of the previous landing component.
export function LogisticsLanding() {
  return <HomePage />;
}
