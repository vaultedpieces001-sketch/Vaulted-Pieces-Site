/* --- Site password gate ---
 * Locks the site behind a password (no launch date — shows "Coming Soon").
 * NOTE: this is a client-side gate for casual "coming soon" protection,
 * not server-side access control — the static assets and source remain
 * publicly retrievable. Don't rely on it for anything sensitive.
 * To change the password, edit the constant below.
 */
(function siteGate() {
  const GATE_PASSWORD = 'VAULTED001';
  const UNLOCK_KEY = 'vpGateUnlocked';

  // Storage is optional: visitors must still enter the password when blocked.
  let alreadyUnlocked = false;
  try {
    alreadyUnlocked = localStorage.getItem(UNLOCK_KEY) === '1';
  } catch {
    alreadyUnlocked = false;
  }

  if (alreadyUnlocked) {
    document.documentElement.classList.add('site-unlocked');
    return;
  }

  document.documentElement.style.overflow = 'hidden';

  const gate = document.createElement('div');
  gate.className = 'gate-overlay';
  gate.innerHTML = `
    <div class="gate-product"><img src="images/midnight-set.jpg" alt="The Ascent Set"><span>THE ASCENT SET / FOUNDERS DROP</span></div><div class="gate-modal">
      <div class="gate-logo">VAULTED&nbsp;PIECES</div>
      <p class="gate-eyebrow">Coming soon</p><h1 class="gate-title">The first drop.</h1><p class="gate-description">The Ascent Set. Hoodie and sweatpants in 350gsm French terry cotton.</p>
      <form class="gate-form" id="gateForm">
        <input type="password" placeholder="Password" id="gatePassword" autocomplete="off" aria-label="Password">
        <button type="submit" class="btn btn-primary">Enter</button>
      </form>
      <p class="gate-error" id="gateError" hidden>Incorrect password.</p>
      <div class="gate-social">
        <a href="https://instagram.com/vaulted.pieces" target="_blank" rel="noopener">Instagram</a>
        <a href="https://tiktok.com/@vaulted1pieces" target="_blank" rel="noopener">TikTok</a>
      </div>
    </div>
  `;
  document.body.appendChild(gate);
  document.getElementById('gatePassword').focus();

  document.getElementById('gateForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const entered = document.getElementById('gatePassword').value;
    if (entered === GATE_PASSWORD) {
      try { localStorage.setItem(UNLOCK_KEY, '1'); } catch { /* best effort */ }
      document.documentElement.style.overflow = '';
      document.documentElement.classList.add('site-unlocked');
      gate.remove();
    } else {
      document.getElementById('gateError').hidden = false;
    }
  });
})();

const navToggle = document.getElementById('navToggle');
const mainNav = document.getElementById('mainNav');
function closeMenu() { mainNav?.classList.remove('open'); navToggle?.setAttribute('aria-expanded','false'); navToggle?.setAttribute('aria-label','Open menu'); }
navToggle?.addEventListener('click',()=>{const open=mainNav.classList.toggle('open');navToggle.setAttribute('aria-expanded',String(open));navToggle.setAttribute('aria-label',open?'Close menu':'Open menu');});
mainNav?.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&mainNav?.classList.contains('open')){closeMenu();navToggle.focus();}});

