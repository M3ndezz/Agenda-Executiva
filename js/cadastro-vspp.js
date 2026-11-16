/* Cadastro local independente das agendas. Operações guardam uma cópia resumida. */
(() => {
  const KEY = "apeVsppRegistryV1";
  const $ = (s) => document.querySelector(s);
  const el = (tag, text, cls) => { const n = document.createElement(tag); if (text) n.textContent = text; if (cls) n.className = cls; return n; };
  const clean = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const groups = [
    ["Identificação", ["RE", "NOME", "CPF", "GÊNERO", "EMPRESA", "SITUAÇÃO", "RG", "DATA NASCIMENTO", "CRACHÁ BRAD"]],
    ["Dados profissionais", ["DATA ADMISSÃO", "TEMPO SERVIÇO", "PROMOÇÃO", "TEMPO NA FUNÇÃO", "TURNO", "ESCALA", "HR ENTRADA", "HR SAÍDA", "CNPJ", "CONTRATO", "UNIFORME", "DATA DE ATUALIZAÇÃO"]],
    ["Documentos", ["CNV PDF", "CNV", "VAL. CNV", "CNH", "CATEGORIA", "VENCIMENTO", "ASO IDADE"]],
    ["Contato e endereço", ["CEL CORPORATIVO", "CELULAR 1", "E-MAIL", "ENDEREÇO", "BAIRRO", "CIDADE", "UF", "CEP", "NOME PAI", "NOME MÃE"]],
    ["Veículos", ["PLACA VEÍCULO 1", "MODELO 01", "PLACA VEÍCULO 2", "MODELO 02"]],
  ];
  const keys = groups.flatMap((g) => g[1]);
  const seeds = (window.VSPPExamples || []).map((fields, i) => ({ id: `demo-vspp-${i + 1}`, demo: true, fields: { ...fields, "GÊNERO": "Não informado", "SITUAÇÃO": "Ativo" }, photo: "" }));
  let records = [], editId = null, pendingPhoto = "", dirty = false, photoBusy = false, loadFailed = false;
  const safePhoto = (s) => typeof s === "string" && s.length < 400000 && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(s) ? s : "";
  try {
    const saved = localStorage.getItem(KEY);
    records = saved === null ? [] : JSON.parse(saved);
    if (!Array.isArray(records) || records.some((r) => !r.id || !r.fields || typeof r.fields !== "object")) throw Error("Formato inválido");
    // Retira apenas os exemplos fornecidos pelo aplicativo, sem tocar em importações.
    const retained = records.filter((r) => !(r.demo === true && seeds.some((seed) => seed.id === r.id && seed.fields.RE === r.fields.RE && seed.fields.CPF === r.fields.CPF && seed.fields.NOME === r.fields.NOME)));
    if (retained.length !== records.length) persist(retained);
  } catch (_) { loadFailed = true; }
  function persist(next) {
    if (loadFailed) throw Error("Não foi possível ler os cadastros salvos. Os dados existentes foram preservados.");
    localStorage.setItem(KEY, JSON.stringify(next));
    records = next;
  }
  function isDemo(person) {
    return seeds.some((r) => r.id === person.registryId && r.fields.CPF === person.cpf && r.fields.NOME === person.name);
  }
  function portrait(person) {
    const box = el("div", "", "vspp-portrait");
    const photo = safePhoto(person.photo);
    if (photo) { const img = el("img"); img.src = photo; img.alt = `Foto de ${person.name || "VSPP"}`; box.append(img); }
    else { box.textContent = (person.name || "VSPP").split(/\s+/).filter(Boolean).slice(0,2).map((s) => s[0]).join(""); box.setAttribute("aria-label", "Sem foto"); }
    return box;
  }
  function isoDate(value) {
    const text = String(value || "").trim();
    const match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    return match ? `${match[3]}-${match[2]}-${match[1]}` : /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
  }
  function snapshot(r) {
    return { registryId: r.id, name: r.fields.NOME || "", cpf: r.fields.CPF || "", rg: r.fields.RG || "", gender: r.fields["GÊNERO"] || "Não informado", company: r.fields.EMPRESA || "", cnv: r.fields.CNV || "", cnvExpiry: isoDate(r.fields["VAL. CNV"]), corporatePhone: r.fields["CEL CORPORATIVO"] || "", phone: r.fields["CEL CORPORATIVO"] || r.fields["CELULAR 1"] || "", photo: safePhoto(r.photo) };
  }
  function summary(person) {
    const row = el("div", "", "vspp-summary"); row.append(portrait(person));
    const info = el("div"); info.append(el("strong", person.name || "VSPP"));
    info.append(el("p", [person.company, person.corporatePhone ?? person.phone].filter(Boolean).join(" · ") || "Empresa e contato não informados"));
    if (isDemo(person)) info.append(el("small", "Cadastro de demonstração"));
    row.append(info); return row;
  }
  function render() {
    const host = $("#vspp-cards"); host.replaceChildren();
    if (loadFailed) { $("#vspp-message").textContent = "Não foi possível ler os cadastros. Nenhum dado foi substituído."; return; }
    const query = clean($("#vspp-search").value), status = $("#vspp-filter").value;
    const visible = records.filter((r) => (status === "all" || (r.fields["SITUAÇÃO"] === "Inativo" ? "inactive" : "active") === status) && clean([r.fields.NOME, r.fields.RE, r.fields.EMPRESA].join(" ")).includes(query)).sort((a,b) => (a.fields.NOME || "").localeCompare(b.fields.NOME || "", "pt-BR"));
    $("#vspp-count").textContent = `${visible.length} profissional(is) encontrado(s)`;
    visible.forEach((r) => {
      const card = el("article", "", "card vspp-list-card"); card.append(summary(snapshot(r)));
      card.append(el("p", `RE: ${r.fields.RE || "Não informado"} · ${r.fields["SITUAÇÃO"] || "Ativo"}`));
      const actions = el("div", "", "vspp-card-actions");
      const button = el("button", "Abrir ficha", "btn btn-outline"); button.type = "button"; button.onclick = () => open(r.id);
      const remove = el("button", "Excluir VSPP", "btn btn-outline"); remove.type = "button";
      remove.setAttribute("aria-label", `Excluir VSPP ${r.fields.NOME || "sem nome"}`);
      remove.onclick = () => {
        if (!confirm(`Excluir o cadastro de ${r.fields.NOME || "este VSPP"}? Esta ação não pode ser desfeita. Os dados nas agendas já preenchidas serão mantidos.`)) return;
        try {
          persist(records.filter((item) => item.id !== r.id));
          render(); $("#vspp-message").textContent = "Cadastro excluído. As agendas existentes foram preservadas.";
        } catch (error) { $("#vspp-message").textContent = error.message; }
      };
      actions.append(button, remove); card.append(actions); host.append(card);
    });
    if (!visible.length) host.append(el("p", "Nenhum profissional encontrado."));
  }
  let pendingPdf = null;
  function elapsed(value, now = new Date()) {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value || "");
    if (!m) return "Informe uma data válida";
    const start = new Date(+m[3], +m[2]-1, +m[1]);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (start.getDate() !== +m[1] || start.getMonth() !== +m[2]-1 || start > end) return "Confira a data informada";
    const anniversary = (months) => { const d = new Date(start.getFullYear(), start.getMonth()+months, 1); d.setDate(Math.min(start.getDate(), new Date(d.getFullYear(),d.getMonth()+1,0).getDate())); return d; };
    let months = (end.getFullYear()-start.getFullYear())*12+end.getMonth()-start.getMonth();
    if (anniversary(months)>end) months--;
    const anchor = anniversary(months);
    const days = Math.round((Date.UTC(end.getFullYear(),end.getMonth(),end.getDate())-Date.UTC(anchor.getFullYear(),anchor.getMonth(),anchor.getDate()))/86400000);
    return `${Math.floor(months/12)} anos, ${months%12} meses e ${days} dias`;
  }
  function refreshTimes() {
    for (const [source,target] of [["DATA ADMISSÃO","TEMPO SERVIÇO"],["PROMOÇÃO","TEMPO NA FUNÇÃO"]]) {
      const input = document.querySelector(`[data-registry-field="${source}"]`), output = document.querySelector(`[data-registry-field="${target}"]`);
      if (input && output) output.value = elapsed(input.value);
    }
  }
  function open(id) {
    const record = records.find((r) => r.id === id);
    editId = record?.id || null; pendingPhoto = safePhoto(record?.photo); pendingPdf = record?.cnvPdf || null; dirty = false;
    $("#vspp-dialog-title").textContent = record ? "Ficha do VSPP" : "Novo VSPP";
    $("#vspp-photo").value = ""; $("#vspp-editor-error").textContent = "";
    $("#vspp-photo-preview").replaceChildren(portrait(snapshot(record || { fields: {}, id: "" })));
    const host = $("#vspp-editor-fields"); host.replaceChildren();
    groups.forEach(([title, fields], i) => {
      const section = el("details"); section.open = i === 0; section.append(el("summary", title));
      const grid = el("div", "", "form-grid two");
      fields.forEach((key) => {
        const label = el("label", key === "NOME" ? "NOME *" : key);
        if (key === "CNV PDF") {
          const file = el("input"); file.type = "file"; file.accept = ".pdf,application/pdf";
          const name = el("span", pendingPdf?.name || "Nenhum PDF anexado");
          const download = el("button", "Baixar PDF", "btn btn-outline"); download.type = "button";
          download.onclick = () => { if (!pendingPdf) return; const a = el("a"); a.href = pendingPdf.data; a.download = pendingPdf.name; a.click(); };
          const remove = el("button", "Remover PDF", "btn btn-outline"); remove.type = "button";
          remove.onclick = () => { pendingPdf = null; name.textContent = "Nenhum PDF anexado"; dirty = true; };
          file.onchange = async () => {
            const f = file.files[0]; if (!f) return; photoBusy = true;
            try {
              if (!/\.pdf$/i.test(f.name) || f.size > 1024*1024 || new TextDecoder().decode(await f.slice(0,5).arrayBuffer()) !== "%PDF-") throw Error("Selecione um PDF válido de até 1 MB.");
              const data = await new Promise((resolve,reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(f); });
              pendingPdf = {name:f.name,data}; name.textContent = f.name; dirty = true; $("#vspp-editor-error").textContent = "";
            } catch (error) { $("#vspp-editor-error").textContent = error.message || "Não foi possível ler o PDF."; }
            finally { photoBusy = false; }
          };
          label.append(file,name,download,remove); grid.append(label); return;
        }
        const options = key === "SITUAÇÃO" ? ["Ativo", "Inativo"] : key === "GÊNERO" ? ["Não informado", "Masculino", "Feminino", "Outro", "Prefere não informar"] : null;
        const control = el(options ? "select" : "input"); control.dataset.registryField = key;
        if (options) options.forEach((o) => control.add(new Option(o, o)));
        else { control.type = "text"; control.maxLength = 250; }
        control.value = record?.fields[key] || (options ? options[0] : "");
        control.required = key === "NOME";
        if (["TEMPO SERVIÇO", "TEMPO NA FUNÇÃO"].includes(key)) control.readOnly = true;
        if (["DATA ADMISSÃO", "PROMOÇÃO"].includes(key)) control.addEventListener("input", refreshTimes);
        if (["DATA ADMISSÃO", "PROMOÇÃO", "DATA NASCIMENTO", "VAL. CNV", "VENCIMENTO", "DATA DE ATUALIZAÇÃO"].includes(key)) control.placeholder = "dd/mm/aaaa";
        label.append(control); grid.append(label);
      });
      section.append(grid); host.append(section);
    });
    refreshTimes();
    $("#vspp-dialog").showModal();
  }
  function close() { if (photoBusy) return; if (!dirty || confirm("Fechar sem salvar as alterações do cadastro?")) $("#vspp-dialog").close(); }
  $("#vspp-close").onclick = close;
  $("#vspp-dialog").addEventListener("cancel", (e) => { e.preventDefault(); close(); });
  $("#vspp-editor").addEventListener("input", () => { dirty = true; });
  window.addEventListener("beforeunload", (e) => { if (dirty && $("#vspp-dialog").open) { e.preventDefault(); e.returnValue = ""; } });
  $("#vspp-editor").onsubmit = (e) => {
    e.preventDefault(); if (photoBusy) return;
    try {
      const fields = Object.fromEntries([...document.querySelectorAll("[data-registry-field]")].map((n) => [n.dataset.registryField, n.value.trim()]));
      if (!fields.NOME) throw Error("Informe o nome do profissional.");
      const previous = records.find((r) => r.id === editId);
      const record = { id: editId || `vspp-${crypto.randomUUID()}`, demo: previous?.demo || false, fields: { ...previous?.fields, ...fields }, photo: pendingPhoto, cnvPdf: pendingPdf };
      const person = snapshot(record);
      if (fields.CPF && !isDemo(person) && !AgendaRules.validCPF(fields.CPF)) throw Error("Confira o CPF informado.");
      if (records.some((r) => r.id !== record.id && ((fields.RE && r.fields.RE === fields.RE) || (fields.CPF && (r.fields.CPF || "").replace(/\D/g, "") === fields.CPF.replace(/\D/g, ""))))) throw Error("Já existe um profissional com esse RE ou CPF.");
      persist(editId ? records.map((r) => r.id === editId ? record : r) : [...records, record]);
      dirty = false; $("#vspp-dialog").close(); render(); $("#vspp-message").textContent = "Cadastro salvo. As agendas anteriores mantêm os dados registrados na operação.";
    } catch (err) { $("#vspp-editor-error").textContent = err.name === "QuotaExceededError" ? "Não há espaço para salvar. Exporte um backup e reduza as fotos." : err.message; }
  };
  $("#vspp-photo-remove").onclick = () => { pendingPhoto = ""; dirty = true; $("#vspp-photo-preview").replaceChildren(portrait({})); };
  $("#vspp-photo").onchange = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    photoBusy = true; $("#vspp-editor-error").textContent = "Preparando foto…";
    try {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 5 * 1024 * 1024) throw Error("Escolha uma foto JPG, PNG ou WebP de até 5 MB.");
      const bitmap = await createImageBitmap(file); const scale = Math.min(1, 320 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
      pendingPhoto = canvas.toDataURL("image/jpeg", .8); dirty = true;
      $("#vspp-photo-preview").replaceChildren(portrait({ photo: pendingPhoto })); $("#vspp-editor-error").textContent = "";
    } catch (err) { $("#vspp-editor-error").textContent = err.message; }
    finally { photoBusy = false; }
  };
  // Selection keeps a snapshot; changing the registry never rewrites old operations.
  function attachPicker(card, data) {
    card.vsppSnapshot = { ...data };
    const panel = el("div", "", "vspp-picker");
    const label = el("label", "Selecionar VSPP cadastrado"); const search = el("input"); search.type = "search"; search.placeholder = "Buscar pelo nome ou RE"; label.append(search);
    const listLabel = el("label", "Profissional"); const select = el("select"); listLabel.append(select);
    const grid = card.querySelector(".form-grid");
    const preview = el("div", "", "operation-portrait");
    const body = el("div", "", "operation-identity");
    const detail = el("div"); const contact = el("p", "", "operation-contact");
    panel.append(listLabel); card.insertBefore(panel, grid);
    card.insertBefore(body, grid); detail.append(grid, contact); body.append(preview, detail);
    function options() {
      select.replaceChildren(new Option("Preencher manualmente", ""));
      records.filter((r) => r.fields["SITUAÇÃO"] !== "Inativo" && clean(`${r.fields.NOME} ${r.fields.RE}`).includes(clean(search.value))).sort((a,b) => a.fields.NOME.localeCompare(b.fields.NOME, "pt-BR")).forEach((r) => select.add(new Option(`${r.fields.NOME} · RE ${r.fields.RE || "—"}`, r.id)));
      const id = card.vsppSnapshot.registryId;
      if (id && ![...select.options].some((o) => o.value === id)) select.add(new Option(`${card.vsppSnapshot.name} (salvo nesta agenda)`, id));
      select.value = id || "";
    }
    function draw() {
      const person = card.vsppSnapshot;
      const photo = portrait(person);
      if (!safePhoto(person.photo)) photo.textContent = "Sem foto";
      preview.replaceChildren(photo);
      contact.textContent = "";
      contact.hidden = !contact.textContent;
    }
    search.oninput = options;
    const updatePhoto = window.ManualPhotos?.attach(card, {
      active: () => !select.value,
      get: () => card.vsppSnapshot.photo || '',
      set: (photo) => { card.vsppSnapshot.photo = photo; },
      redraw: draw,
    });
    select.onchange = () => {
      const record = records.find((r) => r.id === select.value);
      card.vsppSnapshot = record ? snapshot(record) : {};
      for (const key of ["name", "cpf", "gender", "rg", "cnv", "cnvExpiry", "corporatePhone", "company"]) card.querySelector(`[data-field="${key}"]`).value = card.vsppSnapshot[key] || "";
      draw(); updatePhoto?.(); card.dispatchEvent(new Event("input", { bubbles: true }));
    };
    options(); draw(); updatePhoto?.();
  }
  function importRecords(payload) {
    const rows = Array.isArray(payload) ? payload : Array.isArray(payload.records) ? payload.records : (payload.planilhas || []).flatMap((p) => p.registros || []);
    if (!rows.length || rows.length > 2000) throw Error("O JSON deve conter de 1 a 2.000 cadastros.");
    const aliases = { re_compl: "RE", data_nasc: "DATA NASCIMENTO", val_cnv: "VAL. CNV", cracha_brad: "CRACHÁ BRAD", celular_1: "CELULAR 1", e_mail: "E-MAIL", data_de_atualizacao: "DATA DE ATUALIZAÇÃO", placa_veic_01: "PLACA VEÍCULO 1", placa_veic_02: "PLACA VEÍCULO 2" };
    const normalizedKey = (k) => clean(k).replace(/[^a-z0-9]/g, "");
    const issues = [];
    const incoming = rows.map((row, i) => {
      try {
      const fields = {};
      Object.entries(row.fields || row).forEach(([k,v]) => { const key = aliases[k] || keys.find((x) => normalizedKey(x) === normalizedKey(k)); if (key && v != null && ["string", "number"].includes(typeof v)) fields[key] = String(v).slice(0,250); });
      if (!fields.NOME || !(fields.RE || fields.CPF)) throw Error(`Registro ${i+1}: informe nome e RE ou CPF.`);
      fields["SITUAÇÃO"] = fields["SITUAÇÃO"] === "Inativo" ? "Inativo" : "Ativo";
      const matches = records.filter((r) => (fields.RE && fields.RE === r.fields.RE) || (fields.CPF && fields.CPF.replace(/\D/g, "") === (r.fields.CPF || "").replace(/\D/g, "")));
      if (matches.length > 1) throw Error(`Registro ${i+1}: RE e CPF apontam para cadastros diferentes.`);
      const previous = matches[0];
      const seed = seeds.find((r) => r.id === row.id && r.fields.RE === fields.RE && r.fields.CPF === fields.CPF && r.fields.NOME === fields.NOME);
      const id = previous?.id || seed?.id || `vspp-${crypto.randomUUID()}`;
      const pdf = row.cnvPdf;
      const validPdf = pdf && typeof pdf.name === "string" && typeof pdf.data === "string" && pdf.data.length < 1500000 && /^data:application\/pdf;base64,JVBERi0[A-Za-z0-9+/=]*$/.test(pdf.data);
      const candidate = { id, fields: { ...previous?.fields, ...fields }, photo: safePhoto(row.photo) || previous?.photo || "", cnvPdf: validPdf ? pdf : previous?.cnvPdf || null };
      if (fields.CPF && !isDemo(snapshot(candidate)) && !AgendaRules.validCPF(fields.CPF)) throw Error(`Registro ${i+1}: confira o CPF informado.`);
      return candidate;
      } catch (error) { issues.push(error.message); return null; }
    }).filter(Boolean);
    const report = issues.length ? `\n${issues.length} registro(s) ficaram de fora:\n${issues.join("\n")}` : "";
    $("#vspp-message").textContent = `${incoming.length} cadastro(s) válido(s).${report}`;
    if (!incoming.length) return;
    const seen = new Set(); incoming.forEach((r) => { for (const key of [r.fields.RE && `re:${r.fields.RE}`, r.fields.CPF && `cpf:${r.fields.CPF.replace(/\D/g, "")}`].filter(Boolean)) { if (seen.has(key)) throw Error("O arquivo contém RE ou CPF duplicado. Revise antes de importar."); seen.add(key); } });
    if (!confirm(`Importar ${incoming.length} cadastros válidos? Profissionais com o mesmo RE ou CPF serão atualizados. As agendas não serão alteradas.${report}`)) return;
    const next = [...records]; incoming.forEach((r) => { const i = next.findIndex((p) => p.id === r.id); if (i < 0) next.push(r); else next[i] = r; }); persist(next); render();
    $("#vspp-message").textContent = `${incoming.length} cadastros importados.${report}`;
  }
  $("#vspp-import").onclick = () => $("#vspp-import-file").click();
  $("#vspp-import-file").onchange = async (e) => { try { const file = e.target.files[0]; if (!file) return; if (file.size > 10*1024*1024) throw Error("O JSON deve ter até 10 MB."); importRecords(JSON.parse(await file.text())); } catch (err) { $("#vspp-message").textContent = `Não foi possível importar: ${err.message}`; } finally { e.target.value = ""; } };
  $("#vspp-export").onclick = () => { const url = URL.createObjectURL(new Blob([JSON.stringify({ version: 1, records }, null, 2)], { type: "application/json" })); const a = el("a"); a.href = url; a.download = "cadastros-vspp.json"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
  $("#vspp-new").onclick = () => open(); $("#vspp-search").oninput = render; $("#vspp-filter").onchange = render;
  window.VSPPRegistry = { render, attachPicker, summary, isDemo, snapshot };
})();
