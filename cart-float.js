(() => {
  const CART_STORAGE_KEY = "fh_dermatologia_cart";
  const PHONE = "573001234567";

  function formatCOP(value) {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0
    }).format(value || 0);
  }

  function getCart() {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function setCart(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    window.dispatchEvent(new Event("fh-cart-updated"));
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function total(cart) {
    return cart.reduce((acc, item) => acc + Number(item.price) * Number(item.qty), 0);
  }

  function getWhatsAppLink(cart) {
    const lines = cart.map((item) => `- ${item.name} x${item.qty}: ${formatCOP(item.price * item.qty)}`);
    const message = [
      "Hola, quiero realizar este pedido:",
      "",
      ...lines,
      "",
      `Total: ${formatCOP(total(cart))}`
    ].join("\n");

    return `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`;
  }

  function ensureUI() {
    if (!document.getElementById("globalCartBtn")) {
      const button = document.createElement("button");
      button.type = "button";
      button.id = "globalCartBtn";
      button.className = "global-cart-btn";
      document.body.appendChild(button);
    }

    if (!document.getElementById("cartOverlay")) {
      const overlay = document.createElement("div");
      overlay.id = "cartOverlay";
      overlay.className = "cart-overlay";
      document.body.appendChild(overlay);
    }

    if (!document.getElementById("cartDrawer")) {
      const drawer = document.createElement("aside");
      drawer.id = "cartDrawer";
      drawer.className = "cart-drawer";
      drawer.innerHTML = `
        <div class="cart-drawer-head">
          <h3>Tu carrito</h3>
          <div class="cart-drawer-head-actions">
            <button id="drawerClearBtn" type="button" class="chip">Vaciar</button>
            <button id="closeDrawerBtn" type="button" class="chip">Cerrar</button>
          </div>
        </div>
        <div id="drawerItems" class="drawer-items"></div>
        <div class="cart-drawer-foot">
          <strong id="drawerTotal">Total: $0</strong>
          <a id="drawerWppBtn" class="btn" target="_blank" rel="noopener noreferrer">Enviar a WhatsApp</a>
        </div>
      `;
      document.body.appendChild(drawer);
    }
  }

  function toggleDrawer(forceOpen) {
    const drawer = document.getElementById("cartDrawer");
    const overlay = document.getElementById("cartOverlay");
    const isOpen = forceOpen !== undefined ? forceOpen : !drawer.classList.contains("open");

    drawer.classList.toggle("open", isOpen);
    overlay.classList.toggle("open", isOpen);
  }

  function changeQty(productId, action) {
    const cart = getCart();
    const item = cart.find((p) => Number(p.id) === Number(productId));
    if (!item) return;

    if (action === "increase" && item.qty < item.stock) item.qty += 1;
    if (action === "decrease") item.qty -= 1;

    const sanitized = cart.filter((p) => p.qty > 0);
    setCart(sanitized);
  }

  function removeFromCart(productId) {
    const cart = getCart().filter((p) => Number(p.id) !== Number(productId));
    setCart(cart);
  }

  function clearCart() {
    setCart([]);
  }

  function renderDrawer() {
    const cart = getCart();
    const button = document.getElementById("globalCartBtn");
    const items = document.getElementById("drawerItems");
    const totalLabel = document.getElementById("drawerTotal");
    const wppButton = document.getElementById("drawerWppBtn");

    button.textContent = cart.length ? `Carrito: ${formatCOP(total(cart))}` : "Carrito vacio";
    totalLabel.textContent = `Total: ${formatCOP(total(cart))}`;

    if (!cart.length) {
      items.innerHTML = `<p class="cart-empty">Aun no tienes productos en el carrito.</p>`;
      wppButton.href = "inventario.html";
      wppButton.textContent = "Ir a inventario";
      return;
    }

    items.innerHTML = cart.map((item) => `
      <article class="drawer-item">
        <div class="drawer-item-main">
          <strong>${escapeHtml(item.name)}</strong>
          <p>${formatCOP(item.price)} x ${item.qty}</p>
          <small>Subtotal: ${formatCOP(item.price * item.qty)}</small>
        </div>
        <div class="drawer-item-actions">
          <button type="button" class="chip drawer-qty-btn" data-action="decrease" data-id="${item.id}">-</button>
          <button type="button" class="chip drawer-qty-btn" data-action="increase" data-id="${item.id}">+</button>
          <button type="button" class="chip drawer-remove-btn" data-id="${item.id}">Quitar</button>
        </div>
      </article>
    `).join("");

    wppButton.href = getWhatsAppLink(cart);
    wppButton.textContent = "Enviar a WhatsApp";
  }

  function attachEvents() {
    const button = document.getElementById("globalCartBtn");
    const overlay = document.getElementById("cartOverlay");
    const closeButton = document.getElementById("closeDrawerBtn");
    const clearButton = document.getElementById("drawerClearBtn");
    const items = document.getElementById("drawerItems");

    button.addEventListener("click", () => {
      toggleDrawer();
      renderDrawer();
    });

    overlay.addEventListener("click", () => toggleDrawer(false));
    closeButton.addEventListener("click", () => toggleDrawer(false));

    clearButton.addEventListener("click", () => {
      clearCart();
      renderDrawer();
    });

    items.addEventListener("click", (event) => {
      const qtyButton = event.target.closest(".drawer-qty-btn");
      if (qtyButton) {
        changeQty(Number(qtyButton.dataset.id), qtyButton.dataset.action);
        renderDrawer();
        return;
      }

      const removeButton = event.target.closest(".drawer-remove-btn");
      if (removeButton) {
        removeFromCart(Number(removeButton.dataset.id));
        renderDrawer();
      }
    });
  }

  ensureUI();
  attachEvents();
  renderDrawer();

  window.addEventListener("storage", renderDrawer);
  window.addEventListener("fh-cart-updated", renderDrawer);
})();
