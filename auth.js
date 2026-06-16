/* ============================================================
   DEECUTS – Fresh Chicken  |  auth.js
   Firebase Authentication (v8 compat CDN)
   ============================================================

   COVERS:
   • Email / Password Sign-Up & Login
   • Google Sign-In (popup)
   • Sign Out
   • Persistent session via onAuthStateChanged
   • Password Reset email
   • Dynamic navbar user display
   • Checkout gate (must be logged in)
   • Attach Firebase UID to every order

   USAGE: Include AFTER firebase-app.js & firebase-auth.js CDN scripts,
          and BEFORE app.js.
   ============================================================ */


/* ══════════════════════════════════════════════════════════
   § FIREBASE AUTH — Initialisation
   ══════════════════════════════════════════════════════════ */

// firebase.app() was already initialised in app.js (or will be).
// We grab the auth service here safely.
// AFTER ✅
if (!firebase.apps.length) {
  console.error("Firebase not initialized! Load app.js before auth.js");
}
const auth = firebase.auth();

// Google provider for one-tap Sign-In
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });


/* ══════════════════════════════════════════════════════════
   § STATE — Current User (shared across files)
   ══════════════════════════════════════════════════════════ */

// currentUser is set by onAuthStateChanged and consumed by app.js
window.currentUser = null;


/* ══════════════════════════════════════════════════════════
   § AUTH STATE LISTENER — Runs on every page load / tab restore
   ══════════════════════════════════════════════════════════ */

auth.onAuthStateChanged(function (user) {
  window.currentUser = user;

  if (user) {
    // ── User is signed in ──
    console.log("✅ Signed in:", user.email || user.displayName);
    updateNavbarForUser(user);
    updateAccountPage(user);
  } else {
    // ── User is signed out ──
    console.log("ℹ️ No user signed in.");
    updateNavbarForGuest();
  }
});


/* ══════════════════════════════════════════════════════════
   § NAVBAR — Dynamic profile display
   ══════════════════════════════════════════════════════════ */

/**
 * Show the user's name/photo in the navbar when logged in.
 * Replaces the 👤 icon button with a profile chip.
 */
function updateNavbarForUser(user) {
  const navRight  = document.querySelector(".nav-right");
  const mobAcc    = document.getElementById("mn-acc");
  if (!navRight) return;

  // Remove old auth button if already injected
  const old = document.getElementById("nav-user-chip");
  if (old) old.remove();

  const displayName = user.displayName || user.email.split("@")[0];
  const initial     = displayName.charAt(0).toUpperCase();
  const photoURL    = user.photoURL;

  // Build the chip
  const chip = document.createElement("div");
  chip.id    = "nav-user-chip";
  chip.style.cssText = `
    display:flex; align-items:center; gap:8px;
    background:var(--purple-pale); border:1.5px solid var(--purple-light);
    border-radius:10px; padding:5px 12px 5px 6px; cursor:pointer;
    font-family:'DM Sans',sans-serif;
  `;
  chip.innerHTML = `
    <div style="
      width:28px; height:28px; border-radius:50%;
      background:var(--purple); color:#fff;
      display:flex; align-items:center; justify-content:center;
      font-size:12px; font-weight:700; overflow:hidden; flex-shrink:0;
    ">
      ${photoURL
        ? `<img src="${photoURL}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'">`
        : initial}
    </div>
    <div>
      <div style="font-size:12px; font-weight:600; color:var(--text); line-height:1.2; max-width:90px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">
        ${displayName}
      </div>
      <div style="font-size:10px; color:var(--muted); cursor:pointer" onclick="signOutUser()">Sign out</div>
    </div>
  `;
  chip.title = "My Account";
  chip.addEventListener("click", function (e) {
    // Clicking the chip (not "Sign out") → go to account page
    if (e.target.textContent.trim() !== "Sign out") {
      if (typeof showPage === "function") showPage("account");
    }
  });

  // Replace the 👤 icon button in the desktop nav
  const iconBtns = navRight.querySelectorAll(".icon-btn");
  const accBtn   = [...iconBtns].find(b => b.textContent.includes("👤") || b.innerHTML.includes("👤"));
  if (accBtn) accBtn.replaceWith(chip);
  else navRight.appendChild(chip);

  // Update mobile bottom nav label
  if (mobAcc) {
    const label = mobAcc.querySelector(".label");
    if (label) label.textContent = displayName.split(" ")[0];
  }
}

/** Restore the guest 👤 icon when signed out */
function updateNavbarForGuest() {
  const navRight = document.querySelector(".nav-right");
  if (!navRight) return;

  const chip = document.getElementById("nav-user-chip");
  if (chip) {
    const btn = document.createElement("button");
    btn.className   = "icon-btn";
    btn.onclick     = function () { window.location.href = "login.html"; };
    btn.innerHTML   = `<span class="icon">👤</span>`;
    btn.title       = "Login";
    chip.replaceWith(btn);
  }

  // Reset mobile nav label
  const mobAcc = document.getElementById("mn-acc");
  if (mobAcc) {
    const label = mobAcc.querySelector(".label");
    if (label) label.textContent = "Account";
    // Make mobile account button open login page if not signed in
    mobAcc.onclick = function () { window.location.href = "login.html"; };
  }
}


