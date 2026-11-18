const api = {
  async get(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error((await res.json()).error || "Lỗi khi tải dữ liệu");
    return res.json();
  },
  async send(path, method, body) {
    const res = await fetch(path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Yêu cầu thất bại");
    return data;
  },
};

const $ = (sel) => document.querySelector(sel);

function toast(message, isError = false) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.remove("hidden");
  el.classList.toggle("error", isError);
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.add("hidden"), 3000);
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

let currentTab = "tasks";
let allKpis = [];

async function loadKpis() {
  allKpis = await api.get("/api/kpis");
}

function kpiTag(k) {
  return `<span class="tag kpi">${escapeHtml(k.name)}</span>`;
}

// ---------- Tabs ----------

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  document.querySelectorAll(".view").forEach((v) => (v.style.display = v.id === `view-${tab}` ? "block" : "none"));
  if (tab === "tasks") renderTasks();
  if (tab === "admin") {
    renderAdmin();
    renderKpiList();
  }
  if (tab === "personnel") renderPersonnel();
  if (tab === "stats") loadStats();
}

// ---------- Tab 1: hiển thị (mỗi nhân sự 1 dòng) ----------

async function renderTasks() {
  const tbody = $("#tasks-table tbody");
  const people = await api.get("/api/personnel");
  tbody.innerHTML = people.length
    ? people
        .map(
          (p) => `
        <tr>
          <td><strong>${escapeHtml(p.name)}</strong></td>
          <td>${escapeHtml(p.title)}</td>
          <td>
            ${p.tasks.length
              ? `<div class="role-list">${p.tasks.map((t) => `<span class="tag primary">${escapeHtml(t.name)}</span>`).join("")}</div>`
              : '<span class="empty">Chưa gán</span>'}
          </td>
          <td>
            ${p.tasks.length
              ? `<div class="role-list">${p.tasks.map((t) => (t.kpis || []).map(kpiTag).join("")).join("")}</div>`
              : '<span class="empty">—</span>'}
          </td>
        </tr>`
        )
        .join("")
    : '<tr><td colspan="4" class="empty">Chưa có dữ liệu.</td></tr>';
}

// ---------- Tab 2: quản trị nhiệm vụ & KPI ----------

async function renderAdmin() {
  const tbody = $("#admin-table tbody");
  const tasks = await api.get("/api/tasks");
  tbody.innerHTML = tasks.length
    ? tasks
        .map(
          (t) => `
        <tr>
          <td><strong>${escapeHtml(t.name)}</strong></td>
          <td>${t.kpis && t.kpis.length ? `<div class="role-list">${t.kpis.map(kpiTag).join("")}</div>` : '<span class="empty">—</span>'}</td>
          <td class="col-actions">
            <button class="btn small" data-act="edit" data-kind="task" data-id="${t.id}">Sửa</button>
            <button class="btn small danger" data-act="delete" data-kind="task" data-id="${t.id}">Xoá</button>
          </td>
        </tr>`
        )
        .join("")
    : '<tr><td colspan="3" class="empty">Chưa có nhiệm vụ.</td></tr>';
}

async function renderKpiList() {
  const list = $("#kpi-list");
  if (!allKpis.length) await loadKpis();
  list.innerHTML = allKpis.length
    ? allKpis
        .map(
          (k) => `
        <div class="item kpi-item">
          <span class="tag kpi">${escapeHtml(k.name)}</span>
          <button class="btn small danger" data-act="delete" data-kind="kpi" data-id="${k.id}">Xoá</button>
        </div>`
        )
        .join("")
    : '<span class="empty">Chưa có KPI nào.</span>';
}

// ---------- Tab 3: nhân sự & gán nhiệm vụ ----------

async function renderPersonnel() {
  const tbody = $("#personnel-table tbody");
  const people = await api.get("/api/personnel");
  tbody.innerHTML = people.length
    ? people
        .map(
          (p) => `
        <tr>
          <td><strong>${escapeHtml(p.name)}</strong></td>
          <td>${escapeHtml(p.title)}</td>
          <td>
            ${p.tasks.length ? `<div class="role-list">${p.tasks.map((t) => `<span class="tag primary">${escapeHtml(t.name)}</span>`).join("")}</div>` : '<span class="empty">Chưa gán</span>'}
          </td>
          <td class="col-actions">
            <button class="btn small" data-act="assign" data-id="${p.id}">Gán nhiệm vụ</button>
            <button class="btn small" data-act="edit" data-kind="person" data-id="${p.id}">Sửa</button>
            <button class="btn small danger" data-act="delete" data-kind="person" data-id="${p.id}">Xoá</button>
          </td>
        </tr>`
        )
        .join("")
    : '<tr><td colspan="4" class="empty">Chưa có nhân sự.</td></tr>';
}

