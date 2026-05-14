// ================================================
//  APARTASHOWER — Google Apps Script
//  Pega este código en el editor de Apps Script
//  y sigue los pasos del README
// ================================================

const HOJA = "Regalos";

// ---- Lista de productos ----
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
    return reservarProducto(e.parameter.id, e.parameter.quien, e.parameter.email);
  }

  if (accion === "cancelar") {
    return cancelarProducto(e.parameter.id, e.parameter.email);
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
function reservarProducto(id, quien, email) {
  if (!id || !quien || !email) {
    return respuesta({ exito: false, error: "Faltan datos" });
  }

  const hoja = obtenerHoja();
  const datos = hoja.getDataRange().getValues();

  for (var i = 1; i < datos.length; i++) {
    if (String(datos[i][0]) === String(id)) {

      // Ya está reservado
      if (datos[i][2] === true || String(datos[i][2]).toUpperCase() === "TRUE") {
        return respuesta({ exito: false, error: "Ya reservado por " + datos[i][3] });
      }

      // Marcar como reservado
      hoja.getRange(i + 1, 3).setValue(true);
      hoja.getRange(i + 1, 4).setValue(quien);
      hoja.getRange(i + 1, 5).setValue(email);
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

  for (var i = 1; i < datos.length; i++) {
    if (String(datos[i][0]) === String(id)) {
      
      const emailGuardado = String(datos[i][4] || "").toLowerCase();
      if (emailGuardado !== String(email).toLowerCase()) {
        return respuesta({ exito: false, error: "No tienes permiso para cancelar este regalo." });
      }

      // Liberar
      hoja.getRange(i + 1, 3).setValue(false);
      hoja.getRange(i + 1, 4).setValue("");
      hoja.getRange(i + 1, 5).setValue("");
      SpreadsheetApp.flush();
      return respuesta({ exito: true });
    }
  }

  return respuesta({ exito: false, error: "Producto no encontrado" });
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
  if (hoja.getLastRow() > 0) return; // ya tiene datos

  // Encabezados
  hoja.getRange(1, 1, 1, 5).setValues([["id", "nombre", "tomado", "quien", "email"]]);

  // Productos
  var filas = PRODUCTOS.map(function(p) { return [p.id, p.nombre, false, "", ""]; });
  hoja.getRange(2, 1, filas.length, 5).setValues(filas);

  // Estilo encabezado
  hoja.getRange(1, 1, 1, 5)
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
