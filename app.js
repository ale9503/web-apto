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
  p01: { emoji: "🍳", descripcion: "Perfecta para el día a día en la cocina.",        precio: 145000, categoria: "cocina", url: "https://www.amazon.com/s?k=sarten+antiadherente+28cm" },
  p02: { emoji: "🫖", descripcion: "Elegante y duradera para la mesa.",               precio: 68000,  categoria: "cocina", url: "https://www.amazon.com/s?k=jarra+vidrio" },
  p03: { emoji: "☕", descripcion: "Diseño minimalista con platos incluidos.",         precio: 95000,  categoria: "cocina", url: "https://www.amazon.com/s?k=tazas+cafe" },
  p04: { emoji: "🥄", descripcion: "Tenedores, cuchillos y cucharas.",                precio: 120000, categoria: "cocina", url: "https://www.amazon.com/s?k=cubiertos" },
  p05: { emoji: "🧑‍🍳", descripcion: "Resistente y ecológica. Grande.",              precio: 85000,  categoria: "cocina", url: "https://www.amazon.com/s?k=tabla+picar+bambu" },
  p06: { emoji: "🪴", descripcion: "Trae naturaleza a cualquier rincón del hogar.",   precio: 75000,  categoria: "deco",   url: "https://www.amazon.com/s?k=planta+interior+maceta" },
  p07: { emoji: "🕯️", descripcion: "Fragancias de cedro, lavanda y vainilla.",        precio: 58000,  categoria: "deco",   url: "https://www.amazon.com/s?k=velas+aromaticas" },
  p08: { emoji: "🖼️", descripcion: "Estilo nórdico, para pared o mesa. 20x25cm.",    precio: 62000,  categoria: "deco",   url: "https://www.amazon.com/s?k=marco+fotos+madera" },
  p09: { emoji: "🧺", descripcion: "Para especias, utensilios o decoración.",         precio: 80000,  categoria: "deco",   url: "https://www.amazon.com/s?k=organizador+cocina+bambu" },
  p10: { emoji: "💐", descripcion: "Minimalista. Ideal para flores naturales o secas.", precio: 55000, categoria: "deco",  url: "https://www.amazon.com/s?k=florero+vidrio" },
  p11: { emoji: "🚿", descripcion: "Dispensador + porta cepillos + vaso. 3 piezas.",  precio: 95000,  categoria: "bano",   url: "https://www.amazon.com/s?k=accesorios+bano+bambu" },
  p12: { emoji: "🛁", descripcion: "100% algodón. Color neutro. Talla adulto.",       precio: 88000,  categoria: "bano",   url: "https://www.amazon.com/s?k=toallas+bano+premium" },
  p13: { emoji: "🧴", descripcion: "Microfibra absorbente. Suave y lavable.",         precio: 55000,  categoria: "bano",   url: "https://www.amazon.com/s?k=tapete+bano+antideslizante" },
  p14: { emoji: "🌿", descripcion: "Sal, pimienta, orégano, comino, ají y más.",      precio: 70000,  categoria: "cocina", url: "https://www.amazon.com/s?k=set+especias" },
  p15: { emoji: "💡", descripcion: "Luz cálida, recargable por USB-C. Regulable.",    precio: 150000, categoria: "hogar",  url: "https://www.amazon.com/s?k=lampara+mesa+led" },
  p16: { emoji: "🛋️", descripcion: "Tejido premium, relleno antialérgico. 45x45cm.", precio: 65000,  categoria: "hogar",  url: "https://www.amazon.com/s?k=cojin+decorativo" },
  p17: { emoji: "🧹", descripcion: "Escoba, recogedor y trapero plegable.",           precio: 110000, categoria: "hogar",  url: "https://www.amazon.com/s?k=set+limpieza" },
  p18: { emoji: "🍷", descripcion: "Vidrio cristal. Elegantes y resistentes.",        precio: 98000,  categoria: "cocina", url: "https://www.amazon.com/s?k=copas+vino" }
};

