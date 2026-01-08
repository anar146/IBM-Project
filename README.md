# 🛒 ZENVIA | Next-Gen E-Commerce Platform

> **Zenvia** is a high-performance, frontend-focused e-commerce application built with the **Titanium Edition v11.7 JavaScript Engine**. It features a serverless architecture, simulating full-stack functionality using LocalStorage, external APIs, and EmailJS.

---

## 🚀 Key Features

### 🛍️ Core Commerce
* **Hybrid Data Engine:** Aggregates products dynamically from **FakeStoreAPI** and **DummyJSON**.
* **Smart Cart & Wishlist:** Persists user data locally; maintains state across page reloads.
* **Checkout Simulation:** Full checkout flow with address validation and order history tracking.
* **Dynamic Filtering:** Sort by price, rating, and categories.

### 🔐 Advanced Authentication (Serverless)
* **Secure Login/Signup:** Uses LocalStorage as a mock database.
* **OTP Verification:** Integrated with **EmailJS** to send real One-Time Passwords (OTP) to user emails.
* **Password Recovery:** Complete "Forgot Password" flow with email reset links.

### ⚡ User Experience (UX)
* **🎙️ Voice Search:** Built-in Web Speech API integration allows users to search products using voice commands.
* **🌙 Dark/Light Mode:** System-aware theme toggling.
* **Skeleton Loading:** Professional loading states for smoother perceived performance.
* **Amazon-Inspired UI:** A robust footer and information center (`zenvia.html`) featuring Careers, Shipping Timelines, and Legal documentation.
* **Localization:** Region and Language selectors with dynamic flag rendering.

---

## 🛠️ Tech Stack

* **Frontend:** HTML5, CSS3 (Glassmorphism, Flexbox/Grid)
* **Logic:** Vanilla JavaScript (ES6+) - *Titanium Edition Engine*
* **APIs:** FakeStoreAPI, DummyJSON, Web Speech API
* **Services:** EmailJS (Transactional Emails), FlagCDN
* **Storage:** Browser LocalStorage (No Backend Database required)

---

## 📂 Project Structure

```text
ZENVIA/
│
├── index.html          # Homepage (Carousel, Product Grid)
├── product.html        # Product Details Page (Zoom, Reviews)
├── cart.html           # Shopping Bag & Checkout
├── zenvia.html         # Info Center (About, Careers, Shipping, Legal)
├── support.html        # Contact Support Form
├── seller.html         # Seller Application Page
├── reset.html          # Password Reset Landing Page
│
├── script.js           # Titanium Edition Engine v11.7 (Core Logic)
├── style.css           # Global Styles & Responsiveness
└── README.md           # Documentation