// ---------- Tab 4: thống kê ----------

async function loadStats() {
  try {
    const s = await api.get("/api/stats");
    $("#stats-totals").innerHTML = `
      <div class="card"><div class="num">${s.totals.personnel}</div><div class="label">Tổng nhân sự</div></div>
      <div class="card"><div class="num">${s.totals.tasks}</div><div class="label">Tổng nhiệm vụ</div></div>
      <div class="card"><div class="num">${s.totals.assignments}</div><div class="label">Tổng số gán</div></div>
      <div class="card"><div class="num">${s.unassignedTasks.length}</div><div class="label">Nhiệm vụ chưa gán</div></div>
    `;

    $("#stats-people tbody").innerHTML = s.peopleStats
      .map(
        (p) => `
        <tr>
          <td><strong>${escapeHtml(p.name)}</strong></td>
          <td>${escapeHtml(p.title)}</td>
          <td><strong>${p.taskCount}</strong></td>
        </tr>`
      )
      .join("");

    $("#stats-tasks tbody").innerHTML = s.taskStats
      .map(
        (t) => `
        <tr>
          <td>${escapeHtml(t.name)}</td>
          <td><strong>${t.peopleCount}</strong></td>
          <td>${t.kpiCount}/3</td>
        </tr>`
      )
      .join("");

    const unassigned = $("#stats-unassigned");
    unassigned.innerHTML = s.unassignedTasks.length
      ? s.unassignedTasks.map((t) => `<div class="item"><span class="status-warn">${escapeHtml(t.name)}</span></div>`).join("")
      : '<span class="empty">Mọi nhiệm vụ đều có người phụ trách.</span>';

    const missing = $("#stats-missing-kpi");
    missing.innerHTML = s.tasksMissingKpi.length
      ? s.tasksMissingKpi.map((t) => `<div class="item"><strong>${escapeHtml(t.name)}</strong> — có ${t.kpiCount}/3 KPI</div>`).join("")
      : '<span class="empty">Mọi nhiệm vụ đều đủ KPI.</span>';
  } catch (e) {
    toast(e.message, true);
  }
}

// ---------- Modal: nhiệm vụ & KPI ----------

let taskModalId = null;

async function openTaskModal(existing) {
  taskModalId = existing ? existing.id : null;
  if (!allKpis.length) await loadKpis();
  $("#task-title").textContent = existing ? "Sửa nhiệm vụ" : "Thêm nhiệm vụ";
  $("#task-name").value = existing ? existing.name : "";
  const current = existing ? new Set((existing.kpiIds || []).map(Number)) : new Set();
  $("#task-kpi-list").innerHTML = allKpis.length
    ? allKpis
        .map(
          (k) => `
        <label class="check-row">
          <input type="checkbox" value="${k.id}" ${current.has(k.id) ? "checked" : ""} />
          <span>${escapeHtml(k.name)}</span>
        </label>`
        )
        .join("")
    : '<span class="empty">Chưa có KPI nào.</span>';
  $("#task-overlay").classList.remove("hidden");
  $("#task-name").focus();
}

$("#task-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const body = {
    name: $("#task-name").value.trim(),
    kpiIds: Array.from($("#task-kpi-list").querySelectorAll("input:checked")).map((c) => Number(c.value)),
  };
  try {
    if (taskModalId == null) await api.send("/api/tasks", "POST", body);
    else await api.send(`/api/tasks/${taskModalId}`, "PUT", body);
    $("#task-overlay").classList.add("hidden");
    await renderAdmin();
  } catch (err) {
    toast(err.message, true);
  }
});

// ---------- Modal: nhân sự ----------

let personModalId = null;

function openPersonModal(existing) {
  personModalId = existing ? existing.id : null;
  $("#person-title").textContent = existing ? "Sửa nhân sự" : "Thêm nhân sự";
  $("#person-name").value = existing ? existing.name : "";
  $("#person-title-field").value = existing ? existing.title : "";
  $("#person-overlay").classList.remove("hidden");
  $("#person-name").focus();
}

