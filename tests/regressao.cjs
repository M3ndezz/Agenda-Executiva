const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..");
const context = { Intl, console };
context.window = context;
vm.createContext(context);
for (const file of [
  "armazenamento",
  "dominio",
  "valores",
  "operacao",
  "historico",
  "servico-conclusao",
  "relatorios",
]) {
  vm.runInContext(
    fs.readFileSync(path.join(root, "js", file + ".js"), "utf8"),
    context,
  );
}
const {
  AgendaStorage: S,
  AgendaDomain: D,
  AgendaMoney: M,
  AgendaRules: R,
  ConclusionService: C,
  Reports: P,
} = context;
function backend(initial = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => data[k] ?? null,
    setItem(k, v) {
      data[k] = v;
    },
  };
}
const fixture = {
  id: "APE-2026-0008",
  title: "Teste",
  vips: ["Ana", "Bia"],
  receivedDate: "2026-10-01",
  start: "2026-10-03",
  end: "2026-10-03",
  operation: {
    fields: { company: "Empresa" },
    attachments: [{ id: "anexo", name: "teste.eml" }],
  },
  customField: "preservar",
};
let b = backend({ [S.CURRENT_KEY]: JSON.stringify([fixture]) });
let storage = S.create(b);
let loaded = storage.load();
storage.save(loaded);
assert.equal(b.data[S.CURRENT_KEY], JSON.stringify([fixture]));
b = backend({ [S.LEGACY_KEY]: JSON.stringify(fixture) });
loaded = S.create(b).load();
assert.equal(loaded[0].customField, "preservar");
assert(b.data[S.LEGACY_KEY]);
assert(b.data[S.CURRENT_KEY]);
assert.equal(loaded[0].createdAt, undefined);
b = backend({ [S.CURRENT_KEY]: "{invalid" });
storage = S.create(b);
assert.throws(() => storage.load());
assert.throws(() => storage.save([]));
assert.equal(b.data[S.CURRENT_KEY], "{invalid");
b = backend({ [S.CURRENT_KEY]: "{}", [S.LEGACY_KEY]: JSON.stringify(fixture) });
assert.throws(() => S.create(b).load());
assert.equal(b.data[S.CURRENT_KEY], "{}");
assert.equal(D.nextId([fixture], 2026), "APE-2026-0009");
assert.equal(D.nextId([fixture], 2027), "APE-2027-0001");
assert.equal(D.situation(fixture, "2026-10-02").className, "upcoming");
assert.equal(D.situation(fixture, "2026-10-03").className, "active");
assert.equal(D.situation(fixture, "2026-10-04").className, "past");
assert.equal(R.leadTime(fixture).days, 2);
assert.equal(R.leadTime(fixture).status, "ok");
assert.equal(R.leadTime({ ...fixture, start: "2026-10-02" }).status, "short");
assert.equal(R.leadTime({ ...fixture, receivedDate: null }).status, "unknown");
assert.equal(
  R.leadTime({ ...fixture, receivedDate: "2026-12-31", start: "2027-01-02" })
    .days,
  2,
);
assert.equal(M.cents("1.500,99"), 150099);
assert.equal(M.cents(""), null);
assert.equal(M.cents("0,00"), 0);
assert.throws(() => M.cents("-1,00"));
assert.equal(M.calculate(10, 20, [{ amountCents: 30 }]), 60);
const values = {
  staffCents: 10000,
  transportCents: 20000,
  extras: [{ title: "Hotel", amountCents: 30000 }],
  totalCents: 60000,
  notes: "",
};
const completed = C.prepare(fixture, values, false, "2026-10-03T12:00:00Z");
assert.equal(fixture.conclusion, undefined);
assert.equal(completed.operation.attachments[0].id, "anexo");
assert.equal(completed.history.length, 1);
assert.equal(D.situation(completed).className, "completed");
const corrected = C.prepare(completed, values, false, "2026-10-04T12:00:00Z");
assert.equal(
  corrected.conclusion.completedAt,
  completed.conclusion.completedAt,
);
assert.equal(corrected.history.length, 2);
const draft = C.prepare({ ...fixture, id: "draft" }, values, true);
const stats = P.summarize([completed, draft]);
assert.equal(stats.total, 60000);
assert.equal(stats.average, 60000);
assert.equal(stats.draftTotal, 60000);
assert.equal(
  P.select(
    [completed, draft],
    { person: "ana", status: "completed" },
    D.situation,
  ).length,
  1,
);
assert.equal(P.summarize([]).average, null);
console.log(
  "OK — armazenamento legado, proteção de leitura, IDs, datas, situações, valores, histórico e relatórios.",
);
