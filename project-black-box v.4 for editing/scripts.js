document.addEventListener("DOMContentLoaded", () => {
	// --- AUTHENTICATION SYSTEM ---
	const loginOverlay = document.getElementById("loginOverlay");
	const userLoginCard = document.getElementById("userLoginCard");
	const loginUser = document.getElementById("loginUser");
	const loginPass = document.getElementById("loginPass");
	const loginBtn = document.getElementById("loginBtn");
	const loginError = document.getElementById("loginError");
	const logoutBtn = document.getElementById("logoutBtn");

	const USER_CREDENTIALS = { username: "sks125", password: "15567" };

	function initAuth() {
		const lockoutUntil = localStorage.getItem("lockoutUntil");
		if (lockoutUntil && Date.now() < parseInt(lockoutUntil)) {
			lockSystem(parseInt(lockoutUntil) - Date.now());
			return;
		}

		const attempts = parseInt(sessionStorage.getItem("failedLoginAttempts") || "0");
		if (attempts >= 5) {
			handleThresholdReached();
			return;
		}

		const session = sessionStorage.getItem("isLoggedIn");
		if (session === "true") {
			hideLogin();
		} else {
			showLogin();
		}

		// Enforce login on hash change or navigation
		window.addEventListener("hashchange", () => {
			if (sessionStorage.getItem("isLoggedIn") !== "true") {
				showLogin();
			}
		});

		// Periodically check session to ensure overlay hasn't been tampered with
		setInterval(() => {
			if (sessionStorage.getItem("isLoggedIn") !== "true" && loginOverlay.classList.contains("hidden")) {
				showLogin();
			}
		}, 2000);
	}

	function showLogin() {
		loginOverlay.classList.remove("hidden");
		userLoginCard.classList.remove("hidden");
	}

	function hideLogin() {
		loginOverlay.classList.add("hidden");
	}

	function handleLogin() {
		const u = loginUser.value.trim();
		const p = loginPass.value.trim();

		if (u === USER_CREDENTIALS.username && p === USER_CREDENTIALS.password) {
			sessionStorage.setItem("isLoggedIn", "true");
			sessionStorage.removeItem("failedLoginAttempts");
			hideLogin();
			showNotification("Access Granted. Welcome!");
		} else {
			let attempts = parseInt(sessionStorage.getItem("failedLoginAttempts") || "0");
			attempts++;
			sessionStorage.setItem("failedLoginAttempts", attempts);

			loginError.textContent = `Invalid credentials. Attempt ${attempts}/5`;
			loginError.classList.remove("hidden");
			setTimeout(() => loginError.classList.add("hidden"), 3000);

			if (attempts >= 5) {
				handleThresholdReached();
			}
		}
	}

	function handleThresholdReached() {
		sessionStorage.removeItem("failedLoginAttempts");
		const lockoutDuration = 30 * 60 * 1000; // 30 minutes
		const lockoutUntil = Date.now() + lockoutDuration;
		localStorage.setItem("lockoutUntil", lockoutUntil);
		lockSystem(lockoutDuration);
	}

	function lockSystem(durationMs) {
		// Remove existing overlay if any
		const existing = document.getElementById("lockdownOverlay");
		if (existing) existing.remove();

		const lockdownOverlay = document.createElement("div");
		lockdownOverlay.id = "lockdownOverlay";
		lockdownOverlay.style.cssText = `
			position: fixed; top: 0; left: 0; width: 100%; height: 100%;
			background: radial-gradient(circle, #1a1a1a 0%, #000000 100%);
			z-index: 10000; display: flex; flex-direction: column;
			align-items: center; justify-content: center; color: #ff4d4d;
			font-family: 'Segoe UI', Roboto, sans-serif; text-align: center;
			padding: 40px;
		`;

		lockdownOverlay.innerHTML = `
			<div style="padding: 40px; background: rgba(255, 255, 255, 0.05); border: 2px solid #ff4d4d; border-radius: 20px; box-shadow: 0 0 50px rgba(255, 77, 77, 0.2); backdrop-filter: blur(10px); max-width: 500px;">
				<i class="fas fa-clock" style="font-size: 80px; margin-bottom: 25px; filter: drop-shadow(0 0 15px #ff4d4d);"></i>
				<h1 style="font-size: 36px; font-weight: 800; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 5px;">System Locked</h1>
				<p style="font-size: 18px; color: #ffffff; margin-bottom: 20px;">Multiple failed login attempts detected. Access has been restricted for 30 minutes.</p>
				
				<div style="background: rgba(0,0,0,0.3); padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid rgba(255, 77, 77, 0.3);">
					<p style="font-size: 14px; color: #888888; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 2px;">Time Remaining</p>
					<div id="countdownTimer" style="font-size: 48px; font-weight: 700; font-family: monospace; color: #ff4d4d;">30:00</div>
				</div>

				<p style="font-size: 14px; color: #ff4d4d; animation: pulse 1.5s infinite;">Security enforcement active. Tab closure pending.</p>
			</div>
			<style>
				@keyframes pulse {
					0% { opacity: 1; }
					50% { opacity: 0.5; }
					100% { opacity: 1; }
				}
				body { overflow: hidden !important; }
			</style>
		`;
		document.body.appendChild(lockdownOverlay);

		const timerDisplay = document.getElementById("countdownTimer");
		let remainingMs = durationMs;

		const updateTimer = () => {
			if (remainingMs <= 0) {
				clearInterval(timerInterval);
				localStorage.removeItem("lockoutUntil");
				sessionStorage.removeItem("failedLoginAttempts");
				location.reload();
				return;
			}

			const minutes = Math.floor(remainingMs / 60000);
			const seconds = Math.floor((remainingMs % 60000) / 1000);
			timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
			remainingMs -= 1000;
		};

		updateTimer();
		const timerInterval = setInterval(updateTimer, 1000);

		// Tab closure attempt after initial delay
		setTimeout(() => {
			if (remainingMs > 60000) { // Only try to close if more than 1 min remains
				window.close();
				setTimeout(() => {
					if (window.location.href !== "about:blank") {
						window.location.href = "about:blank";
					}
				}, 5000);
			}
		}, 10000);
	}

	function handleLogout() {
		sessionStorage.removeItem("isLoggedIn");
		sessionStorage.removeItem("failedLoginAttempts");
		location.reload();
	}

	loginBtn.addEventListener("click", handleLogin);
	loginPass.addEventListener("keypress", (e) => { if (e.key === "Enter") handleLogin(); });
	logoutBtn.addEventListener("click", (e) => {
		e.preventDefault();
		handleLogout();
	});

	initAuth();

	// --- SHARED UTILITIES ---
	const themeToggle = document.getElementById("themeToggle");
	const themeIcon = document.getElementById("themeIcon");

	// Theme management
	function applyTheme(theme) {
		document.documentElement.setAttribute("data-theme", theme);
		themeIcon.className = theme === "dark" ? "fas fa-sun" : "fas fa-moon";
		localStorage.setItem("theme", theme);
	}

	themeToggle.addEventListener("click", () => {
		const newTheme =
			document.documentElement.getAttribute("data-theme") === "dark"
				? "light"
				: "dark";
		applyTheme(newTheme);
	});

	// Initial theme setup
	const savedTheme = localStorage.getItem("theme");
	const prefersDark =
		window.matchMedia &&
		window.matchMedia("(prefers-color-scheme: dark)").matches;
	applyTheme(savedTheme || (prefersDark ? "dark" : "light"));

	// Navigation
	const navLinks = document.querySelectorAll(".nav-link");
	const pages = document.querySelectorAll(".page-content");

	function switchPage(pageId) {
		pages.forEach((page) => page.classList.add("hidden"));
		navLinks.forEach((link) => link.classList.remove("active"));

		const targetPage = document.getElementById(pageId);
		const targetLink = document.querySelector(
			`.nav-link[data-page="${pageId}"]`
		);

		if (targetPage) targetPage.classList.remove("hidden");
		if (targetLink) targetLink.classList.add("active");

		// Reset scroll position
		const mainContent = document.querySelector('.main-content-scrollable');
		if (mainContent) mainContent.scrollTop = 0;

		const newHash = pageId.replace("-page", "");
		if (window.location.hash !== `#${newHash}`) {
			window.location.hash = newHash;
		}
	}

	document.body.addEventListener("click", function (e) {
		if (e.target.matches(".nav-link")) {
			e.preventDefault();
			// Click feedback: animate RGB border ring
			e.target.classList.add("clicked");
			setTimeout(() => e.target.classList.remove("clicked"), 900);
			switchPage(e.target.dataset.page);
		}
	});

	// Handle initial page load from hash or default to first page
	function handlePageLoad() {
		const initialHash = window.location.hash.substring(1);
		const pageId = initialHash ? `${initialHash}-page` : "car-ads-page";
		const targetPage = document.getElementById(pageId);
		if (targetPage) {
			switchPage(pageId);
		} else {
			switchPage("car-ads-page"); // Fallback to default
		}
	}

	handlePageLoad();
	window.addEventListener("hashchange", handlePageLoad);

	// Price formatting utility
	function formatPrice(priceInput, withCurrency = true) {
		if (!priceInput || priceInput.trim() === "") return "Negotiable";

		let input = String(priceInput).toLowerCase().trim();

		// If it's already formatted, just return it.
		if (input.startsWith("$")) {
			return priceInput;
		}

		// Handle millions and billions first as they are special text formats
		if (input.endsWith("m")) {
			const millionValue = parseFloat(input.slice(0, -1));
			return isNaN(millionValue)
				? "Negotiable"
				: withCurrency
					? `$${millionValue} Million`
					: `${millionValue} Million`;
		}
		if (input.endsWith("b")) {
			const billionValue = parseFloat(input.slice(0, -1));
			return isNaN(billionValue)
				? "Negotiable"
				: withCurrency
					? `$${billionValue} Billion`
					: `${billionValue} Billion`;
		}

		// Handle thousands and plain numbers
		let number;
		if (input.endsWith("k")) {
			number = parseFloat(input.slice(0, -1)) * 1000;
		} else {
			// Strip all non-numeric characters except a potential decimal for parsing
			number = parseFloat(input.replace(/,/g, "")); // Remove commas if user enters them
		}

		if (isNaN(number)) return "Negotiable";

		// Use German locale for dot as thousands separator
		return (withCurrency ? "$" : "") + number.toLocaleString("de-DE");
	}

	// Quantity formatting utility
	function formatQuantity(qtyInput) {
		if (!qtyInput) return qtyInput;
		// Remove existing dots to correctly parse the number, then format it.
		const number = parseFloat(String(qtyInput).replace(/\./g, ""));
		if (isNaN(number)) return qtyInput; // Return original if not a number
		return number.toLocaleString("de-DE");
	}

	// Function to handle disabling "each" checkbox if price is empty
	function handlePriceEachDisabled(priceInput, eachCheckbox) {
		const updateEachState = () => {
			const hasPrice = priceInput.value.trim() !== "";
			eachCheckbox.disabled = !hasPrice;
			if (!hasPrice) {
				eachCheckbox.checked = false;
			}
		};
		priceInput.addEventListener("input", updateEachState);
		updateEachState(); // Initial check
	}

	// Copy utility
	function copyToClipboard(text, button, callback) {
		if (!text || text.trim() === "" || text.includes("will appear here")) {
			showNotification("Nothing to copy!", "error");
			return;
		}
		navigator.clipboard
			.writeText(text)
			.then(() => {
				showNotification("Copied to clipboard!");
				if (callback) callback();
			})
			.catch((err) => {
				console.error("Failed to copy: ", err);
				showNotification("Failed to copy text.", "error");
			});
	}

	// Autocomplete utility
	window.setupAutocomplete = function setupAutocomplete(inputElement, suggestionsElement, dataList) {
		const renderSuggestions = () => {
			const value = inputElement.value.toLowerCase();
			suggestionsElement.innerHTML = "";

			const currentDataList = typeof dataList === "function" ? dataList() : dataList;

			const filtered = value
				? currentDataList.filter((item) => item.toLowerCase().includes(value))
				: currentDataList;

			if (filtered.length > 0) {
				suggestionsElement.classList.remove("hidden");
				// Limit to 100 to prevent performance issues with huge lists
				const itemsToShow = filtered.slice(0, 100);
				itemsToShow.forEach((item) => {
					const div = document.createElement("div");
					div.textContent = item;
					div.addEventListener("click", (e) => {
						inputElement.value = item;
						suggestionsElement.classList.add("hidden");
						suggestionsElement.innerHTML = "";

						// Manually dispatch an 'input' event to trigger the ad generator
						const event = new Event("input", {
							bubbles: true,
							cancelable: true,
						});
						inputElement.dispatchEvent(event);
					});
					suggestionsElement.appendChild(div);
				});
			} else {
				suggestionsElement.classList.add("hidden");
			}
		};

		inputElement.addEventListener("input", renderSuggestions);

		inputElement.addEventListener("focus", () => {
			renderSuggestions();
		});

		document.addEventListener("click", (e) => {
			if (e.target !== inputElement) {
				suggestionsElement.classList.add("hidden");
			}
		});
	}

	// Notification utility
	function showNotification(message, type = "success") {
		const existing = document.querySelector(".notification");
		if (existing) existing.remove();

		const notification = document.createElement("div");
		notification.className = `notification ${type}`;
		notification.textContent = message;

		document.body.appendChild(notification);

		setTimeout(() => {
			notification.classList.add("show");
		}, 10);

		setTimeout(() => {
			notification.classList.remove("show");
			setTimeout(() => notification.remove(), 400);
		}, 3000);
	}

	// --- CAR ADS LOGIC ---
	const carNameInput = document.getElementById("carName");
	const carNameSuggestions = document.getElementById("carNameSuggestions");
	const carTransactionBtns = document.querySelectorAll(
		".car-transaction-btn"
	);
	const carIsTradingCheckbox = document.getElementById("carIsTrading");
	const tradingCarNameGroup = document.getElementById("tradingCarNameGroup");
	const tradingCarNameInput = document.getElementById("tradingCarName");
	const tradingCarNameSuggestions = document.getElementById(
		"tradingCarNameSuggestions"
	);
	const carPriceInput = document.getElementById("carPrice");
	const carPriceLabel = document.getElementById("carPriceLabel");
	const carOutput = document.getElementById("carOutput");
	const carCopyBtn = document.getElementById("carCopyBtn");
	const carResetBtn = document.getElementById("carResetBtn");
	const fullConfigCheckbox = document.getElementById("fullConfig");
	const partialConfigCheckbox = document.getElementById("partialConfig");

	fullConfigCheckbox.addEventListener("change", () => {
		if (fullConfigCheckbox.checked) {
			partialConfigCheckbox.checked = false;
		}
		generateCarAd();
	});

	partialConfigCheckbox.addEventListener("change", () => {
		if (partialConfigCheckbox.checked) {
			fullConfigCheckbox.checked = false;
		}
		generateCarAd();
	});

	let carTransactionType = "Selling";

	const carNames = [
		"Adder",
		"Albany Cassian",
		"Alpha",
		"Annis Falcon R",
		"Annis Elegy GT",
		"Annis Vellum R-Spec",
		"Annis Monarch",
		"Annis Noctis Turbo",
		"Annis Remus S15",
		"Annis Elegy R34",
		"Annis Vireon XL",
		"Annis Boreal XR",
		"Apocalypse Impaler",
		"Apocalypse Imperator",
		"Apocalypse Issi",
		"Apocalypse Slamvan",
		"Ardent",
		"Asbo",
		"Asea",
		"Asterope",
		"Autarch",
		"Baller",
		"Baller LE LWB",
		"Baller SG",
		"Banshee",
		"Banshee 900R",
		"Beater Emperor",
		"Beater Mariachi Tornado",
		"Beater Surfer",
		"Beater Tornado",
		"Benefactor Mariner XL",
		"Benefactor Meridian Performance",
		"Benefactor Lucent R-Spec",
		"Benefactor Dubsta Blackline",
		"Benefactor GT Black Series",
		"Benefactor GT-63 (S)",
		"Benefactor Schafter V12 Sport",
		"Benefactor Apex Cabrio",
		"Benefactor Moraine GT",
		"Benefactor-AMG GT",
		"Benefactor-AMG GT 63 (S)",
		"Benefactor Avenor Sport",
		"Benefactor Valen Cabrio",
		"Benefactor Stratos Cabrio",
		"Benefactor Caldera V6",
		"Bestia GTS",
		"Bison",
		"Blade",
		"Blista",
		"Blista Kanjo",
		"Bodhi",
		"Bravado Ardent GT",
		"Bravado Obsidian R-Spec",
		"Bravado Aureon Coupe",
		"Bravado Viper 2008",
		"Brawler",
		"Brioso R/A",
		"Buccaneer",
		"Buffalo",
		"Bullet",
		"Burgerfahrzeug Club GTI",
		"Burgerfahrzeug Kestrel V8",
		"Declasse Vireo 4x4",
		"Caracara 4x4",
		"Carbonizzare",
		"Casco",
		"Cavalcade",
		"Cheburek",
		"Cheetah",
		"Cheetah Classic",
		"Chino",
		"Clique",
		"Cognoscenti",
		"Cognoscenti 55",
		"Cognoscenti Cabrio",
		"Coil Aleron Cabrio",
		"Coil Vesperon R-Spec",
		"Coil Ardent V8",
		"Coil Kestrel GT",
		"Coil Mirage R-Spec",
		"Comet",
		"Declasse Orion Evolution",
		"Comet SR",
		"Contender",
		"Coquette",
		"Coquette Blackfin",
		"Coquette Classic",
		"Coquette D10",
		"Cyclone",
		"Declasse Tessera Sport",
		"Canis Vellum XL",
		"Declasse Avenor GTS",
		"Declasse Vanta Coupe",
		"Declasse Arcadia Performance",
		"Deveste Eight",
		"Deviant",
		"Dilettante",
		"Dinka NSX 2017",
		"Dinka Meridian GTS",
		"Dominator",
		"Declasse Valence V8",
		"Declasse Draven Touring",
		"Dominator GTX",
		"Dominator Pibwasser",
		"Drift Yosemite",
		"Dubsta",
		"Dubsta 6x6",
		"Dubsta SG",
		"Dukes",
		"Elegy Retro Custom",
		"Elegy RH8",
		"Ellie",
		"Emperor",
		"Emperor Ravena Touring",
		"Emperor RCF",
		"Entity XF",
		"Enus Meridian Sport",
		"Enus Apex Turbo",
		"Enus Jubilee XL",
		"Enus Valence R",
		"ETR-1",
		"Declasse Boreal XR",
		"Exemplar",
		"Enus Summit Custom",
		"F620",
		"Faction",
		"Felon",
		"Felon GT",
		"Feltzer",
		"Flash GT",
		"FMJ",
		"FQ 2",
		"Fugitive",
		"Furore GT",
		"Fusilade",
		"Futo",
		"Declasse Silva Custom",
		"Future Shock Issi",
		"Gallivanter Arclight Classic",
		"Gallivanter Mirage Performance",
		"Gauntlet",
		"Gauntlet Classic",
		"Gauntlet Hellfire",
		"Gauntlet Redwood",
		"GB200",
		"Glendale",
		"GP-1",
		"Granger",
		"Grotti Itali 458",
		"Grotti Purosangue",
		"Declasse Radian GTS",
		"GT 500",
		"Grotti Fervor",
		"Hermes",
		"Hotknife",
		"Huntley S",
		"Imorgon",
		"Impaler",
		"Infernus",
		"Infernus Classic",
		"Ingot",
		"Issi",
		"Itali GTB",
		"Itali GTB Custom",
		"Itali GTO",
		"Jackal",
		"JB 700",
		"Jester",
		"Jester (Racecar)",
		"Jester Classic",
		"Declasse Lucerna Edition",
		"Journey",
		"Jugular",
		"Kamacho",
		"Karin Valora Blackline",
		"Karin Vesper RS",
		"Karin Atlas Signature",
		"Karin Jester A80",
		"Karin Helion GTS",
		"Khamelion",
		"Komoda",
		"Krieger",
		"Kuruma",
		"Lampadati Arclight S",
		"Landstalker",
		"Lynx",
		"Mamba",
		"Mammoth Meridian GTS",
		"Massacro",
		"Monroe",
		"Moonbeam",
		"Nebula Turbo",
		"Neon",
		"Nero",
		"Nero Custom",
		"Nightshade",
		"Novak",
		"Obey Tempest V12",
		"Obey Vespera R",
		"Obey Q60",
		"Obey Altair Cabrio",
		"Obey Vellum Custom",
		"Obey Argent Touring",
		"Obey Argent Sport",
		"Obey Orion Sport",
		"Ocelot DBS GT Zagato",
		"Ocelot Talon GT",
		"Ocelot Volante Clubsport",
		"Ocelot Serrata V8",
		"Ocelot Vanquish Zagato SB",
		"Ocelot Obsidian R-Spec",
		"Ocelot XE SV Project 8",
		"Declasse Atlas",
		"Oracle",
		"Osiris",
		"Panto",
		"Paragon R",
		"Pariah",
		"Patriot",
		"Patriot Stretch",
		"Pegassi Obsidian XL",
		"Pegassi Mirage",
		"Penetrator",
		"Penumbra",
		"Pfister 911",
		"Pfister Sable Cabrio",
		"Pfister Echelon Sport",
		"Pfister Solace Clubsport",
		"Pheonix",
		"Picador",
		"Prairie",
		"Premier",
		"Previon",
		"Progen T20 Apex",
		"Pfister 811",
		"Raiden",
		"Rancher XL",
		"Rapid GT",
		"Raptor",
		"Rat-Loader",
		"Rat-Truck",
		"RE-7B",
		"Reaper",
		"Rebel",
		"Rebla GTS",
		"Regina",
		"Declasse Aster Grand",
		"Revolter",
		"Rhapsody",
		"Riata",
		"Rocoto",
		"Ruiner",
		"Rumpo",
		"Ruston",
		"Rusty Rebel",
		"Sabre Turbo",
		"Sandking SWB",
		"Sandking XL",
		"SC-1",
		"Schafter",
		"Schafter LWB",
		"Schafter LWB (Armored)",
		"Schafter V12",
		"Schlagen GT",
		"Schwarzer",
		"Seminole",
		"Sentinel Classic",
		"Sentinel XS",
		"Serrano",
		"Seven-70",
		"Shelby GT500",
		"Slamvan",
		"Slamvan Custom",
		"Specter",
		"Stafford",
		"StafVapid",
		"Stalion",
		"Stinger",
		"Stinger GT",
		"Stirling GT",
		"Streiter",
		"Stretch",
		"Sultan",
		"Sultan Classic",
		"Sultan RS",
		"Declasse Silva RS",
		"Super Diamond",
		"Surano",
		"Surge",
		"Swinger",
		"T-20",
		"Tailgater",
		"Declasse Aurelia Touring",
		"Taipan",
		"Tampa",
		"Tempesta",
		"Tezeract",
		"Thrax",
		"Tigon",
		"Torero",
		"Toros",
		"Tropos Rallye",
		"Truffade Eclat",
		"Tulip",
		"Turismo Classic",
		"Turismo R",
		"Tyrant",
		"Tyrus",
		"Ubermacht Aureon V6",
		"Ubermacht Arclight R",
		"Ubermacht Sentinel R46",
		"Ubermacht Cypher R",
		"Ubermacht Mariner Custom",
		"Ubermacht Veyra Turbo",
		"Ubermacht Velora SV",
		"Ubermacht Sentinel V8 Clubsport",
		"Ubermacht Apex R-Spec",
		"Ubermacht Sentinel V10",
		"Ubermacht Sentinel V8",
		"Ubermacht Tempest",
		"Ubermacht Avenor Edition",
		"Ubermacht Avenor Clubsport",
		"Ubermacht Lucerna Custom",
		"Ubermacht Cobalt Signature",
		"Ubermacht Vanta 4x4",
		"Ubermacht Revenant Touring",
		"V-STR",
		"Vacca",
		"Vagner",
		"Vamos",
		"Vapid Mustang GT500",
		"Vapid Moraine SV",
		"Declasse Solstice Custom",
		"Velierer",
		"Vigero",
		"Virgo",
		"Virgo Classic",
		"Visione",
		"Voltic",
		"Voodoo",
		"Voodoo Custom",
		"Warrener",
		"Declasse Boreal Sport",
		"Washington",
		"Windsor",
		"Windsor Drop",
		"X80 Proto",
		"XA-21",
		"XLS",
		"XLS (Armored)",
		"Yosemite",
		"Yosemite Rancher",
		"Z-Type",
		"Zentorno",
		"Zion",
		"Zion Cabrio",
		"Zion Classic",
		"Zorrusso",
		"9F",
		"9F Cabrio"
	];
	setupAutocomplete(carNameInput, carNameSuggestions, carNames);
	setupAutocomplete(tradingCarNameInput, tradingCarNameSuggestions, carNames);

	carTransactionBtns.forEach((btn) => {
		btn.addEventListener("click", () => {
			carTransactionBtns.forEach((b) => b.classList.remove("active"));
			btn.classList.add("active");
			carTransactionType = btn.dataset.type.charAt(0).toUpperCase() + btn.dataset.type.slice(1).toLowerCase();
			carPriceLabel.textContent =
				carTransactionType === "Buying" ? "Budget" : "Price";
			generateCarAd();
		});
	});

	carIsTradingCheckbox.addEventListener("change", () => {
		const buyingBtn = document.querySelector(
			'.car-transaction-btn[data-type="Buying"]'
		);
		tradingCarNameGroup.classList.toggle(
			"hidden",
			!carIsTradingCheckbox.checked
		);
		if (carIsTradingCheckbox.checked) {
			buyingBtn.classList.add("disabled");
			if (carTransactionType === "Buying") {
				document
					.querySelector('.car-transaction-btn[data-type="Selling"]')
					.click();
			}
		} else {
			buyingBtn.classList.remove("disabled");
		}
		generateCarAd();
	});

	function generateCarAd() {
		const carName = carNameInput.value.trim();


		const isTrading = carIsTradingCheckbox.checked;
		const tradingCarName = tradingCarNameInput.value.trim();

		let transactionText = carTransactionType;
		if (isTrading) {
			transactionText = "Trading";
			if (carTransactionType === "Selling") {
				transactionText = "Selling or trading";
			}
		}

		let configText = "";
		if (document.getElementById("fullConfig").checked)
			configText = " in full configuration";
		else if (document.getElementById("partialConfig").checked)
			configText = " in partial configuration";

		const extras = [
			{
				checked: document.getElementById("visualUpgrades").checked,
				text: "visual upgrades",
			},
			{
				checked: document.getElementById("carInsurance").checked,
				text: "insurance",
			},
			{
				checked: document.getElementById("tuningParts").checked,
				text: "tuning parts",
			},
			{
				checked: document.getElementById("turboKit").checked,
				text: "turbo kit",
			},
			{
				checked: document.getElementById("driftKit").checked,
				text: "drift kit",
			},
		]
			.filter((e) => e.checked)
			.map((e) => e.text);

		if (extras.includes("turbo kit") && extras.includes("drift kit")) {
			extras[extras.indexOf("turbo kit")] = "turbo";
		}

		let extrasText = "";
		if (extras.length > 0) {
			if (extras.length === 1) extrasText = ` with ${extras[0]}`;
			else {
				const lastExtra = extras.pop();
				extrasText = ` with ${extras.join(", ")} and ${lastExtra}`;
			}
		}

		const priceLabel = carTransactionType === "Buying" ? "Budget" : "Price";
		const formattedPrice = formatPrice(carPriceInput.value);

		const specialVehicles = [
			"motorbike",
			"bike",
			"motorcycle",
			"plane",
			"helicopter",
			"boat",
		];
		const isSpecial = specialVehicles.includes(carName.toLowerCase());
		const isSpecialTrading = specialVehicles.includes(tradingCarName.toLowerCase());

		let ad = "";
		if (carName) {
			if (isSpecial) {
				ad = `${transactionText} a ${carName}`;
			} else {
				ad = `${transactionText} "${carName}"`;
			}
		} else {
			ad = `${transactionText} a car`;
		}

		if (isTrading && tradingCarName) {
			const carLabel = isSpecial ? `a ${carName}` : `"${carName}"`;
			const tradingLabel = isSpecialTrading ? `a ${tradingCarName}` : `"${tradingCarName}"`;
			ad = `Selling or trading ${carLabel} for ${tradingLabel}`;
		} else if (isTrading && !carName && tradingCarName) {
			const tradingLabel = isSpecialTrading ? `a ${tradingCarName}` : `"${tradingCarName}"`;
			ad = `Selling or trading a car for ${tradingLabel}`;
		}

		ad += `${configText}${extrasText}.`;

		if (
			!isTrading ||
			(isTrading && tradingCarName) ||
			carTransactionType === "Selling"
		) {
			ad += ` ${priceLabel}: ${formattedPrice}`;
		}

		if (
			(formattedPrice.includes("Million") ||
				formattedPrice.includes("Billion") ||
				formattedPrice === "Negotiable") &&
			!/\d$/.test(formattedPrice.trim())
		) {
			ad += ".";
		}

		carOutput.textContent = ad.replace(/\s\./g, ".").replace(/\.\./g, "."); // Clean up spaces and double periods
	}

	// Reset function for Car Ads
	function resetCarForm() {
		// Reset input fields
		carNameInput.value = "";
		tradingCarNameInput.value = "";
		carPriceInput.value = "";

		// Reset checkboxes
		carIsTradingCheckbox.checked = false;
		document.getElementById("fullConfig").checked = false;
		document.getElementById("partialConfig").checked = false;
		document.getElementById("visualUpgrades").checked = false;
		document.getElementById("carInsurance").checked = false;
		document.getElementById("tuningParts").checked = false;
		document.getElementById("turboKit").checked = false;
		document.getElementById("driftKit").checked = false;

		// Reset transaction type to default (Selling)
		carTransactionBtns.forEach((b) => b.classList.remove("active"));
		document
			.querySelector('.car-transaction-btn[data-type="Selling"]')
			.classList.add("active");
		carTransactionType = "Selling";
		carPriceLabel.textContent = "Price";

		// Hide trading car name group
		tradingCarNameGroup.classList.add("hidden");

		// Enable buying button
		const buyingBtn = document.querySelector(
			'.car-transaction-btn[data-type="Buying"]'
		);
		buyingBtn.classList.remove("disabled");

		// Clear output
		carOutput.textContent = "Your car advertisement will appear here...";
	}

	carCopyBtn.addEventListener("click", () =>
		copyToClipboard(carOutput.textContent, carCopyBtn, resetCarForm)
	);
	carResetBtn.addEventListener("click", resetCarForm);

	document.getElementById("car-ads-page").addEventListener("input", generateCarAd);

	// --- HOUSE ADS LOGIC ---
	const houseTransactionBtns = document.querySelectorAll(
		".house-transaction-btn"
	);
	const propertyTypeSelect = document.getElementById("propertyTypeSelect");
	const propertyType2Select = document.getElementById("propertyType2Select");
	const propertyNumberInput = document.getElementById("propertyNumber");
	const propertyNumber2Input = document.getElementById("propertyNumber2");
	const garageSpaceSelect = document.getElementById("garageSpaceSelect");
	const warehouseSpaceSelect = document.getElementById(
		"warehouseSpaceSelect"
	);
	const otherFeatureCheckboxes = document.querySelectorAll(
		'#house-ads-page .other-features input[type="checkbox"]'
	);
	const rentPeriodGroup = document.getElementById("rentPeriodGroup");
	const rentPeriodSelect = document.getElementById("rentPeriodSelect");
	const propertyViewSelect = document.getElementById("propertyView");
	const locationInput = document.getElementById("location");
	const locationSuggestions = document.getElementById("locationSuggestions");
	const housePriceInput = document.getElementById("housePrice");
	const housePriceLabel = document.getElementById("housePriceLabel");
	const houseOutput = document.getElementById("houseOutput");
	const houseCopyBtn = document.getElementById("houseCopyBtn");
	const houseResetBtn = document.getElementById("houseResetBtn");
	let houseTransactionType = "Selling";

	const locations = [
		"in Vespucci Canals",
		"in Vinewood Hills",
		"in Rancho",
		"in Sandy Shores",
		"in Vanilla Unicorn Bar",
		"in Richman",
		"in Rockford Hills",
		"in Paleto Bay",
		"in Pillbox Hill",
		"in West Vinewood",
		"in Bahama Mamas",
		"in Banham Canyon",
		"in Cayo Perico Island",
		"in ghetto",
		"in Eclipse Tower",
		"in Del Perro",
		"in Downtown Vinewood",
		"in El Burro Heights",
		"in city",
		"in Mirror Park",
		"near beach",
		"near beach market",
		"near stadium",
		"near fire station",
		"near train station",
		"near post office",
		"near airport",
		"near mall",
		"near Stock Exchange",
		"near residential complex",
		"near Auto Salon",
		"near Fight Club",
		"near Hospital",
		"near Sandy Hospital",
		"near Diamond Bar",
		"near LifeInvader",
		"near Hospital"
	];
	setupAutocomplete(locationInput, locationSuggestions, locations);

	houseTransactionBtns.forEach((btn) => {
		btn.addEventListener("click", () => {
			houseTransactionBtns.forEach((b) => b.classList.remove("active"));
			btn.classList.add("active");
			houseTransactionType = btn.dataset.type;

			const isRenting = houseTransactionType.includes("rent");
			rentPeriodGroup.classList.toggle("hidden", !isRenting);

			if (houseTransactionType === "Renting out") {
				housePriceLabel.textContent = "Rent";
			} else if (
				houseTransactionType === "Looking to rent" ||
				houseTransactionType === "Buying"
			) {
				housePriceLabel.textContent = "Budget";
			} else {
				// Selling
				housePriceLabel.textContent = "Price";
			}
			generateHouseAd();
		});
	});

	function generateHouseAd() {
		let ad = `${houseTransactionType}`;

		const propType = propertyTypeSelect.value;
		const propNum = propertyNumberInput.value.trim();
		const propType2 = propertyType2Select ? propertyType2Select.value : "";
		const propNum2 = propertyNumber2Input ? propertyNumber2Input.value.trim() : "";
		const isTwoProperties = !!propType2;
		const isSameType = isTwoProperties && propType2 === propType;

		// Helper: build singular property string for one property
		function buildPropStr(type, num) {
			if (num) {
				// Has number — no article
				switch (type) {
					case "house":           return `house №${num}`;
					case "apartment":       return `apartment №${num}`;
					case "mansion":         return `mansion №${num}`;
					case "casino penthouse": return `Casino penthouse №${num}`;
				}
			} else {
				// No number — with article
				switch (type) {
					case "house":           return "a house";
					case "apartment":       return "an apartment";
					case "mansion":         return "a mansion";
					case "casino penthouse": return "a Casino penthouse";
				}
			}
			return "";
		}

		// Helper: plural form of property type
		function pluralPropType(type) {
			switch (type) {
				case "house":           return "houses";
				case "apartment":       return "apartments";
				case "mansion":         return "mansions";
				case "casino penthouse": return "Casino penthouses";
			}
			return type + "s";
		}

		let propertyString = "";
		if (isTwoProperties) {
			if (isSameType) {
				// Same type — e.g. house + house → "2 houses" or "houses №67 and №767"
				if (propNum && propNum2) {
					propertyString = ` ${pluralPropType(propType)} №${propNum} and №${propNum2}`;
				} else {
					propertyString = ` 2 ${pluralPropType(propType)}`;
				}
			} else {
				// Different types — e.g. house + apartment
				const s1 = buildPropStr(propType, propNum);
				const s2 = buildPropStr(propType2, propNum2);
				propertyString = ` ${s1} and ${s2}`;
			}
		} else {
			// Single property
			propertyString = " " + buildPropStr(propType, propNum);
		}
		ad += propertyString;

		const allFeatures = [];

		// Pluralize features when 2 properties are selected
		const pluralise = isTwoProperties;

		// Collect features in the specified serial order:
		// Garden -> Garage Space -> Warehouse Space -> Custom Interior -> Insurance -> Helipad -> Tennis Court -> Long Driveway -> Swimming Pool -> View
		const gardenCheckbox = document.getElementById("f_garden");
		if (gardenCheckbox && gardenCheckbox.checked) {
			allFeatures.push(pluralise ? "gardens" : gardenCheckbox.dataset.text);
		}

		const garageSpace = garageSpaceSelect.value;
		if (garageSpace) allFeatures.push(garageSpace);

		const warehouseSpace = warehouseSpaceSelect.value;
		if (warehouseSpace) allFeatures.push(warehouseSpace);

		const featureIds = ["f_custom", "f_insurance", "f_helipad", "f_tennis", "f_driveway", "f_pool"];
		featureIds.forEach(id => {
			const cb = document.getElementById(id);
			if (cb && cb.checked) {
				let text = cb.dataset.text;
				if (pluralise) {
					if (id === "f_helipad")   text = "helipads";
					else if (id === "f_tennis")   text = "tennis courts";
					else if (id === "f_driveway") text = "long driveways";
					else if (id === "f_pool")     text = "swimming pools";
				}
				allFeatures.push(text);
			}
		});

		const view = propertyViewSelect.value;
		if (view) allFeatures.push(view);

		// Join all features with commas and "and" only before the final item
		if (allFeatures.length > 0) {
			ad += " with ";
			if (allFeatures.length === 1) {
				ad += allFeatures[0];
			} else {
				const lastFeature = allFeatures.pop();
				ad += `${allFeatures.join(", ")} and ${lastFeature}`;
			}
		}

		const location = locationInput.value.trim();
		if (location) ad += ` ${location}`;

		ad += ".";

		const priceLabel = housePriceLabel.textContent;
		let formattedPrice = formatPrice(housePriceInput.value);
		const rentPeriod = rentPeriodSelect.value;

		if (
			houseTransactionType.includes("rent") &&
			rentPeriod &&
			formattedPrice !== "Negotiable"
		) {
			formattedPrice += ` ${rentPeriod}`;
		}

		ad += ` ${priceLabel}: ${formattedPrice}`;

		if (
			(formattedPrice.includes("Million") ||
				formattedPrice.includes("Billion") ||
				formattedPrice === "Negotiable" ||
				formattedPrice.includes("per")) &&
			!/\d$/.test(formattedPrice.trim())
		) {
			ad += ".";
		}

		houseOutput.textContent = ad
			.replace(/\s\./g, ".")
			.replace(/\.\./g, ".")
			.trim();
	}

	// Reset function for House Ads
	function resetHouseForm() {
		// Reset select fields to default values
		propertyTypeSelect.value = "house";
		if (propertyType2Select) {
			propertyType2Select.value = "";
		}
		garageSpaceSelect.value = "";
		warehouseSpaceSelect.value = "";
		rentPeriodSelect.value = "";
		propertyViewSelect.value = "";

		// Reset input fields
		propertyNumberInput.value = "";
		if (propertyNumber2Input) {
			propertyNumber2Input.value = "";
			propertyNumber2Input.classList.add("hidden");
		}
		locationInput.value = "";
		housePriceInput.value = "";

		// Reset all feature checkboxes
		otherFeatureCheckboxes.forEach((cb) => {
			cb.checked = false;
		});

		// Reset transaction type to default (Selling)
		houseTransactionBtns.forEach((b) => b.classList.remove("active"));
		document
			.querySelector('.house-transaction-btn[data-type="Selling"]')
			.classList.add("active");
		houseTransactionType = "Selling";
		housePriceLabel.textContent = "Price";

		// Hide rent period group
		rentPeriodGroup.classList.add("hidden");

		// Clear output
		houseOutput.textContent =
			"Your house advertisement will appear here...";
	}

	// Show/hide propertyNumber2 when 2nd property type is selected/cleared
	if (propertyType2Select) {
		propertyType2Select.addEventListener("change", () => {
			const hasType2 = !!propertyType2Select.value;
			if (propertyNumber2Input) {
				propertyNumber2Input.classList.toggle("hidden", !hasType2);
				if (!hasType2) propertyNumber2Input.value = "";
			}
			generateHouseAd();
		});
	}

	houseCopyBtn.addEventListener("click", () =>
		copyToClipboard(houseOutput.textContent, houseCopyBtn, resetHouseForm)
	);
	houseResetBtn.addEventListener("click", resetHouseForm);

	document.getElementById("house-ads-page").addEventListener("input", generateHouseAd);

	// --- ITEMS & CLOTHING ADS (MERGED) LOGIC ---
	const categoryBtns = document.querySelectorAll(".category-btn");
	const itemTransactionBtns = document.querySelectorAll(
		".item-transaction-btn"
	);
	const isTradingCheckbox = document.getElementById("isTrading");
	const itemsContainer = document.getElementById("itemsContainer");
	const pricingContainer = document.getElementById("pricingContainer");
	const addItemBtn = document.getElementById("add-item-btn");
	const inBulkCheckbox = document.getElementById("inBulk");
	const respectivelyCheckbox = document.getElementById("respectively");
	const itemOutput = document.getElementById("itemOutput");
	const itemCopyBtn = document.getElementById("itemCopyBtn");
	const itemResetBtn = document.getElementById("itemResetBtn");
	const pricingLabel = document.getElementById("pricingLabel");
	const itemsLabel = document.getElementById("itemsLabel");

	let currentCategory = "items";

	const colors = [
		"Red",
		"Blue",
		"Green",
		"Black",
		"White",
		"Yellow",
		"Purple",
		"Orange",
		"Pink",
		"Gray",
		"Brown",
		"Checkered",
	];

	// Define type restrictions for specific items
	const itemTypeRestrictions = {
		"VIP 1": [7, 10, 15, 20, 21, 30],
		"VIP 2": [7, 10, 15, 20, 21, 30],
		"spatial sound track": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
	};

	// Define uncountable items that should not be pluralized automatically
	const uncountableItems = [
		"carp",
		"copper",
		"dice",
		"fish",
		"milk",
		"salmon",
		"orca",
		"scrap metal",
		"high quality metal",
		"trout",
		"perch",
		"fruit",
		"timber",
		"obsidian",
		"fuel for resource extraction",
	];

	// Function to populate type dropdown based on item
	function populateTypeDropdown(selectElement, itemName = "") {
		const currentValue = selectElement.value;
		selectElement.innerHTML = '<option value="">Type</option>';

		const normalizedItemName = itemName.toLowerCase().trim();
		let typesToShow = [];

		// Check if item has type restrictions
		if (itemTypeRestrictions[normalizedItemName]) {
			typesToShow = itemTypeRestrictions[normalizedItemName];
		} else {
			// Default: show all types 1-40
			for (let i = 1; i <= 40; i++) {
				typesToShow.push(i);
			}
		}

		// Populate dropdown with allowed types
		typesToShow.forEach(typeNum => {
			const option = document.createElement("option");
			option.value = typeNum;
			option.textContent = `Type ${typeNum}`;
			selectElement.appendChild(option);
		});

		// Restore previous value if it's still valid
		if (currentValue && typesToShow.includes(parseInt(currentValue))) {
			selectElement.value = currentValue;
		}
	}


	let itemTransactionType = "Selling";

	// Combined suggestions list
	const itemSuggestionsList = [
		"alphabet",
		"alphabet (G)",
		"alphabet (R)",
		"alphabet (A)",
		"alphabet (N)",
		"alphabet (D)",
		"animal juice",
		"animal skin",
		"arena gift",
		"juice",
		"attack juice",
		"10% attack juice",
		"20% attack juice",
		"25% attack juice",
		"automatic drill",
		"automatic oil well",
		"automatic rod",
		"automatic sawmill",
		"automatic watering can",
		"power armoured vest skin",
		"power armoured vest skin (V.1)",
		"power armoured vest skin (V.2)",
		"power armoured vest skin (V.3)",
		"power armoured vest skin (V.4)",
		"power armoured vest skin (V.5)",
		"power armoured vest skin (V.6)",
		"power armoured vest skin (V.7)",
		"power armoured vest skin (V.8)",
		"power armoured vest skin (V.9)",
		"power armoured vest skin (V.10)",
		"alcohlic beverage cheetah",
		"battery",
		"batteries",
		"Benefactor gift",
		"big fireworks",
		"binoculars",
		"body armour skin",
		"high quality tuning parts",
		"brakes",
		"high quality brakes",
		"medium quality brakes",
		"low quality brakes",
		"baltic beer",
		"blazzzer alcohlic beverage",
		"burglarized house gift",
		"backpack space",
		"max quality backpack space",
		"high quality backpack space",
		"medium quality backpack space",
		"low quality backpack space",
		"small Birthday gift",
		"big Birthday gift",
		"tokens",
		"cabbage",
		"cabbage seeds",
		"campfire",
		"caravan gift",
		"carp",
		"Cayo Perico gift",
		"chair",
		"chair 1",
		"chair 2",
		"chair 3",
		"chair 4",
		"chair 5",
		"chair 6",
		"Christmas lollipop",
		"Christmas tree",
		"cigarettes",
		"coblevo wine",
		"gift for bikers 1",
		"gift for bikers 2",
		"gift for bikers 3",
		"gift for bikers 4",
		"gift for bikers 5",
		"gift for branded shorts",
		"gift for branded t-shirts",
		"gift for drifters 1",
		"gift for drifters 2",
		"gift for drifters 3",
		"gift for men 1",
		"gift for men 2",
		"gift for racers 1",
		"gift for racers 2",
		"gift for racers 3",
		"gift for women",
		"gift for women 1",
		"gift for women 2",
		"gift with wheels 1",
		"gift with wheels 2",
		"gift with wheels 3",
		"copper",
		"daily gift",
		"desert scarf mask gift",
		"diamond",
		"dice",
		"rubies",
		"double paycheck juice",
		"drawing print",
		"prints",
		"an elixir",
		"elixir",
		"electric chargers",
		"emerald",
		"endurance juice",
		"engine",
		"high quality engine",
		"medium quality engine",
		"low quality engine",
		"exclusive truckers gift",
		"explosive fireworks",
		"earplugs",
		"fast running juice",
		"fish",
		"high quality fishing rod",
		"medium quality fishing rod",
		"low quality fishing rod",
		"flag",
		"flowers",
		"fruit",
		"fuel canister",
		"fuel for resource extraction",
		"red fabric",
		"blue fabric",
		"yellow fabric",
		"green fabric",
		"purple fabric",
		"gardeners gift",
		"gasoline barrels",
		"grand gift",
		"GrandPro bodycam",
		"grill",
		"hookah",
		"high quality metal",
		"immunity juice",
		"ingrand gift",
		"10% juice",
		"20% juice",
		"25% juice",
		"kerosene barrels",
		"leash",
		"license plate",
		"lottery gift",
		"love gift",
		"luminous stone",
		"mandarin seeds",
		"mandarins",
		"map of Los Santos",
		"milk",
		"mining resources",
		"multivitamin juice",
		"mushroom seeds",
		"mushrooms",
		"Monowheel",
		"neon armoured vest skin",
		"neon armoured vest skin (V.1)",
		"neon armoured vest skin (V.2)",
		"neon armoured vest skin (V.3)",
		"neon armoured vest skin (V.4)",
		"neon armoured vest skin (V.5)",
		"neon armoured vest skin (V.6)",
		"neon armoured vest skin (V.7)",
		"neon armoured vest skin (V.8)",
		"neon armoured vest skin (V.9)",
		"neon armoured vest skin (V.10)",
		"neon Muci armoured vest skin",
		"neon Muci armoured vest skin (V.1)",
		"neon Muci armoured vest skin (V.2)",
		"neon Muci armoured vest skin (V.3)",
		"neon Muci armoured vest skin (V.4)",
		"neon Muci armoured vest skin (V.5)",
		"neon Muci armoured vest skin (V.6)",
		"neon Muci armoured vest skin (V.7)",
		"neon Muci armoured vest skin (V.8)",
		"neon Muci armoured vest skin (V.9)",
		"neon Muci armoured vest skin (V.10)",
		"neon Lui Vi armoured vest skin",
		"neon Lui Vi armoured vest skin (V.1)",
		"neon Lui Vi armoured vest skin (V.2)",
		"neon Lui Vi armoured vest skin (V.3)",
		"neon Lui Vi armoured vest skin (V.4)",
		"neon Lui Vi armoured vest skin (V.5)",
		"neon Lui Vi armoured vest skin (V.6)",
		"neon Lui Vi armoured vest skin (V.7)",
		"neon Lui Vi armoured vest skin (V.8)",
		"neon Lui Vi armoured vest skin (V.9)",
		"neon Lui Vi armoured vest skin (V.10)",
		"neon armoured vest skin with chains",
		"neon armoured vest skin with chains (V.1)",
		"neon armoured vest skin with chains (V.2)",
		"neon armoured vest skin with chains (V.3)",
		"neon armoured vest skin with chains (V.4)",
		"neon armoured vest skin with chains (V.5)",
		"neon armoured vest skin with chains (V.6)",
		"neon armoured vest skin with chains (V.7)",
		"neon armoured vest skin with chains (V.8)",
		"neon armoured vest skin with chains (V.9)",
		"neon armoured vest skin with chains (V.10)",
		"neon Summer 2023 armoured vest skin",
		"neon Summer 2023 armoured vest skin (V.1)",
		"neon Summer 2023 armoured vest skin (V.2)",
		"neon Summer 2023 armoured vest skin (V.3)",
		"neon Summer 2023 armoured vest skin (V.4)",
		"neon Summer 2023 armoured vest skin (V.5)",
		"neon Summer 2023 armoured vest skin (V.6)",
		"neon Summer 2023 armoured vest skin (V.7)",
		"neon Summer 2023 armoured vest skin (V.8)",
		"neon Summer 2023 armoured vest skin (V.9)",
		"neon Summer 2023 armoured vest skin (V.10)",
		"new year gift",
		"Ocelot gift",
		"seeds",
		"oil barrel",
		"organisation gift",
		"old autumn gold gift",
		"old winter gold gift",
		"old summer gold gift",
		"paint cans",
		"pearl",
		"perch",
		"pet",
		"pet border collie",
		"pet candy cane",
		"pet cat",
		"pet chicken",
		"pet Christmas elf",
		"pet cute hippo",
		"pet dog",
		"pet duckling",
		"pet fancy bear",
		"pet food",
		"pet futuristic friend",
		"pet ghost",
		"pet golden retriever",
		"pet huggy wuggy",
		"pet husky",
		"pet kitty bunny",
		"pet lion cub",
		"pet mini robot",
		"pet monkey",
		"pet panda",
		"pet panther",
		"pet pig",
		"pet poodle",
		"pet pug",
		"pet puma",
		"pet pumpkin guardian",
		"pet rabbit",
		"pet cyberdog",
		"pet rat",
		"pet robobeast",
		"pet rooster",
		"pet rottweiler",
		"pet Santa Claus",
		"pet scary bear",
		"pet skeleton bear",
		"pet treat",
		"pet voodoo doll",
		"pet westie",
		"pet X-mas husky",
		"platinum prime gift",
		"pickaxe",
		"premium quality pickaxe",
		"max quality pickaxe",
		"high quality pickaxe",
		"medium quality pickaxe",
		"low quality pickaxe",
		"pineapple seeds",
		"sponge",
		"pineapples",
		"pool table",
		"port wine 666",
		"power booster",
		"power juice",
		"10% power juice",
		"20% power juice",
		"25% power juice",
		"starter prime gift",
		"premium fuel canister",
		"secret gift fragment",
		"secret gift",
		"Progen gift",
		"protection juice",
		"10% protection juice",
		"20% protection juice",
		"25% protection juice",
		"pumpkin seeds",
		"pumpkins",
		"purifield water",
		"a pet fancy bear",
		"repair kit",
		"resource scanner",
		"riding juice",
		"ruby/rubies",
		"resources gift",
		"rare lottery gift",
		"salmon",
		"sand",
		"sand figures",
		"scarecrow flag",
		"scrap metal",
		"shovel",
		"sim-cards",
		"Single fireworks",
		"snow",
		"snow figure",
		"snowballs",
		"solar barrel",
		"solar panel",
		"sphere of influence gift",
		"VIP 1",
		"VIP 2",
		"strawberries",
		"study of the organisation gift",
		"Summer 2023 armoured vest skin",
		"Summer 2023 armoured vest skin (V.1)",
		"Summer 2023 armoured vest skin (V.2)",
		"Summer 2023 armoured vest skin (V.3)",
		"Summer 2023 armoured vest skin (V.4)",
		"Summer 2023 armoured vest skin (V.5)",
		"Summer 2023 armoured vest skin (V.6)",
		"Summer 2023 armoured vest skin (V.7)",
		"Summer 2023 armoured vest skin (V.8)",
		"Summer 2023 armoured vest skin (V.9)",
		"Summer 2023 armoured vest skin (V.10)",
		"suspension",
		"high quality suspension",
		"medium quality suspension",
		"low quality suspension",
		"school gift",
		"tactical grand armoured vest skin",
		"tent",
		"threads",
		"timber",
		"tincture of the forest mushrooms",
		"transmission",
		"high quality transmission",
		"medium quality transmission",
		"low quality transmission",
		"Trezor gift",
		"trout",
		"high quality tyres",
		"medium quality tyres",
		"low quality tyres",
		"tuning parts",
		"treasure map",
		"unique love gift",
		"unique rims",
		"valuable gift",
		"video card",
		"volcano fireworks",
		"vodka-shotka",
		"Valentine gift",
		"wire",
		"flame and water lottery gift",
		"resource miners gift",
		"fossil map",
		"car gift",
		"Maserati Granturismo gift",
		"big Christmas gift",
		"small Christmas gift",
		"Christmas gift",
		"opened gift paper",
		"Christmas market stall",
		"biospark",
		"spatial sound track",
		"premium quality fishing rod",
		"max quality fishing rod",
		"gift for racers",
		"megalodon",
		"ray",
		"orca",
		"pet cosmodog",
		"obsidian",
		"pet easter bunny",
		"magma stone",
		"Airhorn",
		"Abibas suit",
		"Air Bior pullover sweater",
		"Alaska winter jacket",
		"Alvin Lein T-shirt",
		"Anti Social Club hoodie",
		"Arm Pangel jacket",
		"black jacket with yellow trim",
		"blob longsleeve top",
		"bomber jacket with glowing elements",
		"branded CDG T-shirt",
		"branded insulated hoodie",
		"Bendi T-shirt",
		"branded longsleeve",
		"branded Molo T-shirt",
		"branded monochrome T-shirt",
		"branded T-shirt",
		"bright hoodie",
		"bright StarWars hoodie",
		"CAP T-shirt",
		"Casual neon torso",
		"classic denim jacket",
		"collection 2022 T-shirt",
		"cropp collection T-shirt",
		"denim jacket",
		"exclusive T-shirt",
		"fur coat without a hood",
		"Grand RP collection hoodie",
		"Grand RP collection T-shirt",
		"Hilipp Lein T-shirt",
		"hoodie with balaclava Cap",
		"jacket",
		"Jacket with a hood",
		"jacket with blue luminous trim",
		"jacket with green luminous trim",
		"jacket with pink luminous trim",
		"jacket with red luminous trim",
		"jacket with T-shirt",
		"jacket with turquoise luminous trim",
		"jacket with white luminous trim",
		"Juice Wrld Vlone T-shirt",
		"Khampion T-shirt",
		"Khanel top",
		"Kupreme T-shirt",
		"Lacoste T-shirt",
		"Lui Vi jacket",
		"Lui Vi sweatshirt",
		"Lui Vi T-shirt",
		"Lui Vi top",
		"luminous LM Playboy jacket",
		"luminous LM Playboy T-shirt",
		"luminous LM Playboy top",
		"luminous T-shirt",
		"maliky hoodie",
		"maliky T-shirt",
		"Mickey Mouse T-shirt",
		"Mikachu hoodie",
		"mix collection T-shirt",
		"Muci hoodie",
		"Muci hoodie with a snake",
		"Muci Not Fake hoodie",
		"Muci sweatshirt",
		"N.E.S.A. T-shirt",
		"neon torso",
		"New Years Eve costume",
		"Niki new collection hoodie",
		"Niki tech top",
		"Niki track suit top",
		"one-colour CAP T-shirt",
		"Plain jacket with sweater",
		"Polo Kinder T-shirt",
		"Rick and Morty trendy jacket",
		"scary turtleneck T-shirt",
		"shirt new",
		"Simpsons T-shirt",
		"skinny jacket",
		"summer collection T-shirt",
		"sweatshirt",
		"swimming trunks",
		"T-shirt",
		"The West Pace jacket",
		"top",
		"trendy jacket",
		"TRON torso",
		"Tsum collection T-shirt",
		"Up-Green sweatshirt",
		"Valenciaga T-shirt",
		"VIN T-shirt",
		"vintage Abibas Olympic jersey",
		"wide print soccer T-shirt",
		"branded colourful T-shirt",
		"open olympics top",
		"wide printed football T-shirt",
		"tapered classic turtleneck",
		"wedding dress",
		"gothic hoodie with neon eyes",
		"bandana top",
		"Barberry corset dress",
		"body wraps kill top",
		"bomber jacket with luminous elements",
		"calligraphy dress",
		"collection 5 top",
		"corset top",
		"day dress",
		"dress",
		"dress with cutout",
		"faution top",
		"Kupreme dress",
		"long branded T-shirt",
		"Love costume",
		"low dress",
		"luminous LM Playboy sweatshirt",
		"Mikachu T-shirt",
		"pullover with long sleeve",
		"short pullover",
		"sports top",
		"stylish suit",
		"summer bra",
		"summer top",
		"top 2 outerwear",
		"top with chains",
		"Watch Me sweater",
		"Spring Set",
		"winter collection dress",
		"motorcycle platform boots",
		"Amire zip-up jumper",
		"luminous dress",
		"asymmetrical austere dress",
		"Essential suit top",
		"leather gothic pants",
		"Abibas pants",
		"Abibas sport pants",
		"Abibas sweatpants",
		"Alvin Lein pants",
		"belted pants",
		"Bersace trousers",
		"Bior pants",
		"branded pants with bunny detail",
		"bright StarWars trousers",
		"bright trousers",
		"colored pants",
		"denim shorts",
		"Grand RP collection pants",
		"half-glowing pants",
		"insulated personal pants",
		"Khampion pants",
		"Khanel pants",
		"Lui Vi pants",
		"Lui Vi shorts",
		"luminous Bendi pants",
		"luminous branded pants with bunny detail",
		"luminous Grand RP trousers",
		"luminous LM Playboy trousers",
		"luminous OFF pants",
		"luminous trousers",
		"LW new sample branded neon pants set",
		"Mickey Mouse pants",
		"Muci pants",
		"Muci trousers",
		"Murberry pants",
		"N.E.S.A. pants",
		"neon Lui Vi pants",
		"neon pants",
		"New Balance trousers",
		"new fashionable joggers",
		"Niki new collection pants",
		"Niki tech fleece pants",
		"Niki track suit pants",
		"old summer shorts",
		"pants",
		"pants split",
		"shorts",
		"skater jeans",
		"spider pants",
		"summer voyage shorts",
		"swordmen pants",
		"TRON pants",
		"trousers",
		"Valenciaga pants",
		"zipper pants",
		"Abibas leggings",
		"Gussi shorts",
		"jeans",
		"Muci shorts",
		"Nik shorts with leggings",
		"Panel pants",
		"pants with belt",
		"ragged jeans",
		"S cargo pants",
		"skirt",
		"skirt with tights",
		"ripped pants with neon strips",
		"Abibas Keezy Foam shoes",
		"Abibas Marquee Boost Lows shoes",
		"Abibas Pezy Boost 700 V3 Alvah shoes",
		"Abibas Pro Bounce 2019 Lows shoes",
		"Acic Gel Kayano sneakers",
		"Alastor McQueen oversized shoes",
		"Bans sneakers",
		"checkered Pans sneakers",
		"Curry Flow 8 sneakers",
		"Ground Mordan 4 Retro Laser 30th shoes",
		"Keezy Boost shoes",
		"luminous shoes",
		"luminous Keezy Boost shoes",
		"modern heeled boots",
		"Mordan 1 shoes",
		"Mordan 6 shoes",
		"Muci branded flip-flops",
		"multi-colored Pans sneakers",
		"neon shoes",
		"Nik Huarache shoes",
		"Niki Ground Porce One new collection shoes",
		"Niki Shox shoes",
		"Niki Uptempo shoes",
		"Niki Zoom Freak 1 Multi-Color shoes",
		"Pans sneakers",
		"Pezy Boost shoes",
		"red sneakers",
		"RGB neon shoes",
		"Rick Ownis X Dr. Martian boots",
		"Rocs",
		"Rocs with neon paint",
		"shoes",
		"sneakers",
		"trainers",
		"TRON shoes",
		"luminous Up-Green Keezy Boost shoes",
		"Up-Green Keezy Boost shoes",
		"Up-Green Pezy Boost shoes",
		"Valenciaga Track shoes",
		"tall boots",
		"sporty boots",
		"accessory",
		"AK-47 chain",
		"black voron shoulder accessory",
		"boxing gloves",
		"bracelet",
		"chain",
		"chain around the body accessory",
		"chain lost treasure neon accessory",
		"chain with star pendant",
		"clown chain",
		"deer antler accessory",
		"deer antlers with a red nose accessory",
		"eagle necklace",
		"el primo corazon krawl on the shoulder accessory",
		"fluorescent cat ears",
		"flying bear on the shoulder accessory",
		"gloves",
		"glowing nails",
		"Grand chain",
		"hamster on the shoulder accessory",
		"hearts Pride glasses",
		"leon krawl on the shoulder accessory",
		"lovely bird egg on the shoulder accessory",
		"neck scarf accessory",
		"necklace",
		"neon rabbit ears",
		"owl on the shoulder accessory",
		"pixel glasses",
		"satanic wings",
		"scarf",
		"shiny deer antler headband accessory",
		"six-tailed fox on the shoulder accessory",
		"snowflake glasses",
		"strong chicken on the shoulder accessory",
		"tie",
		"toothless dragon on the shoulder accessory",
		"wristband accessory",
		"beads accessory",
		"navel piercing accessory",
		"onelove chain",
		"alien with neon eyes mask",
		"anime mask",
		"assassins mask",
		"bandana mask",
		"baseball mask",
		"Bigness mask",
		"boxing helmet",
		"carnival mask",
		"casual neon helmet",
		"cat mask",
		"Christmas tree mask",
		"clown mask",
		"cowgirl hat",
		"Craft Munk mask",
		"Cupids crown",
		"demon mask",
		"desert scarf mask",
		"devil mask",
		"earphones with a heart",
		"emoji mask",
		"evil mask",
		"exotic mask",
		"fashionista scarf mask",
		"fox mask",
		"glasses with glowing snow",
		"glowing face scarf mask",
		"gorilla mask",
		"handkerchief mask",
		"Jason blue mask",
		"Kazer headphones",
		"kitsune mask",
		"luminous head bag mask",
		"luminous LM Playboy mask",
		"mask",
		"Mask Broken",
		"mask made of clips on a chain",
		"monkey boss mask",
		"monkey mask",
		"Nik mask",
		"owl mask",
		"panama hat",
		"penguin mask",
		"pig mask",
		"purge mask",
		"raccoon mask",
		"raptor mask",
		"raven mask",
		"red stocking mask",
		"reindeer mask",
		"robot human mask",
		"robot mask",
		"rooster mask",
		"samurai mask",
		"Santa Claus mask",
		"Sashmello mask",
		"shamanic mask",
		"skeleton king mask",
		"snowboarders mask",
		"snowman mask",
		"sports mask",
		"stealthy mask",
		"tied scarf mask",
		"tight mask",
		"toothy mask",
		"trending shark head hat",
		"TRON helmet",
		"TV-head mask",
		"white Lui Vi desert scarf mask with multi-colored top",
		"saruko neon mask",
		"neon horns with spikes",
		"turkey mask",
		"branded headband",
		"earrings",
		"rabbit ears",
		"gold Kolex watch with black dial",
		"gold Kolex watch with rainbow bezels",
		"Kasio G-Shock watch",
		"Kolex 2 watch",
		"Kolex watch",
		"silver Kolex watch with rainbow bezels",
		"Volex 2 watch",
		"Volex watch",
		"Alvin Lein backpack skin",
		"backpack skin",
		"backpack with a cat skin",
		"backpack with case skin",
		"bear backpack skin",
		"biohazard backpack skin",
		"Bior backpack skin",
		"bitkin handbag skin",
		"chain with spikes backpack skin",
		"classic Lui Vi backpack skin",
		"cloud backpack skin",
		"cow backpack skin",
		"cross backpack skin",
		"cute bear backpack skin",
		"demon backpack skin",
		"Domo backpack skin",
		"double pockets backpack skin",
		"duck backpack skin",
		"duffel bag skin",
		"fancy bear backpack skin",
		"G backpack skin",
		"handbag backpack skin",
		"heart backpack skin",
		"heart with wings backpack skin",
		"hippy bear backpack skin",
		"human backpack skin",
		"jolly bear backpack skin",
		"Kupreme backpack skin",
		"leather school backpack skin",
		"Lui Vi backpack skin",
		"Lui Vi shoulder backpack skin",
		"LUV backpack with wings skin",
		"Mickeys Christmas backpack skin",
		"mini-bear backpack skin",
		"Muci backpack skin",
		"Niki backpack skin",
		"piggy keychain backpack skin",
		"plaid bunny backpack skin",
		"sad hare backpack skin",
		"scary chicken backpack skin",
		"shark backpack skin",
		"skeleton cat backpack skin skin",
		"skeleton cheetah plush backpack skin",
		"skull backpack skin",
		"SSC kit bag skin",
		"star bunny backpack skin",
		"strawberry backpack skin",
		"valentines cat backpack skin",
		"Venom backpack skin",
		"Alvin Lein set",
		"Bersace set",
		"bright StarWars set",
		"Grada set",
		"Grand RP collection set",
		"Khampion set",
		"Khanel set",
		"Kupreme set",
		"Lui Vi set",
		"luminous Bendi set",
		"luminous LM Playboy set",
		"luminous OFF set",
		"Niki new collection set",
		"TRON set",
		"Valenciaga set",
		"luminous LW bomber set",
		"Lui Vi desert scarf mask",
		"gauard bag with ladudu skin",
		"capsule backpack skin",
		"classic military backpack skin",
		"memo bag with ladudu skin",
		"Essential branded pants",
		"LV backpack with water prints skin",
		"sneakers with neon spikes",
		"spiked toxic mask",
		"wide brand pants",
		"TSUM collection 3 T-shirt",
		"snake around the body accessory",
		"pot and pan headwear",
		"Coffin backpack skin",
		"kawaii rabbit bunny fabric backpack skin",
		"womens denim heeled boots",
		"snowman on the shoulder accessory",
		"gingerbread house backpack skin",
		"LW new sample branded neon set",
		"LW crossbody bag skin",
		"LUV Moscnino spiky heart backpack skin",
		"cyberpunk greatsword accessory",
		"custom jeans",
		"large LV crossbody bag skin",
		"HaHaHa set crossbody bag skin",
		"LW new sample branded neon pants",
		"Cubic Friend paired set backpack skin",
		"sweet sheep fur backpack skin",
		"royal lottery gift",
		"animated fire ring accessory",
		"animated chick accessory",
		"animated lightning charge accessory",
		"sports shoe bag skin",
		"animated unicorn wings",
		"animated toy fish accessory",
		"animated crown of shining runes accessory",
		"alcohol",
		"backpack space (low, medium, high & max quality)",
		"fabric/s (only blue)",
		"juice/s (10%, 20%, 25%)",
		"kerosene barrel",
		"leash/es",
		"neon armoured vest skin/s (V.1-?)",
		"paint can",
		"tactical grand armoured vest skin/s (V .1, 2, 3..? )",
		"gasoline barrel",
		"neon armoured vest skin/s with chains (V.?)",
		"barricade",
		"humpback whale",
		"inflatable mattress (big, small)",
		"map/s of Los Santos",
		"neon Lui Vi armoured vest skin/s (V.?)",
		"thread",
		"animal trap",
		"battery/batteries",
		"fishing rod/s (low, medium, high, premium & max quality)",
		"neon Muci armoured vest skin/s (V.?)",
		"VIP/s 1",
		"engine/s (low, medium and high quality)",
		"neon Summer 2023 armoured vest skin/s(V.?)",
		"VIP/s 2",
		"attack juice/s (10%, 20%, 25%)",
		"resource gift",
		"toy alien",
		"toy hamster",
		"birthday gift/s (big, small)",
		"chair (1/2/3/4/5/6)",
		"toy present",
		"blazzzer alcoholic beverage",
		"transmission/s (low medium & high quality)",
		"mushroom",
		"brakes (low, medium and high quality)",
		"gift/s for bikers 1/2/3/4/5",
		"gift/s for branded shorts",
		"tuning parts (low, medium & high quality)",
		"gift/s for branded T-shirts",
		"tyres  (low medium & high quality)",
		"gift/s for drifters 1/2/3",
		"gift/s for men 1/2",
		"gift/s for racers 1/2/3/4/5",
		"gift/s for women 1/2",
		"gift/s with wheels 1/2/3",
		"strawberry/strawberries",
		"Christmas gift/s (big/small)",
		"Summer 2023 armoured vest skin/s (V.1-?)",
		"suspension/s (low, medium & high quality)",
		"pickaxe/s (low, medium, high, premium and max quality)",
		"pineapple",
		"power armoured vest skin/s (V. - 1,2, 3...? )",
		"protection juice/s (10%, 20%, 25%)",
		"pumpkin",
		"purified water",
		"pet cute cactus",
		"animated accessory",
		"animated bat on the shoulder accessory",
		"ATM backpack skin",
		"assassin mask",
		"animated duck blaster accessory",
		"animated earth slime accessory",
		"bag of money backpack skin",
		"animated hero cape accessory",
		"broken mask",
		"calligraphy mask",
		"deer antlers accessory",
		"animated macaque with pacifier accessory",
		"animated mister seal accessory",
		"animated Noodle lover accessory",
		"branded longsleeve top",
		"animated piglet on bread accessory",
		"Essential pants",
		"animated royal bird on the shoulder accessory",
		"clips on a chain mask",
		"animated unicorn aura accessory",
		"Niki tech set",
		"Mucci branded flip-flops",
		"animated unicorn tail accessory",
		"animated unicorn wings accessory",
		"CAP hoodie with balaclava",
		"animated wizard cat shoulder accessory",
		"Lui Vi jeans",
		"Nik Air Max 270 shoes",
		"animated aura of stars accessory",
		"devil Mikachu backpack skin",
		"Lui Vi trousers",
		"lost treasure neon chain accessory",
		"double pocket backpack skin",
		"fur-lined bunny backpack skin",
		"luminous pants with bunny print",
		"gayardo shoulder bag skin",
		"shiny deer antlers headband accessory",
		"heart headphones",
		"gloomy bear backpack skin",
		"Mucci pants",
		"Jason mask",
		"Mucci trousers",
		"hardened heart backpack skin",
		"jacket with sweater",
		"New Balanced trousers",
		"kawaii bunny fabric backpack skin",
		"jacket with yellow trim",
		"leather Ghostface shoulder bag skin",
		"little demon backpack skin",
		"pants with split",
		"Lui Vi backpack with water prints skin",
		"skinny jeans 2024",
		"Lui Vi X Ban backpack skin",
		"Ston Islan classic sport pants",
		"Ston Islan pants",
		"LV crossbody bag skin",
		"LW everyday shoulder bag skin",
		"luminous OFF T-shirt",
		"LW new sample branded neon jacket",
		"mine backpack skin",
		"monster mouth backpack skin",
		"Supermen trousers",
		"Motosport waist backpack skin",
		"Mucci backpack skin",
		"neon chrome handbag skin",
		"Mucci hoodie",
		"silent purge mask",
		"Mucci hoodie with a snake",
		"Mucci Not Fake hoodie",
		"Mucci sweatshirt",
		"Mupreme T-shirt",
		"shoulder bag with gold trim skin",
		"shoulder bag with silver trim skin",
		"skeleton cat backpack skin",
		"toxic spiked mask",
		"small branded backpack skin",
		"small LW shoulder bag skin",
		"small sup bag skin",
		"Sp5der set shoulder bag skin",
		"shirt",
		"Ston Islan classic sports jacket",
		"stitched love shoulder backpack skin",
		"Supermen T-shirt",
		"summertime Ladies bag skin",
		"Cyberperson neon backpack skin",
		"AK backpack skin",
		"Up-Green T-shirt",
		"Womens",
		"HEADWEAR/MASK",
		"WATCH",
		"denim heeled boots",
		"body wrap top",
		"Mucci shorts",
		"unbuttoned jeans",
		"Murberry corset dress",
		"sweater dress",
		"topic pok",
		"red OFF luminous T-shirt",
		"Up-Green luminous pants",
		"gold Monowheel",
		"pink OFF luminous T-shirt",
		"luminous Khanel pants",
		"light yellow Monowheel",
		"blue OFF luminous T-shirt",
		"dark green Monowheel",
		"luminous Lui Vi pants",
		"blue Monowheel",
		"luminous Mickey Mouse pants",
		"dark purple Monowheel",
		"luminous pants",
		"coral Monowheel",
		"luminous Kupreme pants",
		"red Monowheel",
		"luminous Mickey Mouse T-shirt",
		"luminous Up-Green pants",
		"white Monowheel",
		"luminous Kupreme T-shirt",
		"green Monowheel",
		"luminous Up-Green T-shirt",
		"luminous Balenciaga pants",
		"teal Monowheel",
		"pink luminous Simpsons T-shirt",
		"dark grey Monowheel",
		"yellow luminous Simpsons T-shirt",
		"luminous Alvin Lein pants",
		"tan Monowheel",
		"red luminous T-shirt",
		"luminous Mucci pants",
		"aqua Monowheel",
		"ice blue Monowheel",
		"luminous Sashmello T-shirt",
		"luminous Grand pants",
		"light grey Monowheel",
		"luminous Lui Vi T-shirt",
		"grey Monowheel",
		"luminous Khanel T-shirt",
		"luminous Khampion T-shirt",
		"luminous Playboy pants",
		"lime green Monowheel",
		"white luminous OFF T-shirt",
		"light purple Monowheel",
		"luminous Valenciaga T-shirt",
		"Indigo Monowheel",
		"luminous Mucci T-shirt",
		"luminous Boss pants",
		"brown Monowheel",
		"luminous Bersace T-shirt",
		"luminous Bersace pants",
		"yellow Monowheel",
		"luminous Bendi T-shirt",
		"lavender Monowheel",
		"light blue Monowheel",
		"bright green Monowheel",
		"rose Monowheel",
		"dark red Monowheel",
		"olive green Monowheel",
		"purple Monowheel",
		"lavender/pink Monowheel",
		"army green Monowheel",
		"lime Monowheel",
		"peri winkle Monowheel"
	
	];

	function createItemRow(isFirst = false) {
		const rowId = `item-${Date.now()}-${Math.random()}`;
		const row = document.createElement("div");
		row.className = `item-row ${currentCategory === 'clothing' ? 'clothing-mode' : ''}`;
		row.id = rowId;

		row.innerHTML = `
            <div class="item-row-grid">
                <div class="autocomplete-container item-name-container">
                    <input type="text" class="item-name" placeholder="${currentCategory === 'clothing' ? 'Clothing Name' : 'Item Name'}">
                    <div class="autocomplete-suggestions hidden"></div>
                </div>
                <input type="text" class="qty-input" placeholder="Qty">
                <div class="autocomplete-container color-autocomplete-container">
                    <input type="text" class="item-color-select" placeholder="Color" autocomplete="off">
                    <div class="autocomplete-suggestions hidden"></div>
                </div>
                <div class="autocomplete-container type-autocomplete-container">
                    <input type="text" class="item-type-select" placeholder="Type" autocomplete="off">
                    <div class="autocomplete-suggestions hidden"></div>
                </div>
                <button type="button" class="pluralize-btn ${currentCategory === 'clothing' ? 'hidden' : ''}">Pluralize(s)</button>
                ${!isFirst
				? `<button type="button" class="remove-item-btn item-remove-icon">&times;</button>`
				: `<div class="first-spacer" style="width: 32px;"></div>`
			}
            </div>
            <div class="clothing-options ${currentCategory === 'items' ? 'hidden' : ''}">
                <div class="gender-options">
                    <div class="checkbox-item"><input type="radio" id="g-none-${rowId}" name="gender-${rowId}" class="item-gender" value="" checked><label for="g-none-${rowId}">Default</label></div>
                    <div class="checkbox-item"><input type="radio" id="g-men-${rowId}" name="gender-${rowId}" class="item-gender" value="for men"><label for="g-men-${rowId}">Men</label></div>
                    <div class="checkbox-item"><input type="radio" id="g-women-${rowId}" name="gender-${rowId}" class="item-gender" value="for women"><label for="g-women-${rowId}">Women</label></div>
                </div>
            </div>
        `;

		const nameInput = row.querySelector(".item-name");
		const suggestionsDiv = row.querySelector(".autocomplete-suggestions");
		const typeInput = row.querySelector(".item-type-select");
		const typeSuggestionsDiv = row.querySelector(".type-autocomplete-container .autocomplete-suggestions");
		const pluralizeBtn = row.querySelector(".pluralize-btn");
		const colorInput = row.querySelector(".item-color-select");
		const colorSuggestionsDiv = row.querySelector(".color-autocomplete-container .autocomplete-suggestions");

		colorInput.addEventListener("change", generateItemAd);
		colorInput.addEventListener("input", generateItemAd);
		typeInput.addEventListener("change", generateItemAd);
		typeInput.addEventListener("input", generateItemAd);

		const getTypeSuggestions = () => {
			const normalizedItemName = nameInput.value.toLowerCase().trim();
			if (itemTypeRestrictions[normalizedItemName]) {
				return itemTypeRestrictions[normalizedItemName].map((num) => `Type ${num}`);
			}
			return Array.from({ length: 40 }, (_, i) => `Type ${i + 1}`);
		};

		setupAutocomplete(nameInput, suggestionsDiv, itemSuggestionsList);
		setupAutocomplete(colorInput, colorSuggestionsDiv, colors);
		setupAutocomplete(typeInput, typeSuggestionsDiv, getTypeSuggestions);

		nameInput.addEventListener("input", () => {
			// Validate if the current type is still valid for the new item name
			const currentValue = typeInput.value.trim();
			if (currentValue) {
				const validTypes = getTypeSuggestions();
				if (!validTypes.includes(currentValue)) {
					typeInput.value = "";
					generateItemAd();
				}
			}
		});

		if (pluralizeBtn) {
			pluralizeBtn.addEventListener("click", () => {
				const isManual = pluralizeBtn.dataset.manualPlural === "true";
				pluralizeBtn.dataset.manualPlural = !isManual;
				generateItemAd();
			});
		}

		if (!isFirst) {
			row.querySelector(".remove-item-btn").addEventListener(
				"click",
				() => {
					row.remove();
					updateFormState();
				}
			);
		}

		itemsContainer.appendChild(row);
		return row;
	}

	function createPriceRow() {
		const rowId = `price-${Date.now()}-${Math.random()}`;
		const row = document.createElement("div");
		row.className = "flex-group";
		row.style.marginTop = "10px";
		row.innerHTML = `
            <input type="text" class="price-input" placeholder="Price">
            <div class="checkbox-item flex-group">
                <input type="checkbox" id="each-${rowId}" class="each-cb">
                <label for="each-${rowId}">each</label>
            </div>
        `;
		pricingContainer.appendChild(row);

		const priceInput = row.querySelector(".price-input");
		const eachCb = row.querySelector(".each-cb");
		handlePriceEachDisabled(priceInput, eachCb);
	}

	function updateFormState() {
		const isTrading = isTradingCheckbox.checked;
		const itemCount = itemsContainer.children.length;

		// Update labels based on category
		itemsLabel.textContent = currentCategory === 'clothing' ? 'Clothing Items' : 'Items';

		// Toggle clothing-specific fields visibility
		const clothingOptions = document.querySelectorAll('.clothing-options');
		const itemOptions = document.querySelectorAll('.item-options');
		clothingOptions.forEach(el => {
			el.classList.toggle('hidden', currentCategory !== 'clothing');
		});
		itemOptions.forEach(el => {
			el.classList.toggle('hidden', currentCategory === 'clothing');
		});

		// Update placeholders
		const nameInputs = document.querySelectorAll('.item-name');
		nameInputs.forEach(input => {
			input.placeholder = currentCategory === 'clothing' ? 'Clothing Name' : 'Item Name';
		});

		// Manage item rows
		if (isTrading) {
			while (itemsContainer.children.length > 2) {
				itemsContainer.lastChild.remove();
			}
			while (itemsContainer.children.length < 2) {
				createItemRow(itemsContainer.children.length === 0);
			}
			addItemBtn.classList.add("hidden");
			itemsLabel.textContent = currentCategory === 'clothing' ? 'Your Clothing & Wanted Clothing' : 'Your Item & Wanted Item';
		} else {
			addItemBtn.classList.remove("hidden");
			addItemBtn.disabled = itemCount >= 3;
		}

		// Manage pricing section
		pricingContainer.innerHTML = "";
		if (isTrading) {
			pricingContainer.innerHTML =
				'<p style="color: var(--secondary-text);">Price: Negotiable</p>';
			pricingLabel.textContent = "Pricing";
			document
				.getElementById("inBulk")
				.parentElement.parentElement.classList.add("hidden");
		} else {
			document
				.getElementById("inBulk")
				.parentElement.parentElement.classList.remove("hidden");
			pricingLabel.textContent =
				itemTransactionType === "Buying" ? "Budget" : "Pricing";
			for (let i = 0; i < itemsContainer.children.length; i++) {
				createPriceRow();
			}
		}
		generateItemAd();
	}

	// Category toggle
	categoryBtns.forEach((btn) => {
		btn.addEventListener("click", () => {
			categoryBtns.forEach((b) => b.classList.remove("active"));
			btn.classList.add("active");
			currentCategory = btn.dataset.category;

			// Clear and rebuild items with new category
			itemsContainer.innerHTML = "";
			createItemRow(true);
			updateFormState();
		});
	});

	function generateItemAd() {
		const isTrading = isTradingCheckbox.checked;
		let ad = "";

		if (isTrading) {
			const yourItemName =
				itemsContainer.children[0]
					?.querySelector(".item-name")
					.value.trim() || (currentCategory === 'clothing' ? "Your Clothing" : "Your Item");
			const wantedItemName =
				itemsContainer.children[1]
					?.querySelector(".item-name")
					.value.trim() || (currentCategory === 'clothing' ? "Wanted Clothing" : "Wanted Item");
			ad = `Trading ${yourItemName} for ${wantedItemName}. Price: Negotiable`;
		} else {
			let transaction = itemTransactionType;
			const items = Array.from(itemsContainer.children)
				.map((row, index) => {
					let name = row.querySelector(".item-name").value.trim();
					const qty = row.querySelector(".qty-input").value.trim();
					const itemType = row.querySelector(".item-type-select")?.value;
					const pluralizeBtn = row.querySelector(".pluralize-btn");
					const forcePlural = pluralizeBtn
						? pluralizeBtn.dataset.manualPlural === "true"
						: row.querySelector(".force-plural-cb")?.checked;

					// Color Logic
					const colorRaw = row.querySelector(".item-color-select")?.value;
					const colorVal = colorRaw ? colorRaw.toLowerCase() + " " : "";

					// Clothing-specific fields
					const gender = row.querySelector(".item-gender:checked")?.value;

					if (!name) return null;

					// Handle items mode
					if (currentCategory === 'items') {
						const parsedQty = parseFloat(qty.replace(/\./g, ""));
						const isUncountable = uncountableItems.includes(name.toLowerCase().trim());
						const inBulkSelected = document.getElementById("inBulk")?.checked;
						const eachSelected = pricingContainer.children[index]?.querySelector(".each-cb")?.checked;
						const autoPlural = !isUncountable && (forcePlural || inBulkSelected || eachSelected || (!isNaN(parsedQty) && parsedQty > 1));

						if (pluralizeBtn) {
							if (autoPlural) {
								pluralizeBtn.classList.add("active");
								pluralizeBtn.setAttribute("aria-pressed", "true");
							} else {
								pluralizeBtn.classList.remove("active");
								pluralizeBtn.setAttribute("aria-pressed", "false");
							}
						}

						if (autoPlural) {
							// Custom pluralization for animated accessories
							const animatedAccessoryMap = {
								"animated chick accessory": "animated chick accessories",
								"animated fire ring accessory": "animated fire ring accessories",
								"animated lightning charge accessory": "animated lightning charge accessories"
							};
							const lowerName = name.toLowerCase();
							if (animatedAccessoryMap[lowerName]) {
								name = animatedAccessoryMap[lowerName];
							} else if (name.includes("container")) {
								name = name.replace("container", "containers");
							} else if (!name.toLowerCase().endsWith("s")) {
								name += "s";
							}
						}
						if (itemType) {
							const formattedType = itemType.toLowerCase().startsWith("type ")
								? itemType.toLowerCase()
								: `type ${itemType.toLowerCase()}`;
							name += ` of ${formattedType}`;
						}

						let itemStr = colorVal ? `${colorVal}${name}` : name;

						if (qty === "1") {
							const article = "aeiou".includes(itemStr[0].toLowerCase())
								? "an"
								: "a";
							return `${article} ${itemStr}`;
						}
						return qty ? `${formatQuantity(qty)} ${itemStr}` : itemStr;
					}

					// Handle clothing mode
					if (currentCategory === 'clothing') {
						// Custom pluralization for animated accessories in clothing
						const animatedAccessoryMap = {
							"animated chick accessory": "animated chick accessories",
							"animated fire ring accessory": "animated fire ring accessories",
							"animated lightning charge accessory": "animated lightning charge accessories"
						};
						let pluralizedName = name;
						const lowerName = name.toLowerCase();
						const parsedQty = parseFloat(qty.replace(/\./g, ""));
						if (animatedAccessoryMap[lowerName] && !isNaN(parsedQty) && parsedQty > 1) {
							pluralizedName = animatedAccessoryMap[lowerName];
						}
						let itemText = qty ? `${formatQuantity(qty)} ` : "";
						itemText += colorVal ? `${colorVal}${pluralizedName}` : pluralizedName;
						if (itemType) {
							const formattedType = itemType.toLowerCase().startsWith("type ")
								? itemType.toLowerCase()
								: `type ${itemType.toLowerCase()}`;
							itemText += ` of ${formattedType}`;
						}
						if (gender) itemText += ` ${gender}`;
						return itemText.replace(/\s+/g, " ").trim();
					}

					return name;
				})
				.filter(Boolean);

			if (items.length === 0) {
				itemOutput.textContent = "";
				return;
			}

			const rawPrices = Array.from(pricingContainer.children)
				.filter((_, index) => {
					const itemName = itemsContainer.children[index]?.querySelector(".item-name")?.value.trim();
					return !!itemName;
				})
				.map((row) => {
					const price = row.querySelector(".price-input")?.value.trim();
					const isEach = row.querySelector(".each-cb")?.checked;
					return { formatted: formatPrice(price), isEach };
				});

			const allEach = rawPrices.length > 1 && rawPrices.every(p => p.isEach);

			const prices = rawPrices.map(p => {
				let formatted = p.formatted;
				if (p.isEach && !allEach) formatted += " each";
				return formatted;
			});

			const joinWithAnd = (arr) => {
				if (arr.length < 2) return arr.join("");
				if (arr.length === 2) return arr.join(" and ");
				return (
					arr.slice(0, -1).join(", ") + " and " + arr[arr.length - 1]
				);
			};

			const priceLabel =
				itemTransactionType === "Buying" ? "Budget" : "Price";

			if (items.length > 1 && respectivelyCheckbox.checked) {
				let joinedPrices = joinWithAnd(prices);
				if (allEach) joinedPrices += " each";
				ad = `${transaction} ${joinWithAnd(
					items
				)}. ${priceLabel}: ${joinedPrices} respectively.`;
			} else {
				ad = `${transaction} ${joinWithAnd(items)}`;
				if (inBulkCheckbox.checked) ad += " in bulk";
				ad += `. ${priceLabel}: `;

				let combinedPriceText = joinWithAnd(
					prices.filter(
						(p) => p !== "Negotiable" || prices.length === 1
					)
				);
				if (allEach && combinedPriceText && combinedPriceText !== "Negotiable") combinedPriceText += " each";

				const finalPrice = combinedPriceText || "Negotiable";
				ad += finalPrice;

				if (
					(finalPrice.includes("Million") ||
						finalPrice.includes("Billion") ||
						finalPrice.includes("Negotiable") ||
						finalPrice.includes("each")) &&
					!/\d$/.test(finalPrice.trim())
				) {
					ad += ".";
				}
			}
		}
		itemOutput.textContent = ad.trim().replace(/\.\./g, ".");
	}

	// Event Listeners for Items Ad
	itemTransactionBtns.forEach((btn) => {
		btn.addEventListener("click", () => {
			itemTransactionBtns.forEach((b) => b.classList.remove("active"));
			btn.classList.add("active");
			itemTransactionType = btn.dataset.type;
			updateFormState();
		});
	});
	isTradingCheckbox.addEventListener("change", updateFormState);
	addItemBtn.addEventListener("click", () => {
		if (itemsContainer.children.length < 3) {
			createItemRow();
			updateFormState();
		}
	});
	function resetItemForm() {
		itemsContainer.innerHTML = "";
		createItemRow(true);

		// Reset transaction type to Selling
		itemTransactionBtns.forEach((b) => b.classList.remove("active"));
		document
			.querySelector('.item-transaction-btn[data-type="Selling"]')
			.classList.add("active");
		itemTransactionType = "Selling";

		// Reset checkboxes
		isTradingCheckbox.checked = false;
		document.getElementById("inBulk").checked = false;
		document.getElementById("respectively").checked = false;

		updateFormState();

		// Clear output explicitly
		itemOutput.textContent = "";
	}

	itemCopyBtn.addEventListener("click", () => {
		if (itemOutput.textContent) {
			copyToClipboard(itemOutput.textContent, itemCopyBtn, resetItemForm);
		}
	});
	itemResetBtn.addEventListener("click", resetItemForm);

	const itemsAdsPage = document.getElementById("items-ads-page");
	itemsAdsPage.addEventListener("input", generateItemAd);
	itemsAdsPage.addEventListener("change", generateItemAd);
	createItemRow(true);
	updateFormState();

	// --- BUSINESS ADS LOGIC ---
	const businessTransactionBtns = document.querySelectorAll(
		".business-transaction-btn"
	);
	const isPrivateCheckbox = document.getElementById("isPrivate");
	const isFamilyCheckbox = document.getElementById("isFamily");
	const businessNameInput = document.getElementById("businessName");
	const businessNameSuggestions = document.getElementById(
		"businessNameSuggestions"
	);
	const businessNumberInput = document.getElementById("businessNumber");
	const businessLocationInput = document.getElementById("businessLocation");
	const businessLocationSuggestions = document.getElementById(
		"businessLocationSuggestions"
	);
	const businessPriceInput = document.getElementById("businessPrice");
	const businessPriceLabel = document.getElementById("businessPriceLabel");
	const businessOutput = document.getElementById("businessOutput");
	const businessCopyBtn = document.getElementById("businessCopyBtn");
	const businessResetBtn = document.getElementById("businessResetBtn");
	let businessTransactionType = "Buying";
	const businessNames = [
		"Ammunition Store",
		"ATM",
		"Bar",
		"Burger Shop",
		"Chip Tuning",
		"Car Wash",
		"Car Sharing",
		"Clothing Shop",
		"Cowshed",
		"Electric Charging Station",
		"Farm",
		"Fight Club",
		"Freight Train",
		"Gas Station",
		"Grand Elite Clothing Shop",
		"Hair Salon",
		"Jewellery Store",
		"Juice Shop",
		"Oil Well",
		"Parking",
		"Pet Shop",
		"Plantation",
		"Service Station",
		"State Object",
		"Tattoo Studio",
		"Taxi Company",
		"Warehouse",
		"24/7 Store",
		"10-Bed Plantation",
		"15-Bed Plantation",
		"20-Bed Plantation",
		"10-Bed Cabbage Plantation",
		"10-Bed Pineapple Plantation",
		"10-Bed Pumpkin Plantation",
		"10-Bed Mandarin Plantation",
		"15-Bed Cabbage Plantation",
		"15-Bed Pineapple Plantation",
		"15-Bed Pumpkin Plantation",
		"15-Bed Mandarin Plantation",
		"20-Bed Cabbage Plantation",
		"20-Bed Pineapple Plantation",
		"20-Bed Pumpkin Plantation",
		"20-Bed Mandarin Plantation",
		"Cabbage Plantation",
		"Pineapple Plantation",
		"Pumpkin Plantation",
		"Mandarin Plantation",
		"Cowshed",
		"Luna Amusement Park",
	];
	const businessLocations = [
		"in Vespucci Canals",
		"in Vinewood Hills",
		"in Rancho",
		"in Sandy Shores",
		"in Vanilla Unicorn Bar",
		"in Richman",
		"in Rockford Hills",
		"in Paleto Bay",
		"in Pillbox Hill",
		"in West Vinewood",
		"in Bahama Mamas",
		"in Banham Canyon",
		"in Cayo Perico Island",
		"in ghetto",
		"in Eclipse Tower",
		"in Del Perro",
		"in Downtown Vinewood",
		"in El Burro Heights",
		"in city",
		"in Mirror Park",
		"near beach",
		"near beach market",
		"near stadium",
		"near fire station",
		"near train station",
		"near post office",
		"near airport",
		"near mall",
		"near Stock Exchange",
		"near Residential complex",
		"near Auto Salon",
		"near Fight Club Bar",
		"near Hospital",
		"near Sandy Hospital",
		"near Diamond Bar",
		"near LifeInvader",
	];

	setupAutocomplete(
		businessNameInput,
		businessNameSuggestions,
		businessNames
	);
	setupAutocomplete(
		businessLocationInput,
		businessLocationSuggestions,
		businessLocations
	);

	function handleQualifierCheck(checkbox) {
		if (checkbox === isPrivateCheckbox && isPrivateCheckbox.checked) {
			isFamilyCheckbox.checked = false;
		}
		if (checkbox === isFamilyCheckbox && isFamilyCheckbox.checked) {
			isPrivateCheckbox.checked = false;
		}
	}
	isPrivateCheckbox.addEventListener("change", () =>
		handleQualifierCheck(isPrivateCheckbox)
	);
	isFamilyCheckbox.addEventListener("change", () =>
		handleQualifierCheck(isFamilyCheckbox)
	);

	businessTransactionBtns.forEach((btn) => {
		btn.addEventListener("click", () => {
			businessTransactionBtns.forEach((b) =>
				b.classList.remove("active")
			);
			btn.classList.add("active");
			businessTransactionType = btn.dataset.type;
			businessPriceLabel.textContent =
				businessTransactionType === "Buying" ? "Budget" : "Price";
			generateBusinessAd();
		});
	});

	function generateBusinessAd() {
		let ad = `${businessTransactionType} `;

		const isPrivate = isPrivateCheckbox.checked;
		const isFamily = isFamilyCheckbox.checked;
		const name = businessNameInput.value.trim();
		const number = businessNumberInput.value.trim();
		const location = businessLocationInput.value.trim();

		if (isFamily) {
			ad += "a family business";
		} else if (isPrivate) {
			ad += "a private business";
			if (location) {
				ad += ` ${location}`;
			}
		} else {
			if (name) {
				ad += name;
				if (number) {
					ad += ` №${number}`;
				} else {
					ad += " business";
				}
			} else {
				ad += "a business";
			}
			if (location) {
				ad += ` ${location}`;
			}
		}

		const priceLabel =
			businessTransactionType === "Buying" ? "Budget" : "Price";
		const formattedPrice = formatPrice(businessPriceInput.value);
		ad += `. ${priceLabel}: ${formattedPrice}`;

		if (
			(formattedPrice.includes("Million") ||
				formattedPrice.includes("Billion") ||
				formattedPrice === "Negotiable") &&
			!/\d$/.test(formattedPrice.trim())
		) {
			ad += ".";
		}

		businessOutput.textContent = ad;
	}

	function resetBusinessForm() {
		const inputs = document.querySelectorAll(
			'#business-ads-page input[type="text"]'
		);
		inputs.forEach((input) => (input.value = ""));

		isPrivateCheckbox.checked = false;
		isFamilyCheckbox.checked = false;

		const buyingButton = document.querySelector(
			'.business-transaction-btn[data-type="Buying"]'
		);
		if (buyingButton) buyingButton.click();

		businessOutput.textContent = "";
	}

	businessCopyBtn.addEventListener("click", () =>
		copyToClipboard(
			businessOutput.textContent,
			businessCopyBtn,
			resetBusinessForm
		)
	);
	businessResetBtn.addEventListener("click", resetBusinessForm);

	document.getElementById("business-ads-page").addEventListener("input", generateBusinessAd);

	// --- WORK ADS LOGIC ---
	const workCategoryInput = document.getElementById("workCategory");
	const workCategorySuggestions = document.getElementById(
		"workCategorySuggestions"
	);
	const workSalaryInput = document.getElementById("workSalary");
	const perDayCheckbox = document.getElementById("perDay");
	const perHourCheckbox = document.getElementById("perHour");
	const workOutput = document.getElementById("workOutput");
	const workCopyBtn = document.getElementById("workCopyBtn");
	const workResetBtn = document.getElementById("workResetBtn");

	const workSuggestions = [
		"Looking for a job as a driver",
		"Hiring workers at construction site №1, on Vespucci Boulevard",
		"Hiring workers at construction site №2, on Calais Avenue",
		"Hiring workers at construction site №3, in Pillbox Hill",
		"Hiring workers at construction site №4, in Mirror Park",
		"Looking for a job",
		"Hiring workers at construction site",
		"Looking for work as a trucker with 3 years of experience",
		"Looking for work as a driver with 2 years of experience",
		"Hiring a driver with 3 years of experience",
		"Hiring a gardener",
		"Hiring a bodyguard",
		"Hiring a firefighter",
		"Pilot looking for a job",
		"Lawyer looking for work",
		"Hiring professional dancers",
		"Hiring workers for solar panel plantation",
		"Hiring workers for collector job",
		"Looking for a job to plant a solar panel",
		"Looking for a job at the construction site",
		"Looking for work as a lawyer",
		"Hiring a DJ",
		"Hiring a personal assistant",
		"Hiring a lawyer",
	];
	setupAutocomplete(
		workCategoryInput,
		workCategorySuggestions,
		workSuggestions
	);

	function handlePaymentTypeCheck(checkbox) {
		if (checkbox === perDayCheckbox && perDayCheckbox.checked) {
			perHourCheckbox.checked = false;
		}
		if (checkbox === perHourCheckbox && perHourCheckbox.checked) {
			perDayCheckbox.checked = false;
		}
	}
	perDayCheckbox.addEventListener("change", () =>
		handlePaymentTypeCheck(perDayCheckbox)
	);
	perHourCheckbox.addEventListener("change", () =>
		handlePaymentTypeCheck(perHourCheckbox)
	);

	workSalaryInput.addEventListener("blur", () => {
		const value = workSalaryInput.value;
		if (value) {
			const formatted = formatPrice(value, true);
			if (formatted !== "Negotiable") {
				workSalaryInput.value = formatted;
			}
		}
	});

	function handleWorkSalaryFrequencyState() {
		const hasSalary = workSalaryInput.value.trim() !== "";
		perDayCheckbox.disabled = !hasSalary;
		perHourCheckbox.disabled = !hasSalary;
		if (!hasSalary) {
			perDayCheckbox.checked = false;
			perHourCheckbox.checked = false;
		}
	}
	workSalaryInput.addEventListener("input", handleWorkSalaryFrequencyState);
	handleWorkSalaryFrequencyState(); // Initial check

	function generateWorkAd() {
		const category = workCategoryInput.value.trim();
		if (!category) {
			workOutput.textContent = "Please enter a work category.";
			return;
		}

		let ad = `${category}.`;
		const salary = workSalaryInput.value.trim();

		const formattedSalary = formatPrice(salary, true);

		ad += ` Salary: ${formattedSalary}`;

		if (perDayCheckbox.checked) {
			ad += " per day";
		} else if (perHourCheckbox.checked) {
			ad += " per hour";
		}

		if (
			(formattedSalary.includes("Million") ||
				formattedSalary.includes("Billion") ||
				formattedSalary === "Negotiable" ||
				perDayCheckbox.checked ||
				perHourCheckbox.checked) &&
			!/\d$/.test(formattedSalary.trim())
		) {
			ad += ".";
		}
		workOutput.textContent = ad;
	}

	function resetWorkForm() {
		workCategoryInput.value = "";
		workSalaryInput.value = "";
		perDayCheckbox.checked = false;
		perHourCheckbox.checked = false;
		workOutput.textContent = "";
	}

	workCopyBtn.addEventListener("click", () =>
		copyToClipboard(workOutput.textContent, workCopyBtn, resetWorkForm)
	);
	workResetBtn.addEventListener("click", resetWorkForm);

	document.getElementById("work-ads-page").addEventListener("input", generateWorkAd);

	// --- DATING ADS LOGIC ---
	const datingCustomSelect = document.getElementById("datingCustomSelect");
	const datingSelectButton =
		datingCustomSelect.querySelector(".select-button");
	const datingSelectedValue = document.getElementById("datingSelectedValue");
	const datingDropdown = datingCustomSelect.querySelector(".select-dropdown");
	const datingSearchInput = document.getElementById("datingSearchInput");
	const datingOptionsContainer = document.getElementById(
		"datingOptionsContainer"
	);
	const datingFullNameGroup = document.getElementById("datingFullNameGroup");
	const datingFullNameInput = document.getElementById("datingFullName");
	const datingOutput = document.getElementById("datingOutput");
	const datingCopyBtn = document.getElementById("datingCopyBtn");

	const datingOptions = [
		"Looking for a specific person.",
		"Looking for a family.",
		"Looking for family members.",
		"Looking for family friends.",
		"Looking for friends.",
		"Looking for a friend.",
		"Looking for a wife.",
		"Looking for a husband.",
		"Looking for a girlfriend.",
		"Looking for a boyfriend.",
		"Looking for a date.",
		"Looking to arm wrestle.",
		"Looking to play poker. Bet: Negotiable."

	];

	function populateDatingOptions(filter = "") {
		datingOptionsContainer.innerHTML = "";
		const filteredOptions = datingOptions.filter((option) =>
			option.toLowerCase().includes(filter.toLowerCase())
		);

		filteredOptions.forEach((option) => {
			const optionDiv = document.createElement("div");
			optionDiv.textContent = option;
			optionDiv.addEventListener("click", () => {
				datingSelectedValue.textContent = option;
				closeDatingDropdown();
				generateDatingAd();
			});
			datingOptionsContainer.appendChild(optionDiv);
		});
	}

	function closeDatingDropdown() {
		datingDropdown.classList.add("hidden");
		datingSelectButton.classList.remove("open");
	}

	function generateDatingAd() {
		const selectedOption = datingSelectedValue.textContent;
		let ad = "";

		if (selectedOption === "Select an option...") {
			datingOutput.textContent = "";
			datingCopyBtn.disabled = true;
			datingFullNameGroup.classList.add("hidden");
			return;
		}

		if (selectedOption === "Looking for a specific person.") {
			datingFullNameGroup.classList.remove("hidden");
			const fullName = datingFullNameInput.value.trim();
			ad = fullName
				? `Looking for ${fullName}.`
				: "Looking for a specific person.";
		} else {
			datingFullNameGroup.classList.add("hidden");
			ad = selectedOption;
		}

		datingOutput.textContent = ad;
		datingCopyBtn.disabled = false;
	}

	function resetDatingForm() {
		datingSelectedValue.textContent = "Select an option...";
		datingFullNameInput.value = "";
		datingSearchInput.value = "";
		populateDatingOptions();
		generateDatingAd();
	}

	datingSelectButton.addEventListener("click", () => {
		const isOpen = !datingDropdown.classList.contains("hidden");
		if (isOpen) {
			closeDatingDropdown();
		} else {
			datingDropdown.classList.remove("hidden");
			datingSelectButton.classList.add("open");
			populateDatingOptions();
			datingSearchInput.focus();
		}
	});

	datingSearchInput.addEventListener("input", () => {
		populateDatingOptions(datingSearchInput.value);
	});

	datingFullNameInput.addEventListener("input", generateDatingAd);

	datingCopyBtn.addEventListener("click", () =>
		copyToClipboard(datingOutput.textContent, datingCopyBtn, resetDatingForm)
	);

	document.addEventListener("click", (e) => {
		if (!datingCustomSelect.contains(e.target)) {
			closeDatingDropdown();
		}
	});

	// Initial population
	populateDatingOptions();
});

