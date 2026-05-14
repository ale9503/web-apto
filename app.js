// =============================================================
//  APARTASHOWER — Lista de Regalos
//  app.js — Conectado a Google Sheets vía Apps Script
// =============================================================

// ─────────────────────────────────────────
// 1. URL DEL APPS SCRIPT
// ─────────────────────────────────────────
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw3bbcEdVxdyFCpTdUCbYI101CC4BCwb_Sd3ZXrR-GybW-XT2tJnB_6L1W1F8nBBU6InQ/exec";

// ─────────────────────────────────────────
// 2. PRODUCTOS — mismos IDs que el Sheet
//    (aquí van los detalles visuales)
// ─────────────────────────────────────────
const PRODUCTOS_DETALLE = {
  p01: { emoji: "🍳", descripcion: "Perfecta para el día a día en la cocina.",        precio: 145000, categoria: "cocina" },
  p02: { emoji: "🫖", descripcion: "Elegante y duradera para la mesa.",               precio: 68000,  categoria: "cocina" },
  p03: { emoji: "☕", descripcion: "Diseño minimalista con platos incluidos.",         precio: 95000,  categoria: "cocina" },
  p04: { emoji: "🥄", descripcion: "Tenedores, cuchillos y cucharas.",                precio: 120000, categoria: "cocina" },
  p05: { emoji: "🧑‍🍳", descripcion: "Resistente y ecológica. Grande.",              precio: 85000,  categoria: "cocina" },
  p06: { emoji: "🪴", descripcion: "Trae naturaleza a cualquier rincón del hogar.",   precio: 75000,  categoria: "deco"   },
  p07: { emoji: "🕯️", descripcion: "Fragancias de cedro, lavanda y vainilla.",        precio: 58000,  categoria: "deco"   },
  p08: { emoji: "🖼️", descripcion: "Estilo nórdico, para pared o mesa. 20x25cm.",    precio: 62000,  categoria: "deco"   },
  p09: { emoji: "🧺", descripcion: "Para especias, utensilios o decoración.",         precio: 80000,  categoria: "deco"   },
  p10: { emoji: "💐", descripcion: "Minimalista. Ideal para flores naturales o secas.", precio: 55000, categoria: "deco"  },
  p11: { emoji: "🚿", descripcion: "Dispensador + porta cepillos + vaso. 3 piezas.",  precio: 95000,  categoria: "bano"   },
  p12: { emoji: "🛁", descripcion: "100% algodón. Color neutro. Talla adulto.",       precio: 88000,  categoria: "bano"   },
  p13: { emoji: "🧴", descripcion: "Microfibra absorbente. Suave y lavable.",         precio: 55000,  categoria: "bano"   },
  p14: { emoji: "🌿", descripcion: "Sal, pimienta, orégano, comino, ají y más.",      precio: 70000,  categoria: "cocina" },
  p15: { emoji: "💡", descripcion: "Luz cálida, recargable por USB-C. Regulable.",    precio: 150000, categoria: "hogar"  },
  p16: { emoji: "🛋️", descripcion: "Tejido premium, relleno antialérgico. 45x45cm.", precio: 65000,  categoria: "hogar"  },
  p17: { emoji: "🧹", descripcion: "Escoba, recogedor y trapero plegable.",           precio: 110000, categoria: "hogar"  },
  p18: { emoji: "🍷", descripcion: "Vidrio cristal. Elegantes y resistentes.",        precio: 98000,  categoria: "cocina" }
};

// ─────────────────────────────────────────
// 3. ESTADO GLOBAL
// ─────────────────────────────────────────
let nombreUsuario   = "";
let productoSeleccionado = null;
let filtroActivo    = "todos";
let productosCache  = [];       // últimos datos del Sheet
let intervaloPolling = null;

// ─────────────────────────────────────────
// 4. ENTRADA DEL USUARIO
// ─────────────────────────────────────────
function entrarConNombre() {
  const input  = document.getElementById("input-nombre");
  const nombre = input.value.trim();

  if (!nombre || nombre.length < 2) {
    const err = document.getElementById("error-nombre");
    err.textContent = "Por favor escribe al menos 2 caracteres 🌿";
    input.focus();
    return;
  }

  nombreUsuario = nombre;
  document.getElementById("footer-usuario").textContent = `Conectad@ como ${nombre}`;
  document.getElementById("modal-bienvenida").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");

  cargarProductos();
  // Refrescar cada 10 segundos para ver si alguien más reservó
  intervaloPolling = setInterval(cargarProductos, 10000);
}

document.getElementById("input-nombre").addEventListener("keydown", (e) => {
  if (e.key === "Enter") entrarConNombre();
  document.getElementById("error-nombre").textContent = "";
});

// ─────────────────────────────────────────
// 5. LEER DATOS DEL SHEET
// ─────────────────────────────────────────
function cargarProductos() {
  fetch(`${SCRIPT_URL}?accion=leer`)
    .then(r => r.json())
    .then(data => {
      if (data.productos) {
        productosCache = data.productos;
        renderizarProductos();
        actualizarStats();
      }
    })
    .catch(() => {
      mostrarToast("⚠️ No se pudo conectar con la lista. Reintentando...");
    });
}

