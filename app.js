/* ============================================================
   DEECUTS – Fresh Chicken  |  app.js
   Firebase Realtime Database Integration (v8 compat CDN)
   ============================================================ */


/* ══════════════════════════════════════════════════════════
   § FIREBASE — Initialisation & Database Connection
   ══════════════════════════════════════════════════════════ */

/**
 * 🔧 SETUP STEPS (replace the placeholder values below):
 *
 *  1. Go to https://console.firebase.google.com
 *  2. Create a project → Add Web App → copy the firebaseConfig object
 *  3. In Firebase Console → Realtime Database → Create Database
 *  4. Rules tab → paste these rules for testing, then tighten for production:
 *
 *     {
 *       "rules": {
 *         "orders": {
 *           ".read":  false,
 *           ".write": true
 *         }
 *       }
 *     }
 */

const firebaseConfig = {
  apiKey: "AIzaSyAQTwmcPDy73S_qqYEJe3eUoUyiefDRs0A",
  authDomain: "devaro-fresh-chicken.firebaseapp.com",
  databaseURL: "https://devaro-fresh-chicken-default-rtdb.firebaseio.com",
  projectId: "devaro-fresh-chicken",
  storageBucket: "devaro-fresh-chicken.firebasestorage.app",
  messagingSenderId: "1009194311324",
  appId: "1:1009194311324:web:de48f064b87ab583375759",
  measurementId: "G-5FVZQ712V2"
};
// Initialise Firebase app (guard against double-initialisation during hot reloads)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Get a reference to the Realtime Database service
const db = firebase.database();


/* ══════════════════════════════════════════════════════════
   § PRODUCTS — Catalogue Data
   ══════════════════════════════════════════════════════════ */

const products = [
  { id:1,  name:"Chicken Curry Cut",   cat:"Curry Cut",  image:"images/1new.png", price:249, mrp:299, wt:"1 kg",   desc:"Fresh and hygienically cut curry pieces. Perfect for daily cooking." },
  { id:2,  name:"Chicken Leg Piece",   cat:"Leg Piece", image:"images/leg1.png", price:235, mrp:279, wt:"1 kg",   desc:"Juicy and tender chicken leg pieces. Great for grilling and curries." },
  { id:3,  name:"Chicken Boneless",    cat:"Boneless",  image:"images/5new.png", price:299, mrp:349, wt:"500 g",  desc:"Premium boneless chicken breast. Perfect for stir fry and biryani." },
  { id:4,  name:"Chicken Wings",       cat:"Wings",     image:"images/14new.png", price:199, mrp:239, wt:"500 g",  desc:"Crispy and flavourful wings. Perfect for frying and grilling." },
  { id:5,  name:"Chicken Mince",       cat:"Boneless",  image:"images/6new.png", price:219, mrp:259, wt:"500 g",  desc:"Freshly minced chicken. Great for kebabs and momos." },
  { id:6,  name:"Chicken Liver",       cat:"Liver",     image:"images/7new.png", price:179, mrp:219, wt:"500 g",  desc:"Rich in iron and proteins. Perfectly cleaned and fresh." },
  { id:7,  name:"Chicken Thigh",       cat:"Boneless",  image:"images/15new.png", price:249, mrp:299, wt:"500 g",  desc:"Tender boneless thighs. Ideal for burgers and curries." },
  { id:8,  name:"Whole Chicken",       cat:"Whole",    image:"images/4new.png", price:349, mrp:399, wt:"1 kg",   desc:"Full farm-fresh whole chicken. Dressed and ready to cook." },
  { id:9,  name:"Chicken Gizzard",     cat:"Liver",    image:"images/9new.png", price:149, mrp:179, wt:"500 g",  desc:"Clean and fresh gizzards. Traditional favourite." },
  { id:10, name:"Chicken Heart",       cat:"Liver",     image:"images/8new.png", price:149, mrp:179, wt:"500 g",  desc:"Nutritious and fresh chicken heart. Rich in protein." },
  { id:11, name:"Chicken Feet",        cat:"Whole",     image:"images/10new.png", price:120, mrp:149, wt:"500 g",  desc:"Fresh chicken feet for soups and stocks." },
  { id:12, name:"Chicken Drumstick",   cat:"Leg Piece",image:"images/3new.png", price:269, mrp:319, wt:"1 kg",   desc:"Meaty drumsticks perfect for biryani and curries." },
];


