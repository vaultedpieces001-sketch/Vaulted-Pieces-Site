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