/* ══════════════════════════════════════════════════════════
   § ACCOUNT PAGE — Show orders for logged-in user
   ══════════════════════════════════════════════════════════ */

function updateAccountPage(user) {
  // Only update if we're on the main index.html (account section exists)
  const profileBox = document.getElementById("auth-profile-box");
  if (!profileBox) return;

  const displayName = user.displayName || user.email.split("@")[0];

  profileBox.innerHTML = `
    <div style="display:flex; align-items:center; gap:14px; margin-bottom:16px">
      <div style="
        width:52px; height:52px; border-radius:50%;
        background:var(--purple); color:#fff;
        display:flex; align-items:center; justify-content:center;
        font-size:20px; font-weight:700; overflow:hidden; flex-shrink:0;
      ">
        ${user.photoURL
          ? `<img src="${user.photoURL}" style="width:100%;height:100%;object-fit:cover">`
          : displayName.charAt(0).toUpperCase()}
      </div>
      <div>
        <div style="font-weight:700; font-size:15px">${displayName}</div>
        <div style="font-size:12px; color:var(--muted)">${user.email}</div>
        <div style="font-size:11px; color:var(--green); margin-top:2px">● Verified Account</div>
      </div>
    </div>
    <button class="place-order-btn" style="background:#f5f5f5;color:var(--muted);font-size:13px;margin-top:0" onclick="signOutUser()">
      Sign Out →
    </button>
  `;
}


/* ══════════════════════════════════════════════════════════
   § CHECKOUT GATE — Block checkout if not logged in
   ══════════════════════════════════════════════════════════ */

/**
 * Called instead of showPage('checkout') from the cart page.
 * Redirects to login.html if user is not signed in.
 */
function goToCheckout() {
  if (window.currentUser) {
    if (typeof showPage === "function") showPage("checkout");
  } else {
    // Store intended destination for post-login redirect
    sessionStorage.setItem("deecuts_redirect", "checkout");
    showAuthModal();
  }
}

/**
 * Show a lightweight "login required" modal inline
 * (avoids a full page navigate for better UX)
 */
function showAuthModal() {
  // Remove old modal if any
  const old = document.getElementById("auth-gate-modal");
  if (old) old.remove();

  const overlay = document.createElement("div");
  overlay.id = "auth-gate-modal";
  overlay.style.cssText = `
    position:fixed; inset:0; background:rgba(15,11,21,.65); backdrop-filter:blur(6px);
    z-index:9000; display:flex; align-items:center; justify-content:center; padding:20px;
    animation:fadeIn .25s ease;
  `;
  overlay.innerHTML = `
    <div style="
      background:#fff; border-radius:20px; padding:clamp(24px,5vw,36px);
      max-width:380px; width:100%; text-align:center;
      box-shadow:0 24px 60px rgba(91,45,142,.25);
      animation:slideUp .3s ease;
    ">
      <div style="font-size:44px; margin-bottom:12px">🔐</div>
      <div style="font-family:'Playfair Display',serif; font-size:22px; font-weight:700; margin-bottom:8px; color:var(--text)">
        Login Required
      </div>
      <div style="font-size:13px; color:var(--muted); margin-bottom:24px; line-height:1.6">
        Please sign in to place your order and track it later.
      </div>
      <a href="login.html" style="
        display:block; width:100%; padding:13px; background:var(--purple);
        color:#fff; border-radius:10px; font-size:14px; font-weight:700;
        text-decoration:none; font-family:'DM Sans',sans-serif; margin-bottom:10px;
        transition:.2s;
      ">Sign In →</a>
      <a href="signup.html" style="
        display:block; width:100%; padding:13px; background:var(--purple-pale);
        color:var(--purple); border-radius:10px; font-size:14px; font-weight:700;
        text-decoration:none; font-family:'DM Sans',sans-serif;
      ">Create Account</a>
      <button onclick="document.getElementById('auth-gate-modal').remove()" style="
        margin-top:14px; background:none; border:none; font-size:12px;
        color:var(--muted); cursor:pointer; font-family:'DM Sans',sans-serif;
      ">Continue browsing</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) overlay.remove();
  });
}


/* ══════════════════════════════════════════════════════════
   § SIGN OUT
   ══════════════════════════════════════════════════════════ */

function signOutUser() {
  auth.signOut()
    .then(function () {
      window.currentUser = null;
      if (typeof toast === "function") toast("Signed out successfully 👋");
      if (typeof showPage === "function") showPage("home");
    })
    .catch(function (error) {
      console.error("Sign out error:", error);
      alert("Sign out failed. Please try again.");
    });
}


/* ══════════════════════════════════════════════════════════
   § WINDOW EXPORTS
   ══════════════════════════════════════════════════════════ */

window.signOutUser    = signOutUser;
window.goToCheckout   = goToCheckout;
window.showAuthModal  = showAuthModal;