// Original Shopify variants and manually configured quantity limits.
// Shopify checkout is authoritative for actual stock and final pricing.
const SHOPIFY_DOMAIN = 'itxfrk-fa.myshopify.com';
const PRODUCTS = {'midnight-set':{name:'The Ascent Set',price:120,image:'images/midnight-set.jpg',variants:{S:'52544933363844',M:'52544933396612',L:'52544933429380',XL:'52544933462148'},stock:{S:10,M:20,L:10,XL:9}}};
const CART_KEY='vpCart';
let memoryCart=[];
function getCart(){
 let raw;
 try{raw=JSON.parse(localStorage.getItem(CART_KEY)||'[]');}catch{raw=memoryCart;}
 if(!Array.isArray(raw))return [];
 const normalized=[];
 for(const item of raw){
  if(!item||typeof item!=='object')continue;
  const product=Object.hasOwn(PRODUCTS,item.productKey)?PRODUCTS[item.productKey]:null;
  if(!product||!Object.hasOwn(product.variants,item.size))continue;
  const qty=Math.floor(Number(item.qty));if(!Number.isFinite(qty)||qty<1)continue;
  const existing=normalized.find(row=>row.productKey===item.productKey&&row.size===item.size);
  if(existing){existing.qty=Math.min(existing.qty+qty,product.stock[item.size]);continue;}
  normalized.push({productKey:item.productKey,size:item.size,qty:Math.min(qty,product.stock[item.size]),variantId:product.variants[item.size],name:product.name,price:product.price,image:product.image});
 }
 return normalized;
}
function saveCart(cart){memoryCart=cart;try{localStorage.setItem(CART_KEY,JSON.stringify(cart));}catch{}updateCartBadge();}
function money(value){return '$'+value.toFixed(2);}
function updateCartBadge(){const count=getCart().reduce((n,item)=>n+item.qty,0);document.querySelectorAll('#cartCount').forEach(el=>{el.textContent=count;el.hidden=false;});const title=document.getElementById('drawerCount');if(title)title.textContent=`(${count})`;}
function checkout(){const items=getCart();if(!items.length)return;window.location.href=`https://${SHOPIFY_DOMAIN}/cart/${items.map(item=>`${item.variantId}:${item.qty}`).join(',')}?return_to=/checkout`;}
const bagDrawer=document.getElementById('bagDrawer');
function cartMarkup(cart){
 if(!cart.length)return '<div class="cart-empty"><img class="empty-bag-photo" src="images/midnight-set.jpg" alt="The Ascent Set"><div><p>Your bag is empty.</p><span>The Ascent Set · Hoodie + sweatpants · $120</span><a href="index.html#buy" class="btn-primary" data-continue>Explore the set</a></div></div>';
 const subtotal=cart.reduce((sum,item)=>sum+item.price*item.qty,0);
 return `<div class="cart-items">${cart.map((item,i)=>`<div class="cart-item"><a href="index.html#buy"><img class="cart-item-image" src="${item.image}" alt="${item.name}"></a><div class="cart-item-info"><a href="index.html#buy"><h3>${item.name}</h3></a><p>Midnight / ${item.size}</p><p>Hoodie + sweatpants</p><div class="qty-picker"><button class="qty-btn" data-cart-action="decrease" data-index="${i}" aria-label="Decrease quantity of size ${item.size}" ${item.qty<=1?'disabled':''}>−</button><input class="qty-input" type="number" value="${item.qty}" readonly aria-label="Quantity of size ${item.size}"><button class="qty-btn" data-cart-action="increase" data-index="${i}" aria-label="Increase quantity of size ${item.size}" ${item.qty>=PRODUCTS[item.productKey].stock[item.size]?'disabled':''}>+</button></div><button class="cart-remove" data-cart-action="remove" data-index="${i}" aria-label="Remove size ${item.size} from bag">Remove</button></div><p class="cart-item-total">${money(item.price*item.qty)}</p></div>`).join('')}</div><div class="cart-summary"><h2 class="summary-title">Order summary</h2><p class="cart-subtotal"><span>Subtotal</span><span>${money(subtotal)}</span></p><p class="cart-shipping-note">Final total confirmed at checkout.</p><button class="btn-primary" data-checkout>Checkout</button><a href="cart.html" class="btn-link view-bag">View full bag</a><a href="index.html#buy" class="btn-link cart-continue" data-continue>Continue shopping</a></div>`;
}
function renderCart(){const cart=getCart();for(const id of ['cartInner','drawerContents']){const container=document.getElementById(id);if(container)container.innerHTML=cartMarkup(cart);}updateCartBadge();}
function openBag(){renderCart();if(bagDrawer&&!bagDrawer.open)bagDrawer.showModal();}
document.querySelectorAll('[data-open-bag]').forEach(link=>link.addEventListener('click',event=>{if(bagDrawer){event.preventDefault();openBag();}}));
document.addEventListener('click',event=>{
 const checkoutButton=event.target.closest('[data-checkout]');if(checkoutButton){checkout();return;}
 const button=event.target.closest('[data-cart-action]');
 if(button){
  const container=button.closest('#cartInner,#drawerContents');const cart=getCart(),index=Number(button.dataset.index),item=cart[index];if(!item)return;
  const action=button.dataset.cartAction;
  if(action==='remove')cart.splice(index,1);else item.qty=Math.max(1,Math.min(PRODUCTS[item.productKey].stock[item.size],item.qty+(action==='increase'?1:-1)));
  saveCart(cart);renderCart();
  const replacement=container?.querySelector(`[data-cart-action="${action}"][data-index="${Math.min(index,cart.length-1)}"]:not(:disabled)`);
  (replacement||container?.querySelector('button:not(:disabled),a'))?.focus();return;
 }
 if(event.target.closest('[data-continue]')&&bagDrawer?.open&&document.body.classList.contains('home')){event.preventDefault();bagDrawer.close();document.getElementById('sizePicker').scrollIntoView({block:'center'});}
});
document.querySelectorAll('[data-close-dialog]').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}));
window.addEventListener('storage',event=>{if(event.key===CART_KEY||event.key===null)renderCart();});

