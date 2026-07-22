/* --- Site password gate with launch countdown ---
 * Locks the site behind a password until LAUNCH_DATE arrives.
 * NOTE: this is a client-side gate for casual "coming soon" protection,
 * not real security — anyone who disables JS or views page source can
 * see past it. Don't rely on it for anything sensitive.
 * To change the password or date, edit the two constants below.
 */
(function siteGate() {
  const LAUNCH_DATE = new Date('2026-08-29T00:00:00');
  const GATE_PASSWORD = 'VAULTED001';
  const UNLOCK_KEY = 'vpGateUnlocked';

  if (Date.now() >= LAUNCH_DATE.getTime()) return;
  if (localStorage.getItem(UNLOCK_KEY) === '1') return;

  document.documentElement.style.overflow = 'hidden';

  const gate = document.createElement('div');
  gate.className = 'gate-overlay';
  gate.innerHTML = `
    <div class="gate-modal">
      <div class="gate-logo">VAULTED&nbsp;PIECES</div>
      <p class="gate-eyebrow">Launching In</p>
      <div class="gate-countdown">
        <div><span id="gateDays">00</span><small>Days</small></div>
        <div><span id="gateHours">00</span><small>Hrs</small></div>
        <div><span id="gateMinutes">00</span><small>Min</small></div>
        <div><span id="gateSeconds">00</span><small>Sec</small></div>
      </div>
      <form class="gate-form" id="gateForm">
        <input type="password" placeholder="Password" id="gatePassword" autocomplete="off">
        <button type="submit" class="btn btn-primary">Enter</button>
      </form>
      <p class="gate-error" id="gateError" hidden>Incorrect password.</p>
    </div>
  `;
  document.body.appendChild(gate);

  function updateCountdown() {
    const diff = LAUNCH_DATE.getTime() - Date.now();
    if (diff <= 0) {
      window.location.reload();
      return;
    }
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    document.getElementById('gateDays').textContent = String(days).padStart(2, '0');
    document.getElementById('gateHours').textContent = String(hours).padStart(2, '0');
    document.getElementById('gateMinutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('gateSeconds').textContent = String(seconds).padStart(2, '0');
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  document.getElementById('gateForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const entered = document.getElementById('gatePassword').value;
    if (entered === GATE_PASSWORD) {
      localStorage.setItem(UNLOCK_KEY, '1');
      document.documentElement.style.overflow = '';
      gate.remove();
    } else {
      document.getElementById('gateError').hidden = false;
    }
  });
})();

const navToggle = document.getElementById('navToggle');
const mainNav = document.getElementById('mainNav');

navToggle.addEventListener('click', () => {
  mainNav.classList.toggle('open');
});

mainNav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => mainNav.classList.remove('open'));
});

/* --- Products & Shopify variant IDs ---
 * To find a variant ID: Shopify admin → Products → open the product →
 * click a size variant → the URL ends in /variants/1234567890 — that
 * number is the ID.
 */
const SHOPIFY_DOMAIN = 'itxfrk-fa.myshopify.com';

const PRODUCTS = {
  'midnight-set': {
    name: 'Midnight Set',
    price: 120.00,
    image: 'images/midnight-set.jpg',
    variants: { S: '52544933363844', M: '52544933396612', L: '52544933429380', XL: '52544933462148' },
  },
};

/* --- Cart (stored in localStorage, shared across all pages) --- */
const CART_KEY = 'vpCart';

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(productKey, size, qty) {
  const product = PRODUCTS[productKey];
  const variantId = product.variants[size];
  const cart = getCart();

  const existing = cart.find((item) => item.productKey === productKey && item.size === size);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      productKey,
      variantId,
      size,
      qty,
      name: product.name,
      price: product.price,
      image: product.image,
    });
  }

  saveCart(cart);
}

function updateCartBadge() {
  const count = getCart().reduce((sum, item) => sum + item.qty, 0);
  document.querySelectorAll('#cartCount').forEach((badge) => {
    badge.textContent = count;
    badge.hidden = count === 0;
  });
}

updateCartBadge();

