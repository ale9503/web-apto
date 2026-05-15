// =============================================================
//  APARTASHOWER — Lista de Regalos
//  app.js — Conectado a Google Sheets vía Apps Script
// =============================================================

// ─────────────────────────────────────────
// 1. URL DEL APPS SCRIPT
// ─────────────────────────────────────────
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwJRuGKwckjTcQ5Vqd_pjnALVZ3QSS0ZvZLTemIQD4FXjL-wFpaJeByg_WIlx5aZjh8/exec";

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
let nombreUsuario   = localStorage.getItem("apto_nombre") || "";
let emailUsuario    = localStorage.getItem("apto_email") || "";
let productoPendiente = null;
let filtroActivo    = "todos";
let productosCache  = [];       // últimos datos del Sheet
let intervaloPolling = null;

document.addEventListener("DOMContentLoaded", () => {
  if (nombreUsuario && emailUsuario) {
    document.getElementById("top-bar-nombre").textContent = nombreUsuario;
    document.getElementById("footer-usuario").textContent = `Conectad@ como ${nombreUsuario}`;
  }
  cargarProductos();
  intervaloPolling = setInterval(cargarProductos, 10000);
});

// ─────────────────────────────────────────
// 4. ENTRADA DEL USUARIO
// ─────────────────────────────────────────
function entrarConNombre() {
  const inputNombre = document.getElementById("input-nombre");
  const inputEmail  = document.getElementById("input-email");
  const nombre = inputNombre.value.trim();
  const email  = inputEmail.value.trim();

  if (!nombre || nombre.length < 2) {
    const err = document.getElementById("error-nombre");
    err.textContent = "Por favor escribe al menos 2 caracteres en el nombre 🌿";
    inputNombre.focus();
    return;
  }

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    const err = document.getElementById("error-nombre");
    err.textContent = "Por favor escribe un correo válido 📧";
    inputEmail.focus();
    return;
  }

  nombreUsuario = nombre;
  emailUsuario  = email;
  
  localStorage.setItem("apto_nombre", nombre);
  localStorage.setItem("apto_email", email);
  
  document.getElementById("top-bar-nombre").textContent = nombre;
  document.getElementById("footer-usuario").textContent = `Conectad@ como ${nombre}`;
  document.getElementById("modal-auth").classList.add("hidden");

  if (productoPendiente === "mis_regalos") {
    productoPendiente = null;
    abrirMisRegalos();
  } else if (productoPendiente) {
    const id = productoPendiente;
    productoPendiente = null;
    abrirConfirmar(id);
  } else {
    cargarProductos();
  }
}

document.getElementById("input-nombre").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("input-email").focus();
  document.getElementById("error-nombre").textContent = "";
});

document.getElementById("input-email").addEventListener("keydown", (e) => {
  if (e.key === "Enter") entrarConNombre();
  document.getElementById("error-nombre").textContent = "";
});

