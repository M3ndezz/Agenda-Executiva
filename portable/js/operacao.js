// Regras compartilhadas pelo cadastro e pelo futuro painel de conclusão.
window.AgendaRules = {
  leadTime(agenda) {
    if (!agenda.createdAt) return { status: 'unknown', text: 'Sem histórico para calcular: data de criação não registrada.' };
    if (!agenda.startTime) return { status: 'unknown', text: 'Informe o horário de início para calcular a antecedência.' };
    const hours = (new Date(`${agenda.start}T${agenda.startTime}:00`).getTime() - new Date(agenda.createdAt).getTime()) / 3600000;
    if (!Number.isFinite(hours)) return { status: 'unknown', text: 'Datas insuficientes para calcular.' };
    const duration = `${Math.floor(Math.abs(hours))}h ${Math.floor(Math.abs(hours) * 60) % 60}min`;
    return { hours, status: hours < 48 ? 'short' : 'ok', text: hours < 0 ? `Abaixo de 48 horas — agenda criada ${duration} após o início previsto.` : `${hours < 48 ? 'Abaixo de 48 horas' : 'Antecedência atendida'} — ${duration} entre a abertura e o início previsto.` };
  },
  validCPF(value) {
    const digits = value.replace(/\D/g, '');
    if (!/^\d{11}$/.test(digits) || /^(\d)\1{10}$/.test(digits)) return false;
    for (let length = 9; length <= 10; length++) {
      let sum = 0;
      for (let i = 0; i < length; i++) sum += Number(digits[i]) * (length + 1 - i);
      const digit = (sum * 10 % 11) % 10;
      if (digit !== Number(digits[length])) return false;
    }
    return true;
  },
  address(location) {
    return [location.street, location.number, location.district, location.city, location.state, location.cep, 'Brasil'].filter(Boolean).join(', ');
  }
};
