/* Dashboard charts. Owner: P3 SK Sumit Kumbhar. */
"use strict";

const PALETTE = [
  "#1E88E5","#E53935","#FF8F00","#43A047","#8E24AA",
  "#00ACC1","#F4511E","#5E35B1","#C0CA33","#607D8B",
];

const charts = {};
const fmt = (n, d = 2) => Number(n).toFixed(d);

async function getJSON(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
  if (!res.ok) throw new Error(`${url} --- HTTP ${res.status}`);
  return res.json();
}

function upsert(key, canvasId, config) {
  if (charts[key]) {
    charts[key].data = config.data;
    charts[key].update();
    return charts[key];
  }
  const el = document.getElementById(canvasId);
  if (!el) return null;
  charts[key] = new Chart(el.getContext("2d"), config);
  return charts[key];
}

function renderKpis(summary) {
  const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
  set("kpi-carbon",   `${fmt(summary.totals.carbon_avoided_kg_co2e)} kg CO2e`);
  set("kpi-weight",   `${fmt(summary.totals.weight_kg)} kg`);
  set("kpi-records",  String(summary.totals.records));
  set("kpi-month",    `${summary.this_month.records} items • ${fmt(summary.this_month.carbon_avoided_kg_co2e)} kg CO2e`);
}

function renderTrend(ts) {
  upsert("trend", "chart-trend", {
    type: "line",
    data: {
      labels: ts.labels,
      datasets: [
        {
          label: "Daily kg CO2e avoided",
          data: ts.series.carbon_avoided_kg_co2e,
          borderColor: PALETTE[3],
          backgroundColor: "rgba(67,160,71,.15)",
          fill: true, tension: 0.3,
        },
        {
          label: "Cumulative kg CO2e",
          data: ts.series.carbon_cumulative_kg_co2e,
          borderColor: PALETTE[0],
          borderDash: [6, 4],
          fill: false, tension: 0.3,
          yAxisID: "y1",
        },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      scales: {
        y:  { beginAtZero: true, title: { display: true, text: "kg CO2e / day" } },
        y1: { beginAtZero: true, position: "right",
               grid: { drawOnChartArea: false },
               title: { display: true, text: "cumulative" } },
      },
    },
  });
}

function renderByClass(summary) {
  upsert("byClass", "chart-by-class", {
    type: "bar",
    data: {
      labels: summary.by_class.filter(c => c.carbon_avoided_kg_co2e > 0).map(c => c.display_name),
      datasets: [{
        label: "kg CO2e avoided",
        data: summary.by_class.filter(c => c.carbon_avoided_kg_co2e > 0).map(c => c.carbon_avoided_kg_co2e),
        backgroundColor: summary.by_class.filter(c => c.carbon_avoided_kg_co2e > 0).map((_, i) => PALETTE[i % PALETTE.length]),
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      indexAxis: "y",
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true } },
    },
  });
}

function renderMaterials(data) {
  const top = data.materials.slice(0, 8);
  upsert("materials", "chart-materials", {
    type: "doughnut",
    data: {
      labels: top.map(m => m.display_name),
      datasets: [{
        data: top.map(m => m.carbon_avoided_kg_co2e),
        backgroundColor: top.map((_, i) => PALETTE[i % PALETTE.length]),
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: c => `${c.label}: ${fmt(c.parsed)} kg CO2e (${fmt(top[c.dataIndex].share * 100, 1)} %)`,
          },
        },
      },
    },
  });
}

