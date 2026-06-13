/**
 * Gulf Engine Oil Center - Workshop Management System
 * Core Application Script
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyBa9k-6rAWQ5Ad2ZHDZi_wluQm-G-DtlKI",
  authDomain: "shop-5a85b.firebaseapp.com",
  projectId: "shop-5a85b",
  storageBucket: "shop-5a85b.firebasestorage.app",
  messagingSenderId: "411947501193",
  appId: "1:411947501193:web:e2fffa3264f54359376858",
  measurementId: "G-4J2KMGQ4MG"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const analytics = getAnalytics(firebaseApp);

// Application State
const state = {
    inventory: [],
    sales: [],
    expenses: [],
    hiddenCustomers: [],
    cart: {
        items: [],
        laborDesc: "",
        laborCharges: 0,
        discount: 0
    },
    activeTab: "dashboard",
    currentEditProductId: null
};

// Application Main Namespace
const app = {
    // ----------------------------------------------------
    // INITIALIZATION & LIFECYCLE
    // ----------------------------------------------------
    init: function() {
        window.app = this;
        this.loadData();
        this.initDOM();
        this.bindEvents();
        this.startClock();
        
        // Load default tab
        this.switchTab("dashboard");
        
        // Populate product dropdown in billing
        this.updateBillingProductDropdown();
    },

    // Load data from Firebase
    loadData: function() {
        try {
            onSnapshot(doc(db, "shopData", "inventory"), (docSnap) => {
                if (docSnap.exists()) {
                    state.inventory = docSnap.data().items || [];
                } else {
                    state.inventory = [];
                }
                if (this.dom) {
                    if (state.activeTab === "dashboard") this.renderDashboard();
                    if (state.activeTab === "inventory") this.renderInventory();
                    this.updateBillingProductDropdown();
                    this.updateGlobalBadges();
                }
            });

            onSnapshot(doc(db, "shopData", "sales"), (docSnap) => {
                if (docSnap.exists()) {
                    state.sales = docSnap.data().items || [];
                } else {
                    state.sales = [];
                }
                if (this.dom) {
                    if (state.activeTab === "dashboard") this.renderDashboard();
                    if (state.activeTab === "billing") this.renderInvoiceHistory();
                }
            });

            onSnapshot(doc(db, "shopData", "expenses"), (docSnap) => {
                if (docSnap.exists()) {
                    state.expenses = docSnap.data().items || [];
                } else {
                    state.expenses = [];
                }
                if (this.dom) {
                    if (state.activeTab === "dashboard") this.renderDashboard();
                    if (state.activeTab === "expenses") this.renderExpenses();
                }
            });

            onSnapshot(doc(db, "shopData", "hiddenCustomers"), (docSnap) => {
                if (docSnap.exists()) {
                    state.hiddenCustomers = docSnap.data().items || [];
                } else {
                    state.hiddenCustomers = [];
                }
                if (this.dom) {
                    if (state.activeTab === "customers") this.renderCustomersList();
                    if (state.activeTab === "reminders") this.renderServiceReminders();
                }
            });
        } catch (e) {
            console.error("Error setting up Firebase listeners:", e);
        }
    },

    // Save data to Firebase
    saveData: function() {
        try {
            setDoc(doc(db, "shopData", "inventory"), { items: state.inventory });
            setDoc(doc(db, "shopData", "sales"), { items: state.sales });
            setDoc(doc(db, "shopData", "expenses"), { items: state.expenses });
            setDoc(doc(db, "shopData", "hiddenCustomers"), { items: state.hiddenCustomers });
        } catch (e) {
            console.error("Error saving to Firebase:", e);
            alert("Warning: Error syncing to cloud! Please check your internet connection.");
        }
    },

    // ----------------------------------------------------
    // DOM CACHING & INTERFACES
    // ----------------------------------------------------
    initDOM: function() {
        this.dom = {
            sidebar: document.getElementById("sidebar"),
            mobileMenuBtn: document.getElementById("mobile-menu-btn"),
            pageTitle: document.getElementById("page-title"),
            headerDate: document.getElementById("header-date"),
            headerTime: document.getElementById("header-time"),
            quickSaleBtn: document.getElementById("quick-sale-btn"),
            
            // Stats
            statSales: document.getElementById("stat-sales"),
            statSalesQty: document.getElementById("stat-sales-qty"),
            statLabor: document.getElementById("stat-labor"),
            statExpenses: document.getElementById("stat-expenses"),
            statExpensesCount: document.getElementById("stat-expenses-count"),
            statProfit: document.getElementById("stat-profit"),
            lowStockCountBadge: document.getElementById("low-stock-count-badge"),
            remindersCountBadge: document.getElementById("reminders-count-badge"),
            
            // Inventory Summary Stats
            invStatProducts: document.getElementById("inv-stat-products"),
            invStatProductsSub: document.getElementById("inv-stat-products-sub"),
            invStatUnits: document.getElementById("inv-stat-units"),
            invStatUnitsSub: document.getElementById("inv-stat-units-sub"),
            invStatCost: document.getElementById("inv-stat-cost"),
            invStatSell: document.getElementById("inv-stat-sell"),
            
            // Dashboard
            lowStockList: document.getElementById("low-stock-list"),
            recentSalesTbody: document.getElementById("recent-sales-tbody"),
            businessChart: document.getElementById("businessChart"),
            dashboardSearchInput: document.getElementById("dashboard-search-input"),
            dashboardSearchResultsContainer: document.getElementById("dashboard-search-results-container"),
            dashboardSearchTbody: document.getElementById("dashboard-search-tbody"),
            
            // Inventory
            inventoryTbody: document.getElementById("inventory-tbody"),
            inventorySearch: document.getElementById("inventory-search-input"),
            inventoryFilterStock: document.getElementById("inventory-filter-stock"),
            btnAddProduct: document.getElementById("btn-add-product"),
            productModal: document.getElementById("product-modal"),
            productForm: document.getElementById("product-form"),
            productModalTitle: document.getElementById("product-modal-title"),
            
            // Billing
            billInvoiceNum: document.getElementById("invoice-number-disp"),
            billPhone: document.getElementById("bill-customer-phone"),
            phoneAutocomplete: document.getElementById("phone-autocomplete-results"),
            billName: document.getElementById("bill-customer-name"),
            billVehicle: document.getElementById("bill-vehicle-no"),
            billModel: document.getElementById("bill-vehicle-model"),
            billMileage: document.getElementById("bill-current-mileage"),
            billNextMileage: document.getElementById("bill-next-change-mileage"),
            billSelectProduct: document.getElementById("bill-select-product"),
            billProductQty: document.getElementById("bill-product-qty"),
            btnAddCart: document.getElementById("btn-add-to-cart"),
            billLaborDesc: document.getElementById("bill-labor-desc"),
            billLaborCharges: document.getElementById("bill-labor-charges"),
            billDiscount: document.getElementById("bill-discount"),
            cartTbody: document.getElementById("cart-tbody"),
            calcProductsTotal: document.getElementById("calc-products-total"),
            calcLaborCharges: document.getElementById("calc-labor-charges"),
            calcGrandTotal: document.getElementById("calc-grand-total"),
            calcProfitEstimate: document.getElementById("calc-profit-estimate"),
            btnCompleteInvoice: document.getElementById("btn-complete-invoice"),
            btnResetInvoice: document.getElementById("btn-reset-invoice"),
            allSalesTbody: document.getElementById("all-sales-tbody"),
            salesSearchInput: document.getElementById("sales-search-input"),
            
            // Expenses
            expenseForm: document.getElementById("expense-form"),
            expensesTbody: document.getElementById("expenses-tbody"),
            expenseLogTotal: document.getElementById("expense-log-total"),
            expenseDateInput: document.getElementById("expense-date"),
            
            // Customers
            customersTbody: document.getElementById("customers-tbody"),
            customerSearch: document.getElementById("customer-search-input"),
            customerHistoryModal: document.getElementById("customer-history-modal"),
            custModalName: document.getElementById("cust-modal-name"),
            custModalPhone: document.getElementById("cust-modal-phone"),
            custModalVehicle: document.getElementById("cust-modal-vehicle"),
            custModalModel: document.getElementById("cust-modal-model"),
            custModalHistoryTbody: document.getElementById("cust-modal-history-tbody"),
            
            // Reminders
            remindersTbody: document.getElementById("reminders-tbody"),
            reminderDaysThreshold: document.getElementById("reminder-days-threshold"),
            reminderKmThreshold: document.getElementById("reminder-km-threshold"),
            
            // Settings / Backup
            btnExport: document.getElementById("btn-export-data"),
            btnImportLabel: document.querySelector('label[for="restore-file-input"]'),
            restoreFileInput: document.getElementById("restore-file-input"),
            btnLoadDemo: document.getElementById("btn-load-demo"),
            btnWipeData: document.getElementById("btn-wipe-data")
        };
        
        // Set default date for expense form to today
        const todayStr = new Date().toLocaleDateString('en-CA');
        this.dom.expenseDateInput.value = todayStr;
    },

    // ----------------------------------------------------
    // SYSTEM CLOCK
    // ----------------------------------------------------
    startClock: function() {
        const updateClock = () => {
            const now = new Date();
            const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            this.dom.headerDate.textContent = now.toLocaleDateString('en-US', dateOptions);
            
            let hours = now.getHours();
            let minutes = now.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // 0 should be 12
            minutes = minutes < 10 ? '0' + minutes : minutes;
            this.dom.headerTime.textContent = `${hours}:${minutes} ${ampm}`;
        };
        
        updateClock();
        setInterval(updateClock, 30000); // Update every 30 seconds
    },

    // ----------------------------------------------------
    // EVENTS BINDING
    // ----------------------------------------------------
    bindEvents: function() {
        // Tab switching (Desktop Sidebar & Mobile Nav)
        document.querySelectorAll(".menu-item, .mobile-nav-item").forEach(item => {
            if (item.id === "mobile-menu-more") return; // Skip "More" button
            
            item.addEventListener("click", (e) => {
                e.preventDefault();
                const tab = item.getAttribute("data-tab");
                if (tab) this.switchTab(tab);
                
                // Close sidebar on mobile after clicking
                this.dom.sidebar.classList.remove("mobile-open");
            });
        });
        
        // Mobile "More" button toggles sidebar
        const mobileMenuMore = document.getElementById("mobile-menu-more");
        if (mobileMenuMore) {
            mobileMenuMore.addEventListener("click", (e) => {
                e.preventDefault();
                this.dom.sidebar.classList.toggle("mobile-open");
            });
        }
        
        // Mobile menu toggle (Fallback header button)
        if (this.dom.mobileMenuBtn) {
            this.dom.mobileMenuBtn.addEventListener("click", () => {
                this.dom.sidebar.classList.toggle("mobile-open");
            });
        }
        
        // Quick Action Button (Redirects to Billing Tab)
        if (this.dom.quickSaleBtn) {
            this.dom.quickSaleBtn.addEventListener("click", () => {
                this.switchTab("billing");
            });
        }

        // Modal Close handlers
        document.querySelectorAll(".modal-close-btn, .modal-cancel-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                document.querySelectorAll(".modal-backdrop").forEach(m => m.classList.remove("active"));
            });
        });

        // ---------------- INVENTORY EVENTS ----------------
        this.dom.btnAddProduct.addEventListener("click", () => {
            this.openProductModal(null);
        });
        
        this.dom.productForm.addEventListener("submit", (e) => {
            e.preventDefault();
            this.handleProductFormSubmit();
        });

        this.dom.inventorySearch.addEventListener("input", () => this.renderInventory());
        this.dom.inventoryFilterStock.addEventListener("change", () => this.renderInventory());

        // ---------------- DASHBOARD EVENTS ----------------
        if(this.dom.dashboardSearchInput) {
            this.dom.dashboardSearchInput.addEventListener("input", () => this.handleDashboardSearch());
        }

        // ---------------- EXPENSES EVENTS ----------------
        this.dom.expenseForm.addEventListener("submit", (e) => {
            e.preventDefault();
            this.handleExpenseSubmit();
        });

        // ---------------- BILLING / CART EVENTS ----------------
        // Add to Cart
        this.dom.btnAddCart.addEventListener("click", () => this.addSelectedProductToCart());
        
        // Realtime calculation adjustments
        this.dom.billLaborCharges.addEventListener("input", () => this.updateCartTotals());
        this.dom.billLaborDesc.addEventListener("input", () => {
            state.cart.laborDesc = this.dom.billLaborDesc.value;
        });
        this.dom.billDiscount.addEventListener("input", () => this.updateCartTotals());
        this.dom.billMileage.addEventListener("input", () => {
            const mileage = parseInt(this.dom.billMileage.value) || 0;
            if (mileage > 0) {
                // Auto-suggest next change in 3000 km
                this.dom.billNextMileage.value = mileage + 3000;
            } else {
                this.dom.billNextMileage.value = "";
            }
        });
        
        // Customer details autocomplete on Phone field
        this.dom.billPhone.addEventListener("input", () => this.handleCustomerPhoneInput());
        document.addEventListener("click", (e) => {
            if (!this.dom.billPhone.contains(e.target) && !this.dom.phoneAutocomplete.contains(e.target)) {
                this.dom.phoneAutocomplete.style.display = "none";
            }
        });

        // Complete & Reset Checkout Buttons
        this.dom.btnCompleteInvoice.addEventListener("click", () => this.completeSaleAndCheckout());
        this.dom.btnResetInvoice.addEventListener("click", () => this.resetBillingForm());
        
        // Invoice history search
        this.dom.salesSearchInput.addEventListener("input", () => this.renderInvoiceHistory());

        // ---------------- CUSTOMER LIST SEARCH ----------------
        this.dom.customerSearch.addEventListener("input", () => this.renderCustomersList());

        // ---------------- REMINDER SETTINGS ----------------
        this.dom.reminderDaysThreshold.addEventListener("change", () => this.renderServiceReminders());
        this.dom.reminderKmThreshold.addEventListener("change", () => this.renderServiceReminders());

        // ---------------- SETTINGS & BACKUP ----------------
        this.dom.btnExport.addEventListener("click", () => this.exportBackupFile());
        this.dom.restoreFileInput.addEventListener("change", (e) => this.importBackupFile(e));
        this.dom.btnLoadDemo.addEventListener("click", () => this.loadSampleData());
        this.dom.btnWipeData.addEventListener("click", () => this.wipeAllSystemData());
    },

    // ----------------------------------------------------
    // TAB MANAGEMENT & PANEL VISIBILITY
    // ----------------------------------------------------
    switchTab: function(tabName) {
        state.activeTab = tabName;
        
        // Update menu active links (Desktop Sidebar & Mobile Nav)
        document.querySelectorAll(".menu-item, .mobile-nav-item").forEach(item => {
            if (item.id === "mobile-menu-more") return; // Skip "More" button
            
            if (item.getAttribute("data-tab") === tabName) {
                item.classList.add("active");
            } else {
                item.classList.remove("active");
            }
        });

        // Update tab panels display
        document.querySelectorAll(".tab-panel").forEach(panel => {
            if (panel.id === `tab-${tabName}`) {
                panel.classList.add("active");
            } else {
                panel.classList.remove("active");
            }
        });

        // Update page title text
        const titles = {
            dashboard: "Dashboard Overview",
            billing: "Sales Counter & Billing",
            inventory: "Product Inventory Stock",
            expenses: "Shop Expense Book",
            customers: "Customer Directory & Vehicles",
            reminders: "Car Service Reminders",
            settings: "System Settings & Backups"
        };
        this.dom.pageTitle.textContent = titles[tabName] || "Gulf Engine Oil Center";

        // Perform page-specific renders when switched
        if (tabName === "dashboard") {
            this.renderDashboard();
        } else if (tabName === "billing") {
            this.generateNewInvoiceNum();
            this.renderCartTable();
            this.renderInvoiceHistory();
        } else if (tabName === "inventory") {
            this.renderInventory();
        } else if (tabName === "expenses") {
            this.renderExpenses();
        } else if (tabName === "customers") {
            this.renderCustomersList();
        } else if (tabName === "reminders") {
            this.renderServiceReminders();
        }
        
        // Update warnings counts in badges
        this.updateGlobalBadges();
    },

    updateGlobalBadges: function() {
        // Low Stock Count
        const lowStockCount = state.inventory.filter(item => item.stock <= item.minStock).length;
        if (lowStockCount > 0) {
            this.dom.lowStockCountBadge.textContent = `${lowStockCount} item${lowStockCount > 1 ? 's' : ''}`;
            this.dom.lowStockCountBadge.style.display = "inline-block";
        } else {
            this.dom.lowStockCountBadge.style.display = "none";
        }

        // Reminders count (run compile search)
        const dueReminders = this.getOverdueServiceCustomers();
        const remindersCount = dueReminders.length;
        if (remindersCount > 0) {
            this.dom.remindersCountBadge.textContent = remindersCount;
            this.dom.remindersCountBadge.style.display = "inline-block";
        } else {
            this.dom.remindersCountBadge.style.display = "none";
        }
    },

    // ----------------------------------------------------
    // DASHBOARD PANEL RENDER & CUSTOM CHART DRAWER
    // ----------------------------------------------------
    renderDashboard: function() {
        // Today's Date representation
        const todayStr = new Date().toLocaleDateString('en-CA');

        // Today's Sales calculation
        const todaySales = state.sales.filter(sale => sale.date === todayStr);
        const totalSalesSum = todaySales.reduce((acc, sale) => acc + sale.totalPayable, 0);
        const totalSalesQty = todaySales.length;

        // Today's Labor Earnings calculation
        const totalLaborSum = todaySales.reduce((acc, sale) => acc + sale.laborCharges, 0);

        // Today's Expenses calculation
        const todayExpenses = state.expenses.filter(exp => exp.date === todayStr);
        const totalExpensesSum = todayExpenses.reduce((acc, exp) => acc + exp.amount, 0);
        const expensesCount = todayExpenses.length;

        // Today's Net Profit calculation
        const totalProfitSum = todaySales.reduce((acc, sale) => acc + (sale.profit || 0), 0) - totalExpensesSum;

        // Populate Stats DOM
        this.dom.statSales.textContent = `Rs. ${totalSalesSum.toLocaleString()}`;
        this.dom.statSalesQty.textContent = `${totalSalesQty} Invoice${totalSalesQty !== 1 ? 's' : ''} generated`;
        this.dom.statLabor.textContent = `Rs. ${totalLaborSum.toLocaleString()}`;
        this.dom.statExpenses.textContent = `Rs. ${totalExpensesSum.toLocaleString()}`;
        this.dom.statExpensesCount.textContent = `${expensesCount} expense registr${expensesCount !== 1 ? 'ies' : 'y'}`;
        
        // Profit highlighting
        this.dom.statProfit.textContent = `Rs. ${totalProfitSum.toLocaleString()}`;
        if (totalProfitSum < 0) {
            this.dom.statProfit.className = "stat-val font-digit text-red";
        } else {
            this.dom.statProfit.className = "stat-val font-digit text-green";
        }

        // Render Dashboard Low Stock Alerts
        const lowStockItems = state.inventory.filter(item => item.stock <= item.minStock);
        let lowStockHTML = "";
        
        if (lowStockItems.length === 0) {
            lowStockHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    <p>All stock items are sufficient.</p>
                </div>`;
        } else {
            lowStockItems.forEach(item => {
                const badgeClass = item.stock === 0 ? "badge-alert" : "badge-warning";
                const badgeText = item.stock === 0 ? "Out of Stock" : "Low Stock";
                lowStockHTML += `
                    <div class="low-stock-item">
                        <div class="low-stock-info">
                            <span class="low-stock-name">${item.name}</span>
                            <span class="low-stock-status">Category: ${item.category}</span>
                        </div>
                        <div class="low-stock-qty">
                            <span class="qty-value">${item.stock} left</span>
                            <span class="badge ${badgeClass}">${badgeText}</span>
                        </div>
                    </div>`;
            });
        }
        this.dom.lowStockList.innerHTML = lowStockHTML;

        // Render Dashboard Recent Transactions
        let recentSalesHTML = "";
        // Sort sales by date and time descending, limit to last 5 entries today
        const recentTodaySales = [...todaySales].reverse().slice(0, 5);

        if (recentTodaySales.length === 0) {
            recentSalesHTML = `<tr><td colspan="8" class="text-center">No transactions recorded today.</td></tr>`;
        } else {
            recentTodaySales.forEach(sale => {
                const itemsDesc = sale.items.map(it => `${it.name} (x${it.qty})`).join(', ') || 'Service Only';
                recentSalesHTML += `
                    <tr>
                        <td data-label="Time"><span class="font-digit">${sale.time}</span></td>
                        <td data-label="Invoice #"><strong class="text-orange font-digit">${sale.invoiceNum}</strong></td>
                        <td data-label="Customer & Vehicle">
                            <div class="font-bold">${sale.customerName || 'Walk-in'}</div>
                            <div class="description-text">${sale.customerPhone || 'N/A'}</div>
                        </td>
                        <td data-label="Items Sold"><div class="text-ellipse" title="${itemsDesc}">${itemsDesc}</div></td>
                        <td data-label="Labor Charges" class="text-right font-digit text-cyan">Rs. ${sale.laborCharges.toLocaleString()}</td>
                        <td data-label="Total Bill" class="text-right font-bold font-digit">Rs. ${sale.totalPayable.toLocaleString()}</td>
                        <td data-label="Profit Earned" class="text-right font-bold font-digit text-green">Rs. ${sale.profit.toLocaleString()}</td>
                        <td data-label="Actions" class="text-center">
                            <button class="btn btn-sm btn-secondary" onclick="app.printInvoiceById('${sale.id}')">Print</button>
                        </td>
                    </tr>`;
            });
        }
        this.dom.recentSalesTbody.innerHTML = recentSalesHTML;

        // Draw Analytics canvas graph
        this.drawDashboardChart();
        
        // Render Inventory Overview Stats
        this.renderInventoryStats();
    },

    // ----------------------------------------------------
    // INVENTORY STATS (Dashboard Overview Panel)
    // ----------------------------------------------------
    renderInventoryStats: function() {
        // Total unique products in inventory
        const totalProducts = state.inventory.length;
        
        // Total stock units across all products
        const totalUnits = state.inventory.reduce((acc, item) => acc + item.stock, 0);
        
        // Total value of current stock at COST (purchase) price
        const totalCostValue = state.inventory.reduce((acc, item) => acc + (item.stock * item.costPrice), 0);
        
        // Total value of current stock at SELLING price (potential revenue)
        const totalSellValue = state.inventory.reduce((acc, item) => acc + (item.stock * item.sellingPrice), 0);

        // Populate DOM
        this.dom.invStatProducts.textContent = totalProducts.toLocaleString();
        this.dom.invStatProductsSub.textContent = `${totalProducts === 0 ? 'No' : totalProducts} unique product${totalProducts !== 1 ? 's' : ''} registered`;
        
        this.dom.invStatUnits.textContent = totalUnits.toLocaleString();
        this.dom.invStatUnitsSub.textContent = `${totalUnits} total piece${totalUnits !== 1 ? 's' : ''} available in shop`;
        
        this.dom.invStatCost.textContent = `Rs. ${totalCostValue.toLocaleString()}`;
        this.dom.invStatSell.textContent = `Rs. ${totalSellValue.toLocaleString()}`;
    },

    // Draw custom bar chart on HTML5 Canvas (runs completely offline!)
    drawDashboardChart: function() {
        const canvas = this.dom.businessChart;
        if (!canvas) return;

        // Setup dimensions dynamically to fix blurry canvases on Retina
        const container = canvas.parentElement;
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Fetch last 7 days details
        const days = [];
        const dateLabels = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('en-CA');
            days.push(dateStr);
            
            // Format labels as 'Mon 22', 'Tue 23'
            const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
            dateLabels.push(dayLabel);
        }

        // Calculate sales and profit statistics for each of the 7 days
        const salesStats = [];
        const profitStats = [];
        let maxVal = 5000; // default cap for height matching

        days.forEach(dayStr => {
            const daySales = state.sales.filter(sale => sale.date === dayStr);
            const dayExpenses = state.expenses.filter(exp => exp.date === dayStr);
            
            const salesTotal = daySales.reduce((acc, sale) => acc + sale.totalPayable, 0);
            const profitTotal = daySales.reduce((acc, sale) => acc + (sale.profit || 0), 0) - 
                                dayExpenses.reduce((acc, exp) => acc + exp.amount, 0);
            
            salesStats.push(salesTotal);
            profitStats.push(profitTotal);

            if (salesTotal > maxVal) maxVal = salesTotal;
            if (profitTotal > maxVal) maxVal = profitTotal;
        });

        maxVal = Math.ceil(maxVal / 1000) * 1000 * 1.1; // round up to give top margin

        // Setup coordinates
        const paddingLeft = 60;
        const paddingBottom = 40;
        const paddingTop = 20;
        const paddingRight = 20;

        const chartWidth = canvas.width - paddingLeft - paddingRight;
        const chartHeight = canvas.height - paddingTop - paddingBottom;

        // Draw horizontal grid lines and Y-axis scale numbers
        const gridLinesCount = 5;
        ctx.strokeStyle = "#2b3240";
        ctx.lineWidth = 1;
        ctx.fillStyle = "#8c96a8";
        ctx.font = "10px Inter";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";

        for (let i = 0; i <= gridLinesCount; i++) {
            const y = paddingTop + chartHeight - (i / gridLinesCount) * chartHeight;
            const gridVal = (i / gridLinesCount) * maxVal;
            
            // Grid Line
            ctx.beginPath();
            ctx.moveTo(paddingLeft, y);
            ctx.lineTo(paddingLeft + chartWidth, y);
            ctx.stroke();

            // Y Value Label
            ctx.fillText(Math.round(gridVal).toLocaleString(), paddingLeft - 10, y);
        }

        // Draw Bars for each day
        const dayWidth = chartWidth / 7;
        const barWidth = dayWidth * 0.3;
        
        ctx.textAlign = "center";
        ctx.textBaseline = "top";

        for (let i = 0; i < 7; i++) {
            const centerX = paddingLeft + (i * dayWidth) + (dayWidth / 2);
            
            // Calculate coordinates
            const salesHeight = (salesStats[i] / maxVal) * chartHeight;
            const profitHeight = (Math.max(0, profitStats[i]) / maxVal) * chartHeight; // handle positive profits visually

            const salesY = paddingTop + chartHeight - salesHeight;
            const profitY = paddingTop + chartHeight - profitHeight;

            // Draw Sales Bar (Orange Glow Theme)
            ctx.fillStyle = "#ff9f43";
            ctx.beginPath();
            ctx.roundRect(centerX - barWidth - 2, salesY, barWidth, salesHeight, [4, 4, 0, 0]);
            ctx.fill();

            // Draw Profit Bar (Green Theme)
            ctx.fillStyle = "#10ac84";
            ctx.beginPath();
            ctx.roundRect(centerX + 2, profitY, barWidth, profitHeight, [4, 4, 0, 0]);
            ctx.fill();

            // Draw X-axis text date label
            ctx.fillStyle = "#8c96a8";
            ctx.font = "10px Inter";
            ctx.fillText(dateLabels[i], centerX, paddingTop + chartHeight + 10);
        }
    },

    handleDashboardSearch: function() {
        const query = this.dom.dashboardSearchInput.value.toLowerCase().trim();
        if (query === "") {
            this.dom.dashboardSearchResultsContainer.style.display = "none";
            return;
        }

        const filtered = state.inventory.filter(item => {
            return item.name.toLowerCase().includes(query) || 
                   (item.code && item.code.toLowerCase().includes(query));
        });

        let html = "";
        if (filtered.length === 0) {
            html = `<tr><td colspan="6" class="text-center">No products found for "${query}"</td></tr>`;
        } else {
            filtered.forEach(item => {
                let stockClass = "badge-success";
                let stockLabel = "In Stock";
                if (item.stock === 0) {
                    stockClass = "badge-alert";
                    stockLabel = "Out Of Stock";
                } else if (item.stock <= item.minStock) {
                    stockClass = "badge-warning";
                    stockLabel = "Low Stock";
                }

                html += `
                    <tr class="${item.stock === 0 ? 'bg-row-out' : ''}">
                        <td data-label="Code / Number"><span class="font-digit font-bold">${item.code || 'N/A'}</span></td>
                        <td data-label="Product Name"><span class="font-bold">${item.name}</span></td>
                        <td data-label="Category"><span class="category-lbl">${item.category}</span></td>
                        <td data-label="Buying Price" class="text-right font-digit">Rs. ${item.costPrice.toLocaleString()}</td>
                        <td data-label="Selling Price" class="text-right font-digit text-orange">Rs. ${item.sellingPrice.toLocaleString()}</td>
                        <td data-label="Stock" class="text-center font-bold font-digit">
                            <span style="font-size:1.1rem; margin-right: 6px;">${item.stock}</span>
                            <span class="badge ${stockClass}">${stockLabel}</span>
                        </td>
                    </tr>`;
            });
        }
        this.dom.dashboardSearchTbody.innerHTML = html;
        this.dom.dashboardSearchResultsContainer.style.display = "block";
    },

    // ----------------------------------------------------
    // INVENTORY STOCK MANAGEMENT
    // ----------------------------------------------------
    renderInventory: function() {
        const query = this.dom.inventorySearch.value.toLowerCase().trim();
        const filterStock = this.dom.inventoryFilterStock.value;
        let html = "";
        
        // Filter elements
        const filtered = state.inventory.filter(item => {
            const matchSearch = item.name.toLowerCase().includes(query) || 
                                (item.code && item.code.toLowerCase().includes(query)) ||
                                item.category.toLowerCase().includes(query);
            
            let matchStock = true;
            if (filterStock === "low") {
                matchStock = item.stock <= item.minStock && item.stock > 0;
            } else if (filterStock === "out") {
                matchStock = item.stock === 0;
            }

            return matchSearch && matchStock;
        });

        if (filtered.length === 0) {
            html = `<tr><td colspan="8" class="text-center">No inventory items found matching your filters.</td></tr>`;
        } else {
            filtered.forEach(item => {
                let stockClass = "badge-success";
                let stockLabel = "In Stock";
                if (item.stock === 0) {
                    stockClass = "badge-alert";
                    stockLabel = "Out Of Stock";
                } else if (item.stock <= item.minStock) {
                    stockClass = "badge-warning";
                    stockLabel = "Low Stock";
                }

                html += `
                    <tr class="${item.stock === 0 ? 'bg-row-out' : ''}">
                        <td data-label="Product Code"><span class="font-digit font-bold">${item.code || 'N/A'}</span></td>
                        <td data-label="Product Name"><span class="font-bold">${item.name}</span></td>
                        <td data-label="Category"><span class="category-lbl">${item.category}</span></td>
                        <td data-label="Cost Price" class="text-right font-digit">Rs. ${item.costPrice.toLocaleString()}</td>
                        <td data-label="Selling Price" class="text-right font-digit text-orange">Rs. ${item.sellingPrice.toLocaleString()}</td>
                        <td data-label="Stock Level" class="text-center font-bold font-digit">
                            <span style="font-size:1.1rem; margin-right: 6px;">${item.stock}</span>
                            <span class="badge ${stockClass}">${stockLabel}</span>
                        </td>
                        <td data-label="Min Alert" class="text-center font-digit">${item.minStock}</td>
                        <td data-label="Actions">
                            <div class="action-btns-cell">
                                <button class="btn btn-sm btn-secondary" onclick="app.quickAdjustStock('${item.id}', 1)" title="Add 1 Stock">+1</button>
                                <button class="btn btn-sm btn-secondary" onclick="app.openProductModal('${item.id}')">Edit</button>
                                <button class="btn btn-sm btn-danger" onclick="app.deleteProduct('${item.id}')">Delete</button>
                            </div>
                        </td>
                    </tr>`;
            });
        }
        this.dom.inventoryTbody.innerHTML = html;
        this.updateBillingProductDropdown();
    },

    openProductModal: function(productId = null) {
        this.dom.productForm.reset();
        
        if (productId) {
            // Edit existing mode
            const prod = state.inventory.find(item => item.id === productId);
            if (!prod) return;
            
            state.currentEditProductId = productId;
            this.dom.productModalTitle.textContent = "Edit Product Information";
            
            document.getElementById("product-id").value = prod.id;
            document.getElementById("product-name").value = prod.name;
            document.getElementById("product-code").value = prod.code || "";
            document.getElementById("product-category").value = prod.category;
            document.getElementById("product-cost-price").value = prod.costPrice;
            document.getElementById("product-selling-price").value = prod.sellingPrice;
            document.getElementById("product-stock").value = prod.stock;
            document.getElementById("product-min-stock").value = prod.minStock;
        } else {
            // Add new mode
            state.currentEditProductId = null;
            this.dom.productModalTitle.textContent = "Add New Inventory Product";
            document.getElementById("product-id").value = "";
            
            // Auto suggest product code prefix
            document.getElementById("product-code").value = "GULF-" + Math.floor(1000 + Math.random() * 9000);
        }
        this.dom.productModal.classList.add("active");
    },

    handleProductFormSubmit: function() {
        const id = document.getElementById("product-id").value;
        const name = document.getElementById("product-name").value.trim();
        const code = document.getElementById("product-code").value.trim().toUpperCase();
        const category = document.getElementById("product-category").value;
        const costPrice = parseFloat(document.getElementById("product-cost-price").value) || 0;
        const sellingPrice = parseFloat(document.getElementById("product-selling-price").value) || 0;
        const stock = parseInt(document.getElementById("product-stock").value) || 0;
        const minStock = parseInt(document.getElementById("product-min-stock").value) || 0;

        if (!name || costPrice <= 0 || sellingPrice <= 0) {
            alert("Please fill all required fields correctly.");
            return;
        }

        if (id) {
            // Update mode
            const prod = state.inventory.find(item => item.id === id);
            if (prod) {
                prod.name = name;
                prod.code = code;
                prod.category = category;
                prod.costPrice = costPrice;
                prod.sellingPrice = sellingPrice;
                prod.stock = stock;
                prod.minStock = minStock;
            }
        } else {
            // Create mode
            // Check for duplicate product code
            if (code && state.inventory.some(item => item.code === code)) {
                alert("A product with this code already exists. Please choose a unique code.");
                return;
            }

            const newProduct = {
                id: Date.now().toString(),
                name,
                code,
                category,
                costPrice,
                sellingPrice,
                stock,
                minStock
            };
            state.inventory.push(newProduct);
        }

        this.saveData();
        this.renderInventory();
        this.renderInventoryStats();
        this.updateGlobalBadges();
        
        // Hide Modal
        this.dom.productModal.classList.remove("active");
    },

    quickAdjustStock: function(productId, qtyToAdd) {
        const prod = state.inventory.find(item => item.id === productId);
        if (prod) {
            prod.stock += qtyToAdd;
            this.saveData();
            this.renderInventory();
            this.renderInventoryStats();
            this.updateGlobalBadges();
        }
    },

    deleteProduct: function(productId) {
        const prod = state.inventory.find(item => item.id === productId);
        if (!prod) return;

        if (confirm(`Are you sure you want to delete ${prod.name} from the inventory registry?`)) {
            state.inventory = state.inventory.filter(item => item.id !== productId);
            this.saveData();
            this.renderInventory();
            this.renderInventoryStats();
            this.updateGlobalBadges();
        }
    },

    updateBillingProductDropdown: function() {
        const select = this.dom.billSelectProduct;
        if (!select) return;
        
        // Keep initial option
        select.innerHTML = '<option value="">-- Choose Inventory Product --</option>';
        
        // Sort inventory alphabetically
        const sorted = [...state.inventory].sort((a, b) => a.name.localeCompare(b.name));
        
        sorted.forEach(prod => {
            const stockStr = prod.stock === 0 ? "OUT OF STOCK" : `${prod.stock} left`;
            const opt = document.createElement("option");
            opt.value = prod.id;
            opt.textContent = `${prod.name} (${prod.category}) - Rs. ${prod.sellingPrice} [Stock: ${stockStr}]`;
            
            if (prod.stock === 0) {
                opt.disabled = true;
            }
            select.appendChild(opt);
        });
    },

    // ----------------------------------------------------
    // SALES COUNTER & CHECKOUT REGISTER
    // ----------------------------------------------------
    generateNewInvoiceNum: function() {
        let maxNum = 1000;
        state.sales.forEach(sale => {
            const numPart = parseInt(sale.invoiceNum.split("-")[1]);
            if (numPart > maxNum) maxNum = numPart;
        });
        
        const nextNum = maxNum + 1;
        this.dom.billInvoiceNum.textContent = `Invoice # GULF-${nextNum}`;
        return `GULF-${nextNum}`;
    },

    // Customer Autocomplete features
    handleCustomerPhoneInput: function() {
        const phoneInput = this.dom.billPhone.value.trim();
        const resultsDiv = this.dom.phoneAutocomplete;
        
        if (phoneInput.length < 3) {
            resultsDiv.style.display = "none";
            return;
        }

        // Search past sales for matching phone numbers
        const matchingCustomers = [];
        const seenPhones = new Set();

        state.sales.forEach(sale => {
            if (sale.customerPhone && sale.customerPhone.includes(phoneInput) && !seenPhones.has(sale.customerPhone)) {
                seenPhones.add(sale.customerPhone);
                matchingCustomers.push({
                    phone: sale.customerPhone,
                    name: sale.customerName,
                    vehicleNo: sale.vehicleNo,
                    vehicleModel: sale.vehicleModel,
                    lastMileage: sale.currentMileage
                });
            }
        });

        if (matchingCustomers.length === 0) {
            resultsDiv.style.display = "none";
            return;
        }

        let html = "";
        matchingCustomers.slice(0, 5).forEach(cust => {
            html += `
                <div class="autocomplete-item" onclick="app.selectAutocompleteCustomer('${cust.phone}', '${cust.name || ''}', '${cust.vehicleNo || ''}', '${cust.vehicleModel || ''}', ${cust.lastMileage || 0})">
                    <strong>${cust.phone}</strong> - ${cust.name || 'Walk-in'} (${cust.vehicleNo || 'No Plate'})
                </div>`;
        });
        
        resultsDiv.innerHTML = html;
        resultsDiv.style.display = "block";
    },

    selectAutocompleteCustomer: function(phone, name, vehicleNo, vehicleModel, lastMileage) {
        this.dom.billPhone.value = phone;
        this.dom.billName.value = name;
        this.dom.billVehicle.value = vehicleNo;
        this.dom.billModel.value = vehicleModel;
        this.dom.billMileage.value = lastMileage;
        
        if (lastMileage > 0) {
            this.dom.billNextMileage.value = parseInt(lastMileage) + 3000;
        }
        
        this.dom.phoneAutocomplete.style.display = "none";
    },

    addSelectedProductToCart: function() {
        const prodId = this.dom.billSelectProduct.value;
        const qty = parseInt(this.dom.billProductQty.value) || 0;

        if (!prodId) {
            alert("Please choose a product from the list.");
            return;
        }

        if (qty <= 0) {
            alert("Quantity must be at least 1.");
            return;
        }

        const prod = state.inventory.find(item => item.id === prodId);
        if (!prod) return;

        // Check stock availability
        const currentInCart = state.cart.items.find(it => it.productId === prodId);
        const existingQty = currentInCart ? currentInCart.qty : 0;
        const totalRequested = existingQty + qty;

        if (totalRequested > prod.stock) {
            alert(`Requested stock unavailable. ${prod.name} has only ${prod.stock} units left in stock.`);
            return;
        }

        if (currentInCart) {
            currentInCart.qty = totalRequested;
        } else {
            state.cart.items.push({
                productId: prod.id,
                name: prod.name,
                code: prod.code,
                costPrice: prod.costPrice,
                sellingPrice: prod.sellingPrice,
                qty: qty
            });
        }

        this.dom.billSelectProduct.value = "";
        this.dom.billProductQty.value = "1";
        
        this.renderCartTable();
    },

    removeCartItem: function(index) {
        state.cart.items.splice(index, 1);
        this.renderCartTable();
    },

    renderCartTable: function() {
        const tbody = this.dom.cartTbody;
        let html = "";
        
        if (state.cart.items.length === 0) {
            html = `<tr><td colspan="5" class="empty-cart-text">No items added to invoice.</td></tr>`;
        } else {
            state.cart.items.forEach((item, index) => {
                const total = item.sellingPrice * item.qty;
                html += `
                    <tr>
                        <td data-label="Item / Service">
                            <div class="font-bold">${item.name}</div>
                            <div class="description-text font-digit">${item.code || ''}</div>
                        </td>
                        <td data-label="Qty" class="text-center font-bold font-digit">${item.qty}</td>
                        <td data-label="Price" class="text-right font-digit">Rs. ${item.sellingPrice.toLocaleString()}</td>
                        <td data-label="Total" class="text-right font-bold font-digit">Rs. ${total.toLocaleString()}</td>
                        <td data-label="Action" class="text-center">
                            <button class="cart-remove-btn" onclick="app.removeCartItem(${index})">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                        </td>
                    </tr>`;
            });
        }
        
        tbody.innerHTML = html;
        this.updateCartTotals();
    },

    updateCartTotals: function() {
        const prodSubtotal = state.cart.items.reduce((sum, item) => sum + (item.sellingPrice * item.qty), 0);
        const prodCosttotal = state.cart.items.reduce((sum, item) => sum + (item.costPrice * item.qty), 0);
        
        const laborCharges = parseFloat(this.dom.billLaborCharges.value) || 0;
        const discount = parseFloat(this.dom.billDiscount.value) || 0;
        
        const grandTotal = prodSubtotal + laborCharges - discount;
        
        // Estimated Profit: sellingPrice Markup + Labor Charges - Discount
        const markupProfit = prodSubtotal - prodCosttotal;
        const estimatedProfit = markupProfit + laborCharges - discount;

        // Save temporary states
        state.cart.laborCharges = laborCharges;
        state.cart.discount = discount;

        // Render UI displays
        this.dom.calcProductsTotal.textContent = `Rs. ${prodSubtotal.toLocaleString()}`;
        this.dom.calcLaborCharges.textContent = `Rs. ${laborCharges.toLocaleString()}`;
        this.dom.calcGrandTotal.textContent = `Rs. ${Math.max(0, grandTotal).toLocaleString()}`;
        this.dom.calcProfitEstimate.textContent = `Rs. ${estimatedProfit.toLocaleString()}`;
    },

    resetBillingForm: function() {
        state.cart = {
            items: [],
            laborDesc: "",
            laborCharges: 0,
            discount: 0
        };

        this.dom.billPhone.value = "";
        this.dom.billName.value = "";
        this.dom.billVehicle.value = "";
        this.dom.billModel.value = "";
        this.dom.billMileage.value = "";
        this.dom.billNextMileage.value = "";
        this.dom.billSelectProduct.value = "";
        this.dom.billProductQty.value = "1";
        this.dom.billLaborDesc.value = "";
        this.dom.billLaborCharges.value = "0";
        this.dom.billDiscount.value = "0";

        this.generateNewInvoiceNum();
        this.renderCartTable();
    },

    completeSaleAndCheckout: function() {
        const phone = this.dom.billPhone.value.trim();
        const name = this.dom.billName.value.trim();
        const vehicleNo = this.dom.billVehicle.value.trim().toUpperCase();
        const vehicleModel = this.dom.billModel.value.trim();
        const mileage = parseInt(this.dom.billMileage.value) || 0;
        const nextMileage = parseInt(this.dom.billNextMileage.value) || (mileage > 0 ? mileage + 3000 : 0);

        if (!vehicleNo) {
            alert("Vehicle Registration Plate Number is required.");
            return;
        }

        if (mileage <= 0) {
            alert("Please enter current vehicle mileage.");
            return;
        }

        if (state.cart.items.length === 0 && state.cart.laborCharges === 0) {
            alert("Invoice is empty! Please add a service product or labor charges.");
            return;
        }

        // Perform stock updates & double-check availability
        let stockOk = true;
        state.cart.items.forEach(cartItem => {
            const origProd = state.inventory.find(i => i.id === cartItem.productId);
            if (!origProd || origProd.stock < cartItem.qty) {
                alert(`Error: Product "${cartItem.name}" is out of stock!`);
                stockOk = false;
            }
        });

        if (!stockOk) return;

        // Deduct from stock
        state.cart.items.forEach(cartItem => {
            const origProd = state.inventory.find(i => i.id === cartItem.productId);
            if (origProd) {
                origProd.stock -= cartItem.qty;
            }
        });

        // Profit details
        const prodSubtotal = state.cart.items.reduce((sum, item) => sum + (item.sellingPrice * item.qty), 0);
        const prodCosttotal = state.cart.items.reduce((sum, item) => sum + (item.costPrice * item.qty), 0);
        const totalBill = prodSubtotal + state.cart.laborCharges - state.cart.discount;
        const netProfit = (prodSubtotal - prodCosttotal) + state.cart.laborCharges - state.cart.discount;

        const now = new Date();
        const dateStr = now.toLocaleDateString('en-CA');
        let hours = now.getHours();
        let minutes = now.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        const timeStr = `${hours}:${minutes} ${ampm}`;

        const invoiceNum = this.generateNewInvoiceNum();

        const newSale = {
            id: Date.now().toString(),
            invoiceNum,
            date: dateStr,
            time: timeStr,
            customerPhone: phone || "Walk-in Customer",
            customerName: name || "Walk-in",
            vehicleNo: vehicleNo || "N/A",
            vehicleModel: vehicleModel || "General Vehicle",
            currentMileage: mileage || 0,
            nextMileage: nextMileage || null, // Fix: prevent undefined/NaN
            items: [...state.cart.items],
            laborDesc: state.cart.laborDesc || "General Workshop Tuning",
            laborCharges: state.cart.laborCharges || 0,
            discount: state.cart.discount || 0,
            totalPayable: totalBill || 0,
            profit: netProfit || 0
        };

        state.sales.push(newSale);
        this.saveData();

        // Print thermal receipt
        this.printThermalReceipt(newSale);

        // Reset forms and tables
        this.resetBillingForm();
        this.renderInventoryStats();
        this.updateGlobalBadges();
        
        alert(`Transaction checkout completed successfully! Receipt printed for invoice: ${invoiceNum}`);
    },

    printThermalReceipt: function(sale) {
        // Hydrate receipt details
        document.getElementById("pr-invoice-num").textContent = sale.invoiceNum;
        document.getElementById("pr-invoice-date").textContent = sale.date;
        document.getElementById("pr-invoice-time").textContent = sale.time;
        document.getElementById("pr-cust-name").textContent = sale.customerName;
        document.getElementById("pr-cust-phone").textContent = sale.customerPhone;
        document.getElementById("pr-vehicle-no").textContent = sale.vehicleNo;
        document.getElementById("pr-vehicle-model").textContent = sale.vehicleModel;
        document.getElementById("pr-mileage").textContent = `${sale.currentMileage.toLocaleString()} km`;
        
        const nextMilDisp = sale.nextMileage ? `${sale.nextMileage.toLocaleString()} km` : "N/A";
        document.getElementById("pr-next-mileage").textContent = nextMilDisp;
        document.getElementById("pr-next-mileage-reminder").textContent = nextMilDisp;

        // Compile items list HTML
        let itemsHTML = "";
        let prodSub = 0;
        
        sale.items.forEach(it => {
            const rowTotal = it.sellingPrice * it.qty;
            prodSub += rowTotal;
            itemsHTML += `
                <tr>
                    <td>${it.name}</td>
                    <td class="text-center">${it.qty}</td>
                    <td class="text-right">${it.sellingPrice}</td>
                    <td class="text-right">${rowTotal}</td>
                </tr>`;
        });

        // Add labor charges if present
        if (sale.laborCharges > 0) {
            itemsHTML += `
                <tr>
                    <td>${sale.laborDesc || 'Tuning Service Charges'}</td>
                    <td class="text-center">1</td>
                    <td class="text-right">${sale.laborCharges}</td>
                    <td class="text-right">${sale.laborCharges}</td>
                </tr>`;
        }

        document.getElementById("pr-tbody").innerHTML = itemsHTML;
        document.getElementById("pr-products-total").textContent = `Rs. ${prodSub.toLocaleString()}`;
        document.getElementById("pr-labor-total").textContent = `Rs. ${sale.laborCharges.toLocaleString()}`;
        
        if (sale.discount > 0) {
            document.getElementById("pr-discount-row").style.display = "flex";
            document.getElementById("pr-discount").textContent = `- Rs. ${sale.discount.toLocaleString()}`;
        } else {
            document.getElementById("pr-discount-row").style.display = "none";
        }
        
        document.getElementById("pr-grand-total").textContent = `Rs. ${sale.totalPayable.toLocaleString()}`;

        // Call print engine
        window.print();
    },

    printInvoiceById: function(saleId) {
        const sale = state.sales.find(s => s.id === saleId);
        if (sale) {
            this.printThermalReceipt(sale);
        }
    },

    sendInvoiceWhatsApp: function(saleId) {
        const sale = state.sales.find(s => s.id === saleId);
        if (!sale) return;

        let rawPhone = sale.customerPhone.replace(/[^0-9]/g, "");
        if (!rawPhone || rawPhone === "") {
            alert("Customer phone number is missing. Cannot send WhatsApp message.");
            return;
        }
        if (rawPhone.startsWith("0")) {
            rawPhone = "92" + rawPhone.slice(1);
        } else if (!rawPhone.startsWith("92")) {
            rawPhone = "92" + rawPhone;
        }

        let itemsText = "";
        sale.items.forEach(it => {
            itemsText += `${it.name} (x${it.qty}) = Rs. ${it.sellingPrice * it.qty}\n`;
        });
        if (sale.laborCharges > 0) {
            itemsText += `${sale.laborDesc || 'Tuning Service'} = Rs. ${sale.laborCharges}\n`;
        }
        if (sale.discount > 0) {
            itemsText += `Discount = - Rs. ${sale.discount}\n`;
        }

        let nextMilText = sale.nextMileage ? `Next Oil Change: ${sale.nextMileage.toLocaleString()} km\n` : "";

        const message = `*Gulf Engine Oil Center*
Prop: M.Asif and M.Salman
0348-9353023
0343-5847538
Address: Main Multan Road, Malik plaza, Near wensam collage

*Invoice Receipt*
Date: ${sale.date} ${sale.time}
Invoice: ${sale.invoiceNum}
Vehicle: ${sale.vehicleNo}
${nextMilText}
------------------------
${itemsText}------------------------
*Total Bill: Rs. ${sale.totalPayable.toLocaleString()}*

Thank you for visiting!`;

        const waLink = `https://api.whatsapp.com/send?phone=${rawPhone}&text=${encodeURIComponent(message)}`;
        window.open(waLink, "_blank");
    },

    renderInvoiceHistory: function() {
        const query = this.dom.salesSearchInput.value.toLowerCase().trim();
        let html = "";
        
        // Reverse sales list to show newest first
        const sortedSales = [...state.sales].reverse();
        
        const filtered = sortedSales.filter(sale => {
            return sale.invoiceNum.toLowerCase().includes(query) || 
                   sale.vehicleNo.toLowerCase().includes(query) ||
                   (sale.customerName && sale.customerName.toLowerCase().includes(query)) ||
                   (sale.customerPhone && sale.customerPhone.includes(query)) ||
                   sale.items.some(it => it.name.toLowerCase().includes(query));
        });

        if (filtered.length === 0) {
            html = `<tr><td colspan="8" class="text-center">No invoice transactions found.</td></tr>`;
        } else {
            filtered.forEach(sale => {
                const partsStr = sale.items.map(it => `${it.name} (x${it.qty})`).join(', ') || 'Tuning Service';
                html += `
                    <tr>
                        <td data-label="Invoice #"><strong class="text-orange font-digit">${sale.invoiceNum}</strong></td>
                        <td data-label="Date & Time">
                            <div style="font-size:0.8rem;">${sale.date}</div>
                            <div class="description-text font-digit">${sale.time}</div>
                        </td>
                        <td data-label="Customer Info">
                            <div class="font-bold">${sale.customerName}</div>
                            <div class="description-text">${sale.customerPhone}</div>
                        </td>
                        <td data-label="Vehicle Details">
                            <div class="font-bold font-digit text-orange">${sale.vehicleNo}</div>
                            <div class="description-text">${sale.vehicleModel}</div>
                        </td>
                        <td data-label="Current Mileage" class="text-center font-digit">${sale.currentMileage.toLocaleString()} km</td>
                        <td data-label="Bill Amount" class="text-right font-bold font-digit">Rs. ${sale.totalPayable.toLocaleString()}</td>
                        <td data-label="Net Profit" class="text-right font-bold text-green font-digit">Rs. ${sale.profit.toLocaleString()}</td>
                        <td data-label="Actions">
                            <div class="action-btns-cell">
                                <button class="btn btn-sm btn-secondary" onclick="app.printInvoiceById('${sale.id}')">Print</button>
                                <button class="btn btn-sm btn-success" onclick="app.sendInvoiceWhatsApp('${sale.id}')">WhatsApp</button>
                                <button class="btn btn-sm btn-danger" onclick="app.deleteInvoice('${sale.id}')">Delete</button>
                            </div>
                        </td>
                    </tr>`;
            });
        }
        this.dom.allSalesTbody.innerHTML = html;
    },

    deleteInvoice: function(saleId) {
        const sale = state.sales.find(s => s.id === saleId);
        if (!sale) return;

        if (confirm(`Warning: Deleting invoice ${sale.invoiceNum} will delete this transaction log permanently. Products stock will NOT be restored automatically. Continue?`)) {
            state.sales = state.sales.filter(s => s.id !== saleId);
            this.saveData();
            this.renderInvoiceHistory();
            this.updateGlobalBadges();
        }
    },

    // ----------------------------------------------------
    // EXPENSES MANAGEMENT
    // ----------------------------------------------------
    renderExpenses: function() {
        let html = "";
        
        // Sort newest first
        const sorted = [...state.expenses].reverse();
        const totalExp = state.expenses.reduce((sum, e) => sum + e.amount, 0);

        this.dom.expenseLogTotal.textContent = `Rs. ${totalExp.toLocaleString()}`;

        if (sorted.length === 0) {
            html = `<tr><td colspan="5" class="text-center">No expense logs recorded.</td></tr>`;
        } else {
            sorted.forEach(exp => {
                html += `
                    <tr>
                        <td><span class="font-digit">${exp.date}</span></td>
                        <td><strong>${exp.desc}</strong></td>
                        <td><span class="badge badge-warning">${exp.category}</span></td>
                        <td class="text-right font-bold text-red font-digit">Rs. ${exp.amount.toLocaleString()}</td>
                        <td class="text-center">
                            <button class="cart-remove-btn" onclick="app.deleteExpense('${exp.id}')">
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                        </td>
                    </tr>`;
            });
        }
        this.dom.expensesTbody.innerHTML = html;
    },

    handleExpenseSubmit: function() {
        const desc = document.getElementById("expense-desc").value.trim();
        const amount = parseFloat(document.getElementById("expense-amount").value) || 0;
        const category = document.getElementById("expense-category").value;
        const date = document.getElementById("expense-date").value;

        if (!desc || amount <= 0 || !date) {
            alert("Please fill all required inputs.");
            return;
        }

        const newExpense = {
            id: Date.now().toString(),
            desc,
            amount,
            category,
            date
        };

        state.expenses.push(newExpense);
        this.saveData();
        this.renderExpenses();
        
        // Reset form keeping date
        document.getElementById("expense-desc").value = "";
        document.getElementById("expense-amount").value = "";
        
        alert("Expense record saved successfully!");
    },

    deleteExpense: function(id) {
        if (confirm("Are you sure you want to delete this expense entry?")) {
            state.expenses = state.expenses.filter(e => e.id !== id);
            this.saveData();
            this.renderExpenses();
        }
    },

    // ----------------------------------------------------
    // CUSTOMERS & VISITS HISTORY LOG
    // ----------------------------------------------------
    getCustomersSummary: function() {
        const customersMap = {};

        state.sales.forEach(sale => {
            // Group primarily by vehicle plate to avoid mixing phone numbers for multiple cars
            const key = sale.vehicleNo;
            
            if (!customersMap[key]) {
                customersMap[key] = {
                    vehicleNo: sale.vehicleNo,
                    vehicleModel: sale.vehicleModel,
                    name: sale.customerName || "Walk-in",
                    phone: sale.customerPhone || "N/A",
                    totalVisits: 0,
                    totalSpent: 0,
                    lastVisitDate: sale.date,
                    lastMileage: sale.currentMileage,
                    salesHistory: []
                };
            }

            const c = customersMap[key];
            c.totalVisits += 1;
            c.totalSpent += sale.totalPayable;
            
            // Compare dates to get the latest
            if (new Date(sale.date) >= new Date(c.lastVisitDate)) {
                c.lastVisitDate = sale.date;
                c.name = sale.customerName || c.name;
                c.phone = sale.customerPhone || c.phone;
                c.lastMileage = sale.currentMileage;
            }
            
            c.salesHistory.push(sale);
        });

        return Object.values(customersMap);
    },

    renderCustomersList: function() {
        const query = this.dom.customerSearch.value.toLowerCase().trim();
        const customers = this.getCustomersSummary();
        let html = "";

        const filtered = customers.filter(c => {
            const isHidden = state.hiddenCustomers && state.hiddenCustomers.includes(c.vehicleNo);
            if (isHidden) return false;
            
            return c.name.toLowerCase().includes(query) || 
                   c.phone.includes(query) ||
                   c.vehicleNo.toLowerCase().includes(query) ||
                   c.vehicleModel.toLowerCase().includes(query);
        });

        if (filtered.length === 0) {
            html = `<tr><td colspan="8" class="text-center">No customer records found.</td></tr>`;
        } else {
            filtered.forEach(c => {
                html += `
                    <tr>
                        <td data-label="Customer Name"><span class="font-bold">${c.name}</span></td>
                        <td data-label="Phone Number">${c.phone}</td>
                        <td data-label="Vehicle Plate #"><span class="font-bold font-digit text-orange">${c.vehicleNo}</span></td>
                        <td data-label="Vehicle Model">${c.vehicleModel}</td>
                        <td data-label="Total Visits" class="text-center font-bold font-digit">${c.totalVisits}</td>
                        <td data-label="Total Spent" class="text-right font-bold font-digit text-green">Rs. ${c.totalSpent.toLocaleString()}</td>
                        <td data-label="Last Visit Date"><span class="font-digit">${c.lastVisitDate}</span></td>
                        <td data-label="Actions" class="text-center">
                            <button class="btn btn-sm btn-secondary" onclick="app.openCustomerHistoryModal('${c.vehicleNo}')">View Log</button>
                            <button class="btn btn-sm btn-danger" onclick="app.hideCustomer('${c.vehicleNo}', '${c.name}')">Delete</button>
                        </td>
                    </tr>`;
            });
        }
        this.dom.customersTbody.innerHTML = html;
    },

    hideCustomer: function(vehicleNo, name) {
        if (confirm(`Are you sure you want to delete client ${name} (${vehicleNo}) from your directory? Their past sales will remain for accounting, but they will be hidden from this list.`)) {
            if (!state.hiddenCustomers) state.hiddenCustomers = [];
            if (!state.hiddenCustomers.includes(vehicleNo)) {
                state.hiddenCustomers.push(vehicleNo);
                this.saveData();
                this.renderCustomersList();
                this.updateGlobalBadges();
            }
        }
    },

    openCustomerHistoryModal: function(vehicleNo) {
        const customers = this.getCustomersSummary();
        const cust = customers.find(c => c.vehicleNo === vehicleNo);
        if (!cust) return;

        // Set profile details
        this.dom.custModalName.textContent = cust.name;
        this.dom.custModalPhone.textContent = cust.phone;
        this.dom.custModalVehicle.textContent = cust.vehicleNo;
        this.dom.custModalModel.textContent = cust.vehicleModel;

        // Fill history table
        let html = "";
        // Sort history newest first
        const historySorted = [...cust.salesHistory].reverse();

        historySorted.forEach(sale => {
            const items = sale.items.map(it => `${it.name} (x${it.qty})`).join(', ') || 'Tuning/Labor service';
            html += `
                <tr>
                    <td><strong class="text-orange font-digit">${sale.invoiceNum}</strong></td>
                    <td><span class="font-digit">${sale.date} ${sale.time}</span></td>
                    <td class="font-digit">${sale.currentMileage.toLocaleString()} km</td>
                    <td>${items}</td>
                    <td class="text-right font-digit">Rs. ${sale.laborCharges.toLocaleString()}</td>
                    <td class="text-right font-bold font-digit text-green">Rs. ${sale.totalPayable.toLocaleString()}</td>
                </tr>`;
        });

        this.dom.custModalHistoryTbody.innerHTML = html;
        this.dom.customerHistoryModal.classList.add("active");
    },

    // ----------------------------------------------------
    // AUTOMATED MILEAGE & TIMEOUT REMINDERS
    // ----------------------------------------------------
    getOverdueServiceCustomers: function() {
        const daysLimit = parseInt(this.dom.reminderDaysThreshold ? this.dom.reminderDaysThreshold.value : 90);
        const kmLimit = parseInt(this.dom.reminderKmThreshold ? this.dom.reminderKmThreshold.value : 3000);
        
        const customers = this.getCustomersSummary();
        const overdue = [];
        const now = new Date();

        customers.forEach(c => {
            // Check if hidden
            if (state.hiddenCustomers && state.hiddenCustomers.includes(c.vehicleNo)) return;

            // Date difference calculation
            const lastDate = new Date(c.lastVisitDate);
            const diffTime = Math.abs(now - lastDate);
            const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            // Estimate current mileage or compare nextMileage alert
            let nextDueMileage = c.lastMileage + kmLimit;
            let explicitDue = false;

            c.salesHistory.forEach(sale => {
                if (sale.nextMileage && sale.nextMileage > c.lastMileage) {
                    nextDueMileage = sale.nextMileage;
                    explicitDue = true;
                }
            });

            // We trigger reminder if days passed exceeds limits
            const daysOverdue = daysPassed >= daysLimit;
            
            if (daysOverdue) {
                overdue.push({
                    ...c,
                    daysPassed,
                    nextDueMileage,
                    reason: `${daysPassed} Days since last oil change`
                });
            }
        });

        return overdue;
    },

    renderServiceReminders: function() {
        const overdueList = this.getOverdueServiceCustomers();
        let html = "";

        if (overdueList.length === 0) {
            html = `<tr><td colspan="7" class="text-center">All customer tuning cycles are up to date!</td></tr>`;
        } else {
            overdueList.forEach(c => {
                const waLink = this.compileWhatsAppReminder(c);
                html += `
                    <tr>
                        <td><span class="font-bold">${c.name}</span></td>
                        <td>${c.phone}</td>
                        <td>
                            <div class="font-bold font-digit text-orange">${c.vehicleNo}</div>
                            <div class="description-text">${c.vehicleModel}</div>
                        </td>
                        <td class="font-digit">${c.lastMileage.toLocaleString()} km</td>
                        <td><span class="font-digit">${c.lastVisitDate}</span></td>
                        <td>
                            <span class="badge badge-alert">${c.reason}</span>
                        </td>
                        <td class="text-center">
                            <a href="${waLink}" target="_blank" class="whatsapp-btn">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.37 5.054L2 22l5.106-1.341a9.9 9.9 0 0 0 4.905 1.343h.005c5.507 0 9.99-4.478 9.99-9.985 0-2.667-1.037-5.176-2.922-7.062A9.9 9.9 0 0 0 12.012 2zm5.726 14.127c-.247.697-1.2 1.286-1.638 1.347-.417.059-.838.106-2.644-.634-2.285-.936-3.753-3.265-3.869-3.418-.112-.153-.943-1.254-.943-2.391 0-1.137.593-1.696.839-1.954.246-.258.536-.322.715-.322.179 0 .358.001.514.009.167.008.389-.063.609.467.22.53.753 1.836.818 1.97.065.13.109.282.022.458-.088.176-.132.282-.264.436-.132.153-.277.34-.395.457-.132.13-.27.271-.117.53.153.259.68 1.12 1.46 1.815.999.892 1.84 1.168 2.1 1.298.26.13.409.109.56-.065.152-.176.652-.759.827-1.018.176-.259.351-.219.593-.13.242.089 1.533.722 1.797.854.264.13.439.197.505.309.066.111.066.646-.18 1.343z"/></svg>
                                <span>Send WhatsApp</span>
                            </a>
                        </td>
                    </tr>`;
            });
        }
        this.dom.remindersTbody.innerHTML = html;
    },

    compileWhatsAppReminder: function(customer) {
        // Clean customer phone number. Pakistani format: 03001234567 -> 923001234567
        let rawPhone = customer.phone.replace(/[^0-9]/g, "");
        if (rawPhone.startsWith("0")) {
            rawPhone = "92" + rawPhone.slice(1);
        } else if (!rawPhone.startsWith("92")) {
            rawPhone = "92" + rawPhone; // fallback prepend Pakistan country code
        }

        // Construct customized message in Roman Urdu
        const message = `Assalamu Alaikum *${customer.name}* sahib! 🛠️

Gulf Engine Oil Center se reminder: Aap ki gaari *${customer.vehicleNo}* (${customer.vehicleModel}) ki service / oil change ka waqt ho chuka hai.

Aap ki gaari ki last tuning mileage *${customer.lastMileage.toLocaleString()} km* thi aur service date *${customer.lastVisitDate}* thi. 

Engine ki behtari aur lambi zindagi ke liye time par oil change zaroor karwayein. Please hamare shop par tashreef layein.

*Gulf Engine Oil Center*
📍 Near GT Road
📞 0300-1234567`;

        return `https://api.whatsapp.com/send?phone=${rawPhone}&text=${encodeURIComponent(message)}`;
    },

    // ----------------------------------------------------
    // SYSTEM SETTINGS, DEMO DATA & DATA BACKUPS
    // ----------------------------------------------------
    exportBackupFile: function() {
        const backupData = {
            inventory: state.inventory,
            sales: state.sales,
            expenses: state.expenses
        };

        const jsonStr = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const dateStr = new Date().toLocaleDateString('en-CA');
        
        const a = document.createElement("a");
        a.href = url;
        a.download = `gulf_oil_backup_${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
    },

    importBackupFile: function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target.result);
                
                // Format check validation
                if (parsed.inventory && parsed.sales && parsed.expenses) {
                    state.inventory = parsed.inventory;
                    state.sales = parsed.sales;
                    state.expenses = parsed.expenses;
                    
                    this.saveData();
                    this.switchTab("dashboard");
                    
                    alert("System restored successfully from backup file!");
                } else {
                    alert("Invalid backup file format! Missing required registries.");
                }
            } catch (err) {
                alert("Error reading backup file: " + err.message);
            }
        };
        reader.readAsText(file);
    },

    loadSampleData: function() {
        if (!confirm("Are you sure you want to load demo items? This will add sample products, past sales of 7 days, and sample expenses to illustrate the system.")) {
            return;
        }

        // 1. Load sample Inventory
        const sampleInventory = [
            { id: "p1", name: "Gulf Formula G 5W-40 (4 Litre)", code: "GULF-5W40-4L", category: "Engine Oil", costPrice: 4200, sellingPrice: 5100, stock: 12, minStock: 3 },
            { id: "p2", name: "Gulf Pride 20W-50 (3 Litre)", code: "GULF-20W50-3L", category: "Engine Oil", costPrice: 2800, sellingPrice: 3400, stock: 8, minStock: 2 },
            { id: "p3", name: "Guard Oil Filter (Suzuki Alto/Cultus)", code: "G-OFLT-ALT", category: "Oil Filter", costPrice: 350, sellingPrice: 500, stock: 2, minStock: 5 },
            { id: "p4", name: "Guard Air Filter (Toyota Corolla 1.6)", code: "G-AFLT-COR", category: "Air Filter", costPrice: 650, sellingPrice: 850, stock: 6, minStock: 3 },
            { id: "p5", name: "NGK Spark Plugs Set (3pcs)", code: "NGK-SPK-3", category: "Spark Plugs", costPrice: 1100, sellingPrice: 1500, stock: 10, minStock: 2 },
            { id: "p6", name: "Gulf Coolant Pre-mixed (1 Litre)", code: "GULF-CLNT-1L", category: "Coolant", costPrice: 700, sellingPrice: 950, stock: 0, minStock: 3 }
        ];

        // 2. Generate past 7 days Sales
        const sampleSales = [];
        const customerNames = ["Sajid Khan", "Kamran Malik", "Muhammad Ali", "Zubair Shah", "Usman Ghani", "Tariq Mahmood"];
        const phoneNumbers = ["03001234567", "03129876543", "03215554433", "03338765432", "03450001122", "03017778899"];
        const plates = ["LEC-16-4355", "MNA-18-9002", "IDG-20-1122", "LED-14-3874", "RPT-21-4455", "KHI-19-6677"];
        const models = ["Toyota Corolla 1.6", "Honda Civic Oriel", "Suzuki Alto VXR", "Honda City 1.3", "Suzuki Cultus VXL", "Toyota Yaris Ativ"];
        const oils = [
            { productId: "p1", name: "Gulf Formula G 5W-40 (4 Litre)", code: "GULF-5W40-4L", costPrice: 4200, sellingPrice: 5100 },
            { productId: "p2", name: "Gulf Pride 20W-50 (3 Litre)", code: "GULF-20W50-3L", costPrice: 2800, sellingPrice: 3400 }
        ];

        // Fill sales spanning 7 days
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('en-CA');

            // 1 or 2 sales per day
            const salesCount = Math.floor(Math.random() * 2) + 1;
            for (let s = 0; s < salesCount; s++) {
                const customerIndex = Math.floor(Math.random() * customerNames.length);
                const oilChoice = oils[Math.floor(Math.random() * oils.length)];
                
                const labor = 500 + Math.floor(Math.random() * 6) * 100; // 500 to 1000
                const discount = Math.random() > 0.5 ? 100 : 0;
                
                const oilQty = 1;
                
                const subtotal = oilChoice.sellingPrice * oilQty;
                const totalCost = oilChoice.costPrice * oilQty;
                
                const totalBill = subtotal + labor - discount;
                const profit = (subtotal - totalCost) + labor - discount;
                
                const invoiceIndex = 1000 + sampleSales.length + 1;
                
                sampleSales.push({
                    id: `demo-s-${dateStr}-${s}`,
                    invoiceNum: `GULF-${invoiceIndex}`,
                    date: dateStr,
                    time: `${10 + s * 2}:${Math.floor(Math.random() * 50) + 10} AM`,
                    customerPhone: phoneNumbers[customerIndex],
                    customerName: customerNames[customerIndex],
                    vehicleNo: plates[customerIndex],
                    vehicleModel: models[customerIndex],
                    currentMileage: 45000 + Math.floor(Math.random() * 50000),
                    nextMileage: 48000 + Math.floor(Math.random() * 50000),
                    items: [{
                        productId: oilChoice.productId,
                        name: oilChoice.name,
                        code: oilChoice.code,
                        costPrice: oilChoice.costPrice,
                        sellingPrice: oilChoice.sellingPrice,
                        qty: oilQty
                    }],
                    laborDesc: "Tuning, Engine oil & filter replacement",
                    laborCharges: labor,
                    discount: discount,
                    totalPayable: totalBill,
                    profit: profit
                });
            }
        }

        // Add 1 very old sale to test Reminders (dated 4 months ago)
        const pastDate = new Date();
        pastDate.setMonth(pastDate.getMonth() - 4);
        const pastDateStr = pastDate.toLocaleDateString('en-CA');
        
        sampleSales.push({
            id: "demo-old-sale",
            invoiceNum: "GULF-999",
            date: pastDateStr,
            time: "11:30 AM",
            customerPhone: "03009876543",
            customerName: "Zaheer Ahmed",
            vehicleNo: "LHR-12-8877",
            vehicleModel: "Suzuki WagonR",
            currentMileage: 74200,
            nextMileage: 77200,
            items: [{
                productId: "p2",
                name: "Gulf Pride 20W-50 (3 Litre)",
                code: "GULF-20W50-3L",
                costPrice: 2800,
                sellingPrice: 3400,
                qty: 1
            }],
            laborDesc: "WagonR Engine Oil Tuning",
            laborCharges: 600,
            discount: 0,
            totalPayable: 4000,
            profit: 1200
        });

        // 3. Load sample Expenses
        const sampleExpenses = [
            { id: "e1", desc: "Helper wages", amount: 400, category: "Salaries", date: new Date().toLocaleDateString('en-CA') },
            { id: "e2", desc: "Tea & biscuits for staff", amount: 150, category: "Refreshment", date: new Date().toLocaleDateString('en-CA') }
        ];
        
        // Add random helper expenses in past days
        for (let i = 6; i > 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('en-CA');
            sampleExpenses.push({
                id: `demo-e-${dateStr}`,
                desc: "Tuning helper daily allowance",
                amount: 300,
                category: "Salaries",
                date: dateStr
            });
        }

        state.inventory = sampleInventory;
        state.sales = sampleSales;
        state.expenses = sampleExpenses;

        this.saveData();
        this.switchTab("dashboard");
        alert("Demo testing data loaded successfully!");
    },

    wipeAllSystemData: function() {
        if (confirm("CRITICAL WARNING: This will delete all products, invoices, customers records, and expenses registers. This action cannot be undone! Are you absolutely sure?")) {
            state.inventory = [];
            state.sales = [];
            state.expenses = [];
            
            this.saveData();
            this.resetBillingForm();
            this.switchTab("dashboard");
            
            alert("All system databases wiped successfully. Fresh slate loaded.");
        }
    }
};

// Initialize Application once DOM fully loads
document.addEventListener("DOMContentLoaded", () => {
    app.init();
});
