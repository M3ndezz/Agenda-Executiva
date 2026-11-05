(() => {
  const $ = (s) => document.querySelector(s);
  const { money, inputValue, cents, calculate } = AgendaMoney;
  let dirty = false,
    onSave,
    onBack;
  function add(data = {}) {
    const row = document.createElement("div");
    row.className = "cost-row";
    const label = document.createElement("label");
    label.textContent = "Título da despesa *";
    const title = document.createElement("input");
    title.className = "cost-title";
    title.placeholder = "Ex.: Hospedagem";
    title.value = data.title || "";
    label.append(title);
    const priceLabel = document.createElement("label");
    priceLabel.textContent = "Valor (R$) *";
    const price = document.createElement("input");
    price.className = "cost-amount";
    price.inputMode = "decimal";
    price.placeholder = "0,00";
    price.value = inputValue(data.amountCents);
    priceLabel.append(price);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "btn btn-outline";
    remove.textContent = "Remover despesa";
    remove.onclick = () => {
      row.remove();
      dirty = true;
      update();
    };
    row.append(label, priceLabel, remove);
    $("#cost-extras").append(row);
  }
  function read(final = false) {
    const staffCents = cents($("#cost-staff").value),
      transportCents = cents($("#cost-transport").value);
    const extras = [...document.querySelectorAll(".cost-row")].map((row) => ({
      title: row.querySelector(".cost-title").value.trim(),
      amountCents: cents(row.querySelector(".cost-amount").value),
    }));
    if (final && (staffCents === null || transportCents === null))
      throw Error(
        "Informe os valores de VSPP e transportes. Digite 0,00 se não houver custo.",
      );
    if (
      final &&
      extras.some((item) => !item.title || item.amountCents === null)
    )
      throw Error(
        "Preencha título e valor de cada despesa adicional ou remova a linha.",
      );
    return {
      staffCents,
      transportCents,
      extras,
      totalCents: calculate(staffCents, transportCents, extras),
      notes: $("#cost-notes").value.trim(),
      currency: "BRL",
    };
  }
  function update() {
    try {
      const data = read();
      $("#cost-total").textContent = money(data.totalCents);
      $("#cost-total-help").textContent =
        "VSPP + transportes + outras despesas. Calculado automaticamente.";
    } catch (e) {
      $("#cost-total").textContent = "Confira os valores";
      $("#cost-total-help").textContent = e.message;
    }
  }
  function error(message) {
    $("#cost-error").textContent = message;
    $("#cost-error").classList.add("show");
    $("#cost-error").scrollIntoView({ block: "center" });
  }
  function load(agenda) {
    const data = agenda.conclusion || {};
    $("#conclusion-agenda").textContent = agenda.id + " · " + agenda.title;
    $("#cost-staff").value = inputValue(data.staffCents);
    $("#cost-transport").value = inputValue(data.transportCents);
    $("#cost-notes").value = data.notes || "";
    $("#cost-extras").replaceChildren();
    (data.extras || []).forEach(add);
    $("#cost-error").classList.remove("show");
    $("#cost-draft").hidden = data.status === "complete";
    $("#cost-finish").textContent =
      data.status === "complete"
        ? "Salvar correção dos valores"
        : "✓ Concluir operação";
    dirty = false;
    update();
  }
  function init(save, back) {
    onSave = save;
    onBack = back;
    $("#add-cost").onclick = () => {
      add();
      dirty = true;
      $("#cost-extras").lastElementChild.querySelector("input").focus();
    };
    $("#conclusion-form").addEventListener("input", () => {
      dirty = true;
      update();
    });
    $("#conclusion-form").addEventListener("submit", (e) => {
      e.preventDefault();
      submit(false);
    });
    $("#cost-draft").onclick = () => submit(true);
    $("#conclusion-back").onclick = () => {
      if (canLeave()) onBack();
    };
  }
  function submit(draft) {
    try {
      onSave(read(!draft), draft);
    } catch (e) {
      error(e.message);
    }
  }
  function canLeave() {
    if (dirty && !confirm("Sair sem salvar os valores alterados?"))
      return false;
    dirty = false;
    return true;
  }
  window.Conclusion = {
    money,
    cents,
    calculate,
    load,
    init,
    error,
    canLeave,
    isDirty: () => dirty,
    saved: () => {
      dirty = false;
    },
  };
})();