/* ══════════════════════════════════════════════════════════
   § STATE — Runtime Variables
   ══════════════════════════════════════════════════════════ */

let cart        = {};   // { productId: quantity }
let currentProd = null; // product object shown in detail page
let detQtyVal   = 1;    // quantity selected on detail page
let currentPage = "home";
let selectedSlot = "10 AM - 12 PM"; // default delivery slot


/* ══════════════════════════════════════════════════════════
   § NAVIGATION — Page Routing
   ══════════════════════════════════════════════════════════ */

/**
 * Switch between SPA pages.
 * @param {string} p - page id suffix (home | shop | cart | checkout | detail | account | success)
 */
function showPage(p) {
  // Hide all pages
  document.querySelectorAll(".page").forEach(el => el.classList.remove("active"));

  // Show the requested page
  const target = document.getElementById("page-" + p);
  if (target) target.classList.add("active");
  currentPage = p;

  // ── Desktop nav active state ──
  ["home", "shop"].forEach(n => {
    const el = document.getElementById("nl-" + n);
    if (el) el.classList.remove("active");
  });
  if (p === "home" && document.getElementById("nl-home")) document.getElementById("nl-home").classList.add("active");
  if (p === "shop" && document.getElementById("nl-shop")) document.getElementById("nl-shop").classList.add("active");

  // ── Mobile bottom nav active state ──
  ["home", "shop", "cart", "acc"].forEach(n => {
    const el = document.getElementById("mn-" + n);
    if (el) el.classList.remove("active");
  });
  const mnMap = { home: "mn-home", shop: "mn-shop", cart: "mn-cart", account: "mn-acc" };
  if (mnMap[p] && document.getElementById(mnMap[p])) document.getElementById(mnMap[p]).classList.add("active");

  // ── Page-specific render calls ──
  if (p === "shop")     renderShop("All");
  if (p === "home")     renderFeatured();
  if (p === "cart")     renderCart();
  if (p === "checkout") renderCheckout();
  if (p === "account")  renderAccountOrders();

  // Close filter drawer when leaving shop
  if (p !== "shop") {
    const sidebar = document.getElementById("shop-sidebar");
    if (sidebar) sidebar.classList.remove("open");
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}


/* ══════════════════════════════════════════════════════════
   § FILTER DRAWER — Mobile Filter Panel
   ══════════════════════════════════════════════════════════ */

function toggleFilterDrawer() {
  const s = document.getElementById("shop-sidebar");
  if (s) s.classList.toggle("open");
}


/* ══════════════════════════════════════════════════════════
   § PRODUCTS — Rendering Helpers
   ══════════════════════════════════════════════════════════ */

/** Build a single product card HTML string */
function productCardHTML(p) {
  const imgSrc = p.image || "";
  const discount = Math.round(((p.mrp - p.price) / p.mrp) * 100);
  return `
    <div class="product-card" onclick="showDetail(${p.id})">
      <div class="product-img">
        ${imgSrc
          ? `<img src="${imgSrc}" alt="${p.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
          : ``}
        <div class="product-img-fallback" style="${imgSrc ? 'display:none' : 'display:flex'}">🍗</div>
        <div class="product-badge">FRESH</div>
        ${discount > 0 ? `<div class="product-discount-badge">-${discount}%</div>` : ""}
        <div class="product-img-overlay"></div>
      </div>
      <div class="product-body">
        <div class="product-cat-tag">${p.cat}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-weight">${p.wt}</div>
        <div class="product-price-row">
          <span class="product-price">₹${p.price}</span>
          <span class="product-mrp">₹${p.mrp}</span>
        </div>
        <button class="add-to-cart-btn" onclick="event.stopPropagation();quickAdd(${p.id})">
          <span>Add to Cart</span>
          <span class="btn-icon">+</span>
        </button>
      </div>
    </div>`;
}

/** Render the 6 featured products on the home page */
function renderFeatured() {
  const el = document.getElementById("featured-grid");
  if (el) el.innerHTML = products.slice(0, 6).map(productCardHTML).join("");
}

/** Render the shop grid filtered by category */
function renderShop(cat) {
  const fp = cat === "All" ? products : products.filter(p => p.cat === cat);
  const count = document.getElementById("showing-count");
  const grid  = document.getElementById("shop-grid");
  if (count) count.textContent = `Showing 1–${fp.length} of ${fp.length}`;
  if (grid)  grid.innerHTML = fp.map(productCardHTML).join("");
}

/** Filter pills handler */
function filterProducts(cat, el) {
  document.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
  if (el) el.classList.add("active");
  renderShop(cat);
  if (window.innerWidth <= 768) {
    const sidebar = document.getElementById("shop-sidebar");
    if (sidebar) sidebar.classList.remove("open");
  }
}

/** Navigate from homepage category cards → shop page with filter applied */
function goCat(cat) {
  showPage("shop");
  setTimeout(() => {
    filterProducts(cat, null);
    document.querySelectorAll(".filter-pill").forEach(p => {
      if (p.textContent.trim() === cat) p.classList.add("active");
    });
  }, 50);
}


/* ══════════════════════════════════════════════════════════
   § PRODUCT DETAIL PAGE
   ══════════════════════════════════════════════════════════ */

/** Open the product detail page for a given product id */
function showDetail(id) {
  currentProd = products.find(p => p.id === id);
  if (!currentProd) return;

  detQtyVal = 1;
  document.getElementById("det-name").textContent   = currentProd.name;
  document.getElementById("det-price").textContent  = "₹" + currentProd.price;
  document.getElementById("det-mrp").textContent    = "₹" + currentProd.mrp;
  document.getElementById("det-desc").textContent   = currentProd.desc;
  document.getElementById("det-main").innerHTML = `
  <img src="${currentProd.image || ''}"
    alt="${currentProd.name}"
    style="width:100%;height:100%;object-fit:cover;border-radius:24px;transition:transform .4s ease"
    onerror="this.style.display='none'"
    onmouseover="this.style.transform='scale(1.04)'"
    onmouseout="this.style.transform='scale(1)'"
  >
`;
  document.getElementById("det-qty").textContent    = 1;
  document.getElementById("det-crumb").innerHTML    = `Home · Shop · <span>${currentProd.name}</span>`;

  showPage("detail");
}

/** Switch the main product image from thumbnail click */
function setImg(el, img) {

  document.querySelectorAll(".thumb").forEach(t=>{
    t.classList.remove("active");
  });

  el.classList.add("active");

  document.getElementById("det-main").innerHTML = `
    <img src="${img}"
    style="width:100%;height:100%;object-fit:cover;border-radius:24px">
  `;
}

/** Highlight the selected weight option */
function selWt(el) {
  document.querySelectorAll(".weight-opt").forEach(o => o.classList.remove("active"));
  el.classList.add("active");
}

/** Increment / decrement detail page quantity */
function detQty(d) {
  detQtyVal = Math.max(1, detQtyVal + d);
  document.getElementById("det-qty").textContent = detQtyVal;
}

/** Add the current detail-page product to the cart */
function addCurrent() {
  if (!currentProd) return;
  cart[currentProd.id] = (cart[currentProd.id] || 0) + detQtyVal;
  updateBadges();
  toast(`${currentProd.name} added to cart 🎉`);
}

/** One-click add from product card */
function quickAdd(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  cart[id] = (cart[id] || 0) + 1;
  updateBadges();
  toast(`${p.name} added! 🛒`);
}


/* ══════════════════════════════════════════════════════════
   § CART BADGE — Keep header counts updated
   ══════════════════════════════════════════════════════════ */

function updateBadges() {
  const total = Object.values(cart).reduce((a, b) => a + b, 0);
  const badge    = document.getElementById("cart-badge");
  const mobBadge = document.getElementById("mob-cart-badge");
  if (badge)    badge.textContent    = total;
  if (mobBadge) mobBadge.textContent = total;
}


/* ══════════════════════════════════════════════════════════
   § CART PAGE — Render Full Cart
   ══════════════════════════════════════════════════════════ */

function renderCart() {
  const keys = Object.keys(cart).filter(k => cart[k] > 0);
  const el   = document.getElementById("cart-content");
  if (!el) return;

  // Empty state
  if (!keys.length) {
    el.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🛒</div>
        <div class="empty-title">Cart is Empty</div>
        <div class="empty-sub">Add some fresh chicken to get started!</div>
        <button class="btn btn-primary" 
onclick="showPage('shop')">Shop Now →</button>
        
      </div>`;
    return;
  }

  // Build rows & calculate totals
  let subtotal = 0;
  const rows = keys.map(id => {
    const p    = products.find(x => x.id == id);
    const line = p.price * cart[id];
    subtotal  += line;
    return `
      <div class="cart-row">
        <div class="cart-product">
          <div class="cart-prod-img">
            ${p.image ? `<img src="${p.image}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;border-radius:10px" onerror="this.style.display='none'">` : `<span style="font-size:22px">🍗</span>`}
          </div>
          <div>
            <div class="cart-prod-name">${p.name}</div>
            <div class="cart-prod-wt">${p.wt}</div>
          </div>
        </div>
        <div class="cart-price-col">₹${p.price}</div>
        <div class="cart-qty">
          <button class="cqb" onclick="chgCart(${id},-1)">−</button>
          <span class="cqv">${cart[id]}</span>
          <button class="cqb" onclick="chgCart(${id},1)">+</button>
        </div>
        <div class="cart-line-total">₹${line}</div>
        <button class="cart-del" onclick="delCart(${id})">✕</button>
      </div>`;
  }).join("");

  const delivery = subtotal >= 499 ? 0 : 49; // free delivery above ₹499
  const gst      = Math.round(subtotal * 0.05);
  const total    = subtotal + delivery + gst;

  el.innerHTML = `
    <div class="cart-layout">
      <div>
        <div class="cart-table">
          <div class="cart-table-head">
            <span>Product</span><span>Price</span><span>Qty</span><span>Total</span><span></span>
          </div>
          ${rows}
        </div>
        <div class="coupon-row">
          <input class="coupon-input" placeholder="Have a coupon? Apply Here">
          <button class="btn btn-primary" style="padding:10px 18px;font-size:13px">Apply</button>
        </div>
      </div>
      <div class="order-summary">
        <div class="summary-title">Order Summary</div>
        <div class="summary-row"><span>Subtotal</span><span>₹${subtotal}</span></div>
        <div class="summary-row">
          <span>Delivery Charge</span>
          <span>${delivery === 0 ? '<span style="color:var(--green)">FREE</span>' : '₹' + delivery}</span>
        </div>
        <div class="summary-row"><span>GST (5%)</span><span>₹${gst}</span></div>
        <div class="summary-row total"><span>Total</span><span>₹${total}</span></div>
        ${subtotal < 499 ? `<div style="font-size:11px;color:var(--green);text-align:center;margin-bottom:8px">Add ₹${499 - subtotal} more for FREE delivery!</div>` : ""}
        <div class="secure-badge">🔒 Your details are safe with us.</div>
        <button class="checkout-full-btn" onclick="showPage('checkout')">Proceed to Checkout →</button>
      </div>
    </div>`;
}