// --- CONTACT PAGE FUNCTIONS ---

// Open/Close Forms
function openBugReport() {
	closeForms();
	document.getElementById("bugReportForm").classList.remove("hidden");
}

function openFeedback() {
	closeForms();
	document.getElementById("feedbackForm").classList.remove("hidden");
}

function closeForms() {
	document.getElementById("bugReportForm").classList.add("hidden");
	document.getElementById("feedbackForm").classList.add("hidden");
	// Clear forms
	document.getElementById("bugSection").value = "";
	document.getElementById("bugDescription").value = "";
	document.getElementById("feedbackType").value = "";
	document.getElementById("feedbackDescription").value = "";
	document.getElementById("bugReportOutput").textContent = "";
	document.getElementById("feedbackOutput").textContent = "";
	document.getElementById("copyBugReport").disabled = true;
	document.getElementById("copyFeedback").disabled = true;
}

// Generate Bug Report
function generateBugReport() {
	const section = document.getElementById("bugSection").value;
	const description = document.getElementById("bugDescription").value.trim();

	if (!section || !description) {
		showNotification("Please fill in all fields", "error");
		return;
	}

	const report = `🐛 **BUG REPORT** - Grand RP Ads Generator Suite

📍 **Section:** ${section}
📝 **Description:** ${description}
⏰ **Reported:** ${new Date().toLocaleString()}
🌐 **Browser:** ${navigator.userAgent.split(")")[0]})

**Steps to reproduce (if applicable):**
1. Go to ${section} section
2. [Add your steps here]

**Expected vs Actual:**
- Expected: [What should happen]
- Actual: [What actually happened]

**Additional Info:**
Please contact Lord Mashle for assistance.`;

	document.getElementById("bugReportOutput").textContent = report;
	document.getElementById("copyBugReport").disabled = false;
	showNotification("Bug report generated! Copy and send via Discord.");
}

