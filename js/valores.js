(() => {
  const money = (c) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(c / 100);
  const inputValue = (c) =>
    c == null ? "" : (c / 100).toFixed(2).replace(".", ",");
  function cents(value) {
    const text = value.trim().replace(/^R\$\s*/, "");
    if (!text) return null;
    if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(text))
      throw Error("Use valores como 1500,00 ou 1.500,00, sem sinal negativo.");
    const [whole, decimal = ""] = text.replace(/\./g, "").split(",");
    const result = Number(whole) * 100 + Number(decimal.padEnd(2, "0"));
    if (!Number.isSafeInteger(result) || result > 99999999999)
      throw Error("Cada valor deve ser de até R$ 999.999.999,99.");
    return result;
  }
  function calculate(staff, transport, extras) {
    const total =
      (staff ?? 0) +
      (transport ?? 0) +
      extras.reduce((sum, item) => sum + (item.amountCents ?? 0), 0);
    if (!Number.isSafeInteger(total))
      throw Error("O total excede o limite de cálculo.");
    return total;
  }

  window.AgendaMoney = { money, inputValue, cents, calculate };
})();