/** Change cart item quantity (handles zero → remove) */
function chgCart(id, d) {
  cart[id] = Math.max(0, (cart[id] || 0) + d);
  if (!cart[id]) delete cart[id];
  updateBadges();
  renderCart();
}

/** Remove an item completely from cart */
function delCart(id) {
  delete cart[id];
  updateBadges();
  renderCart();
}


/* ══════════════════════════════════════════════════════════
   § CHECKOUT PAGE — Render Order Summary
   ══════════════════════════════════════════════════════════ */

function renderCheckout() {
  const keys = Object.keys(cart).filter(k => cart[k] > 0);
  let subtotal = 0;

  const itemsHTML = keys.map(id => {
    const p = products.find(x => x.id == id);
    subtotal += p.price * cart[id];
    return `
      <div class="order-item-row">
        <div class="order-item-img">
          ${p.image ? `<img src="${p.image}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;border-radius:8px" onerror="this.style.display='none'">` : `<span style="font-size:18px">🍗</span>`}
        </div>
        <div style="flex:1">
          <div class="order-item-name">${p.name}</div>
          <div class="order-item-wt">${p.wt} × ${cart[id]}</div>
        </div>
        <div class="order-item-price">₹${p.price * cart[id]}</div>
      </div>`;
  }).join("");

  const delivery = subtotal >= 499 ? 0 : 49;
  const gst      = Math.round(subtotal * 0.05);
  const total    = subtotal + delivery + gst;

  const coItems  = document.getElementById("co-items");
  const coTotals = document.getElementById("co-totals");

  if (coItems)  coItems.innerHTML  = itemsHTML;
  if (coTotals) coTotals.innerHTML = `
    <div class="summary-row" style="margin-top:12px"><span>Subtotal</span><span>₹${subtotal}</span></div>
    <div class="summary-row"><span>Delivery</span><span>${delivery === 0 ? '<span style="color:var(--green)">FREE</span>' : '₹' + delivery}</span></div>
    <div class="summary-row"><span>GST (5%)</span><span>₹${gst}</span></div>
    <div class="summary-row total"><span>Total</span><span>₹${total}</span></div>`;
}

