(() => {
  function nextId(agendas, year = new Date().getFullYear()) {
    const prefix = `APE-${year}-`;
    const greatestSequence = agendas.reduce((greatest, item) => {
      if (!item.id || !item.id.startsWith(prefix)) return greatest;
      const sequence = Number(item.id.slice(prefix.length));
      return Number.isInteger(sequence)
        ? Math.max(greatest, sequence)
        : greatest;
    }, 0);
    return `${prefix}${String(greatestSequence + 1).padStart(4, "0")}`;
  }
  function todayISO() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  function agendaSituation(agenda, today = todayISO()) {
    if (agenda.conclusion?.status === "complete")
      return { label: "Concluída", className: "completed" };
    if (agenda.start > today)
      return { label: "Próxima", className: "upcoming" };
    if (agenda.end < today)
      return { label: "Período encerrado", className: "past" };
    return { label: "Em andamento", className: "active" };
  }

  window.AgendaDomain = { nextId, todayISO, situation: agendaSituation };
})();