// ─────────────────────────────────────────
// 3. ESTADO GLOBAL
// ─────────────────────────────────────────
let nombreUsuario   = localStorage.getItem("apto_nombre") || "";
let emailUsuario    = localStorage.getItem("apto_email") || "";
let productoPendiente = null;
let filtroActivo    = "todos";     // filtro categoría
let filtroPrecioActivo = "todos";  // filtro presupuesto
let productosCache  = [];          // últimos datos del Sheet
let intervaloPolling = null;
let adminToken      = sessionStorage.getItem("apto_admin_token") || "";  // sesión admin
let modoEdicionAdmin = null;  // null = agregar, string = id del regalo a editar

document.addEventListener("DOMContentLoaded", () => {
  if (nombreUsuario && emailUsuario) {
    document.getElementById("top-bar-nombre").textContent = nombreUsuario;
    document.getElementById("footer-usuario").textContent = `Conectad@ como ${nombreUsuario}`;
  }

  // Keyboard shortcuts para admin
  document.getElementById("admin-input-user").addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("admin-input-password").focus();
    document.getElementById("admin-error").textContent = "";
  });
  document.getElementById("admin-input-password").addEventListener("keydown", (e) => {
    if (e.key === "Enter") loginAdmin();
    document.getElementById("admin-error").textContent = "";
  });
  document.getElementById("admin-regalo-id").addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("admin-regalo-nombre").focus();
    document.getElementById("admin-regalo-error").textContent = "";
  });
  document.getElementById("admin-regalo-nombre").addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("admin-regalo-url").focus();
    document.getElementById("admin-regalo-error").textContent = "";
  });
  document.getElementById("admin-regalo-url").addEventListener("keydown", (e) => {
    if (e.key === "Enter") guardarRegaloAdmin();
    document.getElementById("admin-regalo-error").textContent = "";
  });

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
  const url = `${SCRIPT_URL}?accion=leer&email=${encodeURIComponent(emailUsuario)}&_t=${Date.now()}`;
  fetch(url, { cache: "no-store" })
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

  // Filtro por categoría
  let filtrados = filtroActivo === "todos"
    ? productosCache
    : productosCache.filter(p => {
        const det = PRODUCTOS_DETALLE[p.id];
        return det && det.categoria === filtroActivo;
      });

  // Filtro por presupuesto
  if (filtroPrecioActivo !== "todos") {
    filtrados = filtrados.filter(p => {
      const precio = (PRODUCTOS_DETALLE[p.id] || {}).precio || 0;
      if (filtroPrecioActivo === "low")  return precio < 50000;
      if (filtroPrecioActivo === "mid")  return precio >= 50000 && precio <= 100000;
      if (filtroPrecioActivo === "high") return precio > 100000;
      return true;
    });
  }

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
      ${det.url || producto.url ? `<a href="${det.url || producto.url}" target="_blank" rel="noopener noreferrer" class="card-link-tienda" onclick="event.stopPropagation()">Ver en tienda 🛒</a>` : ""}
      <p class="card-precio">${formatPrecio(det.precio || 0)}</p>
      ${tomado
        ? `<p class="card-quien">🔒 Ya reservado</p>`
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

function filtrarPrecio(btn, rango) {
  document.querySelectorAll(".filtro-precio-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  filtroPrecioActivo = rango;
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
  document.getElementById("input-mensaje").value = "";
  productoSeleccionado = null;
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    cerrarConfirmar();
    cerrarLoginAdmin();
    cerrarModalRegaloAdmin();
    cerrarPanelAdmin();
  }
});

// ─────────────────────────────────────────
// CERRAR SESIÓN
// ─────────────────────────────────────────
function cerrarSesion() {
  // Limpiar localStorage
  localStorage.removeItem("apto_nombre");
  localStorage.removeItem("apto_email");

  // Resetear estado global
  nombreUsuario = "";
  emailUsuario  = "";
  productoPendiente = null;

  // Limpiar UI de la top bar
  document.getElementById("top-bar-nombre").textContent = "Invitado";
  document.getElementById("footer-usuario").textContent = "";
  document.getElementById("badge-mis-regalos").textContent = "0";

  // Limpiar inputs del modal auth por si quedaron datos
  document.getElementById("input-nombre").value = "";
  document.getElementById("input-email").value = "";
  document.getElementById("error-nombre").textContent = "";

  // Cerrar cualquier modal abierto
  cerrarConfirmar();
  cerrarMisRegalos();

  // Mostrar modal de auth
  document.getElementById("modal-auth").classList.remove("hidden");
}