// ─────────────────────────────────────────
// 5. LEER DATOS DEL SHEET
// ─────────────────────────────────────────
function cargarProductos() {
  const url = `${SCRIPT_URL}?accion=leer&email=${encodeURIComponent(emailUsuario)}`;
  fetch(url)
    .then(r => r.json())
    .then(data => {
      if (data.productos) {
        productosCache = data.productos;
        renderizarProductos();
        actualizarStats();
        renderizarRanking();
        actualizarMisRegalos();
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
  if (!nombreUsuario || !emailUsuario) {
    productoPendiente = id;
    document.getElementById("modal-auth").classList.remove("hidden");
    return;
  }

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

  const url = `${SCRIPT_URL}?accion=reservar&id=${encodeURIComponent(productoSeleccionado)}&quien=${encodeURIComponent(nombreUsuario)}&email=${encodeURIComponent(emailUsuario)}`;

  fetch(url)
    .then(r => r.json())
    .then(data => {
      if (data.exito) {
        cerrarConfirmar();
        mostrarToast(`¡Perfecto ${nombreUsuario}! Tu regalo está reservado 🎉`);
        cargarProductos();
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
// 9.5 CANCELAR, MIS REGALOS Y RANKING
// ─────────────────────────────────────────
function abrirMisRegalos() {
  if (!nombreUsuario || !emailUsuario) {
    productoPendiente = "mis_regalos";
    document.getElementById("modal-auth").classList.remove("hidden");
    return;
  }
  document.getElementById("modal-mis-regalos").classList.remove("hidden");
  actualizarMisRegalos();
}

function cerrarMisRegalos() {
  document.getElementById("modal-mis-regalos").classList.add("hidden");
}

function actualizarMisRegalos() {
  const misRegalos = productosCache.filter(p => p.esMio === true);
  document.getElementById("badge-mis-regalos").textContent = misRegalos.length;

  const list = document.getElementById("mis-regalos-list");
  if (misRegalos.length === 0) {
    list.innerHTML = `<p class="confirm-hint" style="text-align:center; padding: 2rem;">Aún no has reservado ningún regalo.</p>`;
    return;
  }

  list.innerHTML = "";
  misRegalos.forEach(p => {
    const det = PRODUCTOS_DETALLE[p.id] || {};
    const item = document.createElement("div");
    item.className = "mis-regalo-item";
    item.innerHTML = `
      <div class="mis-regalo-info">
        <span class="mis-regalo-emoji">${det.emoji || "🎁"}</span>
        <div class="mis-regalo-text">
          <h4>${escapeHtml(p.nombre)}</h4>
          <p>${formatPrecio(det.precio || 0)}</p>
        </div>
      </div>
      <button class="btn-quitar" onclick="cancelarRegalo('${p.id}')" id="btn-cancelar-${p.id}">
        Quitar
      </button>
    `;
    list.appendChild(item);
  });
}

function cancelarRegalo(id) {
  if (!confirm("¿Seguro que quieres quitar este regalo de tu lista?")) return;

  const btn = document.getElementById(`btn-cancelar-${id}`);
  if (btn) { btn.disabled = true; btn.textContent = "⏳"; }

  const url = `${SCRIPT_URL}?accion=cancelar&id=${encodeURIComponent(id)}&email=${encodeURIComponent(emailUsuario)}`;

  fetch(url)
    .then(r => r.json())
    .then(data => {
      if (data.exito) {
        mostrarToast("Regalo liberado correctamente.");
        cargarProductos();
      } else {
        mostrarToast(`⚠️ ${data.error || "No se pudo cancelar."}`);
      }
    })
    .catch(() => mostrarToast("⚠️ Error de conexión."))
    .finally(() => {
      if (btn) { btn.disabled = false; btn.textContent = "Quitar"; }
    });
}

function renderizarRanking() {
  const conteo = {};
  productosCache.forEach(p => {
    const tomado = p.tomado === true || String(p.tomado).toUpperCase() === "TRUE";
    if (tomado && p.quien) {
      conteo[p.quien] = (conteo[p.quien] || 0) + 1;
    }
  });

  const ranking = Object.keys(conteo)
    .map(nombre => ({ nombre, puntaje: conteo[nombre] }))
    .sort((a, b) => b.puntaje - a.puntaje)
    .slice(0, 3);

  const list = document.getElementById("ranking-list");
  
  if (ranking.length === 0) {
    list.innerHTML = `<span class="card-descripcion">Aún no hay padrinos. ¡Sé el primero! 🌱</span>`;
    return;
  }

  list.innerHTML = "";
  const medallas = ["🥇", "🥈", "🥉"];
  
  ranking.forEach((user, index) => {
    const item = document.createElement("div");
    item.className = "ranking-item";
    item.innerHTML = `
      <span class="ranking-medal">${medallas[index] || "🏅"}</span>
      <div class="ranking-info">
        <span class="ranking-name">${escapeHtml(user.nombre)}</span>
        <span class="ranking-score">${user.puntaje} regalo${user.puntaje > 1 ? 's' : ''}</span>
      </div>
    `;
    list.appendChild(item);
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
