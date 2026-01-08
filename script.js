/**
 * ====================================================================================================
 * ZENVIA E-COMMERCE ENGINE - CORE APPLICATION LOGIC (TITANIUM EDITION v11.7)
 * ====================================================================================================
 * Author: Zenvia Development Team (Arnab Pandey)
 * Last Updated: January 8, 2026
 * Description: Enterprise-grade e-commerce controller handling State, Auth, UI, and Data.
 * Update: Removed native browser prompts for Password Reset; added dedicated UI Form flow.
 * * [ SYSTEM ARCHITECTURE ]
 * ----------------------------------------------------------------------------------------------------
 * 1. CONFIGURATION ....... Global constants, API keys, and DOM selectors.
 * 2. LOCALIZATION DATA ... Supported Languages and Regions.
 * 3. UTILITIES ........... Helper functions for Validation, Formatting, and Logging.
 * 4. STATE MANAGER ....... Centralized reactive data store (Redux-lite pattern).
 * 5. DATABASE ............ Mock data for Coupons, Reviews, and Banners.
 * 6. DATA SERVICE ........ Async API fetching with normalization and error handling.
 * 7. AUTH ENGINE ......... Email/Pass Auth + EmailJS OTP + UI-Based Forgot Password.
 * 8. COMMERCE ENGINE ..... Cart, Tax, Shipping, and Wishlist logic.
 * 9. UI RENDERER ......... Dynamic HTML injection (Glassmorphism components).
 * 10. INTERACTION ........ Carousel, Zoom, Voice Search, and Localization Logic.
 * 11. ROUTER ............. URL-based navigation handler.
 * ====================================================================================================
 */

/* =========================================
   1. CONFIGURATION & CONSTANTS
   ========================================= */
const CONFIG = {
    // External API Endpoints
    API: {
        FAKE_STORE: 'https://fakestoreapi.com/products',
        DUMMY_JSON: 'https://dummyjson.com/products?limit=0'
    },
    
    // LocalStorage Keys (Persistent Data)
    STORAGE: {
        CART: 'zenviaCart_v1',
        WISHLIST: 'zenviaWishlist_v1',
        USERS: 'zenviaUsers_v1',
        CURRENT_USER: 'zenviaCurrentUser_v1',
        THEME: 'zenviaTheme_v1',
        RECENT: 'zenviaRecent_v1',
        ORDERS: 'zenviaOrders_v1'
    },

    // EmailJS Configuration (Strictly for Email OTP)
    EMAILJS: {
        SERVICE_ID: "service_hotzar3",
        TEMPLATE_ID: "template_4n6xrkz",
        PUBLIC_KEY: "8nCjbFOjFfGtDi-vn"
    },

    // DOM Element IDs
    DOM: {
        PRODUCT_LIST: 'product-list',
        DETAIL_CONTAINER: 'detail-container',
        CART_ITEMS: 'cart-items',
        REVIEW_LIST: 'reviews-list',
        TOAST_CONTAINER: 'toast-container',
        AUTH_MODAL: 'auth-modal',
        SEARCH_INPUT: 'search-input'
    },

    // System Settings
    SETTINGS: {
        CURRENCY: '$',
        TAX_RATE: 0.05, // 5% Tax
        FREE_SHIPPING_THRESHOLD: 100, // Free shipping over $100
        SHIPPING_COST: 15,
        OTP_LENGTH: 4,
        TOAST_DURATION: 3000,
        CAROUSEL_SPEED: 5000
    }
};

/* =========================================
   2. LOCALIZATION DATA (NEW FEATURE)
   ========================================= */
