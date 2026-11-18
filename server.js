const express = require("express");
const fs = require("fs");
const path = require("path");
const { seed } = require("./seed");

const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let db;

function loadDb() {
  if (fs.existsSync(DB_FILE)) {
    db = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } else {
    db = JSON.parse(JSON.stringify(seed));
    persist();
  }
}

function persist() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = DB_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

function nextId() {
  return db.nextId++;
}

const personById = (id) => db.personnel.find((p) => p.id === id);
const taskById = (id) => db.tasks.find((t) => t.id === id);
const kpiById = (id) => db.kpis.find((k) => k.id === id);

function validateText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function assignmentsForPerson(personId) {
  return db.assignments
    .filter((x) => x.personId === personId)
    .map((x) => ({ ...x, task: taskById(x.taskId) }))
    .filter((x) => x.task);
}

function assignmentsForTask(taskId) {
  return db.assignments
    .filter((x) => x.taskId === taskId)
    .map((x) => ({ ...x, person: personById(x.personId) }))
    .filter((x) => x.person);
}

function taskKpis(t) {
  return (t.kpiIds || []).map(kpiById).filter(Boolean);
}

function serializePerson(p) {
  return { ...p, tasks: assignmentsForPerson(p.id).map((x) => x.task) };
}

function serializeTask(t) {
  return { ...t, kpis: taskKpis(t), people: assignmentsForTask(t.id).map((x) => x.person) };
}

function validateKpiIds(kpiIds) {
  if (!Array.isArray(kpiIds)) return false;
  const valid = new Set(db.kpis.map((k) => k.id));
  return kpiIds.every((id) => valid.has(Number(id)));
}

// ---------- Personnel ----------

app.get("/api/personnel", (req, res) => {
  res.json(db.personnel.map(serializePerson));
});

app.post("/api/personnel", (req, res) => {
  const { name, title } = req.body || {};
  if (!validateText(name)) return res.status(400).json({ error: "Tên nhân sự không được để trống" });
  const p = { id: nextId(), name: name.trim(), title: (title || "").trim() };
  db.personnel.push(p);
  persist();
  res.status(201).json(serializePerson(p));
});

app.put("/api/personnel/:id", (req, res) => {
  const id = Number(req.params.id);
  const p = personById(id);
  if (!p) return res.status(404).json({ error: "Không tìm thấy nhân sự" });
  const { name, title } = req.body || {};
  if (name !== undefined && !validateText(name)) return res.status(400).json({ error: "Tên nhân sự không được để trống" });
  if (name !== undefined) p.name = name.trim();
  if (title !== undefined) p.title = title.trim();
  persist();
  res.json(serializePerson(p));
});

app.delete("/api/personnel/:id", (req, res) => {
  const id = Number(req.params.id);
  const p = personById(id);
  if (!p) return res.status(404).json({ error: "Không tìm thấy nhân sự" });
  db.personnel = db.personnel.filter((x) => x.id !== id);
  db.assignments = db.assignments.filter((x) => x.personId !== id);
  persist();
  res.json({ ok: true });
});

// ---------- Tasks (definition + KPI) ----------

app.get("/api/tasks", (req, res) => {
  res.json(db.tasks.map(serializeTask));
});

app.post("/api/tasks", (req, res) => {
  const { name, kpiIds } = req.body || {};
  if (!validateText(name)) return res.status(400).json({ error: "Tên nhiệm vụ không được để trống" });
  if (kpiIds !== undefined && !validateKpiIds(kpiIds)) return res.status(400).json({ error: "Một số KPI không hợp lệ" });
  const t = {
    id: nextId(),
    name: name.trim(),
    kpiIds: (kpiIds || []).map(Number),
  };
  db.tasks.push(t);
  persist();
  res.status(201).json(serializeTask(t));
});

app.put("/api/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const t = taskById(id);
  if (!t) return res.status(404).json({ error: "Không tìm thấy nhiệm vụ" });
  const { name, kpiIds } = req.body || {};
  if (name !== undefined && !validateText(name)) return res.status(400).json({ error: "Tên nhiệm vụ không được để trống" });
  if (kpiIds !== undefined && !validateKpiIds(kpiIds)) return res.status(400).json({ error: "Một số KPI không hợp lệ" });
  if (name !== undefined) t.name = name.trim();
  if (kpiIds !== undefined) t.kpiIds = kpiIds.map(Number);
  persist();
  res.json(serializeTask(t));
});

app.delete("/api/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const t = taskById(id);
  if (!t) return res.status(404).json({ error: "Không tìm thấy nhiệm vụ" });
  db.tasks = db.tasks.filter((x) => x.id !== id);
  db.assignments = db.assignments.filter((x) => x.taskId !== id);
  persist();
  res.json({ ok: true });
});

// ---------- KPI ----------

app.get("/api/kpis", (req, res) => {
  res.json(db.kpis);
});