// ─────────────────────────────────────────
// 6. RENDERIZAR PRODUCTOS
// ─────────────────────────────────────────
function renderizarProductos() {
  const grid = document.getElementById("productos-grid");

  const filtrados = filtroActivo === "todos"
    ? productosCache
    : productosCache.filter(p => {
        const det = PRODUCTOS_DETALLE[p.id];
        return det && det.categoria === filtroActivo;
      });

  if (filtrados.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <span class="empty-emoji">🌱</span>
        <h3>No hay productos en esta categoría</h3>
        <p>Prueba con otro filtro.</p>
      </div>`;
    return;
  }

  grid.innerHTML = "";

  filtrados.forEach((producto, index) => {
    const det    = PRODUCTOS_DETALLE[producto.id] || {};
    const tomado = producto.tomado === true || String(producto.tomado).toUpperCase() === "TRUE";
    const quien  = producto.quien || "";

    const card = document.createElement("div");
    card.className = `producto-card${tomado ? " tomada" : ""}`;
    card.style.animationDelay = `${index * 0.06}s`;
    card.setAttribute("data-id", producto.id);
    card.setAttribute("role", "article");

    card.innerHTML = `
      <div class="card-badge ${tomado ? "tomado" : "disponible"}">
        ${tomado ? "✅ Reservado" : "✨ Disponible"}
      </div>
      <span class="card-emoji">${det.emoji || "🎁"}</span>
      <div class="card-categoria">${categoriaLabel(det.categoria)}</div>
      <h3 class="card-nombre">${escapeHtml(producto.nombre)}</h3>
      <p class="card-descripcion">${det.descripcion || ""}</p>
      <p class="card-precio">${formatPrecio(det.precio || 0)}</p>
      ${tomado
        ? `<p class="card-quien">🎁 ${escapeHtml(quien)} ya lo reservó</p>`
        : `<button
             class="card-btn"
             id="btn-producto-${producto.id}"
             onclick="abrirConfirmar('${producto.id}')"
             aria-label="Reservar ${escapeHtml(producto.nombre)}"
           >Llevar este regalo 🎁</button>`
      }
    `;

    if (!tomado) {
      card.addEventListener("click", (e) => {
        if (!e.target.closest(".card-btn")) abrirConfirmar(producto.id);
      });
    }

    grid.appendChild(card);
  });
}

// ─────────────────────────────────────────
// 7. FILTRAR
// ─────────────────────────────────────────
function filtrar(btn, categoria) {
  document.querySelectorAll(".filtro-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  filtroActivo = categoria;
  renderizarProductos();
}

// ─────────────────────────────────────────
// 8. MODAL CONFIRMAR
// ─────────────────────────────────────────
function abrirConfirmar(id) {
  const producto = productosCache.find(p => p.id === id);
  if (!producto) return;

  const tomado = producto.tomado === true || String(producto.tomado).toUpperCase() === "TRUE";
  if (tomado) return;

  const det = PRODUCTOS_DETALLE[id] || {};
  productoSeleccionado = id;

  document.getElementById("confirm-emoji").textContent         = det.emoji || "🎁";
  document.getElementById("confirm-nombre-producto").textContent = producto.nombre;
  document.getElementById("confirm-precio-producto").textContent = formatPrecio(det.precio || 0);
  document.getElementById("modal-confirmar").classList.remove("hidden");
}

function cerrarConfirmar() {
  document.getElementById("modal-confirmar").classList.add("hidden");
  productoSeleccionado = null;
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") cerrarConfirmar();
});

// ─────────────────────────────────────────
// 9. CONFIRMAR REGALO → escribir al Sheet
// ─────────────────────────────────────────
function confirmarRegalo() {
  if (!productoSeleccionado) return;

  const btn = document.getElementById("btn-confirmar");
  btn.disabled    = true;
  btn.textContent = "Guardando...";

  const url = `${SCRIPT_URL}?accion=reservar&id=${encodeURIComponent(productoSeleccionado)}&quien=${encodeURIComponent(nombreUsuario)}`;

  fetch(url)
    .then(r => r.json())
    .then(data => {
      if (data.exito) {
        cerrarConfirmar();
        mostrarToast(`¡Perfecto ${nombreUsuario}! Tu regalo está reservado 🎉`);
        cargarProductos(); // refrescar inmediatamente
      } else {
        mostrarToast(`⚠️ ${data.error || "No se pudo reservar. Intenta de nuevo."}`);
        cerrarConfirmar();
        cargarProductos();
      }
    })
    .catch(() => {
      mostrarToast("⚠️ Error de conexión. Intenta de nuevo.");
    })
    .finally(() => {
      btn.disabled    = false;
      btn.textContent = "¡Sí, lo llevo! 🎉";
    });
}

// ─────────────────────────────────────────
// 10. STATS
// ─────────────────────────────────────────
function actualizarStats() {
  let tomados = 0;
  productosCache.forEach(p => {
    if (p.tomado === true || String(p.tomado).toUpperCase() === "TRUE") tomados++;
  });
  const disponibles = productosCache.length - tomados;
  document.getElementById("stat-disponibles").textContent = disponibles;
  document.getElementById("stat-tomados").textContent     = tomados;
}

// ─────────────────────────────────────────
// 11. TOAST
// ─────────────────────────────────────────
let toastTimeout;
function mostrarToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("visible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("visible"), 3500);
}

// ─────────────────────────────────────────
// 12. HELPERS
// ─────────────────────────────────────────
function formatPrecio(n) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP", minimumFractionDigits: 0
  }).format(n);
}

function categoriaLabel(cat) {
  const map = { cocina: "🍳 Cocina", deco: "🪴 Decoración", bano: "🚿 Baño", hogar: "🏠 Hogar" };
  return map[cat] || "🎁 General";
}

function escapeHtml(str) {
  const d = document.createElement("div");
  d.appendChild(document.createTextNode(str || ""));
  return d.innerHTML;
}
