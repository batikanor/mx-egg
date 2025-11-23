export function createVirtualConsole(mxInstance) {
    // 1. Inject CSS
    if (!document.getElementById('vc-styles')) {
        const style = document.createElement('style');
        style.id = 'vc-styles';
        style.textContent = `
            /* Virtual Console CSS */
            .vc-toggle-btn {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #333;
                color: #fff;
                border: 1px solid rgba(255,255,255,0.2);
                padding: 12px 24px;
                border-radius: 50px;
                cursor: pointer;
                font-weight: 600;
                z-index: 9999;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                font-family: 'Poppins', sans-serif;
                transition: all 0.2s;
            }
            .vc-toggle-btn:hover { background: #444; transform: scale(1.05); }

            .virtual-console {
                position: fixed;
                bottom: 80px;
                right: 20px;
                background: #1a1a1a;
                border: 1px solid #333;
                border-radius: 16px;
                padding: 20px;
                box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                z-index: 10000;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 20px;
                transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease;
                transform-origin: bottom right;
                font-family: 'Poppins', sans-serif;
            }
            .virtual-console.hidden {
                transform: scale(0.9) translateY(20px);
                opacity: 0;
                pointer-events: none;
            }
            .vc-header {
                font-size: 14px;
                font-weight: 600;
                color: #888;
                width: 100%;
                text-align: center;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .vc-close { cursor: pointer; padding: 4px; }
            .vc-close:hover { color: #fff; }
            .vc-device {
                display: flex;
                flex-direction: column;
                gap: 16px;
                background: #111;
                padding: 16px;
                border-radius: 12px;
                border: 1px solid #333;
            }
            .vc-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 8px;
            }
            .vc-key {
                width: 60px;
                height: 60px;
                background: #000;
                border-radius: 8px;
                border: 2px solid #333;
                position: relative;
                cursor: pointer;
                overflow: hidden;
                transition: all 0.1s;
            }
            .vc-key:active, .vc-key.pressed {
                border-color: #00b8fc;
                transform: scale(0.95);
            }
            .vc-key canvas, .vc-key img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
            }
            .vc-paging {
                display: flex;
                justify-content: center;
                gap: 12px;
            }
            .vc-btn {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: #222;
                border: 1px solid #333;
                color: #888;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.1s;
                user-select: none;
                font-size: 18px;
            }
            .vc-btn:active, .vc-btn.pressed {
                background: #333;
                color: #fff;
                transform: scale(0.95);
            }
        `;
        document.head.appendChild(style);
    }

    // 2. Inject HTML
    if (document.getElementById('virtualConsole')) return;

    const container = document.createElement('div');
    container.innerHTML = `
        <button id="vcToggleBtn" class="vc-toggle-btn">Show Console View</button>
        <div id="virtualConsole" class="virtual-console hidden">
            <div class="vc-header">
                <span>MX Creative Keypad</span>
                <span class="vc-close" id="vcCloseBtn">×</span>
            </div>
            <div class="vc-device">
                <div class="vc-grid" id="vcGrid"></div>
                <div class="vc-paging">
                    <div class="vc-btn" data-key="9">←</div>
                    <div class="vc-btn" data-key="10">→</div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(container);

    const toggleBtn = document.getElementById('vcToggleBtn');
    const virtualConsole = document.getElementById('virtualConsole');
    const closeBtn = document.getElementById('vcCloseBtn');
    const vcGrid = document.getElementById('vcGrid');

    // Create keys
    for (let i = 0; i < 9; i++) {
        const key = document.createElement('div');
        key.className = 'vc-key';
        key.dataset.key = i;
        vcGrid.appendChild(key);
    }

    // Toggle Logic
    toggleBtn.addEventListener('click', () => {
        virtualConsole.classList.remove('hidden');
        toggleBtn.style.opacity = '0';
        toggleBtn.style.pointerEvents = 'none';
    });
    
    closeBtn.addEventListener('click', () => {
        virtualConsole.classList.add('hidden');
        toggleBtn.style.opacity = '1';
        toggleBtn.style.pointerEvents = 'auto';
    });

    // 3. Logic
    const pressedKeys = new Set();
    
    function simulateInput(key, down) {
        if (down) {
            if (!pressedKeys.has(key)) {
                pressedKeys.add(key);
                // Dispatch event on mx instance so game picks it up
                mxInstance.dispatchEvent(new CustomEvent('keydown', { detail: { key } }));
            }
        } else {
            if (pressedKeys.has(key)) {
                pressedKeys.delete(key);
                mxInstance.dispatchEvent(new CustomEvent('keyup', { detail: { key } }));
            }
        }
    }

    // Bind Interaction Events (Mouse/Touch) to Keys and Buttons
    const bindEvents = (el, key) => {
        el.addEventListener('mousedown', (e) => { e.preventDefault(); simulateInput(key, true); });
        el.addEventListener('mouseup', (e) => { e.preventDefault(); simulateInput(key, false); });
        el.addEventListener('mouseleave', (e) => { 
             if (pressedKeys.has(key)) simulateInput(key, false); 
        });
        el.addEventListener('touchstart', (e) => { e.preventDefault(); simulateInput(key, true); });
        el.addEventListener('touchend', (e) => { e.preventDefault(); simulateInput(key, false); });
    };

    // Grid Keys
    Array.from(vcGrid.children).forEach(el => {
        bindEvents(el, parseInt(el.dataset.key));
    });

    // Paging Buttons
    document.querySelectorAll('.vc-btn').forEach(el => {
        bindEvents(el, parseInt(el.dataset.key));
    });

    // 4. Listen to MX Events
    
    // Highlight keys on press (physical or simulated)
    mxInstance.addEventListener('keydown', (e) => {
        const k = e.detail.key;
        const el = (k < 9) ? vcGrid.children[k] : document.querySelector(`.vc-btn[data-key="${k}"]`);
        if (el) el.classList.add('pressed');
    });

    mxInstance.addEventListener('keyup', (e) => {
        const k = e.detail.key;
        const el = (k < 9) ? vcGrid.children[k] : document.querySelector(`.vc-btn[data-key="${k}"]`);
        if (el) el.classList.remove('pressed');
    });

    // Update Images
    mxInstance.addEventListener('keyimage', (e) => {
        const { keyIndex, imageBlob } = e.detail;
        
        // Handle Full Screen Update (-1)
        if (keyIndex === -1) {
            const imgUrl = URL.createObjectURL(imageBlob);
            const fullImg = new Image();
            fullImg.src = imgUrl;
            fullImg.onload = () => {
                // Slice and dice
                // Image is 434x434. 
                // Key size: 118x118. Gaps: 40px.
                // Offsets: col*(118+40), row*(118+40)
                
                // Temporary canvas to slice
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = 118;
                tempCanvas.height = 118;
                const tCtx = tempCanvas.getContext('2d');
                
                for (let row = 0; row < 3; row++) {
                    for (let col = 0; col < 3; col++) {
                        const index = row * 3 + col;
                        const el = vcGrid.children[index];
                        if (!el) continue;
                        
                        const sx = col * (118 + 40);
                        const sy = row * (118 + 40);
                        
                        tCtx.drawImage(fullImg, sx, sy, 118, 118, 0, 0, 118, 118);
                        
                        // Convert slice to blob/url
                        // Doing toDataURL for simplicity here as it's synchronous enough for 9 keys
                        const sliceUrl = tempCanvas.toDataURL('image/jpeg');
                        
                        el.innerHTML = '';
                        const imgEl = document.createElement('img');
                        imgEl.src = sliceUrl;
                        el.appendChild(imgEl);
                    }
                }
                URL.revokeObjectURL(imgUrl);
            };
            return;
        }

        if (keyIndex < 0 || keyIndex > 8) return;
        
        const el = vcGrid.children[keyIndex];
        if (!el) return;

        // Create an image element or update existing
        const imgUrl = URL.createObjectURL(imageBlob);
        
        // Clear previous content
        el.innerHTML = '';
        const img = document.createElement('img');
        img.src = imgUrl;
        img.onload = () => URL.revokeObjectURL(imgUrl); // GC
        el.appendChild(img);
    });
}

