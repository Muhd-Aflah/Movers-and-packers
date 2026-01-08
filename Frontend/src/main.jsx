import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppRouter } from "./router";
import { AppProvider } from "./store/appContext";
import "./tailwind.css"; 

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppProvider>
      <AppRouter />
    </AppProvider>
  </StrictMode>
);