// Generate Feedback
function generateFeedback() {
	const type = document.getElementById("feedbackType").value;
	const description = document
		.getElementById("feedbackDescription")
		.value.trim();

	if (!type || !description) {
		showNotification("Please fill in all fields", "error");
		return;
	}

	let emoji = "💬";
	switch (type) {
		case "Feature Request":
			emoji = "✨";
			break;
		case "Improvement":
			emoji = "🚀";
			break;
		case "General Feedback":
			emoji = "💬";
			break;
		case "Compliment":
			emoji = "🎉";
			break;
	}

	const feedback = `${emoji} **${type.toUpperCase()}** - Grand RP Ads Generator Suite

📝 **Feedback:** ${description}
⏰ **Submitted:** ${new Date().toLocaleString()}
👤 **From:** Anonymous User

**About the App:**
Grand RP Ads Generator Suite v2.0 - Enhanced Edition
Developed by Lord Mashle

Thank you for your feedback! 🙏`;

	document.getElementById("feedbackOutput").textContent = feedback;
	document.getElementById("copyFeedback").disabled = false;
	showNotification("Feedback message generated! Copy and send via Discord.");
}

// Copy Functions for Contact Forms
document.addEventListener("DOMContentLoaded", () => {
	const copyBugReportBtn = document.getElementById("copyBugReport");
	const copyFeedbackBtn = document.getElementById("copyFeedback");

	if (copyBugReportBtn) {
		copyBugReportBtn.addEventListener("click", () => {
			copyToClipboard(
				document.getElementById("bugReportOutput").textContent,
				copyBugReportBtn,
				() => {
					showNotification(
						"Bug report copied! Now send it via Discord."
					);
					setTimeout(closeForms, 1500);
				}
			);
		});
	}

	if (copyFeedbackBtn) {
		copyFeedbackBtn.addEventListener("click", () => {
			copyToClipboard(
				document.getElementById("feedbackOutput").textContent,
				copyFeedbackBtn,
				() => {
					showNotification(
						"Feedback copied! Now send it via Discord."
					);
					setTimeout(closeForms, 1500);
				}
			);
		});
	}
});

