import { AppRouter } from "./router";

// Keep a single routing implementation even for tooling that imports App.
export default function App() {
  return <AppRouter />;
}