/* --- Size/quantity picker: adds to cart instead of buying directly --- */
document.querySelectorAll('.variant-picker').forEach((picker) => {
  const productKey = picker.dataset.product;
  const sizeBtns = picker.querySelectorAll('.size-btn');
  const qtyInput = picker.querySelector('.qty-input');
  const decreaseBtn = picker.querySelector('[data-action="decrease"]');
  const increaseBtn = picker.querySelector('[data-action="increase"]');
  const addCartBtn = picker.querySelector('.add-cart-btn');

  const status = document.createElement('p');
  status.className = 'variant-status';
  status.hidden = true;
  picker.appendChild(status);

  const showStatus = (message) => {
    status.textContent = message;
    status.hidden = false;
  };

  sizeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      sizeBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      status.hidden = true;
    });
  });

  decreaseBtn.addEventListener('click', () => {
    const current = parseInt(qtyInput.value, 10);
    if (current > 1) qtyInput.value = current - 1;
  });

  increaseBtn.addEventListener('click', () => {
    const current = parseInt(qtyInput.value, 10);
    if (current < 10) qtyInput.value = current + 1;
  });

  addCartBtn.addEventListener('click', () => {
    const activeSize = picker.querySelector('.size-btn.active');
    if (!activeSize) {
      showStatus('Please select a size first.');
      return;
    }

    const size = activeSize.dataset.size;
    const product = PRODUCTS[productKey];
    const variantId = product && product.variants[size];

    if (!variantId || variantId === 'REPLACE_ME') {
      showStatus('This size isn\'t connected to Shopify yet.');
      return;
    }

    addToCart(productKey, size, parseInt(qtyInput.value, 10));
    showStatus('Added to cart.');
  });
});

/* --- Cart page rendering --- */
const cartInner = document.getElementById('cartInner');

if (cartInner) {
  function renderCart() {
    const cart = getCart();

    if (cart.length === 0) {
      cartInner.innerHTML = `
        <div class="cart-empty">
          <p>Your cart is empty.</p>
          <a href="shop.html" class="btn-link">Shop the drop →</a>
        </div>
      `;
      return;
    }

    const itemsHtml = cart.map((item, index) => `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}" class="cart-item-image">
        <div class="cart-item-info">
          <h3>${item.name}</h3>
          <p class="cart-item-size">Size: ${item.size}</p>
          <p class="cart-item-price">$${item.price.toFixed(2)}</p>
          <div class="qty-picker">
            <button type="button" class="qty-btn" data-action="decrease" data-index="${index}" aria-label="Decrease quantity">−</button>
            <input type="number" class="qty-input" value="${item.qty}" min="1" max="10" data-index="${index}" readonly>
            <button type="button" class="qty-btn" data-action="increase" data-index="${index}" aria-label="Increase quantity">+</button>
          </div>
          <button type="button" class="cart-remove" data-index="${index}">Remove</button>
        </div>
        <p class="cart-item-total">$${(item.price * item.qty).toFixed(2)}</p>
      </div>
    `).join('');

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

    cartInner.innerHTML = `
      <div class="cart-items">${itemsHtml}</div>
      <div class="cart-summary">
        <p class="cart-subtotal">Subtotal: $${subtotal.toFixed(2)}</p>
        <button type="button" class="btn btn-primary" id="checkoutBtn">Checkout</button>
      </div>
    `;

    cartInner.querySelectorAll('.qty-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index, 10);
        const cart = getCart();
        const item = cart[index];
        if (btn.dataset.action === 'increase' && item.qty < 10) item.qty += 1;
        if (btn.dataset.action === 'decrease' && item.qty > 1) item.qty -= 1;
        saveCart(cart);
        renderCart();
      });
    });

    cartInner.querySelectorAll('.cart-remove').forEach((btn) => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index, 10);
        const cart = getCart();
        cart.splice(index, 1);
        saveCart(cart);
        renderCart();
      });
    });

    document.getElementById('checkoutBtn').addEventListener('click', () => {
      const items = getCart()
        .map((item) => `${item.variantId}:${item.qty}`)
        .join(',');
      window.location.href = `https://${SHOPIFY_DOMAIN}/cart/${items}?return_to=/checkout`;
    });
  }

  renderCart();
}
