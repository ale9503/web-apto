# Backlog del Proyecto: Apartashower 🏡

A continuación se detallan las funcionalidades aprobadas para ser desarrolladas e implementadas en la plataforma, priorizadas según su impacto en la experiencia de usuario y la dinámica del evento.

---

## 🎯 Prioridad Alta: Dinámica del Evento y Facilidad de Uso

### 1. Mensajes de Buenos Deseos & Dinámica "Amigo Secreto" 🕵️‍♂️🎁
**Descripción:** La experiencia principal no es solo reservar, sino generar una dinámica para el día del evento. Los invitados comprarán el regalo por su cuenta usando el link (ej. Amazon) y lo llevarán físicamente al evento. Al reservarlo en la plataforma, dejarán un "mensaje" (dedicatoria o pista). El día del evento, se leerán los mensajes y los anfitriones (y demás invitados) intentarán adivinar quién dio qué regalo.
**Tareas Técnicas:**
- [x] **Frontend:** Modificar el modal de confirmación (`index.html`) para incluir un `<textarea>` opcional para el mensaje.
- [x] **Frontend:** Modificar el `fetch` en `app.js` para enviar el parámetro `&mensaje=...`.
- [x] **Frontend:** Modificar el grid para ocultar el nombre de quién reservó (`quien`) en las tarjetas públicas, manteniendo así el anonimato/sorpresa hasta el evento.
- [x] **Backend (Apps Script):** Modificar `reservarProducto` para aceptar y guardar el mensaje en una nueva columna de la hoja de cálculo.

### 2. Filtros por Rango de Presupuesto (en COP) 💰
**Descripción:** Para ayudar a los invitados a elegir regalos según su capacidad financiera, se deben añadir filtros por precio que complementen o sustituyan a los de categoría.
**Tareas Técnicas:**
- [x] **Frontend:** Añadir nuevos botones de filtro en la interfaz (`< $50.000`, `$50k - $100k`, `> $100k`).
- [x] **Frontend (Lógica):** Actualizar la función `filtrar()` en `app.js` para que soporte lógica de filtrado numérico sobre la propiedad `precio` de `PRODUCTOS_DETALLE`.

---

## ✨ Prioridad Media: UI y Experiencia Visual

### 3. Barra de Progreso "Hogar Completado" 📊
**Descripción:** Implementar un indicador visual (barra de progreso) que muestre el porcentaje de regalos ya reservados frente al total, para dar una sensación de logro comunitario.
**Tareas Técnicas:**
- [x] **Frontend (UI):** Agregar el contenedor de la barra de progreso en el Header (`index.html`).
- [x] **Frontend (Lógica):** Modificar `actualizarStats()` en `app.js` para calcular `(tomados / total) * 100` y ajustar el `width` del `.progreso-bar`.

### 4. Estado Visual "Agotado" Estricto 🚫
**Descripción:** Mejorar la jerarquía visual de los productos. Los regalos ya reservados deben quedar visualmente en segundo plano (grisáceos) para que la vista del usuario se centre de inmediato en los regalos disponibles.
**Tareas Técnicas:**
- [x] **Frontend (CSS):** Actualizado `style.css` con `filter: grayscale(100%); opacity: 0.5; pointer-events: none;` en `.producto-card.tomada`.

---

*Nota: Las funcionalidades de "Fondo de Mudanza/Lluvia de sobres" y "Compartir por WhatsApp" han sido descartadas.*

---

## ✅ Todo el backlog completado — 19 May 2026
