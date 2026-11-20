
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppRouter } from "./router";
import { AppProvider } from "./store/appContext";
import { SocketProvider } from "./context/SocketContext";
import { SpeedInsights } from "@vercel/speed-insights/react";
import "./tailwind.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppProvider>
      <SocketProvider>
        <AppRouter />
        <SpeedInsights />
      </SocketProvider>
    </AppProvider>
  </StrictMode>
);
