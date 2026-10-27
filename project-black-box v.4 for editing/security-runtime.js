// Runtime Security Enhancement Layer 2
// Advanced Protection for Grand RP Ads Generator
(function() {
    'use strict';
    
    // Obfuscated security layer
    const _$advanced = {
        _initialized: false,
        _checksum: null,
        _startTime: Date.now(),
        
        init: function() {
            if (this._initialized) return;
            this._initialized = true;
            this.deploySecurityMeasures();
        },
        
        deploySecurityMeasures: function() {
            this.protectClipboardAdvanced();
            this.monitorNetworkTraffic();
            this.detectCodeInjection();
            this.monitorPagePerformance();
            this.setupIntegrityChecks();
        },
        
        protectClipboardAdvanced: function() {
            if (navigator.clipboard?.writeText) {
                const originalWrite = navigator.clipboard.writeText;
                navigator.clipboard.writeText = function(text) {
                    if (!text || text.includes('function') || text.includes('const ') || text.includes('var ')) {
                        throw new Error('Unauthorized clipboard access');
                    }
                    return originalWrite.call(this, text);
                };
            }
        },
        
        monitorNetworkTraffic: function() {
            // Network monitoring disabled - all requests allowed
        },
        
        detectCodeInjection: function() {
            new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1 && node.tagName === 'SCRIPT') {
                            const src = node.src || '';
                            const allowedSources = ['scripts.js', 'protection.js', 'security-runtime.js', 'cdnjs.cloudflare.com'];
                            if (!allowedSources.some(allowed => src.includes(allowed)) && src !== '') {
                                node.remove();
                                this.showSecurityAlert('Script injection blocked');
                            }
                        }
                    });
                });
            }).observe(document.documentElement, { childList: true, subtree: true });
        },
        
        monitorPagePerformance: function() {
            let performanceBaseline = performance.now();
            setInterval(() => {
                const current = performance.now();
                const delta = current - performanceBaseline;
                if (delta > 5000) { // Unusual delays might indicate analysis tools
                    this.showSecurityAlert('Performance anomaly detected');
                }
                performanceBaseline = current;
            }, 2000);
        },
        
        setupIntegrityChecks: function() {
            const criticalElements = ['nav', '.container', 'footer'];
            const originalStructure = {};
            
            criticalElements.forEach(selector => {
                const element = document.querySelector(selector);
                if (element) {
                    originalStructure[selector] = element.outerHTML.length;
                }
            });
            
            setInterval(() => {
                criticalElements.forEach(selector => {
                    const element = document.querySelector(selector);
                    if (element && originalStructure[selector]) {
                        const currentLength = element.outerHTML.length;
                        const difference = Math.abs(currentLength - originalStructure[selector]);
                        if (difference > originalStructure[selector] * 0.2) {
                            this.showSecurityAlert('DOM structure integrity compromised');
                        }
                    }
                });
            }, 4000);
        },
        
        showSecurityAlert: function(message) {
            const alertDiv = document.createElement('div');
            alertDiv.style.cssText = `
                position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                background: linear-gradient(45deg, #e74c3c, #c0392b); color: white;
                padding: 30px; border-radius: 15px; z-index: 99999;
                font-size: 18px; font-weight: bold; text-align: center;
                box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                user-select: none; pointer-events: auto;
            `;
            alertDiv.innerHTML = `
                <div>🛡️ SECURITY ALERT</div>
                <div style="font-size: 14px; margin-top: 10px;">${message}</div>
                <div style="font-size: 12px; margin-top: 15px; opacity: 0.8;">Application will reload in 3 seconds...</div>
            `;
            document.body.appendChild(alertDiv);
            
            setTimeout(() => {
                window.location.reload();
            }, 3000);
        }
    };
    
    // Initialize when ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => _$advanced.init());
    } else {
        _$advanced.init();
    }
    
    // Prevent tampering
    Object.freeze(_$advanced);
    
})();

