// Regras compartilhadas pelo cadastro e pelo futuro painel de conclusão.
window.AgendaRules = {
  leadTime(agenda) {
    const dayNumber = (value) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return NaN;
      const date = new Date(value + "T00:00:00Z");
      return Number.isFinite(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
        ? date.getTime() / 86400000
        : NaN;
    };
    const base = { basis: "elapsed-hours", minimumHours: 48, minimumDays: 2 };
    const validTime = (value) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value || "");
    if (!Number.isFinite(dayNumber(agenda.start)) || !Number.isFinite(dayNumber(agenda.receivedDate)) || !validTime(agenda.startTime) || !validTime(agenda.receivedTime))
      return { ...base, status: "unknown", text: "Informe as datas e os horários na abertura para verificar o prazo de preparação." };
    const hours = (new Date(`${agenda.start}T${agenda.startTime}`).getTime() - new Date(`${agenda.receivedDate}T${agenda.receivedTime}`).getTime()) / 3600000;
    const minutes = Math.round(Math.abs(hours) * 60);
    const duration = `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}min` : ""}`;
    const text = hours < 0
      ? "Confira as datas: a preparação começa depois da execução."
      : hours < 48
        ? `Atenção: ${duration} para preparar a operação. O mínimo é de 48 horas.`
        : `${duration} para preparar a operação. Prazo mínimo atendido.`;
    return { ...base, hours, days: hours / 24, duration, status: hours < 48 ? "short" : "ok", text };
  },
  validCPF(value) {
    const digits = value.replace(/\D/g, "");
    if (!/^\d{11}$/.test(digits) || /^(\d)\1{10}$/.test(digits)) return false;
    for (let length = 9; length <= 10; length++) {
      let sum = 0;
      for (let i = 0; i < length; i++)
        sum += Number(digits[i]) * (length + 1 - i);
      const digit = ((sum * 10) % 11) % 10;
      if (digit !== Number(digits[length])) return false;
    }
    return true;
  },
  address(location) {
    return [
      location.street,
      location.number,
      location.district,
      location.city,
      location.state,
      location.cep,
      "Brasil",
    ]
      .filter(Boolean)
      .join(", ");
  },
};
