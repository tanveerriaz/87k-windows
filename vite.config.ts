import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const clientPort = Number(process.env.CLIENT_PORT ?? "5173");
const serverPort = Number(process.env.SERVER_PORT ?? "3001");

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist/client",
    emptyOutDir: true,
  },
  server: {
    port: clientPort,
    strictPort: true,
    proxy: {
      "/api": `http://127.0.0.1:${serverPort}`,
      "/health": `http://127.0.0.1:${serverPort}`,
      "/socket.io": {
        target: `ws://127.0.0.1:${serverPort}`,
        ws: true,
      },
    },
  },
});
