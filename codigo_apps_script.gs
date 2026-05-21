// ================================================
//  APARTASHOWER — Google Apps Script
//  Pega este código en el editor de Apps Script
//  y sigue los pasos del README
// ================================================

const HOJA    = "Regalos";
const SECRETS = "secrets";

// ---- Lista de productos (solo para inicialización) ----
const PRODUCTOS = [
  { id: "p01", nombre: "Sartén antiadherente 28cm" },
  { id: "p02", nombre: "Jarra de agua de vidrio 1.5L" },
  { id: "p03", nombre: "Set de tazas para café (x4)" },
  { id: "p04", nombre: "Set de cubiertos acero inox (6 personas)" },
  { id: "p05", nombre: "Tabla de cortar madera bambú" },
  { id: "p06", nombre: "Planta de interior + maceta decorativa" },
  { id: "p07", nombre: "Set de velones aromáticos (x3)" },
  { id: "p08", nombre: "Marco de fotos madera natural" },
  { id: "p09", nombre: "Organizador de cocina de bambú" },
  { id: "p10", nombre: "Florero de vidrio borosilicato" },
  { id: "p11", nombre: "Set de accesorios de baño bambú" },
  { id: "p12", nombre: "Toallas de baño suaves premium (x2)" },
  { id: "p13", nombre: "Tapete de baño antideslizante" },
  { id: "p14", nombre: "Set de especias y condimentos (x6)" },
  { id: "p15", nombre: "Lámpara de mesa LED decorativa" },
  { id: "p16", nombre: "Cojín decorativo para sala" },
  { id: "p17", nombre: "Set de limpieza básico del hogar" },
  { id: "p18", nombre: "Set de copas de vino (x4)" }
];

// ================================================
//  PUNTO DE ENTRADA — maneja GET con ?accion=
// ================================================
function doGet(e) {
  const accion = e.parameter.accion || "leer";

  if (accion === "leer") {
    return leerProductos(e.parameter.email);
  }

  if (accion === "reservar") {
    return reservarProducto(e.parameter.id, e.parameter.quien, e.parameter.email, e.parameter.mensaje || "");
  }

  if (accion === "cancelar") {
    return cancelarProducto(e.parameter.id, e.parameter.email);
  }

  // ---- Acciones de Admin ----
  if (accion === "loginAdmin") {
    return loginAdmin(e.parameter.user, e.parameter.password);
  }

  if (accion === "agregarRegalo") {
    return agregarRegalo(e.parameter.adminToken, e.parameter.id, e.parameter.nombre);
  }

  if (accion === "editarRegalo") {
    return editarRegalo(e.parameter.adminToken, e.parameter.id, e.parameter.nombre);
  }

  if (accion === "eliminarRegalo") {
    return eliminarRegalo(e.parameter.adminToken, e.parameter.id);
  }

  return respuesta({ error: "Acción no válida" });
}

// ================================================
//  LEER — devuelve todos los productos con estado
// ================================================
function leerProductos(emailSolicitante) {
  const hoja = obtenerHoja();
  const datos = hoja.getDataRange().getValues();
  const encabezados = datos[0];
  const filas = datos.slice(1);

  const productos = filas.map(function(fila) {
    const obj = {};
    encabezados.forEach(function(enc, i) {
      if (enc !== "email") {
        obj[enc] = fila[i];
      } else {
        obj.esMio = (emailSolicitante && String(fila[i]).toLowerCase() === String(emailSolicitante).toLowerCase());
      }
    });
    return obj;
  });

  return respuesta({ productos: productos });
}

// ================================================
//  RESERVAR — marca un producto como tomado
// ================================================
function reservarProducto(id, quien, email, mensaje) {
  if (!id || !quien || !email) {
    return respuesta({ exito: false, error: "Faltan datos" });
  }

  const hoja = obtenerHoja();
  const datos = hoja.getDataRange().getValues();
  const enc   = datos[0];

  var colId      = enc.indexOf("id");
  var colTomado  = enc.indexOf("tomado");
  var colQuien   = enc.indexOf("quien");
  var colEmail   = enc.indexOf("email");
  var colMensaje = enc.indexOf("mensaje");

  if (colId === -1 || colTomado === -1 || colEmail === -1) {
    return respuesta({ exito: false, error: "Estructura de hoja inválida. Verifica los encabezados." });
  }

  for (var i = 1; i < datos.length; i++) {
    if (String(datos[i][colId]).trim() === String(id).trim()) {

      if (datos[i][colTomado] === true || String(datos[i][colTomado]).toUpperCase() === "TRUE") {
        return respuesta({ exito: false, error: "Ya reservado" });
      }

      hoja.getRange(i + 1, colTomado  + 1).setValue(true);
      hoja.getRange(i + 1, colQuien   + 1).setValue(quien);
      hoja.getRange(i + 1, colEmail   + 1).setValue(email);
      if (colMensaje !== -1) {
        hoja.getRange(i + 1, colMensaje + 1).setValue(mensaje || "");
      }
      SpreadsheetApp.flush();
      return respuesta({ exito: true });
    }
  }

  return respuesta({ exito: false, error: "Producto no encontrado" });
}

