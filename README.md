# Qwen 3.5 WebGPU Local Inference Lab

A Proof of Concept (PoC) demonstrating how to run Alibaba's **Qwen 3.5 (0.8B)** Multimodal Large Language Model natively inside the browser using WebGPU and Transformers.js.

This project explores client-side AI execution, allowing token generations to happen directly on the user's local graphics card. It serves as an example of running modern Vision-Language Models (VLMs) without relying on backend APIs.

https://github.com/user-attachments/assets/9d57e46f-13ae-4e92-90e9-0cc679ab5731


## 🚀 Features

*   **100% Local Inference:** Data never leaves your machine.
*   **WebGPU Accelerated:** Utilizes WebGPU
*   **Multimodal (Vision-Language):** Support for both text-based chat and image understanding. Drag and drop an image to have the AI analyze it.
*   **Real-time Metrics:** Displays Time to First Token (TTFT) and real-time generation speed (Tokens/Second).
*   **Vanilla JS Architecture:** No frontend frameworks. Built with pure, optimized JavaScript and Vite for fast load times.

## 🛠️ Technology Stack

*   **Engine:** [Transformers.js](https://github.com/huggingface/transformers.js) by Hugging Face
*   **Runtime:** ONNX Runtime Web (WebAssembly + WebGPU)
*   **Model:** `onnx-community/Qwen3.5-0.8B-ONNX` (4-bit quantized)
*   **Build Tool:** Vite

## 📋 Prerequisites

*   A modern web browser with WebGPU support enabled.
*   Node.js installed on your machine.
*   A dedicated GPU for optimal token generation speeds.

## ⚙️ Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/jerrikchr/WGPU-Qwen3.50.8b.git
   cd WGPU-Qwen3.50.8b
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Launch the Lab:**
   Open your browser and navigate to `http://localhost:5173`. 
   
   *Note: On your first visit, the browser will download the ~650MB model weights and compile the WebGPU shaders. Subsequent loads will be nearly instant as the weights are cached locally via the Cache API.*

## 💡 Usage

*   **Text Chat:** Type your prompt into the terminal interface and hit `Execute`.
*   **Vision Analysis:** Click the image icon (or drag and drop) to load an image into the context. Ask a question about the image to see Qwen 3.5's multimodal capabilities in action.
*   **Session Purge:** Click the `[ PURGE ]` button in the top right to clear the context window and free up memory for a new task.

## 🏗️ Architectural Notes

*   **Vanilla JS (Zero Telemetry):** Chose vanilla JavaScript because it is small, fast, and contains no telemetry, ensuring the privacy of the local environment.
*   **VRAM OOM Prevention:** Uploading large photos directly to the ONNX Runtime will crash the WebGPU sandbox (`std::bad_alloc`). Implemented a pre-processing step using the HTML5 Canvas API to downscale images before tensor conversion, preventing Out-Of-Memory errors on constrained hardware.

This entire project was Vibecoded with Gemini CLI

## 🔒 Privacy

This application is client-side. The initial model weights are downloaded from the Hugging Face Hub, but all subsequent chat history, images, and user prompts remain strictly within the memory of your local browser.

## 📄 License

MIT License. Feel free to fork, modify, and build your own local AI applications!
