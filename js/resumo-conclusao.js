(() => {
  const $ = (selector) => document.querySelector(selector);
  function safe(value) {
    const node = document.createElement("span");
    node.textContent = String(value ?? "");
    return node.innerHTML;
  }
  function renderConclusion(agenda) {
    const ready = agenda.operation?.status === "complete";
    const data = agenda.conclusion;
    const completed = data?.status === "complete";
    $("#open-conclusion").disabled = !ready;
    $("#open-conclusion").textContent = !ready
      ? "Conclusão bloqueada"
      : completed
        ? "Consultar / corrigir valores"
        : "Preencher conclusão →";
    $("#conclusion-help").textContent = !ready
      ? "Salve os dados operacionais para liberar a conclusão."
      : completed
        ? "Operação concluída. Valores disponíveis no resumo."
        : "Etapa 3 disponível: registre os custos e conclua a operação.";
    const steps = [
      ...document.querySelectorAll("#agenda-progress .progress-step"),
    ];
    steps[1].className = "progress-step " + (ready ? "done" : "current");
    steps[1].querySelector("small").textContent = ready
      ? "Preenchida"
      : "Disponível";
    steps[1].querySelector(".progress-circle").textContent = ready ? "✓" : "2";
    steps[2].className =
      "progress-step " + (completed ? "done" : ready ? "current" : "");
    steps[2].querySelector("small").textContent = completed
      ? "Concluída"
      : ready
        ? "Disponível"
        : "Bloqueada";
    steps[2].querySelector(".progress-circle").textContent = completed
      ? "✓"
      : "3";
    document
      .querySelectorAll("#agenda-progress .connector")[1]
      .classList.toggle("active", ready);
    if (!data) {
      $("#cost-summary").textContent = "Valores ainda não informados.";
      return;
    }
    const rows = [
      ["Total de VSPP", data.staffCents],
      ["Total de transportes", data.transportCents],
      ...(data.extras || []).map((x) => [
        x.title || "Despesa sem título",
        x.amountCents,
      ]),
    ];
    $("#cost-summary").innerHTML =
      `<p><span class="pill ${completed ? "completed" : ""}">${completed ? "Valores finais · Operação concluída" : "Rascunho dos valores · Operação não concluída"}</span></p>` +
      rows
        .map(
          ([title, value]) =>
            `<p><strong>${safe(title)}:</strong> ${value == null ? "Não informado" : safe(Conclusion.money(value))}</p>`,
        )
        .join("") +
      `<p class="cost-summary-total"><strong>${completed ? "Valor total da operação" : "Total parcial informado"}: ${safe(Conclusion.money(data.totalCents))}</strong></p>` +
      (data.notes ? `<p>${safe(data.notes)}</p>` : "");
  }

  window.ConclusionSummary = { render: renderConclusion };
})();
