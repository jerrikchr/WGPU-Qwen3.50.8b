export function initBackground() {
    // Create the container
    const bgContainer = document.createElement('div');
    bgContainer.id = 'ambient-bg';
    document.body.insertBefore(bgContainer, document.body.firstChild);

    // SVG shapes representing Transformer / AI concepts
    const shapes = [
        // Mixture of Experts (MoE) Node
        `<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="60" cy="60" r="20" stroke="var(--accent-purple)" stroke-width="2" fill="rgba(124, 58, 237, 0.1)"/>
            <circle cx="20" cy="20" r="10" stroke="var(--accent-green)" stroke-width="2"/>
            <circle cx="100" cy="20" r="10" stroke="var(--accent-green)" stroke-width="2"/>
            <circle cx="20" cy="100" r="10" stroke="var(--accent-green)" stroke-width="2"/>
            <circle cx="100" cy="100" r="10" stroke="var(--accent-green)" stroke-width="2"/>
            <path d="M50 50 L27 27 M70 50 L93 27 M50 70 L27 93 M70 70 L93 93" stroke="rgba(255,255,255,0.2)" stroke-width="2" stroke-dasharray="4 4"/>
        </svg>`,
        
        // Multi-Head Attention Block
        `<svg width="100" height="140" viewBox="0 0 100 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="10" width="80" height="120" rx="10" fill="rgba(16,185,129,0.05)" stroke="var(--accent-green)" stroke-width="2"/>
            <rect x="20" y="30" width="60" height="20" rx="4" fill="rgba(255,255,255,0.1)"/>
            <rect x="20" y="60" width="60" height="20" rx="4" fill="rgba(255,255,255,0.1)"/>
            <rect x="20" y="90" width="60" height="20" rx="4" fill="rgba(255,255,255,0.1)"/>
        </svg>`,
        
        // Data Flow Rings
        `<svg width="150" height="150" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="75" cy="75" r="60" stroke="rgba(255,255,255,0.1)" stroke-width="1" stroke-dasharray="5 5"/>
            <circle cx="75" cy="75" r="45" stroke="var(--accent-green)" stroke-width="1" stroke-dasharray="10 10" opacity="0.5"/>
            <circle cx="75" cy="75" r="30" stroke="var(--accent-purple)" stroke-width="2" opacity="0.3"/>
        </svg>`,
        
        // Neural Link Matrix
        `<svg width="200" height="100" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="50" r="8" fill="var(--accent-green)"/>
            <circle cx="100" cy="20" r="12" fill="rgba(124,58,237,0.2)" stroke="var(--accent-purple)" stroke-width="2"/>
            <circle cx="180" cy="70" r="10" fill="rgba(16,185,129,0.2)" stroke="var(--accent-green)" stroke-width="2"/>
            <path d="M28 50 Q 60 50 90 26" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
            <path d="M110 26 Q 140 26 172 65" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
        </svg>`
    ];

    const elements = [];
    const numElements = 20;

    // Generate floating elements
    for(let i = 0; i < numElements; i++) {
        const wrapper = document.createElement('div');
        wrapper.className = 'parallax-wrapper';
        
        const el = document.createElement('div');
        el.className = 'floating-svg';
        el.innerHTML = shapes[i % shapes.length];
        
        // Randomize position
        const x = Math.random() * 90; // vw
        const y = Math.random() * 90; // vh
        
        // Depth determines scale, blur, and parallax speed (simulating 3D space)
        const depth = Math.random() * 0.8 + 0.2; 
        
        wrapper.style.left = `${x}vw`;
        wrapper.style.top = `${y}vh`;
        
        el.style.transform = `scale(${depth})`;
        el.style.opacity = depth * 0.6; // Closer = more opaque
        
        // Apply depth of field blur (items further away are blurrier)
        const blurAmount = Math.max(0, (1 - depth) * 6);
        el.style.filter = `blur(${blurAmount}px)`;
        
        // Randomize floating animation
        const duration = Math.random() * 15 + 15;
        const delay = Math.random() * -30;
        el.style.animation = `float-svg ${duration}s infinite ease-in-out alternate`;
        el.style.animationDelay = `${delay}s`;

        // Store speed for parallax
        wrapper.dataset.speed = depth; 
        
        wrapper.appendChild(el);
        bgContainer.appendChild(wrapper);
        elements.push(wrapper);
    }

    // --- Interactive Mouse Parallax ---
    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;

    window.addEventListener('mousemove', (e) => {
        // Normalize mouse coordinates from -1 to 1
        mouseX = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
        mouseY = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
    });

    function animateParallax() {
        // Smooth interpolation (lerp)
        currentX += (mouseX - currentX) * 0.05;
        currentY += (mouseY - currentY) * 0.05;

        elements.forEach(wrapper => {
            const speed = parseFloat(wrapper.dataset.speed);
            // Move opposite to mouse direction
            const xOffset = currentX * speed * -60; 
            const yOffset = currentY * speed * -60;
            
            wrapper.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
        });

        requestAnimationFrame(animateParallax);
    }

    animateParallax();
}
