const navToggle = document.getElementById('navToggle');
const mainNav = document.getElementById('mainNav');

navToggle.addEventListener('click', () => {
  mainNav.classList.toggle('open');
});

mainNav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => mainNav.classList.remove('open'));
});

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

/* --- 10% off SMS text-to-join popup ---
 * Shows once per visitor (tracked via localStorage), after a short delay.
 * TODO: once your Postscript number is verified, replace the phone number
 * text below (search "a number coming soon") with the real one.
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
      <p>Text <span class="popup-highlight">VAULTED</span> to <span class="popup-highlight">a number coming soon</span> to get your code.</p>
      <p class="popup-note">Msg &amp; data rates may apply. Reply STOP to unsubscribe.</p>
      <a href="#" class="popup-dismiss">No thanks</a>
    </div>
  `;
  document.body.appendChild(popup);

  const dismiss = () => {
    popup.classList.remove('is-open');
    localStorage.setItem(DISMISS_KEY, '1');
    setTimeout(() => popup.remove(), 300);
  };

  setTimeout(() => popup.classList.add('is-open'), 4000);

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
})();
