(() => {
      const STORAGE_KEY = "superAgendaPrototypeV2";
      const LEGACY_STORAGE_KEY = "superAgendaPrototypeV1";
      const KNOWN_PROTECTED = [
        "Luiz Carlos Trabuco Cappi",
        "Marcelo de Araújo Noronha"
      ];
      let agendas = [];
      let selectedAgendaId = null;
      let editingId = null;
      const $ = (selector) => document.querySelector(selector);
      const $$ = (selector) => [...document.querySelectorAll(selector)];

      function nextId() {
        const year = new Date().getFullYear();
        const prefix = `APE-${year}-`;
        const greatestSequence = agendas.reduce((greatest, item) => {
          if (!item.id || !item.id.startsWith(prefix)) return greatest;
          const sequence = Number(item.id.slice(prefix.length));
          return Number.isInteger(sequence) ? Math.max(greatest, sequence) : greatest;
        }, 0);
        return `${prefix}${String(greatestSequence + 1).padStart(4, "0")}`;
      }
      function selectedAgenda() {
        return agendas.find((item) => item.id === selectedAgendaId) || null;
      }
      function saveAgendas() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(agendas));
      }
      function safe(text) {
        const node = document.createElement("div"); node.textContent = String(text || ""); return node.innerHTML;
      }
      function dateBR(value) {
        if (!value) return "";
        const [year, month, day] = value.split("-"); return `${day}/${month}/${year}`;
      }
      function todayISO() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      }
      function agendaSituation(agenda) {
        const today = todayISO();
        if (agenda.start > today) return { label: "Próxima", className: "upcoming" };
        if (agenda.end < today) return { label: "Período encerrado", className: "past" };
        return { label: "Em andamento", className: "active" };
      }
      function show(screen) {
        $$(".screen").forEach((item) => item.classList.toggle("active", item.id === screen));
        $$(".nav-button").forEach((item) => item.classList.toggle("active", item.dataset.go === screen || (screen === "dashboard" && item.dataset.go === "form")));
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      function toast(message) {
        const element = $("#toast"); element.textContent = message; element.classList.add("show");
        clearTimeout(toast.timer); toast.timer = setTimeout(() => element.classList.remove("show"), 3200);
      }
      function addVip(value = "") {
        const index = $$(".vip-entry").length + 1;
        const label = document.createElement("label"); label.className = "vip-entry";
        const removeButton = index > 1 ? '<button type="button" class="remove-vip" aria-label="Remover protegido">×</button>' : "";
        if (index <= 2) {
          label.innerHTML = `<span>Protegido ${index} *</span><div class="vip-input-row"><div class="protected-fields"><select class="protected-select" aria-label="Selecionar protegido ${index}"><option value="">Selecione um nome</option><option value="Luiz Carlos Trabuco Cappi">Luiz Carlos Trabuco Cappi</option><option value="Marcelo de Araújo Noronha">Marcelo de Araújo Noronha</option><option value="__other__">Outro - informar manualmente</option></select><input class="manual-other" placeholder="Digite o nome completo" aria-label="Nome do protegido ${index}" hidden></div>${removeButton}</div>`;
          const select = label.querySelector(".protected-select");
          const manual = label.querySelector(".manual-other");
          if (KNOWN_PROTECTED.includes(value)) select.value = value;
          else if (value) { select.value = "__other__"; manual.hidden = false; manual.value = value; }
        } else {
          label.innerHTML = `<span>Protegido ${index} *</span><div class="vip-input-row"><div class="protected-fields"><input class="protected-manual" placeholder="Digite o nome completo" aria-label="Nome do protegido ${index}"></div>${removeButton}</div>`;
          label.querySelector(".protected-manual").value = value;
        }
        $("#vip-list").appendChild(label);
      }
      function protectedValue(entry) {
        const select = entry.querySelector(".protected-select");
        if (select) return select.value === "__other__" ? entry.querySelector(".manual-other").value.trim() : select.value.trim();
        return entry.querySelector(".protected-manual").value.trim();
      }
      function renumberVips() {
        $$(".vip-entry").forEach((entry, index) => entry.querySelector("span").textContent = `Protegido ${index + 1} *`);
      }
      function clearForm() {
        $("#agenda-form").reset(); $("#vip-list").innerHTML = ""; addVip(); editingId = null; $("#generated-id").textContent = nextId(); $("#error").classList.remove("show");
      }
      function fillForm() {
        const agenda = selectedAgenda();
        if (!agenda) return;
        $("#title").value = agenda.title; $("#start").value = agenda.start; $("#end").value = agenda.end; $("#notes").value = agenda.notes || ""; $("#generated-id").textContent = agenda.id;
        $("#vip-list").innerHTML = ""; agenda.vips.forEach(addVip); editingId = agenda.id;
      }
      function loadAgendas() {
        try {
          const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
          if (Array.isArray(saved)) agendas = saved;
          else {
            const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || "null");
            agendas = legacy && legacy.id ? [legacy] : [];
            if (agendas.length) saveAgendas();
          }
        } catch { agendas = []; }
        selectedAgendaId = agendas.length ? agendas[agendas.length - 1].id : null;
        renderHome();
      }
      function renderHome(query = "") {
        const today = todayISO();
        const activeAgendas = agendas.filter((agenda) => agenda.start <= today && agenda.end >= today);
        const upcomingAgendas = agendas.filter((agenda) => agenda.start > today);
        $("#active-count").textContent = String(activeAgendas.length);
        $("#upcoming-count").textContent = String(upcomingAgendas.length);
        const list = $("#agenda-list");
        const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
        const matches = agendas.filter((agenda) => [agenda.id, agenda.title, ...agenda.vips].join(" ").toLocaleLowerCase("pt-BR").includes(normalizedQuery)).reverse();
        if (!matches.length) {
          list.innerHTML = `<div class="empty"><div class="empty-symbol">▣</div><h3>${agendas.length && query ? "Nenhuma agenda encontrada" : "Nenhuma agenda cadastrada"}</h3><p>${agendas.length && query ? "Tente buscar por outro termo." : "Crie a primeira agenda para começar o acompanhamento."}</p>${agendas.length && query ? "" : '<button class="btn btn-outline" data-go="form">＋ Criar agenda</button>'}</div>`;
          bindNavigation(); return;
        }
        list.innerHTML = matches.map((agenda) => {
          const situation = agendaSituation(agenda);
          return `<button class="agenda-row" data-agenda-id="${safe(agenda.id)}"><span class="dot ${situation.className}"></span><span class="agenda-row-info"><strong>${safe(agenda.title)}</strong><small>${safe(agenda.id)} · ${safe(agenda.vips.join(", "))} · Início: ${safe(dateBR(agenda.start))}</small></span><span class="pill ${situation.className}">${situation.label}</span><span>›</span></button>`;
        }).join("");
        $$('[data-agenda-id]').forEach((row) => row.addEventListener("click", () => { selectedAgendaId = row.dataset.agendaId; renderDashboard(); show("dashboard"); }));
      }
      function renderDashboard() {
        const agenda = selectedAgenda();
        if (!agenda) return;
        const period = `${dateBR(agenda.start)} a ${dateBR(agenda.end)}`;
        const situation = agendaSituation(agenda);
        $("#dash-id").textContent = agenda.id; $("#dash-title").textContent = agenda.title; $("#dash-period").textContent = `▣ ${period}`; $("#detail-period").textContent = period;
        $("#dash-status").textContent = situation.label;
        $("#dash-status").className = `pill ${situation.className}`;
        $("#detail-vips").innerHTML = agenda.vips.map((vip) => `<span class="vip-chip">${safe(vip)}</span>`).join("");
        $("#detail-notes").textContent = agenda.notes || ""; $("#notes-row").style.display = agenda.notes ? "grid" : "none";
      }
      function bindNavigation() {
        $$('[data-go="home"]').forEach((button) => button.onclick = () => { editingId = null; renderHome($("#search").value); show("home"); });
        $$('[data-go="form"]').forEach((button) => button.onclick = () => { clearForm(); show("form"); });
      }

      $("#add-vip").addEventListener("click", () => addVip());
      $("#vip-list").addEventListener("change", (event) => {
        if (!event.target.classList.contains("protected-select")) return;
        const manual = event.target.closest(".protected-fields").querySelector(".manual-other");
        manual.hidden = event.target.value !== "__other__";
        if (!manual.hidden) manual.focus(); else manual.value = "";
      });
      $("#vip-list").addEventListener("click", (event) => {
        const button = event.target.closest(".remove-vip");
        if (!button) return;
        const removed = button.closest(".vip-entry");
        const values = $$(".vip-entry").filter((entry) => entry !== removed).map(protectedValue);
        $("#vip-list").innerHTML = ""; values.forEach(addVip); if (!values.length) addVip(); renumberVips();
      });
      $("#search").addEventListener("input", (event) => renderHome(event.target.value));
      $("#reports").addEventListener("click", () => toast("Os relatórios serão planejados em uma etapa futura."));
      $("#next-step").addEventListener("click", () => toast("A Etapa 2 será construída na próxima fase do protótipo."));
      $("#edit").addEventListener("click", () => { fillForm(); show("form"); });
      $("#agenda-form").addEventListener("submit", (event) => {
        event.preventDefault();
        const error = $("#error"); const title = $("#title").value.trim(); const start = $("#start").value; const end = $("#end").value; const vips = $$(".vip-entry").map(protectedValue);
        let message = "";
        if (!title || !start || !end) message = "Preencha o título e as duas datas para continuar.";
        else if (end < start) message = "A data final não pode ser anterior à data de início.";
        else if (!vips.length || vips.some((name) => !name)) message = "Selecione ou informe o nome de todos os protegidos adicionados.";
        else if (new Set(vips.map((name) => name.toLocaleLowerCase("pt-BR"))).size !== vips.length) message = "O mesmo protegido foi informado mais de uma vez.";
        if (message) { error.textContent = message; error.classList.add("show"); error.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
        const agenda = { id: editingId || nextId(), title, start, end, vips, notes: $("#notes").value.trim() };
        if (editingId) agendas = agendas.map((item) => item.id === editingId ? agenda : item);
        else agendas.push(agenda);
        selectedAgendaId = agenda.id; editingId = null; saveAgendas(); error.classList.remove("show"); renderHome(); renderDashboard(); show("dashboard");
      });

      addVip(); bindNavigation(); loadAgendas(); $("#generated-id").textContent = nextId();
    })();