/** Highlight the selected delivery slot */
function selectSlot(el, slot) {
  document.querySelectorAll(".slot-btn").forEach(b => b.classList.remove("selected"));
  el.classList.add("selected");
  selectedSlot = slot;
}

/** Highlight the selected payment method */
function selPay(el) {
  document.querySelectorAll(".pay-opt").forEach(o => o.classList.remove("sel"));
  el.classList.add("sel");
}


/* ══════════════════════════════════════════════════════════
   § FIREBASE — Place Order & Save to Realtime Database
   ══════════════════════════════════════════════════════════ */

/**
 * Validates the checkout form, builds the order object,
 * and writes it to Firebase under /orders/{pushId}.
 *
 * Called by the "Place Order" button in the checkout page.
 */
async function placeOrder() {
  // ── 1. Read form fields ──
  const nameEl  = document.getElementById("c-name");
  const phoneEl = document.getElementById("c-phone");
  const addrEl  = document.getElementById("c-addr");
  const cityEl  = document.getElementById("c-city");
  const pinEl   = document.getElementById("c-pin");

  const customerName    = nameEl  ? nameEl.value.trim()  : "";
  const customerPhone   = phoneEl ? phoneEl.value.trim() : "";
  const customerAddress = addrEl  ? addrEl.value.trim()  : "";
  const customerCity    = cityEl  ? cityEl.value.trim()  : "";
  const customerPin     = pinEl   ? pinEl.value.trim()   : "";

  // ── 2. Validate required fields ──
  if (!customerName) {
    alert("⚠️ Please enter your full name.");
    if (nameEl) nameEl.focus();
    return;
  }
  if (!customerPhone || customerPhone.length < 10) {
    alert("⚠️ Please enter a valid 10-digit phone number.");
    if (phoneEl) phoneEl.focus();
    return;
  }
  if (!customerAddress) {
    alert("⚠️ Please enter your delivery address.");
    if (addrEl) addrEl.focus();
    return;
  }

  // ── 3. Check cart is not empty ──
  const cartKeys = Object.keys(cart).filter(k => cart[k] > 0);
  if (!cartKeys.length) {
    alert("⚠️ Your cart is empty. Please add items before placing an order.");
    showPage("shop");
    return;
  }

  // ── 4. Build cart items array & calculate totals ──
  let subtotal    = 0;
  let totalItems  = 0;
  const cartItems = cartKeys.map(id => {
    const p     = products.find(x => x.id == id);
    const qty   = cart[id];
    const line  = p.price * qty;
    subtotal   += line;
    totalItems += qty;
    return {
      productId:   p.id,
      productName: p.name,
      category:    p.cat,
      weight:      p.wt,
      unitPrice:   p.price,
      quantity:    qty,
      lineTotal:   line
    };
  });

  const delivery    = subtotal >= 499 ? 0 : 49;
  const gst         = Math.round(subtotal * 0.05);
  const totalAmount = subtotal + delivery + gst;

  // ── 5. Get selected payment method label ──
  const paySelected = document.querySelector(".pay-opt.sel .pay-opt-name");
  const paymentMethod = paySelected ? paySelected.textContent : "Cash on Delivery";

  // ── 6. Build the order object ──
  const orderData = {
    // Customer details
    customerName,
    customerPhone,
    customerAddress,
    customerCity:    customerCity  || "Coimbatore",
    customerPin:     customerPin   || "",

    // Order details
    cartItems,
    totalItems,
    subtotal,
    deliveryCharge:  delivery,
    gstAmount:       gst,
    totalAmount,

    // Delivery & payment
    deliverySlot:    selectedSlot  || "10 AM - 12 PM",
    paymentMethod,
    orderStatus:     "Pending",

    // Metadata
    createdAt:       new Date().toISOString(),
    timestamp:       firebase.database.ServerValue.TIMESTAMP
  };

  // ── 7. Disable button & show loading state ──
  const placeBtn = document.querySelector(".place-order-btn");
  const originalText = placeBtn ? placeBtn.textContent : "";
  if (placeBtn) {
    placeBtn.disabled     = true;
    placeBtn.textContent  = "Placing Order…";
    placeBtn.style.opacity = "0.7";
  }

  // ── 8. Push order to Firebase Realtime Database ──
  try {
    // db.ref("orders") points to the "orders" node
    // .push() auto-generates a unique key (like -NxAbCdEf12345)
    // .set(orderData) writes the data to that key
    const newOrderRef = db.ref("orders").push();
    await newOrderRef.set(orderData);

    const orderId = newOrderRef.key; // e.g. "-NxAbCdEf12345"
    console.log("✅ Order saved to Firebase:", orderId);

    // ── 9. Success — clear cart & redirect ──
    cart = {};
    updateBadges();
    toast(`Order placed successfully! 🎉 ID: ${orderId.slice(-6).toUpperCase()}`);

    // Short delay so the toast is visible before the page transitions
    setTimeout(() => showPage("success"), 800);

  } catch (error) {
    // ── 10. Error handling ──
    console.error("❌ Firebase order error:", error);

    let message = "Something went wrong. Please try again.";

    if (error.code === "PERMISSION_DENIED") {
      message = "Order failed: Permission denied.\n\nPlease check your Firebase Realtime Database rules.";
    } else if (error.code === "NETWORK_REQUEST_FAILED") {
      message = "Order failed: No internet connection.\n\nPlease check your network and try again.";
    } else if (error.message) {
      message = "Order failed: " + error.message;
    }

    alert("⚠️ " + message);

    // Restore button
    if (placeBtn) {
      placeBtn.disabled      = false;
      placeBtn.textContent   = originalText;
      placeBtn.style.opacity = "1";
    }
  }
}


