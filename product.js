let PRODUCTS = [];
let activeCategory = "all";
let cart = [];

const PHONE = "573001234567";
const CART_STORAGE_KEY = "fh_dermatologia_cart";
const SHEETS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQkLd9bWeFIt1JkN3kOHpFZTguCJJN34JBJTfKcd0cN1lysSs8ZhSvUym-McXYDc9qAxq7YukamoOTv/pub?gid=1701849434&single=true&output=csv";

const grid = document.getElementById("productGrid");
const searchInput = document.getElementById("search");
const categoryChips = document.getElementById("categoryChips");
const sortSelect = document.getElementById("sort");
const cartItemsEl = document.getElementById("cartItems");
const cartTotalEl = document.getElementById("cartTotal");
const clearCartBtn = document.getElementById("clearCartBtn");
const sendCartBtn = document.getElementById("sendCartBtn");
const FALLBACK_IMAGE = "https://via.placeholder.com/600x600?text=Sin+imagen";

function getInitialCategoryFromUrl() {
  const category = new URLSearchParams(window.location.search).get("cat");
  return category ? category.trim() : "all";
}

function formatCOP(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(value);
}

function stockLabel(stock) {
  if (stock <= 0) return { text: "Agotado", cls: "badge-out" };
  if (stock <= 5) return { text: "Pocas unidades", cls: "badge-low" };
  return { text: "Disponible", cls: "badge-ok" };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeText(value, maxLength = 180) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function sanitizeNumber(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function sanitizeImageUrl(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return FALLBACK_IMAGE;

  if (raw.startsWith("img/")) return raw;

  try {
    const parsed = new URL(raw, window.location.href);
    return parsed.protocol === "https:" ? parsed.href : FALLBACK_IMAGE;
  } catch {
    return FALLBACK_IMAGE;
  }
}

function singleProductWhatsappLink(product) {
  const msg = `Hola, quiero informacion de ${product.name} por ${formatCOP(product.price)}.`;
  return `https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`;
}

function productCard(product) {
  const stock = stockLabel(product.stock);
  const disabled = product.stock <= 0 ? "disabled" : "";
  const safeName = escapeHtml(product.name);
  const safeDesc = escapeHtml(product.description);
  const safeImage = escapeHtml(product.image);

  return `
    <article class="product-card">
      <img src="${safeImage}" alt="${safeName}" loading="lazy"
           onerror="this.src='${FALLBACK_IMAGE}'">
      <div class="product-body">
        <h3>${safeName}</h3>
        <p class="price">${formatCOP(product.price)}</p>
        <p class="desc">${safeDesc}</p>
        <div class="meta">
          <span class="badge ${stock.cls}">${stock.text}</span>
          <span>Stock: ${product.stock}</span>
        </div>
        <div class="product-actions">
          <button type="button" class="btn add-cart-btn" data-id="${product.id}" ${disabled}>
            Agregar al carrito
          </button>
          <a class="btn secondary-btn" target="_blank" rel="noopener noreferrer" href="${singleProductWhatsappLink(product)}">
            Consultar
          </a>
        </div>
      </div>
    </article>
  `;
}

function renderCategoryChips() {
  const categories = [...new Set(PRODUCTS.map((p) => p.category).filter(Boolean))].sort();

  categoryChips.innerHTML = `
    <button type="button" class="chip ${activeCategory === "all" ? "active" : ""}" data-category="all">Todas</button>
    ${categories.map((cat) => `
      <button type="button" class="chip ${activeCategory === cat ? "active" : ""}" data-category="${escapeHtml(cat)}">
        ${escapeHtml(cat)}
      </button>
    `).join("")}
  `;
}

function cartTotal() {
  return cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
}

function saveCart() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("fh-cart-updated"));
}

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    cart = Array.isArray(parsed) ? parsed : [];
  } catch {
    cart = [];
  }
}

function syncCartFromStorage() {
  loadCart();
  renderCart();
}

function renderCart() {
  if (!cart.length) {
    cartItemsEl.innerHTML = `<p class="cart-empty">Aun no hay productos en el carrito.</p>`;
    cartTotalEl.textContent = formatCOP(0);
    sendCartBtn.disabled = true;
    return;
  }

  cartItemsEl.innerHTML = cart.map((item) => `
    <div class="cart-item">
      <div>
        <strong>${escapeHtml(item.name)}</strong>
        <p>${formatCOP(item.price)} x ${item.qty}</p>
      </div>
      <div class="cart-item-actions">
        <button type="button" class="chip cart-qty-btn" data-action="decrease" data-id="${item.id}">-</button>
        <button type="button" class="chip cart-qty-btn" data-action="increase" data-id="${item.id}">+</button>
        <button type="button" class="chip cart-remove-btn" data-id="${item.id}">Quitar</button>
      </div>
    </div>
  `).join("");

  cartTotalEl.textContent = formatCOP(cartTotal());
  sendCartBtn.disabled = false;
}