// ================================================
//  CANCELAR — libera un producto si el email coincide
// ================================================
function cancelarProducto(id, email) {
  if (!id || !email) {
    return respuesta({ exito: false, error: "Faltan datos" });
  }

  const hoja = obtenerHoja();
  const datos = hoja.getDataRange().getValues();
  const enc   = datos[0];

  var colId      = enc.indexOf("id");
  var colTomado  = enc.indexOf("tomado");
  var colQuien   = enc.indexOf("quien");
  var colEmail   = enc.indexOf("email");
  var colMensaje = enc.indexOf("mensaje");

  if (colId === -1 || colTomado === -1 || colEmail === -1) {
    return respuesta({ exito: false, error: "Estructura de hoja inválida. Verifica los encabezados." });
  }

  for (var i = 1; i < datos.length; i++) {
    if (String(datos[i][colId]).trim() === String(id).trim()) {

      const emailGuardado = String(datos[i][colEmail] || "").trim().toLowerCase();
      if (emailGuardado !== String(email).trim().toLowerCase()) {
        return respuesta({ exito: false, error: "No tienes permiso para cancelar este regalo." });
      }

      hoja.getRange(i + 1, colTomado + 1).setValue(false);
      hoja.getRange(i + 1, colQuien  + 1).setValue("");
      hoja.getRange(i + 1, colEmail  + 1).setValue("");
      if (colMensaje !== -1) {
        hoja.getRange(i + 1, colMensaje + 1).setValue("");
      }
      SpreadsheetApp.flush();
      return respuesta({ exito: true });
    }
  }

  return respuesta({ exito: false, error: "Producto no encontrado. ID buscado: " + id });
}

// ================================================
//  LOGIN ADMIN — valida contra hoja "secrets"
// ================================================
function loginAdmin(user, password) {
  if (!user || !password) {
    return respuesta({ exito: false, error: "Faltan credenciales" });
  }

  const ss        = SpreadsheetApp.getActiveSpreadsheet();
  const hojaSecrets = ss.getSheetByName(SECRETS);

  if (!hojaSecrets) {
    return respuesta({ exito: false, error: "Hoja 'secrets' no encontrada" });
  }

  const datos = hojaSecrets.getDataRange().getValues();
  // Fila 0 = encabezados [user, password], fila 1 en adelante = credenciales
  for (var i = 1; i < datos.length; i++) {
    const userGuardado  = String(datos[i][0] || "").trim();
    const passGuardada  = String(datos[i][1] || "").trim();

    if (userGuardado === user.trim() && passGuardada === password.trim()) {
      // Generar token simple: hash de user+pass+fecha
      const token = Utilities.base64Encode(user + ":" + password + ":" + new Date().toDateString());
      return respuesta({ exito: true, adminToken: token });
    }
  }

  return respuesta({ exito: false, error: "Credenciales incorrectas" });
}

// ================================================
//  VALIDAR TOKEN — verifica que el token sea válido
// ================================================
function validarToken(adminToken) {
  if (!adminToken) return false;
  try {
    const decoded = Utilities.base64Decode(adminToken);
    const str     = Utilities.newBlob(decoded).getDataAsString();
    const parts   = str.split(":");
    if (parts.length < 3) return false;

    const user     = parts[0];
    const password = parts[1];
    const fecha    = parts.slice(2).join(":");

    // El token debe ser de hoy
    if (fecha !== new Date().toDateString()) return false;

    // Verificar credenciales nuevamente
    const ss          = SpreadsheetApp.getActiveSpreadsheet();
    const hojaSecrets = ss.getSheetByName(SECRETS);
    if (!hojaSecrets) return false;

    const datos = hojaSecrets.getDataRange().getValues();
    for (var i = 1; i < datos.length; i++) {
      if (String(datos[i][0]).trim() === user && String(datos[i][1]).trim() === password) {
        return true;
      }
    }
    return false;
  } catch (e) {
    return false;
  }
}