function renderBins(data) {
  const collection = data.bins;
  upsert("bins", "chart-bins", {
    type: "bar",
    data: {
      labels: collection.map(b => b.bin_name),
      datasets: [{
        label: "Fill %",
        data: collection.map(b => b.fill_percent),
        backgroundColor: collection.map(b => b.color_code),
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, max: Math.max(100, ...collection.map(b => b.fill_percent)), title: { display: true, text: "% of threshold" } } },
    },
  });

  const tbody = document.getElementById("bins-tbody");
  if (!tbody) return;
  tbody.textContent = "";
  for (const b of data.bins) {
    const tr = document.createElement("tr");
    
    // Convert to kg
    const wKg = b.current_weight_g / 1000;
    const tKg = b.threshold_limit_g / 1000;
    const fillStr = b.fill_percent === null ? "---" : `${fmt(b.fill_percent, 1)} %`;
    
    const cells = [
      b.bin_name,
      `${fmt(wKg)} kg`,
      b.threshold_limit_g ? `${fmt(tKg)} kg` : "---",
      fillStr,
      b.partner_name || "---"
    ];
    for (let i = 0; i < cells.length; i++) {
      const td = document.createElement("td");
      td.textContent = cells[i];
      if (i === 3 && b.fill_percent >= 90) {
        td.style.color = "red";
        td.style.fontWeight = "bold";
      }
      tr.appendChild(td);
    }
    const action = document.createElement("td");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-pickup";
    btn.textContent = "Record pickup";
    btn.dataset.binId = String(b.bin_id);
    action.appendChild(btn);
    tr.appendChild(action);
    tbody.appendChild(tr);
  }
}