document.addEventListener("DOMContentLoaded", () => {
	const managerCategorySelect = document.getElementById("managerCategorySelect");
	const managerSearchInput = document.getElementById("managerSearchInput");
	const managerServicesList = document.getElementById("managerServicesList");
	const managerCart = document.getElementById("managerCart");
	const managerSubtotal = document.getElementById("managerSubtotal");
	const managerTax = document.getElementById("managerTax");
	const managerTotal = document.getElementById("managerTotal");
	const managerOrderOutput = document.getElementById("managerOrderOutput");
	const managerBankAccountInput = document.getElementById("managerBankAccountInput");
	const managerCopyBtn = document.getElementById("managerCopyBtn");
	const managerResetBtn = document.getElementById("managerResetBtn");

	if (!managerCategorySelect || !managerServicesList || !managerCart || !managerBankAccountInput) {
		return;
	}

	const savedBankAccount = localStorage.getItem("managerBankAccount");
	if (savedBankAccount !== null) {
		managerBankAccountInput.value = savedBankAccount;
	}

	managerBankAccountInput.addEventListener("input", () => {
		localStorage.setItem("managerBankAccount", managerBankAccountInput.value.trim());
	});

	const managerCategories = {
		"individuals": {
			name: "Individuals",
			services: [
				{ name: "Shoutout in LifeInvader CNN", price: 100000 },
				{ name: "City broadcasts (00:00–11:59)", price: 100000 },
				{ name: "City broadcasts (12:00–23:59)", price: 150000 },
				{ name: "Designing a static poster", price: 100000 },
				{ name: "Designing an animated poster", price: 200000 },
				{ name: "Designing the promotion message", price: 70000 },
				{ name: "Create an event with GPS", price: 25000 },
				{ name: "LifeInvader designing a template", price: 45000 },
				{ name: "Adding or updating a template", price: 20000 },
				{ name: "Photo Shoot", price: 100000 }
			]
		},
		"businesses": {
			name: "Businesses and Offices",
			services: [
				{ name: "Shoutout in LifeInvader CNN", price: 100000 },
				{ name: "City broadcasts (00:00–11:59)", price: 100000 },
				{ name: "City broadcasts (12:00–23:59)", price: 150000 },
				{ name: "Designing a static poster", price: 100000 },
				{ name: "Designing an animated poster", price: 200000 },
				{ name: "Designing the promotion message", price: 70000 },
				{ name: "Create an event with GPS", price: 25000 },
				{ name: "LifeInvader designing a template", price: 45000 },
				{ name: "Adding or updating a template", price: 20000 },
				{ name: "Photo Shoot", price: 100000 }
			]
		},
		"long-term-clients": {
			name: "Long Term Clients",
			services: [
				{ name: "Shoutout", price: 80000 },
				{ name: "Morning broadcast", price: 80000 },
				{ name: "Evening broadcast", price: 120000 },
				{ name: "Static poster", price: 100000 },
				{ name: "Animated poster", price: 200000 },
				{ name: "Promotion message", price: 60000 },
				{ name: "Event GPS", price: 25000 },
				{ name: "Template design", price: 35000 },
				{ name: "Template update", price: 15000 },
				{ name: "Photo Shoot", price: 100000 }
			]
		},
		"invaders": {
			name: "Invaders",
			services: [
				{ name: "Shoutout", price: 50000 },
				{ name: "Morning broadcast", price: 60000 },
				{ name: "Evening broadcast", price: 70000 },
				{ name: "Static poster", price: 100000 },
				{ name: "Animated poster", price: 200000 },
				{ name: "Promotion message", price: 40000 },
				{ name: "Event GPS", price: 20000 },
				{ name: "Template design", price: 25000 },
				{ name: "Template update", price: 10000 },
				{ name: "Photo Shoot", price: 100000 }
			]
		},
		"state": {
			name: "State",
			services: [
				{
					name: "Shoutout",
					price: 0,
					note: "Free for first 3, then $90,000",
					special: "state-shoutout"
				},
				{ name: "Morning broadcast", price: 80000 },
				{ name: "Evening broadcast", price: 120000 },
				{ name: "Static poster", price: 100000 },
				{ name: "Animated poster", price: 200000 },
				{ name: "Promotion message", price: 70000 },
				{ name: "Event GPS", price: 25000 },
				{ name: "Template design", price: 30000 },
				{ name: "Template update", price: 10000 },
				{ name: "Promo video (5 min)", price: 500000 },
				{ name: "Extra footage (1 min)", price: 75000 },
				{ name: "Priority posting", price: 100000 },
				{ name: "Photo Shoot", price: 100000 }
			]
		},
		"political-parties": {
			name: "Political Parties",
			services: [
				{ name: "Shoutout", price: 80000 },
				{ name: "Morning broadcast", price: 80000 },
				{ name: "Evening broadcast", price: 120000 },
				{ name: "Static poster", price: 100000 },
				{ name: "Animated poster", price: 200000 },
				{ name: "Promotion message", price: 40000 },
				{ name: "Event GPS", price: 15000 },
				{ name: "Photo Shoot", price: 100000 }
			]
		},
		"families": {
			name: "Families",
			services: [
				{ name: "Template renew (7 days)", price: 15000 },
				{ name: "Template design", price: 45000 },
				{ name: "Template update", price: 30000 }
			]
		},
		"parties": {
			name: "Parties",
			services: [
				{ name: "Party Bus", price: 50000, unit: "hour" },
				{ name: "Party Limo", price: 30000, unit: "hour" },
				{ name: "Photo Shoot", price: 100000 }
			]
		},
		"southside-influencers": {
			name: "Southside Influencers",
			services: [
				{ name: "Broadcast (all day)", price: 50000 },
				{ name: "Promotion message", price: 70000 },
				{ name: "Event GPS", price: 0, note: "Free" }
			]
		}
	};

	const cartItems = [];
	let activeCategoryId = managerCategorySelect.value;

	function formatCurrency(value) {
		return `$${value.toLocaleString("de-DE")}`;
	}

	function showNotification(message, type = "success") {
		const existing = document.querySelector(".notification");
		if (existing) existing.remove();
		const notification = document.createElement("div");
		notification.className = `notification ${type}`;
		notification.textContent = message;
		document.body.appendChild(notification);
		setTimeout(() => notification.classList.add("show"), 10);
		setTimeout(() => {
			notification.classList.remove("show");
			setTimeout(() => notification.remove(), 400);
		}, 3000);
	}

	function getServiceLabel(service) {
		const priceText = service.price === 0 ? "Free" : formatCurrency(service.price) + (service.unit ? `/${service.unit}` : "");
		return service.note ? `${priceText} (${service.note})` : priceText;
	}

	function computeItemTotal(item) {
		if (item.special === "state-shoutout") {
			const paidQty = Math.max(0, item.quantity - 3);
			return paidQty * 90000;
		}
		return item.price * item.quantity;
	}

	function renderServices() {
		const search = managerSearchInput.value.trim().toLowerCase();
		const category = managerCategories[activeCategoryId];
		const services = category ? category.services : [];
		const matching = search
			? services.filter((service) =>
				service.name.toLowerCase().includes(search)
			)
			: [];

		const serviceLabel = document.getElementById("managerServicesLabel");
		if (search === "") {
			serviceLabel.classList.add("hidden");
			managerServicesList.innerHTML = `<div class="manager-empty">Search for services to begin.</div>`;
			return;
		}

		serviceLabel.classList.remove("hidden");
		managerServicesList.innerHTML = "";
		if (matching.length === 0) {
			managerServicesList.innerHTML = `<div class="manager-empty">No services found.</div>`;
			return;
		}

		matching.forEach((service) => {
			const item = document.createElement("div");
			item.className = "service-item";
			item.innerHTML = `
				<div class="service-details">
					<div class="service-name">${service.name}</div>
					<div class="service-price">${getServiceLabel(service)}</div>
				</div>
				<button type="button" class="action-btn btn-copy">Add</button>
			`;
			item.querySelector("button").addEventListener("click", () => {
				addServiceToCart(service);
				showNotification("Service Added");
			});
			managerServicesList.appendChild(item);
		});
	}

	function renderCart() {
		managerCart.innerHTML = "";
		if (cartItems.length === 0) {
			managerCart.innerHTML = `<div class="manager-empty">No services selected yet.</div>`;
			updateSummary();
			managerOrderOutput.textContent = "Your order summary will appear here.";
			return;
		}

		cartItems.forEach((item) => {
			const row = document.createElement("div");
			row.className = "cart-item";
			row.innerHTML = `
				<div class="cart-details">
					<div class="cart-name">${item.name}</div>
					<div class="cart-price">${item.special === "state-shoutout" ? "Free first 3 uses, $90,000 each after" : item.price === 0 ? "Free" : formatCurrency(item.price) + (item.unit ? `/${item.unit}` : "")}</div>
				</div>
				<div class="cart-controls">
					<input type="number" min="1" value="${item.quantity}" />
					<button type="button" class="remove-btn">Remove</button>
				</div>
			`;
			const quantityInput = row.querySelector("input");
			const removeButton = row.querySelector("button");

			quantityInput.addEventListener("input", () => {
				const value = parseInt(quantityInput.value, 10);
				if (Number.isNaN(value) || value < 1) {
					item.quantity = 1;
					quantityInput.value = 1;
				} else {
					item.quantity = value;
				}
				updateSummary();
				managerOrderOutput.textContent = generateManagerOutput();
			});

			removeButton.addEventListener("click", () => {
				const index = cartItems.indexOf(item);
				if (index !== -1) {
					cartItems.splice(index, 1);
					renderCart();
				}
			});

			managerCart.appendChild(row);
		});

		updateSummary();
		managerOrderOutput.textContent = generateManagerOutput();
	}

	function addServiceToCart(service) {
		const existing = cartItems.find((item) => item.name === service.name);
		if (existing) {
			existing.quantity += 1;
		} else {
			cartItems.push({
				name: service.name,
				price: service.price,
				unit: service.unit || "",
				note: service.note || "",
				special: service.special || "",
				quantity: 1
			});
		}
		renderCart();
	}

	function updateSummary() {
		const subtotal = cartItems.reduce((sum, item) => sum + computeItemTotal(item), 0);
		const tax = Math.round(subtotal * 0.03);
		const total = subtotal + tax;
		managerSubtotal.textContent = formatCurrency(subtotal);
		managerTax.textContent = formatCurrency(tax);
		managerTotal.textContent = formatCurrency(total);
	}

	function generateManagerOutput() {
		if (cartItems.length === 0) {
			return "Your order summary will appear here.";
		}
		const subtotal = cartItems.reduce((sum, item) => sum + computeItemTotal(item), 0);
		const tax = Math.round(subtotal * 0.03);
		const total = subtotal + tax;
		const accountNumber = managerBankAccountInput.value.trim() || "54011";
		const lines = ["Your Order:", ""];
		cartItems.forEach((item) => {
			lines.push(`${item.name} x${item.quantity}`);
		});
		lines.push("", `(Total with 3% Tax) = ${formatCurrency(total)}`);
		lines.push("", `Please make your payment to Bank Account ${accountNumber} and post your payment proof here once completed.`);
		return lines.join("\n");
	}

	managerCategorySelect.addEventListener("change", () => {
		activeCategoryId = managerCategorySelect.value;
		managerSearchInput.value = "";
		cartItems.length = 0;
		renderServices();
		renderCart();
	});

	managerSearchInput.addEventListener("input", renderServices);

	managerCopyBtn.addEventListener("click", () => {
		if (cartItems.length === 0) {
			showNotification("Please add at least one service before copying.", "error");
			return;
		}
		const output = generateManagerOutput();
		navigator.clipboard.writeText(output).then(() => {
			showNotification("Order copied to clipboard.");
			managerOrderOutput.textContent = output;
		}).catch(() => {
			showNotification("Unable to copy order output.", "error");
		});
	});

	managerResetBtn.addEventListener("click", () => {
		cartItems.length = 0;
		managerSearchInput.value = "";
		managerCategorySelect.selectedIndex = 0;
		activeCategoryId = managerCategorySelect.value;
		renderServices();
		renderCart();
		managerOrderOutput.textContent = "Your order summary will appear here.";
	});

	renderServices();
	renderCart();
});
document.addEventListener("DOMContentLoaded", () => {
	const categoryButtons = document.querySelectorAll(".other-category-btn");
	const modeButtons = document.querySelectorAll(".other-toggle-btn");
	const partySection = document.getElementById("otherAdsPartySection");
	const constructionSection = document.getElementById("otherAdsUnderConstruction");
	const houseInputGroup = document.getElementById("houseInputGroup");
	const locationInputGroup = document.getElementById("locationInputGroup");
	const partyHouseNumber = document.getElementById("partyHouseNumber");
	const partyLocationSelect = document.getElementById("partyLocationSelect");
	const partyPreview = document.getElementById("partyPreview");
	const partyCopyBtn = document.getElementById("partyCopyBtn");
	const partyValidationMessage = document.getElementById("partyValidationMessage");
	const partyLocationSuggestions = document.getElementById("partyLocationSuggestions");

	const partyLocations = [
		"Amphitheatre №1", "Amphitheatre №2", "Auto Salon", "Bahama Mamas",
		"Banham Canyon", "Business Center", "Capitol", "the Casino",
		"Cayo Perico Island", "Chumash", "the Church", "Del Perro",
		"Diamond Bar", "Downtown Vinewood", "Eclipse Tower", "El Burro Heights",
		"Fight Club Bar", "Hospital", "Sandy Hospital", "Legion Square",
		"LifeInvader", "Little Seoul", "Mirror Park", "Richards Majestic",
		"Richman", "Rockford Hills", "Pacific Bluffs Country Club", "Paleto Bay",
		"Pillbox Hill", "Postal", "Rancho", "the beach"
	];

	if (window.setupAutocomplete && partyLocationSelect && partyLocationSuggestions) {
		window.setupAutocomplete(partyLocationSelect, partyLocationSuggestions, partyLocations);
	}

	let activeCategory = "Party";
	let activeMode = "house";

	function setActiveCategory(selectedButton) {
		categoryButtons.forEach((button) => {
			button.classList.toggle("active", button === selectedButton);
		});
		activeCategory = selectedButton.dataset.category;
		partySection.classList.toggle("hidden", activeCategory !== "Party");
		constructionSection.classList.toggle("hidden", activeCategory === "Party");
		updatePreview();
	}

	function switchMode(mode) {
		activeMode = mode;
		modeButtons.forEach((button) => {
			button.classList.toggle("active", button.dataset.mode === mode);
		});
		houseInputGroup.classList.toggle("hidden", mode !== "house");
		locationInputGroup.classList.toggle("hidden", mode !== "location");
		partyValidationMessage.classList.add("hidden");
		updatePreview();
	}

	function validateHouseValue(value) {
		return /^\d+$/.test(value);
	}

	function updatePreview() {
		let previewText = "Party at house №???.";
		let valid = false;

		if (activeCategory !== "Party") {
			previewText = "🚧 This category is under construction";
		} else if (activeMode === "house") {
			const houseNumber = partyHouseNumber.value.trim();
			if (!houseNumber) {
				previewText = "Party at house №???.";
			} else if (validateHouseValue(houseNumber)) {
				previewText = `Party at house №${houseNumber}.`;
				valid = true;
			} else {
				previewText = "Party at house №???.";
				partyValidationMessage.classList.remove("hidden");
			}
		} else {
			const locationValue = partyLocationSelect.value;
			if (locationValue) {
				previewText = `Party at ${locationValue}.`;
				valid = true;
			} else {
				previewText = "Party at house №???.";
			}
		}

		partyPreview.textContent = previewText;
		partyCopyBtn.disabled = !valid;
		partyCopyBtn.classList.toggle("disabled", !valid);
	}

	categoryButtons.forEach((button) => {
		button.addEventListener("click", () => setActiveCategory(button));
	});

	modeButtons.forEach((button) => {
		button.addEventListener("click", () => switchMode(button.dataset.mode));
	});

	partyHouseNumber.addEventListener("input", (event) => {
		const rawValue = event.target.value;
		const digitsOnly = rawValue.replace(/\D/g, "");
		if (rawValue !== digitsOnly) {
			event.target.value = digitsOnly;
		}
		partyValidationMessage.classList.add("hidden");
		updatePreview();
	});

	partyLocationSelect.addEventListener("change", updatePreview);
	partyLocationSelect.addEventListener("input", updatePreview);

	partyCopyBtn.addEventListener("click", () => {
		if (partyCopyBtn.disabled) return;
		navigator.clipboard.writeText(partyPreview.textContent.trim()).then(() => {
			partyCopyBtn.textContent = "Copied";
			setTimeout(() => {
				partyCopyBtn.textContent = "Copy Ad";
			}, 1200);
		}).catch(() => {
			console.warn("Clipboard write failed.");
		});
	});

	partySection.classList.remove("hidden");
	constructionSection.classList.add("hidden");
	switchMode("house");
});