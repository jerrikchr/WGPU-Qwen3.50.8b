import {
    AutoProcessor,
    AutoModelForImageTextToText,
    TextStreamer,
    RawImage,
} from "@huggingface/transformers";
import { initBackground } from './bg.js';

const DOM = {
    status: document.getElementById('status-text'),
    chatHistory: document.getElementById('chat-history'),
    input: document.getElementById('prompt-input'),
    button: document.getElementById('send-button'),
    uploadButton: document.getElementById('upload-button'),
    imageInput: document.getElementById('image-input'),
    imagePreviewContainer: document.getElementById('image-preview-container'),
    imagePreview: document.getElementById('image-preview'),
    removeImage: document.getElementById('remove-image'),
    resetButton: document.getElementById('reset-button'),
    metricsContainer: document.getElementById('metrics-container'),
    metricTtft: document.getElementById('metric-ttft'),
    metricSpeed: document.getElementById('metric-speed'),
    metricTokens: document.getElementById('metric-tokens'),
    initOverlay: document.getElementById('init-overlay'),
    initButton: document.getElementById('init-button')
};

const MODEL_ID = "onnx-community/Qwen3.5-0.8B-ONNX";

let processor = null;
let model = null;
let currentImage = null;

// Function to generate the dynamic system prompt with current time
function getSystemPrompt() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    const dateString = now.toLocaleDateString();
    
    return {
        role: 'system',
        content: `You are Qwen, a highly capable AI assistant running locally on the user's device via WebGPU. You are helpful, concise, and accurate. The current local time is ${timeString} on ${dateString}.`
    };
}

// Messages history initialized with dynamic system prompt
let messages = [getSystemPrompt()];

async function initializeModel() {
    try {
        DOM.initButton.disabled = true;
        DOM.initButton.textContent = "INITIALIZING...";
        DOM.status.textContent = "INITIALIZING TRANSFORMERS_JS_V4...";
        processor = await AutoProcessor.from_pretrained(MODEL_ID);

        DOM.status.textContent = "ALLOCATING VRAM (Q4F16 ~650MB)...";
        model = await AutoModelForImageTextToText.from_pretrained(MODEL_ID, {
            device: "webgpu",
            dtype: "q4f16",
            progress_callback: (progress) => {
                if (progress.status === "progress") {
                    const pct = Math.round(progress.loaded / progress.total * 100);
                    DOM.status.textContent = `LOADING_WEIGHTS: ${pct}%`;
                    DOM.initButton.textContent = `LOADING: ${pct}%`;
                }
            },
        });

        DOM.status.textContent = "NEURAL_ENGINE_READY // WEBGPU_ACTIVE";
        DOM.status.style.color = "#10b981";
        DOM.input.disabled = false;
        DOM.button.disabled = false;
        DOM.uploadButton.disabled = false;
        DOM.resetButton.disabled = false;
        
        // Hide overlay
        DOM.initOverlay.style.opacity = '0';
        setTimeout(() => DOM.initOverlay.style.display = 'none', 500);

    } catch (error) {
        console.error("Initialization Error:", error);
        DOM.status.textContent = "ERROR: NEURAL_ENGINE_FAILURE // CHECK CONSOLE";
        DOM.status.style.color = "#ef4444";
        DOM.initButton.textContent = "INITIALIZATION FAILED";
    }
}

function appendMessage(role, content, imageDataUrl = null) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', role);
    
    if (imageDataUrl) {
        const img = document.createElement('img');
        img.src = imageDataUrl;
        img.classList.add('chat-image');
        msgDiv.appendChild(img);
    }

    const textSpan = document.createElement('span');
    updateMessageContent(textSpan, content);
    msgDiv.appendChild(textSpan);
    
    DOM.chatHistory.appendChild(msgDiv);
    DOM.chatHistory.scrollTop = DOM.chatHistory.scrollHeight;
    return textSpan;
}