async function recordPickup(binId) {
  const res = await fetch(`/api/bins/${binId}/pickup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error?.message || `HTTP ${res.status}`);
  await refresh();
}

async function refresh() {
  const days = Number(document.getElementById("range-select")?.value || 30);
  const [summaryData, tsData, binsData, materialsData] = await Promise.all([
    getJSON("/api/dashboard/summary"),
    getJSON(`/api/dashboard/timeseries?days=${days}`),
    getJSON("/api/dashboard/bins"),
    getJSON("/api/dashboard/materials"),
  ]);
  renderKpis(summaryData);
  renderTrend(tsData);
  renderByClass(summaryData);
  renderMaterials(materialsData);
  renderBins(binsData);
  const stamp = document.getElementById("last-updated");
  if (stamp) stamp.textContent = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });

  const recordsData = await getJSON('/api/dashboard/records?limit=50');
  const tbody = document.getElementById('logs-tbody');
  if (tbody && recordsData) {
    tbody.innerHTML = '';
    recordsData.records.forEach(log => {
        const tr = document.createElement('tr');
          if (log.record_status === 'voided') {
              tr.style.opacity = '0.5';
              tr.style.textDecoration = 'line-through';
          }
        
        
        let dt = "";
        if (log.completed_at) {
           const d = new Date(log.completed_at);
           dt = d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'short', timeStyle: 'short' });
        }
        
        tr.innerHTML = `
           <td>${dt}</td>
           <td>${log.display_name || log.item_class}</td>
           <td>${fmt(log.weight_g / 1000)} kg</td>
           <td>${log.bin_name || log.bin_id}</td>
           <td>
              ${log.record_status === 'voided' ? 'Voided' : `
                 <button class="btn-void" data-id="${log.detection_id}" style="background:var(--red);color:white;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;margin-right:4px;">Void</button>
                 <button class="btn-edit" data-id="${log.detection_id}" style="background:#1E88E5;color:white;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;">Edit</button>
              `}
           </td>
        `;
        tbody.appendChild(tr);
    });
  }
}

function wire() {
  document.querySelectorAll('th.sortable').forEach(th => th.addEventListener('click', () => sortTable(parseInt(th.dataset.sort))));
  document.getElementById("range-select")?.addEventListener("change", () => refresh().catch(console.error));
  document.getElementById("refresh-btn")?.addEventListener("click", () => refresh().catch(console.error));
  document.getElementById("bins-tbody")?.addEventListener("click", ev => {
    const btn = ev.target.closest(".btn-pickup");
    if (!btn) return;
    btn.disabled = true;
    recordPickup(btn.dataset.binId).catch(err => alert(err)).finally(() => { btn.disabled = false; });
  });

  const es = new EventSource("/api/stream");
  window.addEventListener("beforeunload", () => es.close());
  for (const name of ["detection_completed", "bin_alert", "record_voided", "pickup_recorded", "record_edited"]) {
    es.addEventListener(name, () => { refresh().catch(console.error); });
  }
  es.addEventListener("error", () => { /* auto retry */ });
  setInterval(() => { refresh().catch(console.error); }, 60000);
}


async function voidRecord(id) {
    if(!confirm("Are you sure you want to void this record? It will be removed from totals.")) return;
    try {
        await fetch(`/api/detections/${id}/void`, { method: 'POST' });
        refresh();
    } catch (e) {
        alert("Failed to void");
    }
}
document.addEventListener("DOMContentLoaded", () => {
  setInterval(() => {
    const stamp = document.getElementById("last-updated");
    if (stamp) stamp.textContent = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });
  }, 1000);

  wire();

  const modal = document.getElementById('edit-modal');
  const cancelBtn = document.getElementById('edit-cancel');
  const saveBtn = document.getElementById('edit-save');
  
  cancelBtn?.addEventListener('click', () => { modal.style.display = 'none'; });
  
  saveBtn?.addEventListener('click', async () => {
    const id = document.getElementById('edit-detection-id').value;
    const itemClass = document.getElementById('edit-item-class').value;
    const weightG = parseInt(document.getElementById('edit-weight').value, 10);
    
    saveBtn.disabled = true;
    try {
        const res = await fetch(`/api/detections/${id}/edit`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ item_class: itemClass, weight_g: weightG })
        });
        if (!res.ok) throw new Error("Failed to edit");
        modal.style.display = 'none';
        refresh();
    } catch (e) {
        alert(e.message);
    } finally {
        saveBtn.disabled = false;
    }
  });

  document.getElementById("logs-tbody")?.addEventListener("click", ev => {
    const voidBtn = ev.target.closest(".btn-void");
    if (voidBtn) {
      voidBtn.disabled = true;
      voidRecord(voidBtn.dataset.id).catch(err => alert(err)).finally(() => { voidBtn.disabled = false; });
      return;
    }

    
    const editBtn = ev.target.closest(".btn-edit");
    if (editBtn) {
      // Find the row data
      const row = editBtn.closest("tr");
      if (!row) return;
      
      const id = editBtn.dataset.id;
      // Item text is in the second column
      const itemText = row.cells[1].innerText.toLowerCase();
      // Weight text is in the third column (e.g., "1.25 kg")
      const weightText = row.cells[2].innerText.replace("kg", "").trim();
      const weightG = Math.round(parseFloat(weightText) * 1000);
      
      document.getElementById('edit-detection-id').value = id;
      document.getElementById('edit-weight').value = weightG;
      
      // Try to select the right option
      const select = document.getElementById('edit-item-class');
      for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].text.toLowerCase() === itemText || select.options[i].value === itemText) {
            select.selectedIndex = i;
            break;
        }
      }
      
      modal.style.display = 'flex';
    }
  });

  refresh().catch(console.error);
});

// Record Filtering
document.getElementById('log-search')?.addEventListener('keyup', function() {
    const term = this.value.toLowerCase();
    const rows = document.getElementById('logs-tbody').getElementsByTagName('tr');
    for (let row of rows) {
        row.style.display = row.innerText.toLowerCase().includes(term) ? '' : 'none';
    }
});

// Record Sorting
let sortDirs = [true, true, true, true, true];
function sortTable(colIdx) {
    const tbody = document.getElementById('logs-tbody');
    const rows = Array.from(tbody.getElementsByTagName('tr'));
    const isAsc = sortDirs[colIdx];
    sortDirs[colIdx] = !isAsc;
    
    // Reset icons
    document.querySelectorAll('th.sortable .sort-icon').forEach(icon => {
        icon.textContent = '↕';
        icon.style.opacity = '0.3';
    });
    // Set active icon
    const activeTh = document.querySelector(`th[data-sort="${colIdx}"]`);
    if (activeTh) {
        const icon = activeTh.querySelector('.sort-icon');
        if (icon) {
            icon.textContent = isAsc ? '↓' : '↑';
            icon.style.opacity = '1.0';
        }
    }
    
    rows.sort((a, b) => {
        let valA = a.cells[colIdx].innerText;
        let valB = b.cells[colIdx].innerText;
        
        if (colIdx === 2) { 
            valA = parseFloat(valA) || 0;
            valB = parseFloat(valB) || 0;
            return isAsc ? valA - valB : valB - valA;
        }
        return isAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
    
    tbody.append(...rows);
}
window.sortTable = sortTable;
