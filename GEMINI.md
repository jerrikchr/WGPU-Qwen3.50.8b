# Qwen 3.5 WebGPU Local Inference Lab

## Project Overview
This project is a Proof of Concept (PoC) demonstrating high-performance, local, hardware-accelerated inference of the **Qwen 3.5 (0.8B)** Multimodal Large Language Model in the browser using WebGPU.

The application operates entirely on the client-side with zero server-side compute. The AI processing happens locally on the user's graphics card, ensuring complete data privacy. It features both text-based chat and image understanding capabilities (Vision-Language Model).

The frontend is built with vanilla JavaScript (no heavy UI frameworks) for performance, structured via Vite, and styled with a custom "Interactive Neural UI".

### Core Technologies
*   **Engine:** `@huggingface/transformers` (v4 Preview)
*   **Runtime:** `onnxruntime-web` (WebAssembly + WebGPU)
*   **Model:** `onnx-community/Qwen3.5-0.8B-ONNX` (4-bit quantized)
*   **Build Tool:** Vite (`vite`)

## Building and Running
The project utilizes standard npm scripts via `package.json` for development and production builds.

1.  **Install Dependencies:**
    ```bash
    npm install
    ```
2.  **Start the Development Server:**
    ```bash
    npm run dev
    ```
    This will serve the application locally (typically at `http://localhost:5173`).
3.  **Build for Production:**
    ```bash
    npm run build
    ```
4.  **Preview Production Build:**
    ```bash
    npm run preview
    ```

**Prerequisites:**
*   Node.js must be installed.
*   A browser supporting WebGPU is required (e.g., Chrome 113+, Edge 113+).

## Development Conventions
*   **Architecture:** The project employs a vanilla JavaScript structure. The core application logic resides in `src/main.js` and background aesthetics in `src/bg.js`.
*   **WebGPU Fallback:** The application explicitly checks for WebGPU support (`navigator.gpu`) and alerts the user if their device/browser does not support it.
*   **Model Caching:** The application checks the browser's Cache API for the `onnx-community/Qwen3.5-0.8B-ONNX` model upon initialization, automatically loading it if found, or prompting the user to download (~650MB) if it's their first visit.
*   **OOM Prevention:** Uploaded images are passed through a `downscaleImage` function via an off-screen canvas to resize them (max 512x512) to prevent WebGPU `std::bad_alloc` Out Of Memory errors.
*   **Dynamic System Prompt:** The system prompt is dynamically generated on load/reset to inject real-time context (current local time and date) into the model.
*   **Styling:** A single CSS file (`src/style.css`) handles all styling, including mobile responsiveness (`@media (max-width: 768px)`).
