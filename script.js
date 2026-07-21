const navToggle = document.getElementById('navToggle');
const mainNav = document.getElementById('mainNav');

navToggle.addEventListener('click', () => {
  mainNav.classList.toggle('open');
});

mainNav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => mainNav.classList.remove('open'));
});

/* --- Postscript SMS signup ---
 * Submits to a Netlify serverless function (netlify/functions/subscribe.js)
 * which calls Postscript's Subscriber API using a private API key kept
 * server-side. Requires POSTSCRIPT_API_KEY and POSTSCRIPT_KEYWORD to be
 * set as environment variables in Netlify, and the site to be deployed
 * via Git (drag-and-drop deploys don't run Netlify Functions).
 */
async function subscribeToSms(phone) {
  try {
    const res = await fetch('/.netlify/functions/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, error: data.error || 'Something went wrong.' };
    return { success: true };
  } catch {
    return { success: false, error: 'Network error — please try again.' };
  }
}

const smsForm = document.getElementById('smsForm');
const signupStatus = document.getElementById('signupStatus');

if (smsForm) {
  smsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const phone = smsForm.querySelector('input[type="tel"]').value;
    signupStatus.textContent = 'Signing you up…';
    signupStatus.hidden = false;
    const result = await subscribeToSms(phone);
    signupStatus.textContent = result.success
      ? "You're on the list! Watch your phone for a welcome text."
      : result.error;
  });
}

/* --- Direct-to-checkout size/quantity picker ---
 * Fill in the numeric Shopify variant ID for each size below.
 * To find a variant ID: Shopify admin → Products → open the product →
 * click a size variant → the URL ends in /variants/1234567890 — that
 * number is the ID. Do this for all 12 (3 products x 4 sizes).
 */
const SHOPIFY_DOMAIN = 'itxfrk-fa.myshopify.com';

const VARIANTS = {
  'midnight-hoodie': { S: '52544932937860', M: '52544932970628', L: '52544933003396', XL: '52544933036164' },
  'midnight-sweatpants': { S: '52544933232772', M: '52544933265540', L: '52544933298308', XL: '52544933331076' },
  'midnight-set': { S: '52544933363844', M: '52544933396612', L: '52544933429380', XL: '52544933462148' },
};

document.querySelectorAll('.variant-picker').forEach((picker) => {
  const productKey = picker.dataset.product;
  const sizeBtns = picker.querySelectorAll('.size-btn');
  const qtyInput = picker.querySelector('.qty-input');
  const decreaseBtn = picker.querySelector('[data-action="decrease"]');
  const increaseBtn = picker.querySelector('[data-action="increase"]');
  const buyBtn = picker.querySelector('.buy-btn');

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

  buyBtn.addEventListener('click', () => {
    const activeSize = picker.querySelector('.size-btn.active');
    if (!activeSize) {
      showStatus('Please select a size first.');
      return;
    }

    const size = activeSize.dataset.size;
    const variantId = VARIANTS[productKey] && VARIANTS[productKey][size];

    if (!variantId || variantId === 'REPLACE_ME') {
      showStatus('This size isn\'t connected to Shopify yet.');
      return;
    }

    const qty = qtyInput.value;
    const url = `https://${SHOPIFY_DOMAIN}/cart/${variantId}:${qty}?return_to=/checkout`;
    window.open(url, '_blank', 'noopener');
  });
});

/* --- 10% off SMS signup popup ---
 * Shows once per visitor (tracked via localStorage), after a short delay.
 * Submits through the same subscribeToSms() → Postscript flow as the
 * footer form. Also create a matching "WELCOME10" discount code in
 * Shopify (Discounts) so the offer actually works at checkout.
 */
(function initSmsPopup() {
  const DISMISS_KEY = 'vpPopupDismissed';
  if (localStorage.getItem(DISMISS_KEY)) return;

  const popup = document.createElement('div');
  popup.className = 'popup-overlay';
  popup.innerHTML = `
    <div class="popup-modal">
      <button type="button" class="popup-close" aria-label="Close">&times;</button>
      <h2>Get 10% Off</h2>
      <p>Sign up for SMS alerts and get an exclusive code for your first order.</p>
      <form class="popup-form">
        <input type="tel" name="phone" placeholder="Phone number" required>
        <button type="submit" class="btn btn-primary">Get My Code</button>
      </form>
      <label class="consent">
        <input type="checkbox" required>
        <span>I agree to receive recurring automated marketing texts from Vaulted Pieces. Consent is not a condition of purchase. Msg &amp; data rates may apply. Reply STOP to unsubscribe.</span>
      </label>
      <p class="popup-status" hidden></p>
      <a href="#" class="popup-dismiss">No thanks</a>
    </div>
  `;
  document.body.appendChild(popup);

  const dismiss = () => {
    popup.classList.remove('is-open');
    localStorage.setItem(DISMISS_KEY, '1');
    setTimeout(() => popup.remove(), 300);
  };

  const openTimer = setTimeout(() => popup.classList.add('is-open'), 4000);

  popup.querySelector('.popup-close').addEventListener('click', dismiss);
  popup.querySelector('.popup-dismiss').addEventListener('click', (e) => {
    e.preventDefault();
    dismiss();
  });
  popup.addEventListener('click', (e) => {
    if (e.target === popup) dismiss();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && popup.classList.contains('is-open')) dismiss();
  });

  const popupForm = popup.querySelector('.popup-form');
  const popupStatus = popup.querySelector('.popup-status');

  popupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearTimeout(openTimer);
    const phone = popupForm.querySelector('input[type="tel"]').value;
    popupStatus.textContent = 'Signing you up…';
    popupStatus.hidden = false;
    const result = await subscribeToSms(phone);
    popupForm.hidden = true;
    popupStatus.textContent = result.success
      ? "You're on the list! Watch your phone for your code."
      : result.error;
    localStorage.setItem(DISMISS_KEY, '1');
  });
})();
