/* =========================================================
   Finca La Esperanza — App de campo (demo funcional)
   Todo se guarda en este dispositivo (localStorage).
   Simula el escenario de la propuesta: registrar sin
   internet y sincronizar cuando "hay señal satelital".
   ========================================================= */

(function () {
  "use strict";

  /* ---------------- almacenamiento local ---------------- */
  const KEYS = {
    session: "fle_session",
    cosechas: "fle_cosechas",
    insumos: "fle_insumos",
    trabajadores: "fle_trabajadores",
    config: "fle_config",
    online: "fle_online",
    seeded: "fle_seeded",
  };

  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
  function todayLabel() {
    const d = new Date();
    const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    return d.getDate() + " " + meses[d.getMonth()];
  }

  /* ---------------- datos de ejemplo (seed) ---------------- */
  function seedData() {
    save(KEYS.trabajadores, [
      { id: uid(), nombre: "J. Pérez", rol: "Recolector", punto: "Punto 1", presente: true },
      { id: uid(), nombre: "L. Gómez", rol: "Recolector", punto: "Punto 2", presente: true },
      { id: uid(), nombre: "A. Ruiz", rol: "Recolector", punto: "Punto 3", presente: true },
      { id: uid(), nombre: "C. Torres", rol: "Supervisor", punto: "Punto 1", presente: false },
      { id: uid(), nombre: "M. Díaz", rol: "Recolector", punto: "Punto 2", presente: true },
    ]);

    save(KEYS.cosechas, [
      { id: uid(), fecha: "24 Sep", lote: "Lote 1", trabajador: "J. Pérez", kilos: 42, estado: "Sincronizado" },
      { id: uid(), fecha: "24 Sep", lote: "Lote 2", trabajador: "L. Gómez", kilos: 38, estado: "Sincronizado" },
      { id: uid(), fecha: "23 Sep", lote: "Lote 3", trabajador: "A. Ruiz", kilos: 51, estado: "Pendiente" },
      { id: uid(), fecha: "23 Sep", lote: "Lote 1", trabajador: "J. Pérez", kilos: 36, estado: "Sincronizado" },
      { id: uid(), fecha: "22 Sep", lote: "Lote 2", trabajador: "L. Gómez", kilos: 44, estado: "Sincronizado" },
    ]);

    save(KEYS.insumos, [
      { id: uid(), nombre: "Fertilizante NPK", categoria: "Abono", cantidad: 12, unidad: "sacos" },
      { id: uid(), nombre: "Fungicida X", categoria: "Fitosanitario", cantidad: 2, unidad: "litros" },
      { id: uid(), nombre: "Guantes", categoria: "Herramienta", cantidad: 25, unidad: "pares" },
      { id: uid(), nombre: "Cal agrícola", categoria: "Abono", cantidad: 1, unidad: "sacos" },
      { id: uid(), nombre: "Machetes", categoria: "Herramienta", cantidad: 9, unidad: "unid." },
    ]);

    save(KEYS.config, {
      autoSync: true,
      saveData: true,
      notifStock: true,
      notifPend: true,
      notifWeekly: false,
    });

    save(KEYS.online, false);
    save(KEYS.seeded, true);
  }

  if (!load(KEYS.seeded, false)) seedData();

  /* ---------------- estado en memoria ---------------- */
  let cosechas = load(KEYS.cosechas, []);
  let insumos = load(KEYS.insumos, []);
  let trabajadores = load(KEYS.trabajadores, []);
  let config = load(KEYS.config, {});
  let online = load(KEYS.online, false);

  function persistAll() {
    save(KEYS.cosechas, cosechas);
    save(KEYS.insumos, insumos);
    save(KEYS.trabajadores, trabajadores);
    save(KEYS.config, config);
    save(KEYS.online, online);
  }

  /* ---------------- helpers de negocio ---------------- */
  function insumoEstado(item) {
    return item.cantidad <= 2 ? "Bajo" : "Normal";
  }
  function pendientesCount() {
    return cosechas.filter((c) => c.estado === "Pendiente").length;
  }
  function initials(name) {
    const parts = name.trim().split(/[\s._-]+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.trim().slice(0, 2).toUpperCase();
  }

  /* ---------------- referencias DOM ---------------- */
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const loginView = $("#view-login");
  const appShell = $("#appShell");
  const loginForm = $("#loginForm");
  const loginError = $("#loginError");

  const viewTitleEl = $("#viewTitle");
  const signalBtn = $("#signalBtn");
  const signalDot = $("#signalDot");
  const signalLabel = $("#signalLabel");
  const userAvatar = $("#userAvatar");

  const TAB_TITLES = {
    panel: "Panel principal",
    cosechas: "Cosechas",
    inventario: "Inventario de insumos",
    trabajadores: "Trabajadores",
    reportes: "Reportes",
    config: "Configuración",
  };

  /* ---------------- sesión / login ---------------- */
  function currentSession() {
    return load(KEYS.session, null);
  }

  function showApp() {
    const session = currentSession();
    loginView.classList.remove("active");
    appShell.hidden = false;
    const label = initials(session.user || "Usuario");
    userAvatar.textContent = label;
    $("#configAvatar").textContent = label;
    $("#configName").textContent = session.user;
    renderSignal();
    renderAll();
    switchTab("panel");
  }

  function showLogin() {
    appShell.hidden = true;
    loginView.classList.add("active");
    $("#loginUser").value = "";
    $("#loginPass").value = "";
  }

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const user = $("#loginUser").value.trim();
    const pass = $("#loginPass").value.trim();
    if (!user || !pass) {
      loginError.hidden = false;
      return;
    }
    loginError.hidden = true;
    save(KEYS.session, { user });
    showApp();
  });

  $("#btnLogout").addEventListener("click", () => {
    localStorage.removeItem(KEYS.session);
    showLogin();
  });

  /* ---------------- señal satelital (simulada) ---------------- */
  function renderSignal() {
    signalBtn.classList.toggle("online", online);
    signalDot.style.background = online ? "" : "";
    signalLabel.textContent = online ? "Señal satelital" : "Sin señal";
  }

  signalBtn.addEventListener("click", () => {
    online = !online;
    save(KEYS.online, online);
    renderSignal();
    if (online) {
      showToast("📶 Señal satelital detectada");
      if (config.autoSync) {
        setTimeout(syncNow, 500);
      }
    } else {
      showToast("📴 Se perdió la señal satelital");
    }
    renderPanel();
  });

  function syncNow() {
    if (!online) {
      showToast("Sin señal. Activa la señal satelital arriba.");
      return;
    }
    const n = pendientesCount();
    if (n === 0) {
      showToast("No hay registros pendientes");
      return;
    }
    cosechas = cosechas.map((c) =>
      c.estado === "Pendiente" ? { ...c, estado: "Sincronizado" } : c
    );
    persistAll();
    showToast("✅ " + n + " registro(s) sincronizado(s)");
    renderPanel();
    renderCosechas();
  }
  $("#syncNowBtn").addEventListener("click", syncNow);

  /* ---------------- navegación (tabbar) ---------------- */
  function switchTab(name) {
    $$(".tab-btn").forEach((b) => b.classList.toggle("active", b.dataset.view === name));
    $$(".view").forEach((v) => v.classList.toggle("active", v.id === "view-" + name));
    viewTitleEl.textContent = TAB_TITLES[name] || "";
    $("#content").scrollTop = 0;
    // recalcula la vista al abrirla, para que nunca quede desactualizada
    if (name === "panel") renderPanel();
    if (name === "cosechas") renderCosechas();
    if (name === "inventario") renderInventario();
    if (name === "trabajadores") renderTrabajadores();
    if (name === "reportes") renderReportes();
    if (name === "config") renderConfig();
  }
  $$(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.view));
  });

  /* ---------------- toast ---------------- */
  let toastTimer = null;
  function showToast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.hidden = true), 2200);
  }

  /* ================= RENDER: PANEL ================= */
  function renderPanel() {
    const totalKg = cosechas.reduce((s, c) => s + Number(c.kilos), 0);
    $("#statCosecha").textContent = totalKg.toLocaleString("es-CO") + " kg";
    $("#statBajo").textContent = insumos.filter((i) => insumoEstado(i) === "Bajo").length;
    $("#statTrabajadores").textContent = trabajadores.length;
    $("#statPendientes").textContent = pendientesCount();

    // gráfico por lote
    const lotes = ["Lote 1", "Lote 2", "Lote 3"];
    const totals = lotes.map((l) => cosechas.filter((c) => c.lote === l).reduce((s, c) => s + Number(c.kilos), 0));
    const max = Math.max(1, ...totals);
    $("#loteChart").innerHTML = lotes
      .map(
        (l, i) => `
      <div class="bar-col">
        <div class="bar-fill" style="height:${Math.max(6, (totals[i] / max) * 96)}px"></div>
        <div class="bar-label">${l.replace("Lote ", "L")}</div>
      </div>`
      )
      .join("");

    // últimos registros
    const last = [...cosechas].slice(-3).reverse();
    $("#ultimosRegistros").innerHTML =
      last
        .map(
          (c) => `
      <div class="mini-item">
        <div class="mini-item-main"><b>${c.lote} · ${c.trabajador}</b><span>${c.fecha}</span></div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span>${c.kilos} kg</span>
          <span class="badge ${c.estado === "Sincronizado" ? "badge-ok" : "badge-pending"}">${c.estado === "Sincronizado" ? "OK" : "Pend."}</span>
        </div>
      </div>`
        )
        .join("") || `<p class="empty-note">Todavía no hay registros.</p>`;

    // banner de sincronización
    const n = pendientesCount();
    const banner = $("#syncBanner");
    if (n > 0) {
      banner.hidden = false;
      $("#syncBannerText").textContent =
        n + (n === 1 ? " registro está" : " registros están") + " esperando conexión satelital para sincronizarse.";
    } else {
      banner.hidden = true;
    }
  }

  /* ================= RENDER: COSECHAS ================= */
  function renderCosechas() {
    const totalKg = cosechas.reduce((s, c) => s + Number(c.kilos), 0);
    $("#cosTotal").textContent = totalKg.toLocaleString("es-CO") + " kg";
    $("#cosProm").textContent = cosechas.length ? Math.round(totalKg / cosechas.length) + " kg" : "0 kg";

    const lotes = ["Lote 1", "Lote 2", "Lote 3"];
    const totals = lotes.map((l) => cosechas.filter((c) => c.lote === l).reduce((s, c) => s + Number(c.kilos), 0));
    const topIdx = totals.indexOf(Math.max(...totals));
    $("#cosTopLote").textContent = cosechas.length ? lotes[topIdx] : "—";

    const ordered = [...cosechas].reverse();
    $("#cosechaList").innerHTML =
      ordered
        .map(
          (c) => `
      <div class="record-item">
        <div class="record-main">
          <b>${c.lote} · ${c.trabajador}</b>
          <span>${c.fecha} · ${c.kilos} kg</span>
        </div>
        <span class="badge ${c.estado === "Sincronizado" ? "badge-ok" : "badge-pending"}">${c.estado}</span>
      </div>`
        )
        .join("") || `<p class="empty-note">Aún no hay cosechas registradas.</p>`;
  }

  /* ================= RENDER: INVENTARIO ================= */
  function renderInventario() {
    $("#invTotal").textContent = insumos.length;
    $("#invBajo").textContent = insumos.filter((i) => insumoEstado(i) === "Bajo").length;

    $("#inventarioList").innerHTML =
      insumos
        .map((i) => {
          const estado = insumoEstado(i);
          return `
      <div class="record-item">
        <div class="record-main">
          <b>${i.nombre}</b>
          <span>${i.categoria} · ${i.cantidad} ${i.unidad}</span>
        </div>
        <span class="badge ${estado === "Bajo" ? "badge-low" : "badge-normal"}">${estado}</span>
      </div>`;
        })
        .join("") || `<p class="empty-note">Aún no hay insumos registrados.</p>`;
  }

  /* ================= RENDER: TRABAJADORES ================= */
  function renderTrabajadores() {
    $("#trTotal").textContent = trabajadores.length;
    $("#trPresentes").textContent = trabajadores.filter((t) => t.presente).length;
    $("#trAusentes").textContent = trabajadores.filter((t) => !t.presente).length;

    $("#trabajadorList").innerHTML =
      trabajadores
        .map(
          (t) => `
      <div class="record-item">
        <div class="record-main">
          <b>${t.nombre}</b>
          <span>${t.rol} · ${t.punto}</span>
        </div>
        <button class="badge ${t.presente ? "badge-present" : "badge-absent"}" data-toggle-worker="${t.id}">
          ${t.presente ? "Presente" : "Ausente"}
        </button>
      </div>`
        )
        .join("") || `<p class="empty-note">Aún no hay trabajadores.</p>`;

    $$("[data-toggle-worker]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.toggleWorker;
        trabajadores = trabajadores.map((t) => (t.id === id ? { ...t, presente: !t.presente } : t));
        persistAll();
        renderTrabajadores();
        renderPanel();
      });
    });
  }

  /* ================= RENDER: REPORTES ================= */
  function renderReportes() {
    const lotes = ["Lote 1", "Lote 2", "Lote 3"];
    const totals = lotes.map((l) => cosechas.filter((c) => c.lote === l).reduce((s, c) => s + Number(c.kilos), 0));
    const max = Math.max(1, ...totals);
    $("#reporteChart").innerHTML = lotes
      .map(
        (l, i) => `
      <div class="bar-col">
        <div class="bar-fill gold" style="height:${Math.max(6, (totals[i] / max) * 96)}px"></div>
        <div class="bar-label">${l.replace("Lote ", "L")}</div>
      </div>`
      )
      .join("");

    const cats = ["Abono", "Herramienta", "Fitosanitario"];
    const catTotals = cats.map((c) => insumos.filter((i) => i.categoria === c).length);
    const catMax = Math.max(1, ...catTotals);
    $("#categoriaBars").innerHTML = cats
      .map((c, i) => {
        const w = Math.max(14, (catTotals[i] / catMax) * 100);
        return `
      <div class="cat-bar-row">
        <div class="cat-bar-track"><div class="cat-bar-fill" style="width:${w}%">${c} (${catTotals[i]})</div></div>
      </div>`;
      })
      .join("");

    const total = trabajadores.length || 1;
    const presentes = trabajadores.filter((t) => t.presente).length;
    const pct = Math.round((presentes / total) * 100);
    const puntual = trabajadores.find((t) => t.presente);
    $("#asistenciaResumen").innerHTML = `Promedio de asistencia hoy: <b>${pct}%</b><br>Presentes: <b>${presentes}</b> · Ausentes: <b>${total - presentes}</b><br>Trabajador presente destacado: <b>${puntual ? puntual.nombre : "—"}</b>`;
  }

  $("#btnExportar").addEventListener("click", () => {
    showToast("Generando vista de impresión / PDF…");
    setTimeout(() => window.print(), 400);
  });

  /* ================= RENDER: CONFIG ================= */
  function renderConfig() {
    $("#cfgAutoSync").checked = !!config.autoSync;
    $("#cfgSaveData").checked = !!config.saveData;
    $("#cfgNotifStock").checked = !!config.notifStock;
    $("#cfgNotifPend").checked = !!config.notifPend;
    $("#cfgNotifWeekly").checked = !!config.notifWeekly;
  }
  [
    ["cfgAutoSync", "autoSync"],
    ["cfgSaveData", "saveData"],
    ["cfgNotifStock", "notifStock"],
    ["cfgNotifPend", "notifPend"],
    ["cfgNotifWeekly", "notifWeekly"],
  ].forEach(([elId, key]) => {
    $("#" + elId).addEventListener("change", (e) => {
      config[key] = e.target.checked;
      persistAll();
    });
  });

  $("#btnChangePass").addEventListener("click", () => {
    showToast("Función de demostración: no cambia la contraseña real.");
  });

  $("#btnReset").addEventListener("click", () => {
    if (!confirm("¿Borrar todos los datos guardados en este dispositivo y volver a los datos de ejemplo?")) return;
    seedData();
    cosechas = load(KEYS.cosechas, []);
    insumos = load(KEYS.insumos, []);
    trabajadores = load(KEYS.trabajadores, []);
    config = load(KEYS.config, {});
    online = load(KEYS.online, false);
    renderSignal();
    renderAll();
    switchTab("panel");
    showToast("Datos de ejemplo restablecidos");
  });

  function renderAll() {
    renderPanel();
    renderCosechas();
    renderInventario();
    renderTrabajadores();
    renderReportes();
    renderConfig();
  }

  /* ================= MODAL / FORMULARIOS ================= */
  const modalOverlay = $("#modalOverlay");
  const modalTitle = $("#modalTitle");
  const modalForm = $("#modalForm");

  function openModal(title, fieldsHtml, onSubmit) {
    modalTitle.textContent = title;
    modalForm.innerHTML =
      fieldsHtml +
      `<div class="modal-actions">
         <button type="button" class="btn btn-outline" id="modalCancel">Cancelar</button>
         <button type="submit" class="btn btn-primary">Guardar</button>
       </div>`;
    modalOverlay.hidden = false;
    $("#modalCancel").addEventListener("click", closeModal);
    modalForm.onsubmit = (e) => {
      e.preventDefault();
      onSubmit(new FormData(modalForm));
    };
  }
  function closeModal() {
    modalOverlay.hidden = true;
    modalForm.onsubmit = null;
  }
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // Nueva cosecha
  $("#btnNuevaCosecha").addEventListener("click", () => {
    const workerOptions = trabajadores.map((t) => `<option value="${t.nombre}">${t.nombre}</option>`).join("");
    openModal(
      "Nueva cosecha",
      `
      <label>Lote
        <select name="lote" required>
          <option value="Lote 1">Lote 1</option>
          <option value="Lote 2">Lote 2</option>
          <option value="Lote 3">Lote 3</option>
        </select>
      </label>
      <label>Trabajador
        <select name="trabajador" required>${workerOptions}</select>
      </label>
      <label>Kilos recolectados
        <input type="number" name="kilos" min="1" step="1" placeholder="Ej. 40" required>
      </label>
      <label>Fecha
        <input type="text" value="${todayLabel()} (automática)" disabled>
      </label>
    `,
      (fd) => {
        cosechas.push({
          id: uid(),
          fecha: todayLabel(),
          lote: fd.get("lote"),
          trabajador: fd.get("trabajador"),
          kilos: Number(fd.get("kilos")),
          estado: online ? "Sincronizado" : "Pendiente",
        });
        persistAll();
        renderCosechas();
        renderPanel();
        closeModal();
        showToast(online ? "Cosecha registrada y sincronizada" : "Cosecha guardada en el dispositivo (pendiente)");
      }
    );
  });

  // Nuevo insumo
  $("#btnNuevoInsumo").addEventListener("click", () => {
    openModal(
      "Registrar insumo",
      `
      <label>Nombre
        <input type="text" name="nombre" placeholder="Ej. Abono orgánico" required>
      </label>
      <label>Categoría
        <select name="categoria" required>
          <option value="Abono">Abono</option>
          <option value="Herramienta">Herramienta</option>
          <option value="Fitosanitario">Fitosanitario</option>
        </select>
      </label>
      <label>Cantidad
        <input type="number" name="cantidad" min="0" step="1" placeholder="Ej. 10" required>
      </label>
      <label>Unidad
        <select name="unidad" required>
          <option value="sacos">sacos</option>
          <option value="litros">litros</option>
          <option value="pares">pares</option>
          <option value="unid.">unid.</option>
        </select>
      </label>
    `,
      (fd) => {
        insumos.push({
          id: uid(),
          nombre: fd.get("nombre"),
          categoria: fd.get("categoria"),
          cantidad: Number(fd.get("cantidad")),
          unidad: fd.get("unidad"),
        });
        persistAll();
        renderInventario();
        renderPanel();
        closeModal();
        showToast("Insumo registrado");
      }
    );
  });

  // Nuevo trabajador
  $("#btnNuevoTrabajador").addEventListener("click", () => {
    openModal(
      "Agregar trabajador",
      `
      <label>Nombre
        <input type="text" name="nombre" placeholder="Ej. S. Martínez" required>
      </label>
      <label>Rol
        <select name="rol" required>
          <option value="Recolector">Recolector</option>
          <option value="Supervisor">Supervisor</option>
        </select>
      </label>
      <label>Punto asignado
        <select name="punto" required>
          <option value="Punto 1">Punto 1</option>
          <option value="Punto 2">Punto 2</option>
          <option value="Punto 3">Punto 3</option>
        </select>
      </label>
    `,
      (fd) => {
        trabajadores.push({
          id: uid(),
          nombre: fd.get("nombre"),
          rol: fd.get("rol"),
          punto: fd.get("punto"),
          presente: true,
        });
        persistAll();
        renderTrabajadores();
        renderPanel();
        closeModal();
        showToast("Trabajador agregado");
      }
    );
  });

  /* ---------------- arranque ---------------- */
  if (currentSession()) {
    showApp();
  } else {
    showLogin();
  }
})();