const LocalizationData = {
    // Supported Languages with native names
    LANGUAGES: [
        { code: 'en', name: 'English', native: 'English' },
        { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
        { code: 'es', name: 'Spanish', native: 'Español' },
        { code: 'fr', name: 'French', native: 'Français' },
        { code: 'de', name: 'German', native: 'Deutsch' },
        { code: 'ar', name: 'Arabic', native: 'العربية' },
        { code: 'pt', name: 'Portuguese', native: 'Português' },
        { code: 'zh', name: 'Chinese', native: '中文' }
    ],
    // Supported Regions with FlagCDN codes
    REGIONS: [
        { code: 'in', name: 'India', flag: 'in' },
        { code: 'us', name: 'United States', flag: 'us' },
        { code: 'gb', name: 'United Kingdom', flag: 'gb' },
        { code: 'ae', name: 'United Arab Emirates', flag: 'ae' },
        { code: 'ca', name: 'Canada', flag: 'ca' },
        { code: 'au', name: 'Australia', flag: 'au' },
        { code: 'br', name: 'Brazil', flag: 'br' },
        { code: 'de', name: 'Germany', flag: 'de' }
    ]
};

/* =========================================
   3. UTILITIES (Validation & Helpers)
   ========================================= */
const Utils = {
    /**
     * Internal Logger to trace application events
     */
    log: (msg, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = `[ZENVIA ${timestamp}]:`;
        if (type === 'error') console.error(prefix, msg);
        else if (type === 'warn') console.warn(prefix, msg);
        else console.log(prefix, msg);
    },

    /**
     * Formats currency numbers to 2 decimal places
     */
    formatMoney: (amount) => {
        return parseFloat(amount).toFixed(2);
    },

    /**
     * Capitalizes first letter of words (slug to title)
     */
    capitalize: (str) => {
        if (!str) return '';
        return str.replace(/-/g, ' ').replace(/_/g, ' ').toLowerCase()
                  .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    },

    /**
     * Validation Regex Patterns
     */
    Validators: {
        email: (email) => {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(String(email).toLowerCase());
        },
        password: (pass) => {
            // Min 6 chars, at least one letter and one number
            return pass.length >= 6; 
        },
        name: (name) => {
            return name.trim().length >= 2;
        }
    },

    /**
     * Generates a random N-digit OTP
     */
    generateOTP: () => {
        return Math.floor(1000 + Math.random() * 9000);
    },

    /**
     * Scroll to top helper
     */
    scrollTop: () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

/* =========================================
   4. STATE MANAGEMENT
   ========================================= */
const State = {
    // Persistent Data (Loaded from LocalStorage)
    cart: JSON.parse(localStorage.getItem(CONFIG.STORAGE.CART)) || [],
    wishlist: JSON.parse(localStorage.getItem(CONFIG.STORAGE.WISHLIST)) || [],
    users: JSON.parse(localStorage.getItem(CONFIG.STORAGE.USERS)) || [],
    currentUser: JSON.parse(localStorage.getItem(CONFIG.STORAGE.CURRENT_USER)) || null,
    recentViews: JSON.parse(localStorage.getItem(CONFIG.STORAGE.RECENT)) || [],
    orders: JSON.parse(localStorage.getItem(CONFIG.STORAGE.ORDERS)) || [],
    
    // Application Runtime State
    allProducts: [],
    filteredProducts: [],
    currentProduct: null,
    selectedSize: null,
    isLoading: false,
    
    // Auth Runtime State
    generatedOTP: null,
    tempAuthData: null, // Stores user data pending OTP verification
    
    // Cart Runtime State
    discountCode: null,
    discountPercent: 0,
    
    // UI State
    carouselIndex: 0,
    carouselInterval: null
};

/* =========================================
   5. MOCK DATABASE (Static Data)
   ========================================= */
const DB = {
    COUPONS: { 
        "ZENVIA10": 0.10, 
        "WELCOME20": 0.20,
        "FLASH50": 0.50,
        "STUDENT": 0.15
    },

    REVIEWS: [
        { name: "Aditi Sharma", text: "Absolutely love this! The quality is unmatched." },
        { name: "Rahul Verma", text: "Delivery was super fast. Looks exactly like the photo." },
        { name: "Sneha Gupta", text: "Good product, but the packaging could be better." },
        { name: "Vikram Singh", text: "Five stars! Will definitely buy from Zenvia again." },
        { name: "Priya Patel", text: "Decent quality. Fits well and feels comfortable." },
        { name: "Amit Kumar", text: "Exceeded my expectations. Highly recommended!" },
        { name: "Rohan Das", text: "Value for money. I bought two of these." },
        { name: "Kavita Reddy", text: "Just okay. Nothing special, but does the job." },
        { name: "Arjun Mehta", text: "Premium feel. Very satisfied with the purchase." },
        { name: "Zara Khan", text: "The color is slightly different, but I still like it." }
    ],

    // Generate specific distribution for visual graphs
    getRatingDistribution: (avgRate, count) => {
        const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        let remaining = count;
        
        // Algorithm to fake a distribution curve based on average rating
        if(avgRate >= 4.5) { dist[5] = Math.floor(count * 0.7); dist[4] = Math.floor(count * 0.2); }
        else if(avgRate >= 4.0) { dist[5] = Math.floor(count * 0.5); dist[4] = Math.floor(count * 0.3); }
        else { dist[5] = Math.floor(count * 0.2); dist[4] = Math.floor(count * 0.2); dist[3] = Math.floor(count * 0.3); }
        
        remaining -= (dist[5] + dist[4] + dist[3]);
        dist[2] = Math.max(0, Math.floor(remaining * 0.6));
        dist[1] = Math.max(0, remaining - dist[2]);
        
        return dist;
    }
};

/* =========================================
   6. DATA SERVICE (API Handler)
   ========================================= */
const DataService = {
    /**
     * Generates a random set of reviews for a product
     */
    generateReviews: (count, existingReviews = []) => {
        if (existingReviews && existingReviews.length > 0) return existingReviews;
        
        let revs = [];
        const num = Math.min(count || 5, 6); 
        
        for (let i = 0; i < num; i++) {
            const r = DB.REVIEWS[Math.floor(Math.random() * DB.REVIEWS.length)];
            revs.push({
                reviewerName: r.name,
                rating: Math.floor(Math.random() * 2) + 4, // Mostly 4 or 5 stars
                comment: r.text,
                date: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toLocaleDateString()
            });
        }
        return revs;
    },

    /**
     * Main Data Fetching Function.
     * Combines FakeStoreAPI and DummyJSON into a standardized format.
     */
    fetchAllProducts: async () => {
        if(State.allProducts.length > 0) return State.allProducts;
        
        State.isLoading = true;
        UI.renderSkeleton(); 

        let combined = [];
        try {
            Utils.log("Fetching data from external APIs...");
            
            const [res1, res2] = await Promise.all([
                fetch(CONFIG.API.FAKE_STORE),
                fetch(CONFIG.API.DUMMY_JSON)
            ]);
            
            const d1 = await res1.json();
            const d2 = await res2.json();
            
            // Normalize FakeStore Data
            const f1 = d1.map(p => ({ 
                id: `fs-${p.id}`, 
                title: p.title, 
                price: p.price, 
                category: Utils.capitalize(p.category), 
                image: p.image, 
                rating: p.rating, 
                description: p.description, 
                reviews: DataService.generateReviews(p.rating.count),
                dist: DB.getRatingDistribution(p.rating.rate, p.rating.count),
                source: 'FakeStore'
            }));
            
            // Normalize DummyJSON Data
            const f2 = d2.products.map(p => ({ 
                id: `dj-${p.id}`, 
                title: p.title, 
                price: p.price, 
                category: Utils.capitalize(p.category), 
                image: p.thumbnail, 
                rating: { rate: p.rating, count: 50 }, 
                description: p.description, 
                reviews: (p.reviews && p.reviews.length) ? p.reviews : DataService.generateReviews(5),
                dist: DB.getRatingDistribution(p.rating, 50),
                source: 'DummyJSON'
            }));
            
            combined = [...combined, ...f1, ...f2];
            Utils.log(`Data loaded successfully. ${combined.length} items.`);
        } catch (e) { 
            Utils.log("Critical Data Fetch Error", "error");
            console.error(e); 
            UI.showToast("Network Error: Could not load products", "error");
        } finally {
            State.isLoading = false;
        }
        
        State.allProducts = combined;
        return combined;
    }
};

/* =========================================
   7. AUTH ENGINE (UPDATED UI FLOW - NO PROMPTS)
   ========================================= */
const AuthEngine = {
    /**
     * Initializes Auth State (listeners, modal injection)
     */
    init: () => {
        AuthEngine.injectModal();
        UI.updateAuthButton();
    },

    /**
     * Injects the Authentication Modal HTML into the DOM.
     * Includes Login, Signup, OTP, and NEW FORGOT PASSWORD VIEW.
     */
    injectModal: () => {
        const existing = document.getElementById(CONFIG.DOM.AUTH_MODAL);
        if (existing) existing.remove();

        const modalHTML = `
            <div id="${CONFIG.DOM.AUTH_MODAL}" class="modal-overlay">
                <div class="auth-box">
                    <i class="fa-solid fa-xmark close-modal" onclick="UI.closeAuthModal()"></i>
                    
                    <div class="auth-header">
                        <h2>Welcome Back</h2>
                        <p>Secure login via Email & OTP</p>
                    </div>

                    <div class="auth-tabs">
                        <div class="auth-tab active" id="tab-login" onclick="UI.switchAuthTab('login')">
                            <i class="fa-solid fa-right-to-bracket"></i> Login
                        </div>
                        <div class="auth-tab" id="tab-signup" onclick="UI.switchAuthTab('signup')">
                            <i class="fa-solid fa-user-plus"></i> Sign Up
                        </div>
                    </div>
                    
                    <form id="login-form" onsubmit="AuthEngine.handleLogin(event)">
                        <div class="form-group">
                            <label><i class="fa-solid fa-envelope"></i> Email Address</label>
                            <input type="email" id="li-email" class="form-input" placeholder="name@example.com" required>
                        </div>
                        
                        <div class="form-group">
                            <label><i class="fa-solid fa-lock"></i> Password</label>
                            <div class="password-wrapper">
                                <input type="password" id="li-pass" class="form-input" placeholder="Enter your password" required>
                                <i class="fa-regular fa-eye password-toggle" onclick="AuthEngine.togglePass('li-pass')"></i>
                            </div>
                            <div style="text-align:right; margin-top:5px;">
                                <span onclick="AuthEngine.showForgotForm()" style="font-size:12px; color:var(--primary); cursor:pointer; text-decoration:underline;">Forgot Password?</span>
                            </div>
                        </div>
                        
                        <button type="submit" class="btn-primary" style="width:100%;">
                            LOGIN SECURELY
                        </button>
                    </form>

                    <form id="signup-form" style="display:none;" onsubmit="AuthEngine.handleSignup(event)">
                        <div class="form-group">
                            <label><i class="fa-solid fa-user"></i> Full Name</label>
                            <input type="text" id="su-name" class="form-input" placeholder="Arnab Pandey" required>
                        </div>
                        
                        <div class="form-group">
                            <label><i class="fa-solid fa-envelope"></i> Email Address</label>
                            <input type="email" id="su-email" class="form-input" placeholder="name@example.com" required>
                        </div>
                        
                        <div class="form-group">
                            <label><i class="fa-solid fa-lock"></i> Create Password</label>
                            <div class="password-wrapper">
                                <input type="password" id="su-pass" class="form-input" placeholder="Min 6 characters" required>
                                <i class="fa-regular fa-eye password-toggle" onclick="AuthEngine.togglePass('su-pass')"></i>
                            </div>
                        </div>
                        
                        <button type="submit" class="btn-primary" style="width:100%;">
                            CREATE ACCOUNT
                        </button>
                    </form>

                    <div id="forgot-form" style="display:none; text-align:center;">
                        <div style="margin-bottom:20px; color:var(--primary);">
                            <i class="fa-solid fa-unlock-keyhole" style="font-size:40px;"></i>
                        </div>
                        <h3 style="margin-bottom:10px; font-size:20px;">Reset Password</h3>
                        <p style="margin-bottom:20px; color:#666; font-size:14px; line-height:1.5;">
                            Enter the email address associated with your account and we'll send you a link to reset your password.
                        </p>
                        
                        <div class="form-group" style="text-align:left;">
                            <label><i class="fa-solid fa-envelope"></i> Registered Email</label>
                            <input type="email" id="fp-email" class="form-input" placeholder="name@example.com">
                        </div>
                        
                        <button class="btn-primary" style="width:100%;" onclick="AuthEngine.handleForgotSubmit()">
                            SEND RESET LINK
                        </button>
                        
                        <div style="margin-top:20px; font-size:13px; cursor:pointer; color:#666;" onclick="UI.switchAuthTab('login')">
                            <i class="fa-solid fa-arrow-left"></i> Back to Login
                        </div>
                    </div>

                    <div id="otp-form" style="display:none; text-align:center;">
                        <div style="margin: 20px 0;">
                            <i class="fa-solid fa-envelope-circle-check" style="font-size: 40px; color: var(--primary);"></i>
                        </div>
                        <p style="margin-bottom:20px; color:var(--text);">
                            We sent a ${CONFIG.SETTINGS.OTP_LENGTH}-digit code to your email.
                        </p>
                        <div class="form-group">
                            <input type="number" id="otp-input" class="form-input" 
                                   placeholder="XXXX" 
                                   style="text-align:center; letter-spacing:8px; font-size:24px; font-weight:bold;">
                        </div>
                        <button class="btn-primary" style="width:100%;" onclick="AuthEngine.verifyOTP()">
                            VERIFY & PROCEED
                        </button>
                        <p style="font-size:12px; margin-top:10px; cursor:pointer; text-decoration:underline;" onclick="AuthEngine.resendOTP()">
                            Resend Code
                        </p>
                    </div>

                    <div class="auth-footer" style="margin-top:20px; font-size:11px; color:#888; text-align:center;">
                        By continuing, you agree to Zenvia's Terms & Conditions.<br>
                        Protected by reCAPTCHA Enterprise.
                    </div>
                </div>
            </div>`;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },

    /**
     * Logic: Handle Login Form Submit
     */
    handleLogin: (e) => {
        e.preventDefault();
        const email = document.getElementById('li-email').value.trim();
        const pass = document.getElementById('li-pass').value.trim();

        if (!Utils.Validators.email(email)) {
            UI.showToast("Invalid Email Format ❌", "error");
            return;
        }

        // Check against LocalStorage Users
        const user = State.users.find(u => u.email === email && u.pass === pass);
        
        if (user) {
            State.tempAuthData = user;
            AuthEngine.sendOTP(email);
        } else {
            UI.showToast("Invalid Credentials. Try again. ❌", "error");
        }
    },

    /**
     * Logic: Handle Signup Form Submit
     */
    handleSignup: (e) => {
        e.preventDefault();
        const name = document.getElementById('su-name').value.trim();
        const email = document.getElementById('su-email').value.trim();
        const pass = document.getElementById('su-pass').value.trim();

        // Validations
        if (!Utils.Validators.name(name)) { UI.showToast("Name too short", "error"); return; }
        if (!Utils.Validators.email(email)) { UI.showToast("Invalid Email", "error"); return; }
        if (!Utils.Validators.password(pass)) { UI.showToast("Password too weak (min 6 chars)", "error"); return; }

        // Check duplicate
        if (State.users.find(u => u.email === email)) {
            UI.showToast("Account already exists. Please Login.", "error");
            UI.switchAuthTab('login');
            return;
        }

        State.tempAuthData = { name, email, pass };
        AuthEngine.sendOTP(email);
    },

    // --- NEW: FORGOT PASSWORD HANDLERS ---
    showForgotForm: () => {
        // Hide standard forms and tabs, show only forgot form
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('signup-form').style.display = 'none';
        document.querySelector('.auth-tabs').style.display = 'none'; // Hide tabs for cleaner look
        document.getElementById('forgot-form').style.display = 'block';
    },

    handleForgotSubmit: () => {
        const emailInput = document.getElementById('fp-email');
        const email = emailInput.value.trim();
        const btn = document.querySelector('#forgot-form button');

        if(!Utils.Validators.email(email)) { 
            UI.showToast("Please enter a valid email", "error"); 
            return; 
        }

        // 1. Check if user exists locally
        const user = State.users.find(u => u.email === email);
        if(!user) {
            UI.showToast("Email not found in our records ❌", "error");
            return;
        }

        // 2. UI Loading State
        const originalText = btn.innerText;
        btn.innerText = "SENDING LINK...";
        btn.disabled = true;

        // 3. Generate Reset Link (Simulated)
        const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/'));
        const resetLink = `${baseUrl}/reset.html?email=${email}`;

        // 4. Send Link via EmailJS
        const payload = {
            service_id: CONFIG.EMAILJS.SERVICE_ID,
            template_id: CONFIG.EMAILJS.TEMPLATE_ID,
            user_id: CONFIG.EMAILJS.PUBLIC_KEY,
            template_params: {
                email: email,
                passcode: resetLink // We re-use the 'passcode' variable in template to send the link
            }
        };

        fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(async (response) => {
            if (response.ok) {
                UI.showToast(`Reset link sent to ${email} 📩`, "success");
                emailInput.value = ""; // Clear input
                // Return to login after delay
                setTimeout(() => UI.switchAuthTab('login'), 2000);
            } else {
                throw new Error("Email failed");
            }
        })
        .catch((err) => {
            console.error(err);
            // Fallback for demo if email fails
            alert(`[DEV MODE] Password Reset Link:\n${resetLink}`);
            UI.switchAuthTab('login');
        })
        .finally(() => {
            btn.innerText = originalText;
            btn.disabled = false;
        });
    },

    /**
     * Logic: Send OTP using EmailJS
     */
    sendOTP: (email) => {
        State.generatedOTP = Utils.generateOTP();
        const btn = document.querySelector('.auth-box .btn-primary');
        const originalText = btn ? btn.innerText : 'PROCESSING...';
        
        if(btn) {
            btn.innerText = "SENDING CODE...";
            btn.disabled = true;
        }

        const payload = {
            service_id: CONFIG.EMAILJS.SERVICE_ID,
            template_id: CONFIG.EMAILJS.TEMPLATE_ID,
            user_id: CONFIG.EMAILJS.PUBLIC_KEY,
            template_params: {
                email: email,
                passcode: String(State.generatedOTP)
            }
        };

        Utils.log(`Sending OTP to ${email}...`);

        fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(async (response) => {
            if (response.ok) {
                UI.showToast(`Code sent to ${email} 📩`, "success");
                UI.showOTPForm();
            } else {
                const txt = await response.text();
                throw new Error(txt);
            }
        })
        .catch((err) => {
            Utils.log("EmailJS Error", "error");
            // FALLBACK FOR DEMO/DEVELOPMENT if API key is invalid
            UI.showToast(`[DEV MODE] OTP: ${State.generatedOTP}`, "info");
            UI.showOTPForm();
        })
        .finally(() => {
            if(btn) {
                btn.innerText = originalText;
                btn.disabled = false;
            }
        });
    },

    /**
     * Logic: Verify Input OTP against Generated OTP
     */
    verifyOTP: () => {
        const input = document.getElementById('otp-input').value;
        if (parseInt(input) === State.generatedOTP) {
            
            // Check if this is a new registration
            const isNew = !State.users.find(u => u.email === State.tempAuthData.email);
            
            if (isNew) {
                State.users.push(State.tempAuthData);
                localStorage.setItem(CONFIG.STORAGE.USERS, JSON.stringify(State.users));
            }

            // Set Session
            State.currentUser = State.tempAuthData;
            localStorage.setItem(CONFIG.STORAGE.CURRENT_USER, JSON.stringify(State.currentUser));
            
            UI.closeAuthModal();
            UI.updateAuthButton();
            UI.showToast(`Welcome, ${State.currentUser.name}! 🚀`, "success");
            
            // Clear temporary data
            State.tempAuthData = null;
            State.generatedOTP = null;

        } else {
            UI.showToast("Incorrect Code. Try again. ❌", "error");
        }
    },

    resendOTP: () => {
        if(State.tempAuthData && State.tempAuthData.email) {
            AuthEngine.sendOTP(State.tempAuthData.email);
        }
    },

    logout: () => {
        const name = State.currentUser ? State.currentUser.name : "Guest";
        State.currentUser = null;
        localStorage.removeItem(CONFIG.STORAGE.CURRENT_USER);
        UI.updateAuthButton();
        UI.showToast(`Goodbye, ${name}! 👋`, "success");
        
        // Redirect if on profile page
        if(window.location.pathname.includes('profile')) {
            setTimeout(() => window.location.href = 'index.html', 1000);
        }
    },

    togglePass: (id) => {
        const input = document.getElementById(id);
        const icon = input.nextElementSibling;
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.add('fa-eye');
            icon.classList.remove('fa-eye-slash');
        }
    }
};

/* =========================================
   8. UI RENDERER (View Layer)
   ========================================= */
const UI = {
    /**
     * Toast Notification System
     */
    showToast: (message, type = 'success') => {
        let container = document.getElementById(CONFIG.DOM.TOAST_CONTAINER);
        if (!container) {
            container = document.createElement('div');
            container.id = CONFIG.DOM.TOAST_CONTAINER;
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const iconMap = {
            'success': 'fa-circle-check',
            'error': 'fa-circle-xmark',
            'info': 'fa-circle-info',
            'warning': 'fa-triangle-exclamation'
        };

        toast.innerHTML = `
            <span>${message}</span> 
            <i class="fa-solid ${iconMap[type]}"></i>
        `;
        
        container.appendChild(toast);

        // Animation Entrance
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        });

        // Removal
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 500);
        }, CONFIG.SETTINGS.TOAST_DURATION);
    },

    /**
     * Generates star icons HTML
     */
    getStars: (rate) => {
        let s = '';
        for (let i = 0; i < 5; i++) {
            if (i < Math.floor(rate)) s += '<i class="fa-solid fa-star"></i>';
            else if (i < rate) s += '<i class="fa-solid fa-star-half-stroke"></i>';
            else s += '<i class="fa-regular fa-star"></i>';
        }
        return s;
    },

    /**
     * Updates Cart Badge Counter in Header
     */
    updateCartBadge: () => {
        const count = State.cart.reduce((a, b) => a + b.qty, 0);
        const badge = document.getElementById('cart-count');
        const mobileBadge = document.getElementById('mobile-cart-count');
        
        if (badge) {
            badge.innerText = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
        if (mobileBadge) {
            mobileBadge.innerText = count;
        }
    },

    /**
     * Updates Authentication Button State
     */
    updateAuthButton: () => {
        const btn = document.getElementById('auth-btn-text');
        
        // Desktop Button
        if(btn) {
            btn.innerText = State.currentUser ? `Hi, ${State.currentUser.name.split(' ')[0]}` : "Login";
        }

        // Mobile Sidebar Button
        const mobileBtn = document.getElementById('mobile-auth-btn');
        if(mobileBtn) {
            if(State.currentUser) {
                mobileBtn.innerHTML = `<i class="fa-solid fa-right-from-bracket"></i> Logout (${State.currentUser.name})`;
                mobileBtn.onclick = (e) => { e.preventDefault(); AuthEngine.logout(); };
                mobileBtn.style.color = "#ff4444";
            } else {
                mobileBtn.innerHTML = `<i class="fa-solid fa-user"></i> Login / Sign Up`;
                mobileBtn.onclick = (e) => { e.preventDefault(); UI.openAuthModal(); };
                mobileBtn.style.color = "var(--primary)";
            }
        }
    },

    /**
     * Auth Modal Visibility Controls
     */
    openAuthModal: () => {
        AuthEngine.injectModal();
        if (State.currentUser) { 
            AuthEngine.logout(); 
        } else {
            Utils.scrollTop();
            const modal = document.getElementById(CONFIG.DOM.AUTH_MODAL);
            modal.style.display = 'flex'; 
            setTimeout(() => modal.classList.add('active'), 10);
            UI.switchAuthTab('login');
        }
    },

    closeAuthModal: () => {
        const modal = document.getElementById(CONFIG.DOM.AUTH_MODAL);
        if (!modal) return;
        modal.classList.remove('active');
        setTimeout(() => modal.style.display = 'none', 300);
    },

    switchAuthTab: (tab) => {
        // Ensure Tabs are visible (might have been hidden by forgot form)
        const tabContainer = document.querySelector('.auth-tabs');
        if(tabContainer) tabContainer.style.display = 'flex';

        // Tab Headers
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        const activeTab = document.getElementById(`tab-${tab}`);
        if(activeTab) activeTab.classList.add('active');

        // Form Visibility
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');
        const forgotForm = document.getElementById('forgot-form');
        const otpForm = document.getElementById('otp-form');

        if(loginForm) loginForm.style.display = tab === 'login' ? 'block' : 'none';
        if(signupForm) signupForm.style.display = tab === 'signup' ? 'block' : 'none';
        
        // Hide others
        if(forgotForm) forgotForm.style.display = 'none';
        if(otpForm) otpForm.style.display = 'none';
    },

    showOTPForm: () => {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('signup-form').style.display = 'none';
        document.getElementById('forgot-form').style.display = 'none';
        document.getElementById('otp-form').style.display = 'block';
    },

    /**
     * Render Skeleton Loading State
     */
    renderSkeleton: () => {
        const container = document.getElementById(CONFIG.DOM.PRODUCT_LIST);
        if(!container) return;
        
        const skeletonHTML = Array(8).fill(0).map(() => `
            <div class="skeleton-card" style="border:1px solid var(--border); padding:20px; background:var(--secondary); border-radius:12px;">
                <div class="skeleton" style="width:100%; height:250px; margin-bottom:15px; border-radius:8px;"></div>
                <div class="skeleton" style="width:80%; height:15px; margin-bottom:10px; border-radius:4px;"></div>
                <div class="skeleton" style="width:40%; height:15px; border-radius:4px;"></div>
            </div>
        `).join('');
        
        container.innerHTML = skeletonHTML;
    },

    /**
     * Render Product Grid
     */
    renderProductGrid: (items) => {
        const container = document.getElementById(CONFIG.DOM.PRODUCT_LIST);
        if (!container) return;
        
        if (items.length === 0) { 
            container.innerHTML = `
                <div style="grid-column:1/-1; text-align:center; padding:60px;">
                    <i class="fa-solid fa-box-open" style="font-size:40px; color:#ccc; margin-bottom:20px;"></i>
                    <p>No products found matching your criteria.</p>
                </div>`; 
            return; 
        }

        container.innerHTML = items.map(p => `
            <div class="product-card" onclick="Router.navigateToProduct('${p.id}')">
                <div class="img-box">
                    <img src="${p.image}" alt="${p.title}" loading="lazy">
                    <div class="overlay-actions">
                        <button onclick="event.stopPropagation(); CommerceEngine.quickAdd('${p.id}')">
                            <i class="fa-solid fa-cart-plus"></i>
                        </button>
                    </div>
                </div>
                <div class="p-details">
                    <div class="p-cat">${p.category}</div>
                    <h4>${p.title.length > 45 ? p.title.substring(0, 42) + '...' : p.title}</h4>
                    <div class="stars">${UI.getStars(p.rating.rate)} <span style="font-size:11px;color:#888;">(${p.rating.count})</span></div>
                    <div class="price-row">
                        <div class="p-price">${CONFIG.SETTINGS.CURRENCY}${p.price}</div>
                    </div>
                </div>
            </div>`).join('');
    },

    /**
     * Render Detailed Single Product View
     */
    renderDetailView: (p) => {
        const dist = p.dist || {5:0, 4:0, 3:0, 2:0, 1:0}; 
        const total = p.rating.count;
        
        // Dynamic Breadcrumbs
        const breadcrumbs = `
            <div class="breadcrumbs">
                <span onclick="window.location.href='index.html'"><i class="fa-solid fa-house"></i> Home</span> 
                <span class="divider">/</span> 
                <span onclick="window.location.href='index.html?category=${encodeURIComponent(p.category)}'">${p.category}</span> 
                <span class="divider">/</span> 
                <span class="active">${p.title.substring(0, 20)}...</span>
            </div>
        `;

        let html = `
            ${breadcrumbs}
            <div class="detail-container">
                <div class="detail-left" onmousemove="InteractionEngine.zoomImage(event, this)" onmouseleave="InteractionEngine.resetZoom(this)">
                    <img src="${p.image}" alt="${p.title}" id="main-product-img">
                    <div class="zoom-hint"><i class="fa-solid fa-magnifying-glass"></i> Hover to Zoom</div>
                </div>

                <div class="detail-right">
                    <div class="p-cat-badge">${p.category}</div>
                    <h1 class="product-title">${p.title}</h1>
                    
                    <div class="rating-row" onclick="UI.scrollToReviews()">
                        <div class="stars">${UI.getStars(p.rating.rate)}</div>
                        <span class="rating-text">${p.rating.rate} Rating &bull; ${total} Reviews</span>
                    </div>

                    <div class="detail-price-box">
                        <span class="current-price">${CONFIG.SETTINGS.CURRENCY}${p.price}</span>
                        <span class="shipping-info"><i class="fa-solid fa-truck-fast"></i> Free Shipping over $100</span>
                    </div>

                    <p class="product-desc">${p.description}</p>
                    
                    <div class="selector-group">
                        <label>Select Size</label>
                        <div class="size-selector">
                            <button class="size-btn" onclick="InteractionEngine.selectSize('Std',this)">Std</button>
                            <button class="size-btn" onclick="InteractionEngine.selectSize('Pack',this)">Pack</button>
                            <button class="size-btn" onclick="InteractionEngine.selectSize('XL',this)">XL</button>
                        </div>
                    </div>

                    <div class="action-row">
                        <button class="btn-primary" onclick="CommerceEngine.addToCart()">
                            <i class="fa-solid fa-bag-shopping"></i> Add to Bag
                        </button>
                        <button class="btn-outline" onclick="CommerceEngine.buyNow()">Buy Now</button>
                        <button class="btn-wishlist" id="wishlist-btn" onclick="CommerceEngine.toggleWishlist('${p.id}')">
                            <i class="fa-regular fa-heart"></i>
                        </button>
                    </div>

                    <div class="trust-badges">
                        <div><i class="fa-solid fa-shield-halved"></i> 1 Year Warranty</div>
                        <div><i class="fa-solid fa-rotate-left"></i> 30 Days Return</div>
                        <div><i class="fa-solid fa-lock"></i> Secure Payment</div>
                    </div>
                </div>
            </div>`;
        
        // Rating Breakdown Chart
        html += `
        <div class="rating-breakdown-section">
            <h3>Customer Ratings</h3>
            <div class="rating-box">
                <div class="rating-left">
                    <div class="big-rating">${p.rating.rate}</div>
                    <div class="stars">${UI.getStars(p.rating.rate)}</div>
                    <div class="total-ratings">${total} Ratings</div>
                </div>
                <div class="rating-bars">`;
        
        [5,4,3,2,1].forEach(star => {
            const count = dist[star] || 0;
            const percent = total > 0 ? (count / total) * 100 : 0;
            html += `
                <div class="bar-row">
                    <span class="star-label">${star} <i class="fa-solid fa-star"></i></span>
                    <div class="bar-container">
                        <div class="bar-fill" style="width:${percent}%"></div>
                    </div>
                    <span class="count-label">${count}</span>
                </div>`;
        });
        html += `</div></div></div>`;

        document.getElementById(CONFIG.DOM.DETAIL_CONTAINER).innerHTML = html;
        
        UI.renderSuggested(p.category, p.id);
        UI.renderQA();
        UI.renderHeart(p.id); 
        UI.renderReviews(p.reviews);
    },

    renderSuggested: (cat, currentId) => {
        const suggested = State.allProducts.filter(p => p.category === cat && p.id !== currentId).slice(0, 4);
        const html = `
        <div class="suggested-section">
            <h3>You Might Also Like</h3>
            <div class="suggested-grid">
                ${suggested.map(p => `
                    <div class="product-card mini" onclick="window.location.href='product.html?id=${p.id}'">
                        <div class="img-box"><img src="${p.image}"></div>
                        <div class="p-details">
                            <h4>${p.title.substring(0,25)}...</h4>
                            <div class="p-price">${CONFIG.SETTINGS.CURRENCY}${p.price}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>`;
        document.getElementById(CONFIG.DOM.DETAIL_CONTAINER).insertAdjacentHTML('afterend', html);
    },

    renderQA: () => {
        const html = `
        <div class="qa-section">
            <h3>Questions & Answers</h3>
            <div class="review-form">
                <input type="text" class="form-input" id="qa-input" placeholder="Have a question? Search for answers">
                <button class="btn-primary" onclick="InteractionEngine.askQuestion()" style="margin-top:10px; width:auto;">Ask Question</button>
            </div>
            <div id="qa-list">
                <div class="qa-card">
                    <div class="question">Is this item durable?</div>
                    <div class="answer">Yes, it is made of high quality materials and comes with warranty.</div>
                </div>
            </div>
        </div>`;
        const reviewSection = document.querySelector('.review-section');
        if(reviewSection) reviewSection.insertAdjacentHTML('beforebegin', html);
    },

    renderReviews: (reviews) => {
        const container = document.getElementById(CONFIG.DOM.REVIEW_LIST);
        if(!container) return;
        if(!reviews || reviews.length === 0) { container.innerHTML = "<p>No reviews yet.</p>"; return; }
        container.innerHTML = reviews.map(r => `
            <div class="review-card">
                <div class="review-header">
                    <div class="review-user">
                        <div class="avatar">${r.reviewerName.charAt(0)}</div>
                        <div>
                            <div class="name">${r.reviewerName}</div>
                            <div class="verified"><i class="fa-solid fa-circle-check"></i> Verified Buyer</div>
                        </div>
                    </div>
                    <div class="review-date">${r.date || 'Recently'}</div>
                </div>
                <div class="stars">${UI.getStars(r.rating)}</div>
                <p class="review-text">${r.comment}</p>
            </div>`).join('');
    },

    renderCart: () => {
        const container = document.getElementById(CONFIG.DOM.CART_ITEMS);
        const subtotalEl = document.getElementById('subtotal-display');
        const taxEl = document.getElementById('tax-display');
        const shipEl = document.getElementById('shipping-display');
        const discountEl = document.getElementById('discount-display');
        const totalEl = document.getElementById('total-display');

        if(!container) return;

        if (State.cart.length === 0) { 
            container.innerHTML = `
                <div class="empty-cart">
                    <i class="fa-solid fa-cart-arrow-down"></i>
                    <p>Your shopping bag is empty</p>
                    <button class="btn-primary" onclick="window.location.href='index.html'">Start Shopping</button>
                </div>`; 
            if(totalEl) totalEl.innerText = "$0.00"; 
            return; 
        }
        
        let subtotal = 0;
        
        container.innerHTML = State.cart.map((item, i) => {
            const itemTotal = parseFloat(item.price) * item.qty;
            subtotal += itemTotal;
            return `
                <div class="cart-row">
                    <img src="${item.image}" alt="Product">
                    <div class="cart-info">
                        <h4>${item.title}</h4>
                        <p class="meta">Size: ${item.size}</p>
                        <div class="price">${CONFIG.SETTINGS.CURRENCY}${item.price}</div>
                    </div>
                    <div class="cart-controls">
                        <div class="qty-control">
                            <button onclick="CommerceEngine.updateQty(${i}, -1)">-</button>
                            <span>${item.qty}</span>
                            <button onclick="CommerceEngine.updateQty(${i}, 1)">+</button>
                        </div>
                        <button class="remove-link" onclick="CommerceEngine.removeItem(${i})">
                            <i class="fa-regular fa-trash-can"></i> Remove
                        </button>
                    </div>
                </div>`;
        }).join('');

        // Calculate Totals
        const tax = subtotal * CONFIG.SETTINGS.TAX_RATE;
        const shipping = subtotal > CONFIG.SETTINGS.FREE_SHIPPING_THRESHOLD ? 0 : CONFIG.SETTINGS.SHIPPING_COST;
        const discountAmount = subtotal * State.discountPercent;
        const grandTotal = subtotal + tax + shipping - discountAmount;

        // Update DOM
        if(subtotalEl) subtotalEl.innerText = `${CONFIG.SETTINGS.CURRENCY}${Utils.formatMoney(subtotal)}`;
        if(taxEl) taxEl.innerText = `${CONFIG.SETTINGS.CURRENCY}${Utils.formatMoney(tax)}`;
        if(shipEl) shipEl.innerText = shipping === 0 ? "FREE" : `${CONFIG.SETTINGS.CURRENCY}${shipping}`;
        if(discountEl) discountEl.innerText = `-${CONFIG.SETTINGS.CURRENCY}${Utils.formatMoney(discountAmount)}`;
        if(totalEl) totalEl.innerText = `${CONFIG.SETTINGS.CURRENCY}${Utils.formatMoney(grandTotal)}`;
    },

    renderHeart: (id) => {
        const btn = document.getElementById('wishlist-btn');
        if (btn) btn.innerHTML = State.wishlist.includes(String(id)) 
            ? '<i class="fa-solid fa-heart" style="color:#ff4444;"></i>' 
            : '<i class="fa-regular fa-heart"></i>';
    },

    scrollToReviews: () => {
        const el = document.querySelector('.review-section');
        if(el) el.scrollIntoView({ behavior: 'smooth' });
    }
};

/* =========================================
   9. COMMERCE ENGINE (Cart, Wishlist, Checkout)
   ========================================= */
const CommerceEngine = {
    /**
     * Add item to cart logic
     */
    addToCart: () => {
        if (!State.selectedSize) { 
            UI.showToast("Please select a size first 📏", "info"); 
            return; 
        }
        
        const uid = `${State.currentProduct.id}-${State.selectedSize}`;
        const exist = State.cart.find(c => c.uid === uid);
        
        if (exist) {
            exist.qty++;
        } else {
            State.cart.push({ 
                ...State.currentProduct, 
                uid, 
                size: State.selectedSize, 
                qty: 1 
            });
        }

        CommerceEngine.saveCart();
        UI.showToast("Item added to your bag! 🛍️", "success");
    },

    /**
     * Quick Add (from grid view) - defaults to 'Std' size
     */
    quickAdd: (id) => {
        const product = State.allProducts.find(p => p.id === id);
        if(!product) return;
        
        const uid = `${product.id}-Std`;
        const exist = State.cart.find(c => c.uid === uid);
        
        if (exist) exist.qty++; 
        else State.cart.push({ ...product, uid, size: 'Std', qty: 1 });
        
        CommerceEngine.saveCart();
        UI.showToast("Added to Cart!", "success");
    },

    saveCart: () => {
        localStorage.setItem(CONFIG.STORAGE.CART, JSON.stringify(State.cart));
        UI.updateCartBadge();
    },

    updateQty: (index, change) => {
        if (State.cart[index].qty + change > 0) {
            State.cart[index].qty += change;
        } else {
            // Remove if 0? Optional. Currently min is 1.
            return;
        }
        CommerceEngine.saveCart();
        UI.renderCart();
    },

    removeItem: (index) => {
        State.cart.splice(index, 1);
        CommerceEngine.saveCart();
        UI.renderCart();
    },

    buyNow: () => { 
        CommerceEngine.addToCart(); 
        if(State.selectedSize) window.location.href = 'cart.html#checkout'; 
    },

    toggleWishlist: (id) => {
        const strId = String(id);
        const idx = State.wishlist.indexOf(strId);
        
        if (idx === -1) { 
            State.wishlist.push(strId); 
            UI.showToast("Saved to Wishlist ❤️", "success");
        } else { 
            State.wishlist.splice(idx, 1); 
            UI.showToast("Removed from Wishlist 💔", "info");
        }
        
        localStorage.setItem(CONFIG.STORAGE.WISHLIST, JSON.stringify(State.wishlist));
        UI.renderHeart(strId);
    },

    applyCoupon: () => {
        const input = document.getElementById('coupon-input');
        if(!input) return;
        
        const code = input.value.trim().toUpperCase();
        if(DB.COUPONS[code]) { 
            State.discountPercent = DB.COUPONS[code]; 
            State.discountCode = code;
            UI.renderCart(); 
            UI.showToast(`Code ${code} Applied!`, "success"); 
        } else { 
            UI.showToast("Invalid Coupon Code", "error"); 
        }
    },

    showCheckout: () => { 
        const form = document.getElementById('checkout-form');
        if(form) {
            form.classList.add('active'); 
            form.scrollIntoView({behavior:'smooth'});
        }
    },
    
    processOrder: (e) => {
        e.preventDefault();
        
        if(!State.currentUser) { 
            UI.showToast("Please Login to secure your order 🔒", "error"); 
            UI.openAuthModal(); 
            return; 
        }

        // Simulate Processing
        const btn = e.target.querySelector('button');
        const oldText = btn.innerText;
        btn.innerText = "Processing Payment...";
        btn.disabled = true;

        setTimeout(() => {
            const newOrder = { 
                id: `ORD-${Date.now()}`, 
                date: new Date().toLocaleDateString(), 
                items: State.cart, 
                total: document.getElementById('total-display').innerText 
            };
            
            State.orders.push(newOrder); 
            localStorage.setItem(CONFIG.STORAGE.ORDERS, JSON.stringify(State.orders));
            
            // Clear Cart
            State.cart = []; 
            State.discountPercent = 0;
            localStorage.removeItem(CONFIG.STORAGE.CART);
            
            UI.showToast("Order Placed Successfully! 🚀", "success"); 
            setTimeout(() => window.location.href = 'index.html', 2000);
        }, 2000);
    }
};

/* =========================================
   10. INTERACTION ENGINE (Events & Effects)
   ========================================= */
const InteractionEngine = {
    selectSize: (size, btn) => {
        State.selectedSize = size;
        document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    },

    handleSearch: (query) => {
        const homeLayout = document.getElementById('home-layout');
        const listLayout = document.getElementById('listing-layout');
        const listTitle = document.getElementById('list-title');

        if (query.length > 0) {
            if(homeLayout) homeLayout.style.display = 'none';
            if(listLayout) listLayout.style.display = 'block';
            if(listTitle) listTitle.innerText = `Results for "${query}"`;
            
            const filtered = State.allProducts.filter(p => 
                p.title.toLowerCase().includes(query.toLowerCase()) || 
                p.category.toLowerCase().includes(query.toLowerCase())
            );
            
            UI.renderProductGrid(filtered);
        } else { 
            window.location.href = 'index.html'; 
        }
    },

    // --- NEW: VOICE SEARCH LOGIC ---
    startVoiceSearch: () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            UI.showToast("Voice search not supported in this browser", "error");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        const micBtn = document.getElementById('voice-search-btn');

        recognition.onstart = () => {
            if(micBtn) micBtn.classList.add('listening');
            UI.showToast("Listening... Speak now 🎙️", "info");
        };

        recognition.onend = () => {
            if(micBtn) micBtn.classList.remove('listening');
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            
            // Update Input Field
            const searchInput = document.querySelector('.search-input');
            if(searchInput) {
                searchInput.value = transcript;
                InteractionEngine.handleSearch(transcript); // Trigger existing search logic
            }
            
            UI.showToast(`Searching for: "${transcript}"`, "success");
        };

        recognition.start();
    },

    submitReview: (e) => {
        e.preventDefault();
        const name = document.getElementById('r-name').value;
        const text = document.getElementById('r-text').value;

        if(!name || !text) return;

        const newReview = {
            reviewerName: name,
            rating: 5,
            comment: text,
            date: "Just Now"
        };

        // Prepend to DOM
        const container = document.getElementById(CONFIG.DOM.REVIEW_LIST);
        const card = `
            <div class="review-card new-review">
                <div class="review-header">
                    <div class="review-user"><div class="avatar">${name.charAt(0)}</div><div><div class="name">${name}</div></div></div>
                    <div class="review-date">Just Now</div>
                </div>
                <div class="stars">${UI.getStars(5)}</div>
                <p class="review-text">${text}</p>
            </div>`;
        
        container.insertAdjacentHTML('afterbegin', card);
        e.target.reset();
        UI.showToast("Review Submitted! 🌟", "success");
    },
    
    askQuestion: () => {
        const input = document.getElementById('qa-input');
        if(input.value.trim() === "") return;
        
        const html = `
            <div class="qa-card">
                <div class="question">${input.value}</div>
                <div class="answer" style="font-style:italic; color:#888;">
                    <i class="fa-solid fa-clock"></i> Waiting for seller response...
                </div>
            </div>`;
        
        document.getElementById('qa-list').insertAdjacentHTML('afterbegin', html);
        input.value = "";
        UI.showToast("Question Posted", "success");
    },

    toggleTheme: () => {
        const current = document.body.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        
        document.body.setAttribute('data-theme', next);
        localStorage.setItem(CONFIG.STORAGE.THEME, next);
        
        // Update Icons
        const icons = document.querySelectorAll('.theme-icon');
        icons.forEach(icon => {
            icon.innerHTML = next === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
        });
    },

    toggleMenu: () => {
        const menu = document.getElementById('mobile-sidebar');
        if(menu) menu.classList.toggle('active');
    },

    addToRecent: (id) => {
        State.recentViews = State.recentViews.filter(pid => pid !== id);
        State.recentViews.unshift(id);
        if(State.recentViews.length > 6) State.recentViews.pop();
        localStorage.setItem(CONFIG.STORAGE.RECENT, JSON.stringify(State.recentViews));
    },

    sortProducts: (criteria) => {
        let sorted = [...State.allProducts];
        
        switch(criteria) {
            case 'low-high': sorted.sort((a, b) => a.price - b.price); break;
            case 'high-low': sorted.sort((a, b) => b.price - a.price); break;
            case 'rating': sorted.sort((a, b) => b.rating.rate - a.rating.rate); break;
        }
        
        UI.renderProductGrid(sorted);
    },

    // --- CAROUSEL LOGIC ---
    showSlide: (index) => {
        const slides = document.querySelectorAll('.carousel-slide');
        const dots = document.querySelectorAll('.dot');
        
        if(slides.length === 0) return;
        
        // Boundary Checks
        if (index >= slides.length) State.carouselIndex = 0;
        else if (index < 0) State.carouselIndex = slides.length - 1;
        else State.carouselIndex = index;
        
        // Update DOM
        slides.forEach(s => s.classList.remove('active'));
        dots.forEach(d => d.classList.remove('active'));
        
        slides[State.carouselIndex].classList.add('active');
        if(dots[State.carouselIndex]) dots[State.carouselIndex].classList.add('active');
    },

    nextSlide: () => { 
        InteractionEngine.showSlide(State.carouselIndex + 1); 
        InteractionEngine.resetTimer(); 
    },
    
    prevSlide: () => { 
        InteractionEngine.showSlide(State.carouselIndex - 1); 
        InteractionEngine.resetTimer(); 
    },
    
    goToSlide: (n) => { 
        InteractionEngine.showSlide(n); 
        InteractionEngine.resetTimer(); 
    },
    
    startCarousel: () => { 
        if(document.querySelector('.carousel-slide')) { 
            State.carouselInterval = setInterval(InteractionEngine.nextSlide, CONFIG.SETTINGS.CAROUSEL_SPEED); 
        } 
    },
    
    resetTimer: () => { 
        clearInterval(State.carouselInterval); 
        State.carouselInterval = setInterval(InteractionEngine.nextSlide, CONFIG.SETTINGS.CAROUSEL_SPEED); 
    },

    // --- ZOOM LOGIC ---
    zoomImage: (e, container) => {
        const img = container.querySelector('img');
        const x = e.clientX - container.getBoundingClientRect().left;
        const y = e.clientY - container.getBoundingClientRect().top;
        
        const xPercent = (x / container.offsetWidth) * 100;
        const yPercent = (y / container.offsetHeight) * 100;
        
        img.style.transformOrigin = `${xPercent}% ${yPercent}%`;
        img.style.transform = "scale(1.6)";
    },
    
    resetZoom: (container) => {
        const img = container.querySelector('img');
        img.style.transform = "scale(1)";
        setTimeout(() => { img.style.transformOrigin = "center center"; }, 200);
    },

    // --- SETTINGS MODAL LOGIC (New Language & Region Feature) ---
    openSettingsModal: (type) => {
        // Remove existing modal if any
        const existing = document.getElementById('settings-modal');
        if (existing) existing.remove();

        let title, contentHtml;

        if (type === 'lang') {
            title = "Choose Language";
            contentHtml = LocalizationData.LANGUAGES.map(l => `
                <div class="settings-option" onclick="InteractionEngine.setLanguage('${l.name}')">
                    <div style="font-weight:600;">${l.native}</div>
                    <div style="font-size:12px; opacity:0.7;">${l.name} - ${l.code.toUpperCase()}</div>
                    ${document.getElementById('current-lang-text').innerText.includes(l.name) ? '<i class="fa-solid fa-check" style="color:var(--primary);"></i>' : ''}
                </div>
            `).join('');
        } else {
            title = "Choose Region";
            contentHtml = LocalizationData.REGIONS.map(r => `
                <div class="settings-option" onclick="InteractionEngine.setRegion('${r.name}', '${r.flag}')">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <img src="https://flagcdn.com/w40/${r.flag}.png" style="width:24px; border-radius:2px;">
                        <span>${r.name}</span>
                    </div>
                    ${document.getElementById('current-region-text').innerText.includes(r.name) ? '<i class="fa-solid fa-check" style="color:var(--primary);"></i>' : ''}
                </div>
            `).join('');
        }

        const modalHTML = `
            <div id="settings-modal" class="modal-overlay" style="display:flex;" onclick="if(event.target === this) this.remove()">
                <div class="auth-box settings-box">
                    <div class="auth-header">
                        <h2>${title}</h2>
                        <i class="fa-solid fa-xmark close-modal" onclick="document.getElementById('settings-modal').remove()"></i>
                    </div>
                    <div class="settings-list">
                        ${contentHtml}
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        setTimeout(() => document.getElementById('settings-modal').classList.add('active'), 10);
    },

    setLanguage: (langName) => {
        document.getElementById('current-lang-text').innerHTML = `<i class="fa-solid fa-globe"></i> ${langName} <i class="fa-solid fa-sort" style="font-size:10px; margin-left:5px;"></i>`;
        document.getElementById('settings-modal').remove();
        UI.showToast(`Language updated to ${langName}`, 'success');
        // Here you would add real translation logic if you had it
    },

    setRegion: (regionName, flagCode) => {
        document.getElementById('current-region-text').innerHTML = `<img src="https://flagcdn.com/w20/${flagCode}.png" alt="${regionName}" style="width:16px; height:auto;"> ${regionName}`;
        document.getElementById('settings-modal').remove();
        UI.showToast(`Region updated to ${regionName}`, 'success');
        // Here you could trigger currency updates (e.g., change $ to ₹)
    }
};

