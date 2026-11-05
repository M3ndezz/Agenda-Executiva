// Keep the existing storage keys: changing these would hide the user's agendas.
(() => {
  const CURRENT_KEY = "superAgendaPrototypeV2";
  const LEGACY_KEY = "superAgendaPrototypeV1";
  function create(backend) {
    let blocked = false;
    function validate(items) {
      if (
        !Array.isArray(items) ||
        items.some(
          (a) => !a || typeof a.id !== "string" || !Array.isArray(a.vips),
        )
      )
        throw Error("Formato de agendas inválido.");
      return items;
    }
    function load() {
      try {
        const raw = backend.getItem(CURRENT_KEY);
        if (raw !== null) {
          const result = validate(JSON.parse(raw));
          blocked = false;
          return result;
        }
        const old = backend.getItem(LEGACY_KEY);
        const legacy = old === null ? null : JSON.parse(old);
        const result = legacy === null ? [] : validate([legacy]);
        // Copy only; retain V1 for recovery. Never invent creation/receipt dates.
        if (result.length) backend.setItem(CURRENT_KEY, JSON.stringify(result));
        blocked = false;
        return result;
      } catch (error) {
        blocked = true;
        throw error;
      }
    }
    function save(items) {
      if (blocked)
        throw Error(
          "Salvamento bloqueado porque os dados anteriores não puderam ser lidos.",
        );
      backend.setItem(CURRENT_KEY, JSON.stringify(validate(items)));
    }
    return { load, save };
  }
  window.AgendaStorage = { create, CURRENT_KEY, LEGACY_KEY };
})();