$("#person-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const body = {
    name: $("#person-name").value.trim(),
    title: $("#person-title-field").value.trim(),
  };
  try {
    if (personModalId == null) await api.send("/api/personnel", "POST", body);
    else await api.send(`/api/personnel/${personModalId}`, "PUT", body);
    $("#person-overlay").classList.add("hidden");
    await renderPersonnel();
  } catch (err) {
    toast(err.message, true);
  }
});

// ---------- Modal: gán nhiệm vụ ----------

let assignPersonId = null;

async function openAssign(personId) {
  assignPersonId = personId;
  const [person, tasks] = await Promise.all([api.get("/api/personnel"), api.get("/api/tasks")]);
  const current = new Set(person.find((p) => p.id === personId).tasks.map((t) => t.id));
  $("#assign-title").textContent = `Gán nhiệm vụ cho: ${person.find((p) => p.id === personId).name}`;
  $("#assign-list").innerHTML = tasks.length
    ? tasks
        .map(
          (t) => `
        <label class="check-row">
          <input type="checkbox" value="${t.id}" ${current.has(t.id) ? "checked" : ""} />
          <span>${escapeHtml(t.name)}</span>
        </label>`
        )
        .join("")
    : '<span class="empty">Chưa có nhiệm vụ nào để gán.</span>';
  $("#assign-overlay").classList.remove("hidden");
}

$("#assign-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const taskIds = Array.from($("#assign-list").querySelectorAll("input:checked")).map((c) => Number(c.value));
  try {
    await api.send(`/api/personnel/${assignPersonId}/assignments`, "PUT", { taskIds });
    $("#assign-overlay").classList.add("hidden");
    await renderPersonnel();
  } catch (err) {
    toast(err.message, true);
  }
});

// ---------- Event delegation ----------

document.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-act]");
  if (!btn) return;
  const act = btn.dataset.act;
  const kind = btn.dataset.kind;
  const id = Number(btn.dataset.id);

  if (act === "assign") {
    await openAssign(id);
    return;
  }

  if (act === "edit") {
    if (kind === "task") {
      const task = (await api.get("/api/tasks")).find((t) => t.id === id);
      openTaskModal(task);
    } else {
      const person = (await api.get("/api/personnel")).find((p) => p.id === id);
      openPersonModal(person);
    }
    return;
  }

  if (act === "delete") {
    const labels = { task: "nhiệm vụ", person: "nhân sự", kpi: "KPI" };
    const label = labels[kind] || kind;
    if (!confirm(`Xoá ${label} này?`)) return;
    try {
      await api.send(`/api/${kind}s/${id}`, "DELETE");
      if (kind === "kpi") {
        await loadKpis();
        await renderKpiList();
        await renderAdmin();
      } else if (currentTab === "admin") {
        await renderAdmin();
      } else {
        await renderPersonnel();
      }
    } catch (err) {
      toast(err.message, true);
    }
  }
});

// ---------- Static buttons ----------

$("#btn-add-task").addEventListener("click", () => openTaskModal(null));
$("#btn-goto-admin").addEventListener("click", () => switchTab("admin"));
$("#btn-add-person").addEventListener("click", () => openPersonModal(null));
$("#btn-refresh-stats").addEventListener("click", loadStats);
$("#task-cancel").addEventListener("click", () => $("#task-overlay").classList.add("hidden"));
$("#person-cancel").addEventListener("click", () => $("#person-overlay").classList.add("hidden"));
$("#assign-cancel").addEventListener("click", () => $("#assign-overlay").classList.add("hidden"));

$("#btn-add-kpi").addEventListener("click", async () => {
  const name = $("#new-kpi-name").value.trim();
  if (!name) return toast("Nhập tên KPI", true);
  try {
    await api.send("/api/kpis", "POST", { name });
    $("#new-kpi-name").value = "";
    await loadKpis();
    await renderKpiList();
  } catch (err) {
    toast(err.message, true);
  }
});

document.querySelectorAll(".tab-btn").forEach((b) => b.addEventListener("click", () => switchTab(b.dataset.tab)));

// ---------- Init ----------

(async function init() {
  try {
    await renderTasks();
  } catch (e) {
    toast(e.message, true);
  }
})();
