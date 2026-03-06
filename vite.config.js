import { defineConfig } from "vite";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const currentDir = path.dirname(url.fileURLToPath(import.meta.url));

// Vite struggles with serving raw .wasm files from node_modules during development.
// This custom middleware explicitly intercepts and serves the ONNX runtime WebAssembly binaries.
const onnxWasmPlugin = () => ({
  name: "onnx-wasm-provider",
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url && req.url.includes(".wasm") && req.url.includes("ort-wasm")) {
        const wasmFileName = req.url.split("/").pop();
        const targetPath = path.resolve(currentDir, "node_modules", "onnxruntime-web", "dist", wasmFileName);
        
        if (fs.existsSync(targetPath)) {
          res.setHeader("Content-Type", "application/wasm");
          res.setHeader("Cache-Control", "no-cache");
          fs.createReadStream(targetPath).pipe(res);
          return;
        }
      }
      next();
    });
  }
});

export default defineConfig({
  plugins: [onnxWasmPlugin()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    open: true,
  },
});