/* ══════════════════════════════════════════════════════════
   § ACCOUNT PAGE — Sample Order History
   ══════════════════════════════════════════════════════════ */
function renderAccountOrders() {

  const el = document.getElementById("account-orders");

  if (!el) return;

  const orders =
    JSON.parse(localStorage.getItem("myOrders")) || [];

  if (!orders.length) {

    el.innerHTML = `
      <div style="
        text-align:center;
        padding:20px;
        color:gray;
      ">
        No orders found
      </div>
    `;

    return;
  }

  el.innerHTML = orders.map(order => {

    let itemsHTML = "";

    order.cartItems.forEach(item => {

      itemsHTML += `

        <div style="
          font-size:13px;
          color:#666;
          margin-top:5px;
        ">
          ${item.productName} × ${item.quantity}
        </div>

      `;

    });

    return `

    <div style="
      background:#fff;
      border-radius:18px;
      padding:16px;
      margin-bottom:14px;
      border:1px solid #eee;
    ">

      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        margin-bottom:10px;
      ">

        <div>

          <div style="
            font-weight:700;
            font-size:14px;
          ">
            #${order.id.slice(-6).toUpperCase()}
          </div>

          <div style="
            font-size:11px;
            color:gray;
          ">
            ${new Date(order.createdAt).toLocaleDateString()}
          </div>

        </div>

        <div style="text-align:right">

          <div style="
            color:#7c3aed;
            font-weight:700;
          ">
            ₹${order.totalAmount}
          </div>

          <div style="text-align:right">

  <div style="
    color:#7c3aed;
    font-weight:700;
  ">
    ₹${order.totalAmount}
  </div>

</div>

        </div>

      </div>

      ${itemsHTML}

    </div>

    `;

  }).join("");

}

