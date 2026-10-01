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
        if (agenda.conclusion?.status === "complete") return {label:"Concluída",className:"completed"};
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
        $("#received-date").value = agenda.receivedDate || ""; $("#start-time").value = agenda.startTime || ""; $("#title").value = agenda.title; $("#start").value = agenda.start; $("#end").value = agenda.end; $("#notes").value = agenda.notes || ""; $("#generated-id").textContent = agenda.id;
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
        const activeAgendas = agendas.filter((agenda) => agenda.conclusion?.status !== "complete" && agenda.start <= today && agenda.end >= today);
        const upcomingAgendas = agendas.filter((agenda) => agenda.conclusion?.status !== "complete" && agenda.start > today);
        $("#active-count").textContent = String(activeAgendas.length);
        $("#upcoming-count").textContent = String(upcomingAgendas.length);
        const now = new Date();
        $('#completed-month').textContent = now.toLocaleDateString('pt-BR', {month:'long',year:'numeric'});
        $('#completed-count').textContent = agendas.filter(a=>{
          const date = new Date(a.conclusion?.completedAt);
          return a.conclusion?.status==='complete' && date.getMonth()===now.getMonth() && date.getFullYear()===now.getFullYear();
        }).length;
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
        $("#lead-summary").textContent = '◷ Preparação mínima: 2 dias corridos (cálculo por datas, sem horários). ' + lead.text;
        $("#lead-summary").className = `notice ${lead.status}`;
        AgendaHistory.render(agenda);
        renderOperationSummary(agenda);
        renderConclusion(agenda);
        $("#dash-id").textContent = agenda.id; $("#dash-title").textContent = agenda.title; $("#dash-period").textContent = `▣ ${period}`; $("#detail-period").textContent = period;
        $("#dash-status").textContent = situation.label;
        $("#dash-status").className = `pill ${situation.className}`;
        $("#detail-vips").innerHTML = agenda.vips.map((vip) => `<span class="vip-chip">${safe(vip)}</span>`).join("");
        $("#detail-notes").textContent = agenda.notes || ""; $("#notes-row").style.display = agenda.notes ? "grid" : "none";
      }
      function renderConclusion(agenda) {
        const ready = agenda.operation?.status === 'complete';
        const data = agenda.conclusion;
        const completed = data?.status === 'complete';
        $('#open-conclusion').disabled = !ready;
        $('#open-conclusion').textContent = !ready ? 'Conclusão bloqueada' : completed ? 'Consultar / corrigir valores' : 'Preencher conclusão →';
        $('#conclusion-help').textContent = !ready ? 'Salve os dados operacionais para liberar a conclusão.' : completed ? 'Operação concluída. Valores disponíveis no resumo.' : 'Etapa 3 disponível: registre os custos e conclua a operação.';
        const steps = [...document.querySelectorAll('#agenda-progress .progress-step')];
        steps[1].className = 'progress-step ' + (ready ? 'done' : 'current');
        steps[1].querySelector('small').textContent = ready ? 'Preenchida' : 'Disponível';
        steps[1].querySelector('.progress-circle').textContent = ready ? '✓' : '2';
        steps[2].className = 'progress-step ' + (completed ? 'done' : ready ? 'current' : '');
        steps[2].querySelector('small').textContent = completed ? 'Concluída' : ready ? 'Disponível' : 'Bloqueada';
        steps[2].querySelector('.progress-circle').textContent = completed ? '✓' : '3';
        document.querySelectorAll('#agenda-progress .connector')[1].classList.toggle('active', ready);
        if (!data) { $('#cost-summary').textContent = 'Valores ainda não informados.'; return; }
        const rows = [['Total de VSPP',data.staffCents],['Total de transportes',data.transportCents],...(data.extras||[]).map(x=>[x.title||'Despesa sem título',x.amountCents])];
        $('#cost-summary').innerHTML = `<p><span class="pill ${completed?'completed':''}">${completed?'Valores finais · Operação concluída':'Rascunho dos valores · Operação não concluída'}</span></p>` + rows.map(([title,value])=>`<p><strong>${safe(title)}:</strong> ${value==null?'Não informado':safe(Conclusion.money(value))}</p>`).join('') + `<p class="cost-summary-total"><strong>${completed?'Valor total da operação':'Total parcial informado'}: ${safe(Conclusion.money(data.totalCents))}</strong></p>` + (data.notes?`<p>${safe(data.notes)}</p>`:'');
      }
      $('#open-conclusion').addEventListener('click', () => {
        const agenda=selectedAgenda();
        if (!agenda || agenda.operation?.status!=='complete') return;
        Conclusion.load(agenda); show('conclusion');
      });
      Conclusion.init((values,draft) => {
        const agenda=selectedAgenda();
        if (!agenda || agenda.operation?.status!=='complete') throw Error('Salve os registros operacionais antes da conclusão.');
        const previous=agenda.conclusion, at=new Date().toISOString();
        const conclusion={...values,status:draft?'draft':'complete',updatedAt:at,completedAt:draft?null:(previous?.completedAt || at)};
        const updated={...agenda,conclusion};
        const changes=[];
        if (previous?.staffCents!==values.staffCents) changes.push('Total de VSPP: '+(values.staffCents==null?'não informado':Conclusion.money(values.staffCents))+'.');
        if (previous?.transportCents!==values.transportCents) changes.push('Total de transportes: '+(values.transportCents==null?'não informado':Conclusion.money(values.transportCents))+'.');
        if (JSON.stringify(previous?.extras||[])!==JSON.stringify(values.extras)) changes.push('Outras despesas atualizadas: '+values.extras.length+' registro(s).');
        if ((previous?.notes||'')!==values.notes) changes.push('Observações da conclusão atualizadas.');
        changes.push('Total '+(draft?'parcial':'da operação')+': '+Conclusion.money(values.totalCents)+'.');
        updated.history=[...AgendaHistory.entries(agenda),{at,title:draft?'Rascunho dos valores salvo':previous?.status==='complete'?'Valores da conclusão corrigidos':'Operação concluída',changes}];
        updated.historyLegacy=agenda.historyLegacy ?? !Array.isArray(agenda.history);
        const previousAgendas=agendas;
        agendas=agendas.map(item=>item.id===agenda.id?updated:item);
        try {saveAgendas();} catch(e) {agendas=previousAgendas;throw Error('Não foi possível salvar os valores e o histórico. Verifique o armazenamento do navegador e tente novamente.');}
        Conclusion.saved();renderHome();renderDashboard();show('dashboard');toast(draft?'Rascunho dos valores salvo.':'Valores salvos. Operação concluída.');
      },()=>{renderDashboard();show('dashboard');});
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
        if (!title || !start || !end || !$("#received-date").value) message = "Preencha o título, a data de recebimento, a data de início e a data final.";
        else if (end < start) message = "A data final não pode ser anterior à data de início.";
        else if (!vips.length || vips.some((name) => !name)) message = "Selecione ou informe o nome de todos os protegidos adicionados.";
        else if (new Set(vips.map((name) => name.toLocaleLowerCase("pt-BR"))).size !== vips.length) message = "O mesmo protegido foi informado mais de uma vez.";
        if (message) { error.textContent = message; error.classList.add("show"); error.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
        const previous = editingId ? agendas.find(item => item.id === editingId) : null;
        const agenda = { ...previous, id: editingId || nextId(), createdAt: previous ? previous.createdAt : new Date().toISOString(), title, start, receivedDate: $("#received-date").value, startTime: $("#start-time").value, end, vips, notes: $("#notes").value.trim() };
        agenda.leadTime = { ...AgendaRules.leadTime(agenda), evaluatedAt: new Date().toISOString() };
        AgendaHistory.opening(agenda, previous);
        const previousAgendas = agendas;
        if (editingId) agendas = agendas.map((item) => item.id === editingId ? agenda : item);
        else agendas = [...agendas, agenda];
        try { saveAgendas(); } catch (reason) {
          agendas = previousAgendas;
          error.textContent = 'Não foi possível salvar a agenda e seu histórico. Verifique o armazenamento do navegador.';
          error.classList.add('show'); error.scrollIntoView({block:'center'}); return;
        }
        selectedAgendaId = agenda.id; editingId = null; error.classList.remove("show"); renderHome(); renderDashboard(); show("dashboard");
      });

      const operationForm = $("#operation-form");
      let operationDirty = false;
      const operationValue = (name) => operationForm.elements.namedItem(name).value.trim();
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
        $('#save-draft').hidden = agenda.conclusion?.status === 'complete';
        operationDirty = false;
        OperationRepeater.load(agenda.operation); ContactBook.load(agenda.operation); Gallery.load(agenda); updateMap(); show('operations');
      }
      function renderOperationSummary(agenda) {
        const operation = agenda.operation;
        ContactBook.render(operation);
        Gallery.render(agenda);
        $('#next-step').textContent = operation ? 'Editar registros operacionais' : 'Preencher registros operacionais';
        if (!operation) { $('#operation-summary').textContent = 'Nenhum dado operacional salvo.'; return; }
        const f = operation.fields;
        const multi = OperationRepeater.normalize(operation);
        const entries = [
          ['Preenchimento', operation.status === 'complete' ? 'Dados desta versão preenchidos' : 'Rascunho'],
          ['Local', [f.venue, AgendaRules.address(f), f.complement, f.reference].filter(Boolean).join(' · ')],
          ['Empresa de segurança', f.company || 'Não informada'],
          ...multi.staff.map((person,index) => [`VSPP ${index+1}`, `${person.name || 'Não informado'}${person.gender ? ' · ' + person.gender : ''}`]),
          ['Transporte', OperationRepeater.mode(multi.legs)],
          ...multi.legs.map((leg,index) => [`Trecho ${index+1}`, OperationRepeater.description(leg)]),
          ['Atualizado em', new Date(operation.updatedAt).toLocaleString('pt-BR')]
        ];
        $('#operation-summary').innerHTML = entries.map(([label,value]) => `<p><strong>${safe(label)}:</strong> ${safe(value)}</p>`).join('');
      }
      async function saveOperation(draft) {
        if (Gallery.isBusy()) return;
        const agenda = selectedAgenda();
        if (!agenda) return;
        if (draft && agenda.conclusion?.status === 'complete') return;
        const fields = Object.fromEntries(new FormData(operationForm));
        Object.keys(fields).forEach(key => fields[key] = fields[key].trim());
        let message = '';
        const multi = OperationRepeater.read();
        const contacts = ContactBook.read();
        const attachments = Gallery.read();
        const required = ['street','number','district','city','state','company'];
        if (!draft && required.some(key => !fields[key])) message = 'Preencha endereço e empresa nos campos com * ou salve um rascunho.';
        else if (!draft && fields.cep && !/^\d{8}$/.test(fields.cep.replace(/\D/g,''))) message = 'O CEP deve conter 8 dígitos.';
        else if (!draft) message = OperationRepeater.validate(multi.staff, multi.legs);
        if (!draft && !message) message = ContactBook.validate(contacts);
        if (!draft && !message) message = Gallery.validate(attachments);
        if (message) { $('#operation-error').textContent = message; $('#operation-error').classList.add('show'); $('#operation-error').scrollIntoView({block:'center'}); return; }
        const previous = agenda.operation;
        const previousHistory = agenda.history;
        const previousLegacy = agenda.historyLegacy;
        Gallery.setBusy(true);
        try {
          await Gallery.prepare(agenda.id);
          agenda.operation = { fields, ...multi, contacts, attachments, schemaVersion: 4, status: draft ? 'draft' : 'complete', updatedAt: new Date().toISOString() };
          AgendaHistory.operation(agenda, previous, previousHistory);
          saveAgendas();
          Gallery.committed(agenda.id, Gallery.metadata(previous), attachments);
        } catch (reason) {
          agenda.operation = previous;
          if (previousHistory === undefined) delete agenda.history; else agenda.history = previousHistory;
          if (previousLegacy === undefined) delete agenda.historyLegacy; else agenda.historyLegacy = previousLegacy;
          $('#operation-error').textContent = 'Não foi possível salvar. ' + (reason.message || 'Verifique o armazenamento do navegador.');
          $('#operation-error').classList.add('show'); $('#operation-error').scrollIntoView({block:'center'}); return;
        } finally { Gallery.setBusy(false); }
        operationDirty = false;
        renderDashboard(); show('dashboard'); toast(draft ? 'Rascunho salvo.' : 'Dados operacionais salvos.');
      }
      operationForm.addEventListener('input', () => { operationDirty = true; updateMap(); });
      operationForm.addEventListener('change', () => { operationDirty = true; updateMap(); });
      operationForm.addEventListener('submit', event => { event.preventDefault(); saveOperation(false); });
      $('#add-staff').addEventListener('click', () => { OperationRepeater.addStaff({}, true); operationDirty = true; });
      $('#add-leg').addEventListener('click', () => { OperationRepeater.addLeg({}, true); operationDirty = true; });
      $$('[data-add-contact]').forEach(button => button.addEventListener('click', () => ContactBook.add({category:button.dataset.addContact},true)));
      $('#save-draft').addEventListener('click', () => saveOperation(true));
      $('#operation-back').addEventListener('click', () => {
        if (Gallery.isBusy()) { toast('Aguarde o salvamento dos anexos.'); return; }
        if (operationDirty && !confirm('Sair sem salvar as alterações operacionais?')) return;
        operationDirty = false; renderDashboard(); show('dashboard');
      });
      document.addEventListener('click', event => {
        if ($('#conclusion').classList.contains('active') && event.target.closest('[data-go]') && !Conclusion.canLeave()) { event.preventDefault(); event.stopImmediatePropagation(); return; }
        if (Gallery.isBusy() && event.target.closest('[data-go]')) { event.preventDefault(); event.stopImmediatePropagation(); toast('Aguarde o salvamento dos anexos.'); return; }
        if (!operationDirty || !$('#operations').classList.contains('active') || !event.target.closest('[data-go]')) return;
        if (!confirm('Sair sem salvar as alterações operacionais?')) { event.preventDefault(); event.stopImmediatePropagation(); }
        else operationDirty = false;
      }, true);
      window.addEventListener('beforeunload', event => { if (operationDirty || Gallery.isBusy() || Conclusion.isDirty()) { event.preventDefault(); event.returnValue = ''; } });
      addVip(); bindNavigation(); loadAgendas(); $("#generated-id").textContent = nextId();
    })();