// ================================================
//  AGREGAR REGALO — añade nueva fila al Sheet
// ================================================
function agregarRegalo(adminToken, id, nombre) {
  if (!validarToken(adminToken)) {
    return respuesta({ exito: false, error: "No autorizado" });
  }
  if (!id || !nombre) {
    return respuesta({ exito: false, error: "Faltan datos: id y nombre son obligatorios" });
  }

  const hoja = obtenerHoja();
  const datos = hoja.getDataRange().getValues();
  const enc   = datos[0];

  // Verificar que el ID no exista ya
  const colId = enc.indexOf("id");
  for (var i = 1; i < datos.length; i++) {
    if (String(datos[i][colId]).trim() === String(id).trim()) {
      return respuesta({ exito: false, error: "Ya existe un regalo con ese ID" });
    }
  }

  // Agregar fila con el orden de columnas actual
  const nuevaFila = enc.map(function(col) {
    if (col === "id")      return id.trim();
    if (col === "nombre")  return nombre.trim();
    if (col === "tomado")  return false;
    return "";
  });

  hoja.appendRow(nuevaFila);
  SpreadsheetApp.flush();
  return respuesta({ exito: true });
}

// ================================================
//  EDITAR REGALO — actualiza nombre por ID
// ================================================
function editarRegalo(adminToken, id, nombre) {
  if (!validarToken(adminToken)) {
    return respuesta({ exito: false, error: "No autorizado" });
  }
  if (!id || !nombre) {
    return respuesta({ exito: false, error: "Faltan datos: id y nombre son obligatorios" });
  }

  const hoja = obtenerHoja();
  const datos = hoja.getDataRange().getValues();
  const enc   = datos[0];

  var colId     = enc.indexOf("id");
  var colNombre = enc.indexOf("nombre");

  if (colId === -1 || colNombre === -1) {
    return respuesta({ exito: false, error: "Estructura de hoja inválida" });
  }

  for (var i = 1; i < datos.length; i++) {
    if (String(datos[i][colId]).trim() === String(id).trim()) {
      hoja.getRange(i + 1, colNombre + 1).setValue(nombre.trim());
      SpreadsheetApp.flush();
      return respuesta({ exito: true });
    }
  }

  return respuesta({ exito: false, error: "Regalo no encontrado" });
}

// ================================================
//  ELIMINAR REGALO — borra fila por ID
// ================================================
function eliminarRegalo(adminToken, id) {
  if (!validarToken(adminToken)) {
    return respuesta({ exito: false, error: "No autorizado" });
  }
  if (!id) {
    return respuesta({ exito: false, error: "Falta el ID del regalo" });
  }

  const hoja = obtenerHoja();
  const datos = hoja.getDataRange().getValues();
  const enc   = datos[0];
  var colId   = enc.indexOf("id");

  if (colId === -1) {
    return respuesta({ exito: false, error: "Estructura de hoja inválida" });
  }

  for (var i = 1; i < datos.length; i++) {
    if (String(datos[i][colId]).trim() === String(id).trim()) {
      hoja.deleteRow(i + 1);
      SpreadsheetApp.flush();
      return respuesta({ exito: true });
    }
  }

  return respuesta({ exito: false, error: "Regalo no encontrado" });
}

// ================================================
//  UTILIDADES
// ================================================
function obtenerHoja() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName(HOJA);
  if (!hoja) {
    hoja = ss.insertSheet(HOJA);
    inicializarHoja(hoja);
  }
  return hoja;
}

function inicializarHoja(hoja) {
  if (hoja.getLastRow() > 0) return;

  hoja.getRange(1, 1, 1, 6).setValues([["id", "nombre", "tomado", "quien", "email", "mensaje"]]);

  var filas = PRODUCTOS.map(function(p) { return [p.id, p.nombre, false, "", "", ""]; });
  hoja.getRange(2, 1, filas.length, 6).setValues(filas);

  hoja.getRange(1, 1, 1, 6)
    .setFontWeight("bold")
    .setBackground("#1a4031")
    .setFontColor("#ffffff");

  Logger.log("✅ Hoja inicializada con " + PRODUCTOS.length + " productos.");
}

// ================================================
//  INICIALIZAR — ejecuta esto manualmente 1 sola vez
// ================================================
function inicializar() {
  inicializarHoja(obtenerHoja());
  Logger.log("✅ Listo. Ahora despliega como app web.");
}

// ================================================
//  RESPUESTA JSON
// ================================================
function respuesta(datos) {
  return ContentService
    .createTextOutput(JSON.stringify(datos))
    .setMimeType(ContentService.MimeType.JSON);
}
