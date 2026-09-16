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
        $("#start-time").value = agenda.startTime || ""; $("#title").value = agenda.title; $("#start").value = agenda.start; $("#end").value = agenda.end; $("#notes").value = agenda.notes || ""; $("#generated-id").textContent = agenda.id;
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
        const period = `${dateBR(agenda.start)} ${agenda.startTime || ""} a ${dateBR(agenda.end)}`;
        const situation = agendaSituation(agenda);
        const lead = AgendaRules.leadTime(agenda);
        $("#lead-summary").textContent = '◷ Antecedência mínima: 48 horas corridas. ' + lead.text;
        $("#lead-summary").className = `notice ${lead.status}`;
        $("#created-label").textContent = agenda.createdAt ? new Date(agenda.createdAt).toLocaleString('pt-BR') : 'Data de criação não registrada (agenda antiga)';
        renderOperationSummary(agenda);
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
      $("#next-step").addEventListener("click", openOperations);
      $("#edit").addEventListener("click", () => { fillForm(); show("form"); });
      $("#agenda-form").addEventListener("submit", (event) => {
        event.preventDefault();
        const error = $("#error"); const title = $("#title").value.trim(); const start = $("#start").value; const end = $("#end").value; const vips = $$(".vip-entry").map(protectedValue);
        let message = "";
        if (!title || !start || !end || !$("#start-time").value) message = "Preencha o título, as datas e o horário de início para continuar.";
        else if (end < start) message = "A data final não pode ser anterior à data de início.";
        else if (!vips.length || vips.some((name) => !name)) message = "Selecione ou informe o nome de todos os protegidos adicionados.";
        else if (new Set(vips.map((name) => name.toLocaleLowerCase("pt-BR"))).size !== vips.length) message = "O mesmo protegido foi informado mais de uma vez.";
        if (message) { error.textContent = message; error.classList.add("show"); error.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
        const previous = editingId ? agendas.find(item => item.id === editingId) : null;
        const agenda = { ...previous, id: editingId || nextId(), createdAt: previous ? previous.createdAt : new Date().toISOString(), title, start, startTime: $("#start-time").value, end, vips, notes: $("#notes").value.trim() };
        agenda.leadTime = { ...AgendaRules.leadTime(agenda), evaluatedAt: new Date().toISOString() };
        if (editingId) agendas = agendas.map((item) => item.id === editingId ? agenda : item);
        else agendas.push(agenda);
        selectedAgendaId = agenda.id; editingId = null; saveAgendas(); error.classList.remove("show"); renderHome(); renderDashboard(); show("dashboard");
      });

      const operationForm = $("#operation-form");
      let operationDirty = false;
      const operationValue = (name) => operationForm.elements.namedItem(name).value.trim();
      function updateTransport() {
        $$('[data-transport]').forEach(group => {
          group.hidden = group.dataset.transport !== operationValue('transport');
          group.querySelectorAll('input').forEach(input => input.disabled = group.hidden);
        });
      }
      function updateMap() {
        const address = AgendaRules.address(Object.fromEntries(['street','number','district','city','state','cep'].map(key => [key, operationValue(key)])));
        const ready = operationValue('street') && operationValue('city') && operationValue('state');
        $('#address-preview').textContent = ready ? address : 'Preencha rua, cidade e UF para consultar.';
        $('#maps-link').hidden = !ready;
        if (ready) $('#maps-link').href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(address);
        else $('#maps-link').removeAttribute('href');
      }
      function openOperations() {
        const agenda = selectedAgenda();
        if (!agenda) return;
        operationForm.reset();
        for (const [key, value] of Object.entries(agenda.operation?.fields || {})) {
          const input = operationForm.elements.namedItem(key);
          if (input) input.value = value;
        }
        $('#operation-agenda').textContent = `${agenda.id} · ${agenda.title}`;
        $('#operation-error').classList.remove('show');
        operationDirty = false;
        updateTransport(); updateMap(); show('operations');
      }
      function renderOperationSummary(agenda) {
        const operation = agenda.operation;
        $('#next-step').textContent = operation ? 'Editar registros operacionais' : 'Preencher registros operacionais';
        if (!operation) { $('#operation-summary').textContent = 'Nenhum dado operacional salvo.'; return; }
        const f = operation.fields;
        const transport = f.transport === 'car' ? `Carro · ${f.brand || ''} ${f.model || ''} · ${f.plate || ''} · ${f.color || ''} · ${f.year || ''}` : f.transport === 'helicopter' ? `Helicóptero · ${f.heliCompany || ''} · ${f.boarding || ''} → ${f.landing || ''}` : f.transport === 'plane' ? `Avião · ${f.airline || ''} · Voo ${f.flight || ''} · ${f.departure || ''} → ${f.arrival || ''}` : 'Não informado';
        const entries = [
          ['Preenchimento', operation.status === 'complete' ? 'Dados desta versão preenchidos' : 'Rascunho'],
          ['Local', [f.venue, AgendaRules.address(f), f.complement, f.reference].filter(Boolean).join(' · ')],
          ['Empresa de segurança', f.company || 'Não informada'],
          ['VSPP', `${f.vspp || 'Não informado'}${f.gender ? ' · ' + f.gender : ''}`],
          ['Transporte', transport],
          ['Atualizado em', new Date(operation.updatedAt).toLocaleString('pt-BR')]
        ];
        $('#operation-summary').innerHTML = entries.map(([label,value]) => `<p><strong>${safe(label)}:</strong> ${safe(value)}</p>`).join('');
      }
      function saveOperation(draft) {
        const agenda = selectedAgenda();
        if (!agenda) return;
        const fields = Object.fromEntries(new FormData(operationForm));
        Object.keys(fields).forEach(key => fields[key] = fields[key].trim());
        let message = '';
        const required = ['street','number','district','city','state','company','vspp','cpf','gender','transport'];
        const conditional = { car: ['plate','brand','model','color','year'], helicopter: ['heliCompany','boarding','landing'], plane: ['airline','flight','departure','arrival'] };
        if (!draft && [...required, ...(conditional[fields.transport] || [])].some(key => !fields[key])) message = 'Preencha os campos com * ou use Salvar rascunho para continuar depois.';
        else if (!draft && fields.cpf && !AgendaRules.validCPF(fields.cpf)) message = 'Confira o CPF: os dígitos informados não são válidos.';
        else if (!draft && fields.cep && !/^\d{8}$/.test(fields.cep.replace(/\D/g,''))) message = 'O CEP deve conter 8 dígitos.';
        else if (!draft && fields.transport === 'car' && !/^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(fields.plate.toUpperCase().replace(/[-\s]/g,''))) message = 'Confira a placa. Exemplos: ABC-1234 ou ABC1D23.';
        else if (!draft && fields.transport === 'car' && (!/^\d{4}$/.test(fields.year) || +fields.year < 1900 || +fields.year > 2100)) message = 'Informe um ano válido com quatro dígitos.';
        const departure = fields.transport === 'helicopter' ? fields.boarding : fields.departure;
        const arrival = fields.transport === 'helicopter' ? fields.landing : fields.arrival;
        if (!draft && !message && departure && arrival && new Date(arrival) < new Date(departure)) message = 'A chegada ou o desembarque não pode ser anterior à partida. Confira também as datas.';
        if (message) { $('#operation-error').textContent = message; $('#operation-error').classList.add('show'); $('#operation-error').scrollIntoView({block:'center'}); return; }
        const previous = agenda.operation;
        agenda.operation = { fields, status: draft ? 'draft' : 'complete', updatedAt: new Date().toISOString() };
        try { saveAgendas(); } catch { agenda.operation = previous; toast('Não foi possível salvar. Verifique o armazenamento do navegador.'); return; }
        operationDirty = false;
        renderDashboard(); show('dashboard'); toast(draft ? 'Rascunho salvo.' : 'Dados operacionais salvos.');
      }
      operationForm.addEventListener('input', () => { operationDirty = true; updateMap(); });
      operationForm.addEventListener('change', () => { operationDirty = true; updateTransport(); updateMap(); });
      operationForm.addEventListener('submit', event => { event.preventDefault(); saveOperation(false); });
      $('#save-draft').addEventListener('click', () => saveOperation(true));
      $('#operation-back').addEventListener('click', () => {
        if (operationDirty && !confirm('Sair sem salvar as alterações operacionais?')) return;
        operationDirty = false; renderDashboard(); show('dashboard');
      });
      document.addEventListener('click', event => {
        if (!operationDirty || !$('#operations').classList.contains('active') || !event.target.closest('[data-go]')) return;
        if (!confirm('Sair sem salvar as alterações operacionais?')) { event.preventDefault(); event.stopImmediatePropagation(); }
        else operationDirty = false;
      }, true);
      window.addEventListener('beforeunload', event => { if (operationDirty) { event.preventDefault(); event.returnValue = ''; } });
      addVip(); bindNavigation(); loadAgendas(); $("#generated-id").textContent = nextId();
    })();
