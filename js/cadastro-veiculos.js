/* Cadastro independente. Cada trecho mantém sua própria cópia dos dados e da foto. */
(() => {
  const KEY = "apeVehicleRegistryV1";
  const fields = [["plate", "Placa"], ["brand", "Marca"], ["model", "Modelo"], ["color", "Cor"], ["year", "Ano"], ["vehicleCompany", "Empresa responsável"]];
  const kinds = {car:"Carro", helicopter:"Helicóptero", plane:"Avião"};
  const kind = r => r.vehicleType || "car";
  const title = r => [kinds[kind(r)], r.plate, r.brand, r.model].filter(Boolean).join(" · ");
  const $ = (s) => document.querySelector(s);
  const el = (tag, text, cls) => { const n = document.createElement(tag); if (text) n.textContent = text; if (cls) n.className = cls; return n; };
  const plateKey = (v) => String(v || "").toUpperCase().replace(/[-\s]/g, "");
  const clean = (v) => String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const newId = () => typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
  const safePhoto = (v) => typeof v === "string" && v.length < 400000 && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(v) ? v : "";
  const views = [["front", "Frente"], ["right", "Lateral direita"], ["left", "Lateral esquerda"], ["rear", "Ré"]];
  const photoSet = (r = {}) => Object.fromEntries(views.map(([key]) => [key, safePhoto((r.photos || r.vehiclePhotos || {})[key]) || (key === "front" ? safePhoto(r.photo || r.vehiclePhoto) : "")]));
  let photos = photoSet(), selectedView = "front";
  let records = [], loadFailed = false, editId = null, photo = "", busy = false, dirty = false;
  try {
    records = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (!Array.isArray(records) || records.some((r) => !r || typeof r.id !== "string" || fields.some(([k]) => typeof r[k] !== "string"))) throw Error("Formato inválido");
  } catch (_) { loadFailed = true; records = []; }
  function persist(next) {
    if (loadFailed) throw Error("Não foi possível ler os veículos salvos. Os dados existentes foram preservados.");
    localStorage.setItem(KEY, JSON.stringify(next)); records = next;
  }
  function validate(r) {
    if (!kinds[kind(r)]) return "Selecione o tipo de veículo.";
    if ((kind(r) === "car" ? ["plate","brand","model","color","year"] : ["brand","model","year"]).some(k => !String(r[k] || "").trim())) return "Preencha os campos com *.";
    if (kind(r) === "car" && !/^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(plateKey(r.plate))) return "Confira a placa (ABC-1234 ou ABC1D23).";
    if (!/^\d{4}$/.test(r.year) || +r.year < 1900 || +r.year > 2100) return "Informe um ano válido.";
    if (kind(r) === "car" && records.some((v) => kind(v) === "car" && v.id !== r.id && plateKey(v.plate) === plateKey(r.plate))) return "Já existe um veículo com esta placa.";
    return "";
  }
  function snapshot(r) { return { vehicleId: r.id, vehicleType: kind(r), ...Object.fromEntries(fields.map(([k]) => [k, r[k] || ""])), vehiclePhoto: photoSet(r).front, vehiclePhotos: photoSet(r) }; }
  function summary(v) {
    const row = el("div", "", "vehicle-summary");
    const box = el("div", "", "vehicle-photo");
    const src = safePhoto(v.vehiclePhoto);
    if (src) { const img = el("img"); img.src = src; img.alt = `Veículo ${v.plate || ""}`; box.append(img); }
    else box.append(el("span", "Sem foto"));
    const info = el("div"); info.append(el("strong", [v.brand, v.model].filter(Boolean).join(" ") || "Veículo"));
    info.append(el("p", [kinds[kind(v)], v.plate, v.color, v.year].filter(Boolean).join(" · ")));
    if (v.vehicleCompany) info.append(el("p", v.vehicleCompany));
    row.append(box, info); return row;
  }
  const errorText = (e) => e.name === "QuotaExceededError" ? "Não há espaço para salvar. Tente uma foto menor ou remova a foto." : e.message;
  function render() {
    const host = $("#vehicle-cards"); host.replaceChildren();
    if (loadFailed) { $("#vehicle-message").textContent = "Não foi possível ler os veículos salvos. Nenhum dado foi substituído."; return; }
    const query = clean($("#vehicle-search").value);
    const visible = records.filter((r) => clean(title(r) + " " + fields.map(([k]) => r[k]).join(" ")).includes(query)).sort((a,b) => title(a).localeCompare(title(b)));
    $("#vehicle-count").textContent = `${visible.length} veículo(s) encontrado(s)`;
    visible.forEach((r) => {
      const card = el("article", "", "card vspp-list-card"); card.append(summary(snapshot(r)));
      const actions = el("div", "", "vspp-card-actions vehicle-actions");
      const edit = el("button", "Editar veículo", "btn btn-outline"); edit.type = "button"; edit.onclick = () => open(r.id);
      const remove = el("button", "Excluir veículo", "btn btn-outline"); remove.type = "button";
      remove.setAttribute("aria-label", `Excluir veículo ${title(r)}`);
      remove.onclick = () => {
        if (!confirm(`Excluir o veículo ${title(r)}? Esta ação não pode ser desfeita. Os dados nas agendas já preenchidas serão mantidos.`)) return;
        try { persist(records.filter((v) => v.id !== r.id)); render(); $("#vehicle-message").textContent = "Veículo excluído. As agendas existentes foram preservadas."; }
        catch (e) { $("#vehicle-message").textContent = errorText(e); }
      };
      actions.append(edit, remove); card.append(actions); host.append(card);
    });
    if (!visible.length) host.append(el("p", records.length ? "Nenhum veículo encontrado. Tente outra busca." : "Nenhum veículo cadastrado. Use Novo veículo para começar."));
  }
  function open(id) {
    if (loadFailed) { render(); return; }
    const r = records.find((v) => v.id === id) || {};
    editId = r.id || null; photos = photoSet(r); photo = photos.front; dirty = false;
    $("#vehicle-dialog-title").textContent = editId ? "Editar veículo" : "Novo veículo";
    $("#vehicle-photo").value = ""; $("#vehicle-error").textContent = "";
    drawGallery();
    const host = $("#vehicle-fields"); host.replaceChildren();
    $("#vehicle-type").value = kind(r);
    fields.forEach(([key, label]) => {
      const required = key !== "vehicleCompany";
      const wrapper = el("label");
      const caption = el("span", label + (required ? " *" : " (opcional)")); wrapper.append(caption); wrapper.dataset.vehicleRow = key;
      const control = el("input"); control.dataset.vehicleField = key; control.type = key === "year" ? "number" : "text";
      control.required = required; control.maxLength = key === "plate" ? 8 : 150;
      if (key === "year") { control.min = "1900"; control.max = "2100"; control.step = "1"; }
      if (key === "plate") control.placeholder = "ABC1D23 ou ABC-1234";
      control.value = r[key] || ""; wrapper.append(control); host.append(wrapper);
    });
    updateFields();
    $("#vehicle-dialog").showModal();
  }
  function updateFields() {
    const aircraft = $("#vehicle-type").value !== "car";
    document.querySelectorAll("[data-vehicle-row]").forEach(row => {
      const key = row.dataset.vehicleRow, control = row.querySelector("input");
      row.hidden = aircraft && ["plate","color","vehicleCompany"].includes(key);
      control.disabled = row.hidden; control.required = !row.hidden && key !== "vehicleCompany";
      row.querySelector("span").textContent = (aircraft && key === "brand" ? "Fabricante" : aircraft && key === "year" ? "Ano de fabricação" : fields.find(([k])=>k===key)[1]) + (control.required ? " *" : " (opcional)");
    });
  }
  $("#vehicle-type").onchange = () => { dirty = true; updateFields(); };
  function close() { if (!busy && (!dirty || confirm("Fechar sem salvar as alterações do veículo?"))) { $("#vehicle-dialog").close(); dirty = false; } }
  $("#vehicle-close").onclick = close;
  $("#vehicle-dialog").addEventListener("cancel", (e) => { e.preventDefault(); close(); });
  $("#vehicle-editor").addEventListener("input", () => { dirty = true; });
  window.addEventListener("beforeunload", (e) => { if ((dirty || busy) && $("#vehicle-dialog").open) { e.preventDefault(); e.returnValue = ""; } });
  $("#vehicle-editor").onsubmit = (e) => {
    e.preventDefault(); if (busy) return;
    try {
      const values = Object.fromEntries([...document.querySelectorAll("[data-vehicle-field]")].map((n) => [n.dataset.vehicleField, n.value.trim()]));
      const r = { ...values, vehicleType: $("#vehicle-type").value || "car", id: editId || `vehicle-${newId()}`, photo: photos.front, photos: { ...photos } };
      fields.forEach(([key]) => { r[key] = r[key] || ""; });
      if (r.vehicleType !== "car") { r.plate = ""; r.color = ""; r.vehicleCompany = ""; }
      r.plate = plateKey(r.plate);
      const issue = validate(r); if (issue) throw Error(issue);
      persist(editId ? records.map((v) => v.id === editId ? r : v) : [...records, r]);
      dirty = false; $("#vehicle-dialog").close(); render(); $("#vehicle-message").textContent = "Veículo salvo. As agendas anteriores mantêm os dados registrados.";
    } catch (e) { $("#vehicle-error").textContent = errorText(e); }
  };
  function drawGallery() {
    const host = $("#vehicle-photo-preview"); host.replaceChildren();
    views.forEach(([key, title]) => {
      const item = el("div", "", "vehicle-gallery-item");
      const tile = el("button", "", "vehicle-gallery-tile"); tile.type = "button"; tile.disabled = busy;
      tile.setAttribute("aria-label", `${photos[key] ? "Trocar" : "Adicionar"} foto: ${title}`);
      if (photos[key]) { const img = el("img"); img.src = photos[key]; img.alt = title; tile.append(img); }
      tile.append(el("strong", title), el("small", photos[key] ? "Clique para trocar" : "+ Adicionar foto"));
      tile.onclick = () => { if (busy) return; selectedView = key; $("#vehicle-photo").value = ""; $("#vehicle-photo").click(); };
      item.append(tile);
      if (photos[key]) {
        const remove = el("button", "Remover foto", "btn btn-outline vehicle-gallery-remove"); remove.type = "button"; remove.disabled = busy;
        remove.setAttribute("aria-label", `Remover foto: ${title}`);
        remove.onclick = () => { if (busy) return; photos[key] = ""; photo = photos.front; dirty = true; drawGallery(); };
        item.append(remove);
      }
      host.append(item);
    });
  }
  $("#vehicle-photo").onchange = async (e) => {
    const file = e.target.files[0]; if (!file || busy) return;
    busy = true; drawGallery(); e.target.disabled = true; $("#vehicle-error").textContent = "Preparando foto…";
    try {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 5*1024*1024) throw Error("Escolha uma foto JPG, PNG ou WebP de até 5 MB.");
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 480 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(bitmap.width*scale)); canvas.height = Math.max(1, Math.round(bitmap.height*scale));
      canvas.getContext("2d").drawImage(bitmap,0,0,canvas.width,canvas.height); bitmap.close();
      const result = canvas.toDataURL("image/jpeg", .8);
      if (!safePhoto(result)) throw Error("A foto ficou muito grande. Escolha uma imagem menor.");
      photos[selectedView] = result; photo = photos.front; dirty = true; $("#vehicle-error").textContent = "";
    } catch (err) { $("#vehicle-error").textContent = err.message || "Não foi possível ler a foto."; }
    finally { busy = false; e.target.disabled = false; e.target.value = ""; drawGallery(); }
  };
  function attachPicker(card, data = {}) {
    const group = card.querySelector('[data-kind="car"]');
    card.vehicleSnapshot = { vehicleId: data.vehicleId || "", vehiclePhoto: safePhoto(data.vehiclePhoto), vehiclePhotos: photoSet(data) };
    const panel = el("div", "", "vspp-picker vehicle-picker");
    const label = el("label", "Veículo do protegido"); const select = el("select");
    select.add(new Option("Preencher manualmente", ""));
    records.filter(r => kind(r) === "car").sort((a,b) => title(a).localeCompare(title(b))).forEach((r) => select.add(new Option(`${r.plate} · ${r.brand} ${r.model}`, r.id)));
    if (data.vehicleId) {
      // Uma opção própria impede que o cadastro atualizado substitua o histórico ao abrir.
      select.add(new Option(`${data.plate || "Veículo"} (salvo nesta agenda)`, "__saved__")); select.value = "__saved__";
    }
    const grid = el("div", "", "form-grid two");
    grid.append(...Array.from(group.children));
    const body = el("div", "", "operation-identity operation-vehicle");
    label.append(select); const preview = el("div", "", "operation-vehicle-photo");
    panel.append(label); body.append(preview, grid); group.replaceChildren(panel, body);
    // A escolta pertence ao mesmo trecho; a cópia salva preserva o histórico.
    card.escortSnapshot = data.escort ? structuredClone(data.escort) : null;
    const escortPanel = el("div", "", "escort-panel");
    const escortLabel = el("label", "Veículo de escolta");
    const escortSelect = el("select");
    escortSelect.add(new Option("Selecione a escolta cadastrada", ""));
    records.filter(r => kind(r) === "car").sort((a,b) => title(a).localeCompare(title(b))).forEach(r => escortSelect.add(new Option(`${r.plate} · ${r.brand} ${r.model}`, r.id)));
    if (data.escort) { escortSelect.add(new Option(`${data.escort.plate || "Escolta"} (salvo nesta agenda)`, "__saved__")); escortSelect.value = "__saved__"; }
    const escortPreview = el("div");
    function drawEscort() { escortPreview.replaceChildren(); if (card.escortSnapshot) escortPreview.append(summary(card.escortSnapshot)); }
    escortLabel.append(escortSelect);
    escortPanel.append(escortLabel, el("p", "A escolta acompanha o protegido neste mesmo percurso. Cadastre o carro em Veículos para selecioná-lo."), escortPreview);
    group.append(escortPanel); drawEscort();
    escortSelect.onchange = () => {
      const record = records.find(r => r.id === escortSelect.value);
      card.escortSnapshot = escortSelect.value === "__saved__" ? structuredClone(data.escort) : record ? snapshot(record) : null;
      drawEscort(); card.dispatchEvent(new Event("input", {bubbles:true}));
    };
    function draw(value) {
      const box = el("div", "", "vehicle-photo");
      const src = safePhoto(value.vehiclePhoto);
      if (src) { const image = el("img"); image.src = src; image.alt = `Veículo ${value.plate || ""}`; box.append(image); }
      else box.append(el("span", "Sem foto"));
      preview.replaceChildren(box);
    }
    draw(data);
    card.updateManualPhoto = window.ManualPhotos?.attach(card, {
      active: () => !select.value && card.querySelector('[data-field="type"]').value === 'car',
      get: () => card.vehicleSnapshot.vehiclePhoto || '',
      set: (photo) => { card.vehicleSnapshot.vehiclePhoto = photo; card.vehicleSnapshot.vehiclePhotos.front = photo; },
      redraw: () => draw(card.vehicleSnapshot),
    });
    select.onchange = () => {
      const record = records.find((r) => r.id === select.value);
      const value = select.value === "__saved__" ? data : record ? snapshot(record) : {};
      card.vehicleSnapshot = { vehicleId: value.vehicleId || "", vehiclePhoto: safePhoto(value.vehiclePhoto), vehiclePhotos: photoSet(value) };
      fields.forEach(([key]) => { card.querySelector(`[data-field="${key}"]`).value = value[key] || ""; });
      draw(value);
      card.updateManualPhoto?.();
      card.dispatchEvent(new Event("input", {bubbles:true}));
    };
    // O resumo acompanha ajustes manuais sem modificar o cadastro original.
    group.addEventListener("input", () => {
      if (!card.vehicleSnapshot.vehicleId) return;
      const values = Object.fromEntries(fields.map(([key]) => [key, card.querySelector(`[data-field="${key}"]`).value]));
      draw({...card.vehicleSnapshot,...values});
    });
    if (loadFailed) panel.append(el("p", "Não foi possível carregar o cadastro. Você pode preencher os dados manualmente."));
  }
  function attachAircraft(card, data = {}) {
    card.aircraftSnapshots = {};
    for (const type of ["helicopter", "plane"]) {
      const group = card.querySelector(`[data-kind="${type}"]`);
      const panel = el("div", "", "vspp-picker vehicle-picker");
      const label = el("label", `${kinds[type]} cadastrado`), select = el("select"), preview = el("div");
      select.add(new Option("Sem aeronave cadastrada / voo comercial", ""));
      records.filter(r => kind(r) === type).forEach(r => select.add(new Option(title(r),r.id)));
      const saved = data.type === type && data.aircraft ? structuredClone(data.aircraft) : null;
      card.aircraftSnapshots[type] = saved;
      if (saved) { select.add(new Option(`${title(saved)} (salvo nesta agenda)`, "__saved__")); select.value = "__saved__"; }
      const draw = () => { preview.replaceChildren(); if (card.aircraftSnapshots[type]) preview.append(summary(card.aircraftSnapshots[type])); };
      label.append(select); panel.append(label,preview); group.prepend(panel); draw();
      select.onchange = () => {
        const record = records.find(r => r.id === select.value && kind(r) === type);
        card.aircraftSnapshots[type] = select.value === "__saved__" ? structuredClone(saved) : record ? snapshot(record) : null;
        draw(); card.dispatchEvent(new Event("input", {bubbles:true}));
      };
    }
  }
  $("#vehicle-new").onclick = () => open();
  $("#vehicle-search").oninput = render;
  window.VehicleRegistry = { render, attachPicker, attachAircraft, snapshot, validate };
})();
