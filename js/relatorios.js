(() => {
  const $ = (s) => document.querySelector(s),
    money = (c) => AgendaMoney.money(c);
  let getAgendas, situation, openAgenda, generateReport;
  let applied = { from: "", to: "", person: "", status: "" };
  const normalize = (x) => String(x).trim().toLocaleLowerCase("pt-BR");
  function select(agendas, filters, statusOf) {
    return agendas.filter(
      (a) =>
        (!filters.from || a.start >= filters.from) &&
        (!filters.to || a.start <= filters.to) &&
        (!filters.person ||
          (a.vips || []).some((p) => normalize(p) === filters.person)) &&
        (!filters.status || statusOf(a).className === filters.status),
    );
  }
  function summarize(agendas) {
    const complete = agendas.filter((a) => a.conclusion?.status === "complete");
    const valued = complete.filter(
      (a) =>
        Number.isSafeInteger(a.conclusion.totalCents) &&
        a.conclusion.totalCents >= 0,
    );
    const costs = [0, 0, 0];
    let total = 0;
    valued.forEach((a) => {
      const c = a.conclusion;
      total += c.totalCents;
      costs[0] += c.staffCents || 0;
      costs[1] += c.transportCents || 0;
      costs[2] += (c.extras || []).reduce(
        (sum, x) => sum + (x.amountCents || 0),
        0,
      );
    });
    const drafts = agendas.filter((a) => a.conclusion?.status === "draft");
    const lead = { ok: 0, short: 0, unknown: 0 };
    agendas.forEach((a) => lead[AgendaRules.leadTime(a).status]++);
    return {
      count: agendas.length,
      completed: complete.length,
      valued: valued.length,
      total,
      average: valued.length ? Math.round(total / valued.length) : null,
      costs,
      drafts: drafts.length,
      draftTotal: drafts.reduce(
        (sum, a) => sum + (a.conclusion.totalCents || 0),
        0,
      ),
      missing: complete.length - valued.length,
      lead,
    };
  }
  function element(tag, text, cls) {
    const e = document.createElement(tag);
    e.textContent = text;
    if (cls) e.className = cls;
    return e;
  }
  function date(value) {
    return value ? value.split("-").reverse().join("/") : "Não informada";
  }
  function bars(host, items, total) {
    host.replaceChildren();
    items.forEach(([label, value, color, formatted]) => {
      const row = element("div", "", "report-bar-row"),
        line = element("div", "", "report-bar-label");
      line.append(element("span", label), element("strong", formatted));
      const track = element("div", "", "report-bar-track"),
        fill = element("div", "", "report-bar-fill");
      fill.style.width =
        (total ? Math.min(100, (value / total) * 100) : 0) + "%";
      fill.style.background = color;
      track.append(fill);
      row.append(line, track);
      host.append(row);
    });
  }
  function render() {
    const selected = select(getAgendas(), applied, situation),
      stats = summarize(selected);
    $("#report-scope").textContent =
      `${stats.count} agenda(s) · Execução: ${applied.from ? date(applied.from) : "desde o início"} até ${applied.to ? date(applied.to) : "qualquer data"} · ${applied.person || "Todos os protegidos"} · ${applied.status ? $("#report-status").querySelector('option[value="' + applied.status + '"]').textContent : "Todas as situações"}`;
    const kpis = $("#report-kpis");
    kpis.replaceChildren();
    [
      ["Agendas", stats.count],
      ["Concluídas", stats.completed],
      ["Custo total", money(stats.total)],
      [
        "Custo médio por operação",
        stats.average === null ? "—" : money(stats.average),
      ],
    ].forEach(([title, value]) => {
      const card = element("article", "", "card report-kpi");
      card.append(element("span", title), element("strong", value));
      kpis.append(card);
    });
    $("#report-finance-note").textContent =
      `Custos e média consideram ${stats.valued} operação(ões) concluída(s) com valores registrados. Rascunhos: ${stats.drafts} agenda(s), com ${money(stats.draftTotal)} informados, fora do custo total.` +
      (stats.missing
        ? ` ${stats.missing} concluída(s) sem valores válidos, fora do cálculo.`
        : "") +
      " Uma agenda com vários protegidos é contabilizada uma única vez.";
    bars(
      $("#report-costs"),
      [
        ["VSPP", stats.costs[0], "#cc0033", money(stats.costs[0])],
        ["Transportes", stats.costs[1], "#2169ac", money(stats.costs[1])],
        ["Outras despesas", stats.costs[2], "#167448", money(stats.costs[2])],
      ],
      stats.total,
    );
    bars(
      $("#report-lead"),
      [
        [
          "Prazo atendido",
          stats.lead.ok,
          "#167448",
          stats.lead.ok + " agenda(s)",
        ],
        [
          "Abaixo do mínimo",
          stats.lead.short,
          "#ad6500",
          stats.lead.short + " agenda(s)",
        ],
        [
          "Não informado",
          stats.lead.unknown,
          "#737b85",
          stats.lead.unknown + " agenda(s)",
        ],
      ],
      stats.count,
    );
    const body = $("#report-rows");
    body.replaceChildren();
    $("#report-empty").hidden = selected.length > 0;
    selected
      .slice()
      .sort((a, b) => (b.start || "").localeCompare(a.start || ""))
      .forEach((a) => {
        const row = element("tr"),
          id = element("td");
        id.append(element("strong", a.id), element("div", a.title));
        row.append(
          id,
          element("td", date(a.start)),
          element("td", (a.vips || []).join(", ")),
        );
        const status = situation(a),
          statusCell = element("td");
        statusCell.append(
          element("span", status.label, "pill " + status.className),
        );
        row.append(statusCell);
        const lead = AgendaRules.leadTime(a);
        row.append(
          element(
            "td",
            lead.status === "unknown"
              ? "Não informado"
              : `${lead.duration} · ${lead.status === "ok" ? "Prazo atendido" : "Abaixo do mínimo"}`,
          ),
        );
        const c = a.conclusion;
        row.append(
          element(
            "td",
            c && Number.isSafeInteger(c.totalCents)
              ? money(c.totalCents) +
                  (c.status === "draft" ? " (rascunho)" : "")
              : "Não informado",
          ),
        );
        const action = element("td"),
          button = element("button", "Ver agenda", "btn btn-outline");
        button.type = "button";
        button.setAttribute("aria-label", "Ver agenda " + a.id);
        button.onclick = () => openAgenda(a.id);
        const report = element("button", "Gerar relatório", "btn btn-primary");
        report.type = "button";
        report.setAttribute("aria-label", "Gerar relatório da agenda " + a.id);
        report.onclick = () => generateReport(a.id, report);
        const actions = element("div", "", "dashboard-report-actions");
        actions.append(button, report);
        action.append(actions);
        row.append(action);
        body.append(row);
      });
  }
  function open() {
    const person = $("#report-person");
    person.replaceChildren();
    const all = element("option", "Todos os protegidos");
    all.value = "";
    person.append(all);
    const names = new Map();
    getAgendas().forEach((a) =>
      (a.vips || []).forEach((p) => names.set(normalize(p), p.trim())),
    );
    [...names]
      .sort((a, b) => a[1].localeCompare(b[1], "pt-BR"))
      .forEach(([key, name]) => {
        const option = element("option", name);
        option.value = key;
        person.append(option);
      });
    if (applied.person && !names.has(applied.person)) applied.person = "";
    $("#report-from").value = applied.from;
    $("#report-to").value = applied.to;
    person.value = applied.person;
    $("#report-status").value = applied.status;
    $("#report-error").textContent = "";
    render();
  }
  function init(get, status, openFn, reportFn) {
    getAgendas = get;
    situation = status;
    openAgenda = openFn;
    generateReport = reportFn;
    $("#report-filters").addEventListener("submit", (event) => {
      event.preventDefault();
      const filters = {
        from: $("#report-from").value,
        to: $("#report-to").value,
        person: $("#report-person").value,
        status: $("#report-status").value,
      };
      if (filters.from && filters.to && filters.to < filters.from) {
        $("#report-error").textContent =
          "A data final do filtro deve ser igual ou posterior à inicial.";
        return;
      }
      $("#report-error").textContent = "";
      applied = filters;
      render();
    });
    $("#report-clear").onclick = () => {
      applied = { from: "", to: "", person: "", status: "" };
      open();
    };
  }
  window.Reports = { init, open, select, summarize };
})();