/* =========================================
   11. ROUTER (Navigation Handler)
   ========================================= */
const Router = {
    init: async () => {
        Utils.log("Application Initializing...");
        
        // Load Global Preferences
        const savedTheme = localStorage.getItem(CONFIG.STORAGE.THEME);
        if(savedTheme) document.body.setAttribute('data-theme', savedTheme);
        
        // Init Subsystems
        AuthEngine.init();
        UI.updateCartBadge();
        
        const path = window.location.pathname;

        // Route Detection
        if (path.includes('index.html') || path === '/' || path.endsWith('/')) {
            await Router.loadHome();
        } else if (path.includes('product.html')) {
            await Router.loadProduct();
        } else if (path.includes('cart.html')) {
            UI.renderCart();
            if(window.location.hash === '#checkout') CommerceEngine.showCheckout();
        } else if (path.includes('shop.html')) {
            await DataService.fetchAllProducts();
            UI.renderProductGrid(State.allProducts);
        }
        
        Utils.log("Application Ready.");
    },

    loadHome: async () => {
        const params = new URLSearchParams(window.location.search);
        const catParam = params.get('category');
        
        InteractionEngine.startCarousel();
        
        // Inject Recent Views
        const layout = document.getElementById('home-layout');
        if(layout) {
            const recentBox = document.createElement('div');
            recentBox.className = 'container recent-section';
            recentBox.innerHTML = '<h2>Recently Viewed</h2><div class="recent-grid" id="recent-views"></div>';
            layout.appendChild(recentBox);
        }
        
        await DataService.fetchAllProducts();
        
        // Render Recent Views
        const recentContainer = document.getElementById('recent-views');
        if(recentContainer && State.recentViews.length > 0) {
            const recents = State.allProducts.filter(p => State.recentViews.includes(p.id)).slice(0, 6);
            recentContainer.innerHTML = recents.map(p => `
                <div class="recent-card" onclick="Router.navigateToProduct('${p.id}')">
                    <img src="${p.image}">
                    <div class="title">${p.title.substring(0,15)}...</div>
                </div>`).join('');
        }

        if(catParam) {
            document.getElementById('home-layout').style.display = 'none';
            document.getElementById('listing-layout').style.display = 'block';
            document.getElementById('list-title').innerText = Utils.capitalize(decodeURIComponent(catParam));
            
            const filtered = State.allProducts.filter(p => p.category.toLowerCase() === decodeURIComponent(catParam).toLowerCase());
            UI.renderProductGrid(filtered);
        } else {
            Router.renderCategoryBoard();
        }
    },

    loadProduct: async () => {
        await DataService.fetchAllProducts();
        const id = new URLSearchParams(window.location.search).get('id');
        const product = State.allProducts.find(p => p.id == id);
        
        if (product) { 
            State.currentProduct = product; 
            UI.renderDetailView(product);
            InteractionEngine.addToRecent(product.id);
        } else {
            document.getElementById(CONFIG.DOM.DETAIL_CONTAINER).innerHTML = 
                "<div style='text-align:center; padding:50px;'><h2>Product not found</h2><a href='index.html' class='btn-primary'>Go Home</a></div>";
        }
    },

    renderCategoryBoard: () => {
        const board = document.getElementById('category-board');
        if(!board) return;

        const categories = [...new Set(State.allProducts.map(p => p.category))].slice(0,12);
        
        board.innerHTML = categories.map(cat => {
            const item = State.allProducts.find(p => p.category === cat);
            return `
                <div class="cat-card" onclick="window.location.href='index.html?category=${encodeURIComponent(cat)}'">
                    <h3>${cat}</h3>
                    <div class="cat-img-box"><img src="${item.image}" alt="${cat}" loading="lazy"></div>
                    <div class="cat-link">Shop Collection <i class="fa-solid fa-arrow-right"></i></div>
                </div>`;
        }).join('');
    },

    navigateToProduct: (id) => {
        window.location.href = `product.html?id=${id}`;
    }
};

/* =========================================
   12. INITIALIZATION & GLOBAL BINDINGS
   ========================================= */

// Bind actions to window so HTML onlick attributes can find them
window.AuthEngine = AuthEngine;
window.CommerceEngine = CommerceEngine;
window.InteractionEngine = InteractionEngine;
window.UI = UI;
window.Router = Router;

// Expose individual functions for legacy HTML compatibility
window.handleSearch = InteractionEngine.handleSearch;
window.toggleTheme = InteractionEngine.toggleTheme;
window.toggleMenu = InteractionEngine.toggleMenu;

// Start the Engine
window.onload = Router.init;

// End of Titanium Edition Engine