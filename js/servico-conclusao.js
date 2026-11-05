(() => {
  function prepare(agenda, values, draft, at = new Date().toISOString()) {
    const previous = agenda.conclusion;
    const conclusion = {
      ...values,
      status: draft ? "draft" : "complete",
      updatedAt: at,
      completedAt: draft ? null : previous?.completedAt || at,
    };
    const updated = { ...agenda, conclusion };
    const changes = [];
    if (previous?.staffCents !== values.staffCents)
      changes.push(
        "Total de VSPP: " +
          (values.staffCents == null
            ? "não informado"
            : AgendaMoney.money(values.staffCents)) +
          ".",
      );
    if (previous?.transportCents !== values.transportCents)
      changes.push(
        "Total de transportes: " +
          (values.transportCents == null
            ? "não informado"
            : AgendaMoney.money(values.transportCents)) +
          ".",
      );
    if (
      JSON.stringify(previous?.extras || []) !== JSON.stringify(values.extras)
    )
      changes.push(
        "Outras despesas atualizadas: " +
          values.extras.length +
          " registro(s).",
      );
    if ((previous?.notes || "") !== values.notes)
      changes.push("Observações da conclusão atualizadas.");
    changes.push(
      "Total " +
        (draft ? "parcial" : "da operação") +
        ": " +
        AgendaMoney.money(values.totalCents) +
        ".",
    );
    updated.history = [
      ...AgendaHistory.entries(agenda),
      {
        at,
        title: draft
          ? "Rascunho dos valores salvo"
          : previous?.status === "complete"
            ? "Valores da conclusão corrigidos"
            : "Operação concluída",
        changes,
      },
    ];
    updated.historyLegacy =
      agenda.historyLegacy ?? !Array.isArray(agenda.history);
    return updated;
  }
  window.ConclusionService = { prepare };
})();