function addToCart(productId) {
  // Ensure we always work with the latest shared cart state.
  loadCart();

  const product = PRODUCTS.find((p) => p.id === productId);
  if (!product || product.stock <= 0) return;

  const existing = cart.find((item) => item.id === productId);
  if (existing) {
    if (existing.qty < product.stock) existing.qty += 1;
  } else {
    cart.push({
      id: product.id,
      name: sanitizeText(product.name, 120),
      price: product.price,
      stock: product.stock,
      qty: 1
    });
  }

  saveCart();
  renderCart();
}

function changeQty(productId, action) {
  loadCart();
  const item = cart.find((p) => p.id === productId);
  if (!item) return;

  if (action === "increase" && item.qty < item.stock) item.qty += 1;
  if (action === "decrease") item.qty -= 1;
  if (item.qty <= 0) cart = cart.filter((p) => p.id !== productId);

  saveCart();
  renderCart();
}

function removeFromCart(productId) {
  loadCart();
  cart = cart.filter((p) => p.id !== productId);
  saveCart();
  renderCart();
}

function clearCart() {
  cart = [];
  saveCart();
  renderCart();
}

function sendCartToWhatsApp() {
  if (!cart.length) return;

  const lines = cart.map((item) => `- ${item.name} x${item.qty}: ${formatCOP(item.price * item.qty)}`);
  const message = [
    "Hola, quiero realizar este pedido:",
    "",
    ...lines,
    "",
    `Total: ${formatCOP(cartTotal())}`
  ].join("\n");

  const link = `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`;
  window.open(link, "_blank", "noopener,noreferrer");
}

function applyFilters() {
  const q = searchInput.value.toLowerCase().trim();
  const sort = sortSelect.value;

  let items = [...PRODUCTS];

  if (q) {
    items = items.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
  }

  if (activeCategory !== "all") {
    items = items.filter((p) => p.category === activeCategory);
  }

  if (sort === "price-asc") items.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") items.sort((a, b) => b.price - a.price);
  if (sort === "stock-desc") items.sort((a, b) => b.stock - a.stock);

  grid.innerHTML = items.length
    ? items.map(productCard).join("")
    : `<p>No hay productos para ese filtro.</p>`;
}

async function loadProductsFromSheets() {
  try {
    const response = await fetch(SHEETS_CSV_URL);
    const csvText = await response.text();

    if (csvText.trim().startsWith("<!DOCTYPE html") || csvText.trim().startsWith("<html")) {
      throw new Error("El enlace no devolvio CSV. Revisa que el Sheet este publicado en formato CSV.");
    }

    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.replace(/^\ufeff/, "").trim().toLowerCase()
    });

    PRODUCTS = parsed.data.map((row) => ({
      id: sanitizeNumber(row.id, 0, 9999999),
      name: sanitizeText(row.nombre || row.name, 120),
      price: sanitizeNumber(row.precio ?? row.price, 0, 999999999),
      stock: sanitizeNumber(row.stock, 0, 100000),
      category: sanitizeText(row.categoria || row.category || "General", 50),
      image: sanitizeImageUrl(row.imagen || row.image),
      description: sanitizeText(row.descripcion || row.description, 240)
    })).filter((p) => p.id && p.name);

    // Keep cart valid if sheet changed stock or removed products.
    cart = cart
      .filter((item) => PRODUCTS.some((p) => p.id === item.id))
      .map((item) => {
        const product = PRODUCTS.find((p) => p.id === item.id);
        return { ...item, stock: product.stock, qty: Math.min(item.qty, product.stock) };
      })
      .filter((item) => item.qty > 0);

    saveCart();
    const urlCategory = getInitialCategoryFromUrl();
    if (urlCategory !== "all" && PRODUCTS.some((p) => p.category === urlCategory)) {
      activeCategory = urlCategory;
    }

    renderCategoryChips();
    applyFilters();
    renderCart();
  } catch (error) {
    grid.innerHTML = `<p>No se pudo cargar el inventario.</p>`;
    console.error("Error cargando inventario:", error);
  }
}

categoryChips.addEventListener("click", (e) => {
  const btn = e.target.closest(".chip");
  if (!btn) return;
  activeCategory = btn.dataset.category;
  renderCategoryChips();
  applyFilters();
});

grid.addEventListener("click", (e) => {
  const btn = e.target.closest(".add-cart-btn");
  if (!btn) return;
  addToCart(Number(btn.dataset.id));
});

cartItemsEl.addEventListener("click", (e) => {
  const qtyBtn = e.target.closest(".cart-qty-btn");
  if (qtyBtn) {
    changeQty(Number(qtyBtn.dataset.id), qtyBtn.dataset.action);
    return;
  }

  const removeBtn = e.target.closest(".cart-remove-btn");
  if (removeBtn) removeFromCart(Number(removeBtn.dataset.id));
});

clearCartBtn.addEventListener("click", clearCart);
sendCartBtn.addEventListener("click", sendCartToWhatsApp);
[searchInput, sortSelect].forEach((el) => el.addEventListener("input", applyFilters));
window.addEventListener("fh-cart-updated", syncCartFromStorage);
window.addEventListener("storage", syncCartFromStorage);

loadCart();
renderCart();
loadProductsFromSheets();
