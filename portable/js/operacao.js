// Regras compartilhadas pelo cadastro e pelo futuro painel de conclusão.
window.AgendaRules = {
  leadTime(agenda) {
    const dayNumber = value => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return NaN;
      const date = new Date(value + 'T00:00:00Z');
      return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === value ? date.getTime()/86400000 : NaN;
    };
    const days = dayNumber(agenda.start) - dayNumber(agenda.receivedDate);
    const base = { basis:'calendar-days', minimumDays:2 };
    if (!Number.isFinite(days)) return { ...base, status:'unknown', text:'Informe a data de recebimento da solicitação na abertura para calcular o prazo de preparação.' };
    const duration = `${Math.abs(days)} ${Math.abs(days) === 1 ? 'dia corrido' : 'dias corridos'}`;
    const text = days < 0 ? `Fora do prazo — solicitação recebida ${duration} após a data de início.` : days === 0 ? 'Abaixo do mínimo — solicitação recebida no mesmo dia da atividade.' : `${days < 2 ? 'Abaixo do mínimo' : 'Prazo atendido'} — ${duration} entre o recebimento e o início da atividade.`;
    return { ...base, days, status:days < 2 ? 'short' : 'ok', text };
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