const picker=document.querySelector('.variant-picker');
if(picker){
 const product=PRODUCTS[picker.dataset.product],qtyInput=picker.querySelector('.qty-input'),addButton=picker.querySelector('.add-cart-btn'),status=picker.querySelector('.variant-status');
 const sizes=[...picker.querySelectorAll('.size-btn')];let selected=null;
 const showStatus=(text,success=false)=>{status.textContent=text;status.hidden=false;status.classList.toggle('success',success);};
 const syncQuantity=()=>{const qty=Number(qtyInput.value);picker.querySelector('[data-action="decrease"]').disabled=qty<=1;picker.querySelector('[data-action="increase"]').disabled=qty>=Number(qtyInput.max);addButton.innerHTML=`Add to bag <span>— $${qty*product.price}</span>`;};
 for(const button of sizes)button.addEventListener('click',()=>{selected=button.dataset.size;sizes.forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});document.getElementById('selectedSize').textContent=selected;qtyInput.max=product.stock[selected];qtyInput.value=Math.min(Number(qtyInput.value),Number(qtyInput.max));status.hidden=true;document.getElementById('mobileBuyButton').textContent='Add to bag';syncQuantity();});
 picker.querySelectorAll('[data-action]').forEach(button=>button.addEventListener('click',()=>{qtyInput.value=Math.max(1,Math.min(Number(qtyInput.max),Number(qtyInput.value)+(button.dataset.action==='increase'?1:-1)));syncQuantity();}));
 addButton.addEventListener('click',()=>{
  if(!selected){showStatus('Please select a size.');sizes[0].focus();return;}
  const cart=getCart();const existing=cart.find(item=>item.productKey===picker.dataset.product&&item.size===selected);const current=existing?.qty||0,max=product.stock[selected];
  if(current>=max){showStatus('You already have the maximum available quantity for this size in your bag.');return;}
  const requested=Number(qtyInput.value),added=Math.min(requested,max-current);
  if(existing)existing.qty+=added;else cart.push({productKey:picker.dataset.product,size:selected,qty:added});
  saveCart(cart);showStatus(added<requested?`Added ${added}; this is the maximum available quantity for this size.`:'Added to your bag.',true);openBag();
 });
 syncQuantity();
 const mobileBar=document.getElementById('mobileBuy');
 new IntersectionObserver(entries=>{mobileBar.hidden=entries[0].isIntersecting;},{threshold:0}).observe(picker);
 document.getElementById('mobileBuyButton').addEventListener('click',()=>{if(selected){addButton.click();}else{picker.scrollIntoView({block:'center'});sizes[0].focus({preventScroll:true});}});
 document.getElementById('sizeHelp').addEventListener('click',()=>document.getElementById('sizeDialog').showModal());
}
const imageDialog=document.getElementById('imageDialog');
document.querySelectorAll('[data-zoom]').forEach(button=>button.addEventListener('click',()=>{const image=document.getElementById('zoomImage');image.src=button.dataset.zoom;image.alt=button.dataset.photoAlt;document.getElementById('zoomCaption').textContent=button.dataset.photoAlt;imageDialog.showModal();imageDialog.querySelector('.zoom-scroll').scrollTo(0,0);}));
const track=document.getElementById('galleryTrack');
if(track){const dots=[...document.querySelectorAll('[data-gallery-index]')];dots.forEach(button=>button.addEventListener('click',()=>{const image=track.children[Number(button.dataset.galleryIndex)];track.scrollTo({left:image.offsetLeft-track.children[0].offsetLeft,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}));track.addEventListener('scroll',()=>{const index=track.scrollLeft>(track.children[0].clientWidth/2)?1:0;dots.forEach((dot,i)=>{dot.classList.toggle('active',i===index);dot.setAttribute('aria-pressed',String(i===index));});},{passive:true});}
renderCart();