app.post("/api/kpis", (req, res) => {
  const { name } = req.body || {};
  if (!validateText(name)) return res.status(400).json({ error: "Tên KPI không được để trống" });
  const existing = db.kpis.find((k) => k.name.trim().toLowerCase() === name.trim().toLowerCase());
  if (existing) return res.status(400).json({ error: "KPI này đã tồn tại" });
  const k = { id: nextId(), name: name.trim() };
  db.kpis.push(k);
  persist();
  res.status(201).json(k);
});

app.put("/api/kpis/:id", (req, res) => {
  const id = Number(req.params.id);
  const k = kpiById(id);
  if (!k) return res.status(404).json({ error: "Không tìm thấy KPI" });
  const { name } = req.body || {};
  if (name !== undefined && !validateText(name)) return res.status(400).json({ error: "Tên KPI không được để trống" });
  if (name !== undefined && db.kpis.some((x) => x.id !== id && x.name.trim().toLowerCase() === name.trim().toLowerCase()))
    return res.status(400).json({ error: "KPI này đã tồn tại" });
  if (name !== undefined) k.name = name.trim();
  persist();
  res.json(k);
});

app.delete("/api/kpis/:id", (req, res) => {
  const id = Number(req.params.id);
  const k = kpiById(id);
  if (!k) return res.status(404).json({ error: "Không tìm thấy KPI" });
  db.kpis = db.kpis.filter((x) => x.id !== id);
  db.tasks.forEach((t) => {
    t.kpiIds = (t.kpiIds || []).filter((kid) => kid !== id);
  });
  persist();
  res.json({ ok: true });
});

// ---------- Assignments ----------

app.get("/api/assignments", (req, res) => {
  const rows = db.assignments
    .map((x) => ({ ...x, person: personById(x.personId), task: taskById(x.taskId) }))
    .filter((x) => x.person && x.task);
  res.json(rows);
});

app.post("/api/assignments", (req, res) => {
  const { personId, taskId } = req.body || {};
  const p = personById(Number(personId));
  const t = taskById(Number(taskId));
  if (!p || !t) return res.status(400).json({ error: "Nhân sự hoặc nhiệm vụ không hợp lệ" });
  if (db.assignments.some((x) => x.personId === p.id && x.taskId === t.id))
    return res.status(400).json({ error: "Nhân sự này đã được gán nhiệm vụ này" });
  const x = { id: nextId(), personId: p.id, taskId: t.id };
  db.assignments.push(x);
  persist();
  res.status(201).json(x);
});

app.put("/api/personnel/:id/assignments", (req, res) => {
  const id = Number(req.params.id);
  const p = personById(id);
  if (!p) return res.status(404).json({ error: "Không tìm thấy nhân sự" });
  const { taskIds } = req.body || {};
  if (!Array.isArray(taskIds)) return res.status(400).json({ error: "taskIds phải là mảng" });
  const valid = new Set(db.tasks.map((t) => t.id));
  const unique = [...new Set(taskIds.map(Number))];
  if (unique.some((tid) => !valid.has(tid)))
    return res.status(400).json({ error: "Một số nhiệm vụ không hợp lệ" });
  db.assignments = db.assignments.filter((x) => x.personId !== id);
  unique.forEach((tid) => db.assignments.push({ id: nextId(), personId: id, taskId: tid }));
  persist();
  res.json(serializePerson(p));
});

app.delete("/api/assignments/:id", (req, res) => {
  const id = Number(req.params.id);
  const x = db.assignments.find((a) => a.id === id);
  if (!x) return res.status(404).json({ error: "Không tìm thấy gán nhiệm vụ" });
  db.assignments = db.assignments.filter((a) => a.id !== id);
  persist();
  res.json({ ok: true });
});

// ---------- Stats ----------

app.get("/api/stats", (req, res) => {
  const people = db.personnel.map(serializePerson);
  const taskList = db.tasks.map(serializeTask);

  const peopleStats = people.map((p) => ({ id: p.id, name: p.name, title: p.title, taskCount: p.tasks.length }));
  const taskStats = taskList.map((t) => ({
    id: t.id,
    name: t.name,
    peopleCount: t.people.length,
    kpiCount: (t.kpiIds || []).length,
  }));
  const unassignedTasks = taskList.filter((t) => t.people.length === 0);
  const tasksMissingKpi = taskList.filter((t) => (t.kpiIds || []).length < 3);

  res.json({
    totals: {
      personnel: people.length,
      tasks: db.tasks.length,
      kpis: db.kpis.length,
      assignments: db.assignments.length,
    },
    peopleStats,
    taskStats,
    unassignedTasks,
    tasksMissingKpi,
  });
});

// ---------- Serve SPA fallback ----------

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

loadDb();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`App đang chạy tại http://localhost:${PORT}`);
});