// ─────────────────────────────────────────
// 9. CONFIRMAR REGALO → escribir al Sheet
// ─────────────────────────────────────────
function confirmarRegalo() {
  if (!productoSeleccionado) return;

  const btn = document.getElementById("btn-confirmar");
  btn.disabled    = true;
  btn.textContent = "Guardando...";

  const mensaje = document.getElementById("input-mensaje").value.trim();
  const url = `${SCRIPT_URL}?accion=reservar&id=${encodeURIComponent(productoSeleccionado)}&quien=${encodeURIComponent(nombreUsuario)}&email=${encodeURIComponent(emailUsuario)}&mensaje=${encodeURIComponent(mensaje)}`;

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

  const url = `${SCRIPT_URL}?accion=cancelar&id=${encodeURIComponent(id)}&email=${encodeURIComponent(emailUsuario)}&_t=${Date.now()}`;

  fetch(url, { cache: "no-store" })
    .then(r => r.json())
    .then(data => {
      if (data.exito) {
        // Actualizar cache local de inmediato (optimistic update)
        productosCache = productosCache.map(p => {
          if (p.id === id) {
            return { ...p, tomado: false, quien: "", esMio: false };
          }
          return p;
        });
        renderizarProductos();
        actualizarStats();
        renderizarRanking();
        actualizarMisRegalos();
        mostrarToast("Regalo liberado correctamente. 🌿");
        // Re-fetch para confirmar con el Sheet real (sin bloquear UI)
        setTimeout(cargarProductos, 1500);
      } else {
        mostrarToast(`⚠️ ${data.error || "No se pudo cancelar."}`);
        if (btn) { btn.disabled = false; btn.textContent = "Quitar"; }
      }
    })
    .catch(() => {
      mostrarToast("⚠️ Error de conexión.");
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
  const total = productosCache.length;
  const disponibles = total - tomados;
  document.getElementById("stat-disponibles").textContent = disponibles;
  document.getElementById("stat-tomados").textContent     = tomados;

  // Barra de progreso
  const pct = total > 0 ? Math.round((tomados / total) * 100) : 0;
  document.getElementById("progreso-bar").style.width = pct + "%";
  document.getElementById("progreso-pct").textContent = pct + "%";
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

// ─────────────────────────────────────────
// 13. ADMIN — LOGIN
// ─────────────────────────────────────────
function abrirLoginAdmin() {
  // Si ya hay sesión admin activa, abrir el panel directamente
  if (adminToken) {
    abrirPanelAdmin();
    return;
  }
  document.getElementById("admin-input-user").value = "";
  document.getElementById("admin-input-password").value = "";
  document.getElementById("admin-error").textContent = "";
  document.getElementById("modal-admin-login").classList.remove("hidden");
  setTimeout(() => document.getElementById("admin-input-user").focus(), 100);
}

function cerrarLoginAdmin() {
  document.getElementById("modal-admin-login").classList.add("hidden");
}

function loginAdmin() {
  const user     = document.getElementById("admin-input-user").value.trim();
  const password = document.getElementById("admin-input-password").value.trim();
  const errEl    = document.getElementById("admin-error");
  const btn      = document.getElementById("btn-admin-login");

  if (!user || !password) {
    errEl.textContent = "Por favor ingresa usuario y contraseña.";
    return;
  }

  btn.disabled    = true;
  btn.textContent = "Verificando...";

  const url = `${SCRIPT_URL}?accion=loginAdmin&user=${encodeURIComponent(user)}&password=${encodeURIComponent(password)}`;

  fetch(url, { cache: "no-store" })
    .then(r => r.json())
    .then(data => {
      if (data.exito && data.adminToken) {
        adminToken = data.adminToken;
        sessionStorage.setItem("apto_admin_token", adminToken);
        cerrarLoginAdmin();
        abrirPanelAdmin();
        mostrarToast("✅ Sesión admin iniciada.");
      } else {
        errEl.textContent = data.error || "Credenciales incorrectas.";
      }
    })
    .catch(() => {
      errEl.textContent = "Error de conexión. Intenta de nuevo.";
    })
    .finally(() => {
      btn.disabled    = false;
      btn.textContent = "Entrar 🔐";
    });
}

function cerrarSesionAdmin() {
  if (!confirm("¿Cerrar sesión de administrador?")) return;
  adminToken = "";
  sessionStorage.removeItem("apto_admin_token");
  cerrarPanelAdmin();
  mostrarToast("Sesión admin cerrada.");
}

// ─────────────────────────────────────────
// 14. ADMIN — PANEL Y LISTA
// ─────────────────────────────────────────
function abrirPanelAdmin() {
  document.getElementById("panel-admin").classList.remove("hidden");
  renderizarListaAdmin();
}

function cerrarPanelAdmin() {
  document.getElementById("panel-admin").classList.add("hidden");
}

function renderizarListaAdmin() {
  const lista = document.getElementById("admin-lista");

  if (productosCache.length === 0) {
    lista.innerHTML = `<p class="confirm-hint" style="text-align:center;padding:2rem;">No hay regalos cargados aún.</p>`;
    return;
  }

  lista.innerHTML = "";
  productosCache.forEach(p => {
    const det    = PRODUCTOS_DETALLE[p.id] || {};
    const tomado = p.tomado === true || String(p.tomado).toUpperCase() === "TRUE";
    const item   = document.createElement("div");
    item.className = "admin-item";
    item.innerHTML = `
      <div class="admin-item-info">
        <span class="admin-item-emoji">${det.emoji || "🎁"}</span>
        <div class="admin-item-text">
          <span class="admin-item-id">${escapeHtml(p.id)}</span>
          <strong>${escapeHtml(p.nombre)}</strong>
          ${tomado ? `<span class="admin-badge-tomado">✅ Reservado por ${escapeHtml(p.quien || "")}</span>` : `<span class="admin-badge-libre">✨ Disponible</span>`}
        </div>
      </div>
      <div class="admin-item-actions">
        <button class="btn-admin-edit" onclick="abrirModalEditarRegalo('${p.id}')" title="Editar nombre">✏️</button>
        <button class="btn-admin-del" onclick="eliminarRegaloAdmin('${p.id}')" title="Eliminar regalo">🗑️</button>
      </div>
    `;
    lista.appendChild(item);
  });
}

// ─────────────────────────────────────────
// 15. ADMIN — MODAL AGREGAR / EDITAR
// ─────────────────────────────────────────
function abrirModalAgregarRegalo() {
  modoEdicionAdmin = null;
  document.getElementById("admin-regalo-titulo").textContent = "Agregar Regalo";
  document.getElementById("admin-regalo-icon").textContent   = "🎁";
  document.getElementById("admin-regalo-id").value           = "";
  document.getElementById("admin-regalo-id").disabled        = false;
  document.getElementById("admin-regalo-nombre").value       = "";
  document.getElementById("admin-regalo-url").value          = "";
  document.getElementById("admin-regalo-error").textContent  = "";
  document.getElementById("modal-admin-regalo").classList.remove("hidden");
  setTimeout(() => document.getElementById("admin-regalo-id").focus(), 100);
}

function abrirModalEditarRegalo(id) {
  const producto = productosCache.find(p => p.id === id);
  if (!producto) return;

  const det = PRODUCTOS_DETALLE[id] || {};
  modoEdicionAdmin = id;
  document.getElementById("admin-regalo-titulo").textContent = "Editar Regalo";
  document.getElementById("admin-regalo-icon").textContent   = det.emoji || "✏️";
  document.getElementById("admin-regalo-id").value           = id;
  document.getElementById("admin-regalo-id").disabled        = true;  // no permitir cambiar el ID
  document.getElementById("admin-regalo-nombre").value       = producto.nombre;
  document.getElementById("admin-regalo-error").textContent  = "";
  document.getElementById("modal-admin-regalo").classList.remove("hidden");
  setTimeout(() => document.getElementById("admin-regalo-nombre").focus(), 100);
}

function cerrarModalRegaloAdmin() {
  document.getElementById("modal-admin-regalo").classList.add("hidden");
  modoEdicionAdmin = null;
}

function guardarRegaloAdmin() {
  const id     = document.getElementById("admin-regalo-id").value.trim();
  const nombre = document.getElementById("admin-regalo-nombre").value.trim();
  const url    = document.getElementById("admin-regalo-url").value.trim();
  const errEl  = document.getElementById("admin-regalo-error");
  const btn    = document.getElementById("btn-guardar-regalo");

  if (!id || id.length < 2) {
    errEl.textContent = "El ID debe tener al menos 2 caracteres.";
    return;
  }
  if (!nombre || nombre.length < 3) {
    errEl.textContent = "El nombre debe tener al menos 3 caracteres.";
    return;
  }

  btn.disabled    = true;
  btn.textContent = "Guardando...";

  const esEdicion = modoEdicionAdmin !== null;
  const accion    = esEdicion ? "editarRegalo" : "agregarRegalo";
  const url2 = `${SCRIPT_URL}?accion=${accion}&adminToken=${encodeURIComponent(adminToken)}&id=${encodeURIComponent(id)}&nombre=${encodeURIComponent(nombre)}&url=${encodeURIComponent(url)}`;

  fetch(url2, { cache: "no-store" })
    .then(r => r.json())
    .then(data => {
      if (data.exito) {
        cerrarModalRegaloAdmin();
        mostrarToast(esEdicion ? `✅ Regalo "${nombre}" actualizado.` : `✅ Regalo "${nombre}" agregado.`);
        cargarProductos();
        // Si el panel está abierto, actualizar la lista
        if (!document.getElementById("panel-admin").classList.contains("hidden")) {
          setTimeout(renderizarListaAdmin, 1200);
        }
      } else {
        // Token expirado
        if (data.error === "No autorizado") {
          errEl.textContent = "La sesión admin expiró. Cierra y vuelve a iniciar sesión.";
          adminToken = "";
          sessionStorage.removeItem("apto_admin_token");
        } else {
          errEl.textContent = data.error || "No se pudo guardar. Intenta de nuevo.";
        }
      }
    })
    .catch(() => {
      errEl.textContent = "Error de conexión. Intenta de nuevo.";
    })
    .finally(() => {
      btn.disabled    = false;
      btn.textContent = "Guardar 💾";
    });
}

// ─────────────────────────────────────────
// 16. ADMIN — ELIMINAR REGALO
// ─────────────────────────────────────────
function eliminarRegaloAdmin(id) {
  const producto = productosCache.find(p => p.id === id);
  const nombre   = producto ? producto.nombre : id;

  if (!confirm(`¿Eliminar el regalo "${nombre}" de la lista?\nEsta acción no se puede deshacer.`)) return;

  const url = `${SCRIPT_URL}?accion=eliminarRegalo&adminToken=${encodeURIComponent(adminToken)}&id=${encodeURIComponent(id)}`;

  fetch(url, { cache: "no-store" })
    .then(r => r.json())
    .then(data => {
      if (data.exito) {
        mostrarToast(`🗑️ Regalo "${nombre}" eliminado.`);
        // Optimistic update
        productosCache = productosCache.filter(p => p.id !== id);
        renderizarProductos();
        actualizarStats();
        renderizarRanking();
        renderizarListaAdmin();
        setTimeout(cargarProductos, 1500);
      } else {
        if (data.error === "No autorizado") {
          mostrarToast("⚠️ Sesión admin expirada. Inicia sesión de nuevo.");
          adminToken = "";
          sessionStorage.removeItem("apto_admin_token");
        } else {
          mostrarToast(`⚠️ ${data.error || "No se pudo eliminar."}`);
        }
      }
    })
    .catch(() => mostrarToast("⚠️ Error de conexión."));
}
