// Advanced Web Protection System
// Copyright Protection & Anti-Cloning Measures
(function () {
	"use strict";

	// Obfuscated constants
	const _0x1a2b = [
		"contextmenu",
		"selectstart",
		"dragstart",
		"keydown",
		"devtools",
		"copy",
		"F12",
		"Ctrl+Shift+I",
		"Ctrl+U",
	];
	const _0x3c4d = {
		watermark: "© 2025 Grand RP Ads Generator - Protected Content",
		domain: window.location.hostname,
		title: document.title,
	};

	// Anti-debugging measures
	let devtools = { open: false, orientation: null };
	const threshold = 160;

	// Advanced DevTools Detection
	function detectDevTools() {
		if (
			window.outerHeight - window.innerHeight > threshold ||
			window.outerWidth - window.innerWidth > threshold
		) {
			if (!devtools.open) {
				devtools.open = true;
				handleDevToolsOpen();
			}
		} else {
			devtools.open = false;
		}
	}

	function handleDevToolsOpen() {
		console.clear();
		console.log(
			"%c🛡️ PROTECTION ACTIVE 🛡️",
			"color: red; font-size: 20px; font-weight: bold;"
		);
		console.log(
			"%cThis application is protected against unauthorized copying.",
			"color: orange; font-size: 14px;"
		);
		console.log(
			"%cAccess to source code is restricted.",
			"color: orange; font-size: 14px;"
		);

		// Advanced anti-debugging
		document.body.innerHTML =
			'<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#000;color:#ff0000;font-family:monospace;font-size:24px;text-align:center;">🛡️<br>DEVELOPER TOOLS DETECTED<br><span style="font-size:16px;color:#fff;">Please close developer tools to continue</span></div>';

		setTimeout(() => {
			if (devtools.open) {
				window.location.reload();
			}
		}, 3000);
	}

	// Disable right-click context menu
	function disableContextMenu(e) {
		e.preventDefault();
		showWarning("Right-click is disabled for content protection");
		return false;
	}

	// Disable text selection
	function disableSelection(e) {
		e.preventDefault();
		return false;
	}

	// Disable drag and drop
	function disableDragStart(e) {
		e.preventDefault();
		return false;
	}

	// Advanced keyboard shortcut blocking
	function blockKeyShortcuts(e) {
		// F12 - Developer Tools
		if (e.keyCode === 123) {
			e.preventDefault();
			showWarning("Developer tools access is restricted");
			return false;
		}

		// Ctrl+Shift+I - Developer Tools
		if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
			e.preventDefault();
			showWarning("Developer tools access is restricted");
			return false;
		}

		// Ctrl+Shift+J - Console
		if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
			e.preventDefault();
			showWarning("Console access is restricted");
			return false;
		}

		// Ctrl+U - View Source
		if (e.ctrlKey && e.keyCode === 85) {
			e.preventDefault();
			showWarning("View source is disabled for content protection");
			return false;
		}

		// Ctrl+S - Save Page
		if (e.ctrlKey && e.keyCode === 83) {
			e.preventDefault();
			showWarning("Saving is disabled for content protection");
			return false;
		}

		// Ctrl+A - Select All (in sensitive areas)
		if (e.ctrlKey && e.keyCode === 65) {
			const isCode =
				e.target.tagName === "SCRIPT" ||
				e.target.className.includes("output-area");
			if (isCode) {
				e.preventDefault();
				return false;
			}
		}

		// Ctrl+C on sensitive content
		if (e.ctrlKey && e.keyCode === 67) {
			const selection = window.getSelection().toString();
			if (
				selection.includes("function") ||
				selection.includes("var ") ||
				selection.includes("const ")
			) {
				e.preventDefault();
				showWarning("Copying source code is not allowed");
				return false;
			}
		}
	}

	// Show warning notification
	function showWarning(message) {
		const existing = document.querySelector(".protection-warning");
		if (existing) existing.remove();

		const warning = document.createElement("div");
		warning.className = "protection-warning";
		warning.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 9999;
            background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
            color: white; padding: 15px 20px; border-radius: 10px;
            box-shadow: 0 10px 30px rgba(255, 107, 107, 0.3);
            font-weight: 600; font-size: 14px; max-width: 300px;
            transform: translateX(400px); transition: transform 0.3s ease;
            border-left: 4px solid #ff4757;
        `;
		warning.innerHTML = `🛡️ ${message}`;

		document.body.appendChild(warning);
		setTimeout(() => (warning.style.transform = "translateX(0)"), 10);
		setTimeout(() => {
			warning.style.transform = "translateX(400px)";
			setTimeout(() => warning.remove(), 300);
		}, 3000);
	}

	// Console protection
	function protectConsole() {
		// Override console methods
		const originalLog = console.log;
		const originalWarn = console.warn;
		const originalError = console.error;

		console.log =
			console.warn =
			console.error =
			console.info =
			console.debug =
				function () {
					showWarning("Console access is restricted");
				};

		// Restore console for legitimate app use
		window._console = {
			log: originalLog,
			warn: originalWarn,
			error: originalError,
		};
	}

	// Domain validation - DISABLED
	function validateDomain() {
		// Domain validation disabled - all domains allowed
		return true;
	}

	// Code obfuscation detector
	function detectCodeTheft() {
		const scripts = document.querySelectorAll("script");
		const originalCount = scripts.length;

		// Check if external scripts are being injected
		setInterval(() => {
			const currentScripts = document.querySelectorAll("script");
			if (currentScripts.length !== originalCount) {
				showWarning("Unauthorized script injection detected");
				window.location.reload();
			}
		}, 2000);
	}

	// Advanced content protection
	function protectContent() {
		// Disable printing
		window.addEventListener("beforeprint", (e) => {
			e.preventDefault();
			showWarning("Printing is disabled for content protection");
			return false;
		});

		// Disable screenshot attempts (limited effectiveness)
		document.addEventListener("keyup", (e) => {
			if (e.key === "PrintScreen") {
				showWarning("Screenshots may violate content protection");
			}
		});

		// Protect against iframe embedding
		if (window !== window.top) {
			document.body.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#000;color:#ff0000;font-family:monospace;text-align:center;">
                    <div>
                        <h1>🚫 EMBEDDING NOT ALLOWED</h1>
                        <p>This application cannot be embedded in iframes.</p>
                    </div>
                </div>
            `;
			return;
		}
	}

	// Watermark system
	function createWatermark() {
		const watermark = document.createElement("div");
		watermark.style.cssText = `
            position: fixed; bottom: 10px; right: 10px; z-index: 9998;
            opacity: 0.1; pointer-events: none; color: #666;
            font-size: 10px; font-family: monospace; transform: rotate(-45deg);
            user-select: none; -webkit-user-select: none; -moz-user-select: none;
        `;
		watermark.innerHTML =
			_0x3c4d.watermark + " - " + new Date().getFullYear();
		document.body.appendChild(watermark);

		// Background watermark
		const bgWatermark = document.createElement("div");
		bgWatermark.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg);
            z-index: -1; opacity: 0.03; pointer-events: none; color: #999;
            font-size: 72px; font-weight: bold; user-select: none; white-space: nowrap;
        `;
		bgWatermark.innerHTML = "GRAND RP ADS GENERATOR";
		document.body.appendChild(bgWatermark);
	}

	// Anti-debugger
	function antiDebugger() {
		setInterval(() => {
			debugger;
		}, 100);
	}

	// Source code scrambling
	function scrambleSource() {
		// Add fake source code comments
		const fakeComments = [
			"<!-- This is not the real source -->",
			"<!-- Decoy content for protection -->",
			"<!-- Original code is obfuscated -->",
		];

		fakeComments.forEach((comment) => {
			const div = document.createElement("div");
			div.innerHTML = comment;
			div.style.display = "none";
			document.head.appendChild(div);
		});
	}

	// Initialize all protection measures
	function initProtection() {
		if (!validateDomain()) return;

		// Set up event listeners
		document.addEventListener("contextmenu", disableContextMenu);
		document.addEventListener("selectstart", disableSelection);
		document.addEventListener("dragstart", disableDragStart);
		document.addEventListener("keydown", blockKeyShortcuts);

		// Prevent various copying methods
		document.addEventListener("copy", function (e) {
			const selection = window.getSelection().toString();
			if (
				selection.includes("function") ||
				selection.includes("const ") ||
				selection.includes("var ")
			) {
				e.clipboardData.setData(
					"text/plain",
					"Content protected by Grand RP Ads Generator Security"
				);
				e.preventDefault();
				showWarning("Source code copying is restricted");
			}
		});

		// Advanced protection measures
		detectDevTools();
		setInterval(detectDevTools, 500);
		protectConsole();
		detectCodeTheft();
		protectContent();
		createWatermark();
		scrambleSource();

		// Console warnings
		console.clear();
		console.log(
			"%c🛡️ PROTECTED APPLICATION 🛡️",
			"background: linear-gradient(90deg, #667eea, #764ba2); color: white; padding: 10px 20px; border-radius: 5px; font-size: 16px; font-weight: bold;"
		);
		console.log(
			"%cGrand RP Ads Generator Suite",
			"color: #667eea; font-size: 18px; font-weight: bold;"
		);
		console.log(
			"%c© 2025 - All Rights Reserved",
			"color: #999; font-size: 12px;"
		);
		console.log(
			"%c⚠️  WARNING: Unauthorized copying, modification, or distribution is prohibited.",
			"color: red; font-size: 14px; font-weight: bold;"
		);
		console.log(
			"%cThis application contains proprietary code and is protected by copyright law.",
			"color: orange; font-size: 12px;"
		);

		// Fake debugging info to confuse copiers
		console.log("%cDecoy Debug Info:", "color: #666; font-size: 10px;");
		console.log("Version: 3.7.2-OBFUSCATED");
		console.log(
			"Build: PROTECTED-" + Math.random().toString(36).substr(2, 9)
		);
		console.log("Hash: " + btoa(Math.random().toString()).substr(0, 32));
	}

	// Document ready check with protection
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", initProtection);
	} else {
		initProtection();
	}

	// Protect against tampering
	Object.freeze(window.console);

	// Monitor for unauthorized modifications
	const observer = new MutationObserver((mutations) => {
		mutations.forEach((mutation) => {
			if (mutation.type === "childList") {
				mutation.addedNodes.forEach((node) => {
					if (
						node.tagName === "SCRIPT" &&
						!node.src.includes("scripts.js") &&
						!node.src.includes("protection.js")
					) {
						showWarning("Unauthorized script injection detected");
						node.remove();
					}
				});
			}
		});
	});

	observer.observe(document.documentElement, {
		childList: true,
		subtree: true,
	});

	// Advanced obfuscation technique
	const _protect = () => {
		const _key = "GrandRP_Protected_" + Date.now();
		window[_key] = true;

		setTimeout(() => {
			delete window[_key];
		}, 1000);
	};

	setInterval(_protect, 1000);

	// Self-destruct if tampered with
	let integrityHash = btoa(document.documentElement.outerHTML.slice(0, 1000));
	setInterval(() => {
		const currentHash = btoa(
			document.documentElement.outerHTML.slice(0, 1000)
		);
		if (
			currentHash !== integrityHash &&
			document.body.children.length > 10
		) {
			// Only trigger if significant changes detected
			const changeRatio =
				Math.abs(currentHash.length - integrityHash.length) /
				integrityHash.length;
			if (changeRatio > 0.1) {
				console.warn(
					"Integrity check failed - potential tampering detected"
				);
				showWarning("Content integrity compromised");
			}
		}
		integrityHash = currentHash;
	}, 5000);
})();

// Additional Protection Layer - CSS Injection Prevention
(function () {
	const originalSetAttribute = Element.prototype.setAttribute;
	Element.prototype.setAttribute = function (name, value) {
		if (name === "style" && typeof value === "string") {
			if (value.includes("display:") && value.includes("none")) {
				console.warn("Suspicious style modification detected");
				return;
			}
		}
		return originalSetAttribute.call(this, name, value);
	};
})();

// URL Tampering Protection
(function () {
	const originalURL = window.location.href;
	setInterval(() => {
		if (
			window.location.href !== originalURL &&
			!window.location.href.includes("#")
		) {
			showWarning("URL tampering detected");
			window.location.href = originalURL;
		}
	}, 1000);
})();