function updateMessageContent(element, content) {
    // Clean unwanted special tokens
    const cleaned = content
        .replace(/<\|im_end\|>/g, '')
        .replace(/<\|im_start\|>/g, '')
        .replace(/<\|endoftext\|>/g, '');
    
    // Split by code blocks to avoid formatting inside code
    const parts = cleaned.split(/(```[\s\S]*?(?:```|$))/g);
    
    let html = '';
    
    parts.forEach(part => {
        if (part.startsWith('```')) {
            const match = part.match(/```([\w-]*)\n?([\s\S]*?)(?:```|$)/);
            if (match) {
                const lang = match[1];
                const code = match[2];
                const escapedCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                
                if (part.endsWith('```')) {
                    const languageLabel = lang ? lang.toUpperCase() : 'CODE';
                    html += `
<div class="code-block-wrapper">
    <div class="code-header">
        <span>${languageLabel}</span>
        <button class="copy-btn">COPY</button>
    </div>
    <pre><code>${escapedCode}</code></pre>
</div>`;
                } else {
                    html += `<pre><code>${escapedCode}</code></pre>`;
                }
            }
        } else {
            // Normal text - apply basic markdown
            let text = part;
            // Escape HTML tags to prevent rendering glitches
            text = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            // Bold
            text = text.replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--accent-green);">$1</strong>');
            // Italic
            text = text.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
            // Inline code
            text = text.replace(/`([^`]+)`/g, '<code style="background: rgba(255,255,255,0.1); padding: 2px 4px; border-radius: 4px;">$1</code>');
            
            html += text;
        }
    });
    
    element.innerHTML = html;
}

// Event Delegation for Copy Buttons
DOM.chatHistory.addEventListener('click', (e) => {
    if (e.target.classList.contains('copy-btn')) {
        const codeElement = e.target.closest('.code-block-wrapper').querySelector('code');
        navigator.clipboard.writeText(codeElement.innerText).then(() => {
            const btn = e.target;
            const originalText = btn.innerText;
            btn.innerText = 'COPIED!';
            btn.style.color = '#fff';
            btn.style.background = 'var(--accent-green)';
            setTimeout(() => {
                btn.innerText = originalText;
                btn.style.color = 'var(--accent-green)';
                btn.style.background = 'transparent';
            }, 2000);
        });
    }
});

function createThinkingIndicator() {
    const indicator = document.createElement('div');
    indicator.classList.add('message', 'assistant', 'thinking-indicator');
    indicator.innerHTML = `
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
    `;
    DOM.chatHistory.appendChild(indicator);
    DOM.chatHistory.scrollTop = DOM.chatHistory.scrollHeight;
    return indicator;
}

// Handle Image Selection
DOM.uploadButton.addEventListener('click', () => DOM.imageInput.click());

// Downscale image to prevent WebGPU std::bad_alloc out-of-memory errors
function downscaleImage(dataUrl, maxWidth = 512, maxHeight = 512) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            let width = img.width;
            let height = img.height;

            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.8)); // Compress slightly
        };
        img.src = dataUrl;
    });
}

DOM.imageInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        // Downscale before saving to state
        currentImage = await downscaleImage(e.target.result);
        DOM.imagePreview.src = currentImage;
        DOM.imagePreviewContainer.style.display = 'flex';
        DOM.uploadButton.classList.add('active');
    };
    reader.readAsDataURL(file);
});

DOM.removeImage.addEventListener('click', () => {
    currentImage = null;
    DOM.imageInput.value = '';
    DOM.imagePreviewContainer.style.display = 'none';
    DOM.uploadButton.classList.remove('active');
});

// Handle Reset Session
DOM.resetButton.addEventListener('click', () => {
    messages = [getSystemPrompt()];
    DOM.chatHistory.innerHTML = '';
    DOM.metricsContainer.style.display = 'none';
    currentImage = null;
    DOM.imageInput.value = '';
    DOM.imagePreviewContainer.style.display = 'none';
    DOM.uploadButton.classList.remove('active');
    appendMessage('assistant', "SESSION_PURGED. MEMORY_CLEARED. READY_FOR_INPUT.");
});

async function handleGenerate() {
    const prompt = DOM.input.value.trim();
    if (!prompt || !model || !processor) return;

    const imageDataUrl = currentImage;
    
    // 1. Add user message
    appendMessage('user', prompt, imageDataUrl);
    
    const userMessage = {
        role: 'user',
        content: imageDataUrl 
            ? [{ type: 'image' }, { type: 'text', text: prompt }]
            : prompt
    };
    messages.push(userMessage);
    
    // UI Reset
    DOM.input.value = '';
    DOM.input.style.height = 'auto';
    DOM.input.disabled = true;
    DOM.button.disabled = true;
    DOM.uploadButton.disabled = true;
    DOM.resetButton.disabled = true;
    DOM.status.textContent = "EXECUTING_NEURAL_FORWARDS...";
    DOM.metricsContainer.style.display = 'none';
    
    currentImage = null;
    DOM.imageInput.value = '';
    DOM.imagePreviewContainer.style.display = 'none';
    DOM.uploadButton.classList.remove('active');

    // 2. Add Thinking Indicator
    const thinkingIndicator = createThinkingIndicator();
    
    let assistantResponse = '';
    let assistantTextSpan = null;

    // Metrics tracking
    const startTime = performance.now();
    let firstTokenTime = null;
    let tokenCount = 0;

    try {
        const text = processor.apply_chat_template(messages, {
            tokenize: false,
            add_generation_prompt: true,
        });

        let inputs;
        if (imageDataUrl) {
            const image = await RawImage.read(imageDataUrl);
            inputs = await processor(text, [image]);
        } else {
            inputs = await processor(text);
        }

        const streamer = new TextStreamer(processor.tokenizer, {
            skip_prompt: true,
            skip_special_tokens: false,
            callback_function: (text) => {
                if (firstTokenTime === null) {
                    firstTokenTime = performance.now();
                    const ttft = ((firstTokenTime - startTime) / 1000).toFixed(2);
                    DOM.metricTtft.textContent = `${ttft}s`;
                    DOM.metricsContainer.style.display = 'flex';
                }

                tokenCount++;
                
                // If it's the first token, remove thinking indicator and create assistant bubble
                if (assistantTextSpan === null) {
                    thinkingIndicator.remove();
                    assistantTextSpan = appendMessage('assistant', '');
                }
                
                assistantResponse += text;
                updateMessageContent(assistantTextSpan, assistantResponse);
                DOM.chatHistory.scrollTop = DOM.chatHistory.scrollHeight;

                // Update speed metrics
                if (firstTokenTime !== null) {
                    const elapsedSinceFirst = (performance.now() - firstTokenTime) / 1000;
                    if (elapsedSinceFirst > 0.1) {
                        const speed = (tokenCount / elapsedSinceFirst).toFixed(1);
                        DOM.metricSpeed.textContent = `${speed} t/s`;
                        DOM.metricTokens.textContent = tokenCount;
                    }
                }
            },
        });

        await model.generate({
            ...inputs,
            max_new_tokens: 512,
            do_sample: true,
            temperature: 0.6,
            top_k: 20,
            top_p: 0.95,
            streamer,
        });

        // Ensure special tokens are stripped from final state
        const finalCleaned = assistantResponse
            .replace(/<\|im_end\|>/g, '')
            .replace(/<\|im_start\|>/g, '')
            .replace(/<\|endoftext\|>/g, '');
            
        messages.push({ role: 'assistant', content: finalCleaned });

    } catch (error) {
        console.error("Generation Error:", error);
        thinkingIndicator.remove();
        appendMessage('assistant', "[ERROR: INFERENCE_FAILURE]");
    } finally {
        DOM.status.textContent = "NEURAL_ENGINE_READY // WEBGPU_ACTIVE";
        DOM.input.disabled = false;
        DOM.button.disabled = false;
        DOM.uploadButton.disabled = false;
        DOM.resetButton.disabled = false;
        DOM.input.focus();
    }
}

DOM.button.addEventListener('click', handleGenerate);
DOM.input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleGenerate();
    }
});

DOM.input.addEventListener('input', () => {
    DOM.input.style.height = 'auto';
    DOM.input.style.height = (DOM.input.scrollHeight) + 'px';
});

async function checkCache() {
    try {
        const cache = await caches.open('transformers-cache');
        const keys = await cache.keys();
        return keys.some(req => req.url.includes(MODEL_ID) || req.url.includes(MODEL_ID.replace('/', '%2F')));
    } catch {
        return false;
    }
}

async function setupStartup() {
    if (!navigator.gpu) {
        DOM.initButton.disabled = true;
        DOM.initButton.textContent = "UNSUPPORTED DEVICE";
        DOM.status.textContent = "ERROR: WEBGPU_NOT_FOUND";
        DOM.status.style.color = "#ef4444";
        const warning = document.querySelector('.size-warning');
        if (warning) {
            warning.textContent = "WebGPU is not supported on this browser/device. Please use Chrome/Edge on a desktop.";
            warning.style.color = "#ef4444";
        }
    } else {
        const isCached = await checkCache();
        if (isCached) {
            DOM.initButton.style.display = 'none';
            const warning = document.querySelector('.size-warning');
            if (warning) {
                warning.textContent = "Model found in local cache. Auto-starting...";
                warning.style.color = "#10b981";
            }
            initializeModel();
        } else {
            DOM.initButton.addEventListener('click', initializeModel);
        }
    }
}

initBackground();
setupStartup();