/* ══════════════════════════════════════════════════════════
   § UI HELPERS — Toast Notification
   ══════════════════════════════════════════════════════════ */

/**
 * Show a short-lived toast message at the bottom of the screen.
 * @param {string} msg - message text
 * @param {number} duration - ms to display (default 2500)
 */
function toast(msg, duration = 2500) {
  const t = document.getElementById("toast-msg");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), duration);
}


/* ══════════════════════════════════════════════════════════
   § WINDOW EXPORTS — Make functions accessible from HTML onclick=""
   (Required because this file may be treated as a module
    by some bundlers / dev tools)
   ══════════════════════════════════════════════════════════ */

window.showPage           = showPage;
window.toggleFilterDrawer = toggleFilterDrawer;
window.filterProducts     = filterProducts;
window.goCat              = goCat;
window.showDetail         = showDetail;
window.setImg             = setImg;
window.selWt              = selWt;
window.detQty             = detQty;
window.addCurrent         = addCurrent;
window.quickAdd           = quickAdd;
window.chgCart            = chgCart;
window.delCart            = delCart;
window.selectSlot         = selectSlot;
window.selPay             = selPay;
window.placeOrder         = placeOrder;
window.toast              = toast;


/* ══════════════════════════════════════════════════════════
   § INIT — Boot the App
   ══════════════════════════════════════════════════════════ */

// Render the home page featured products on first load
renderFeatured();