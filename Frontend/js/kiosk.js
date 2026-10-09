/* Kiosk JS. Owner: P2 VP Vedant Patil. */
"use strict";

const $ = id => document.getElementById(id);

/// ------ result card ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function showResult(ev, isHistory = false) {
  if ($("result-header-text")) $("result-header-text").classList.remove("hidden");
  if ($("result-class")) $("result-class").textContent = ev.display_name || ev.item_class;
  
  if (ev.completed_at) {
      const d = new Date(ev.completed_at + (ev.completed_at.endsWith('Z') ? '' : 'Z'));
      const timeStr = d.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour12: true, hour: '2-digit', minute: '2-digit' });
      const rTime = $("result-time");
      if(rTime) rTime.textContent = timeStr;
  }
  
  if ($("result-weight")) $("result-weight").textContent  = `${ev.weight_g} g`;
  if ($("result-carbon")) $("result-carbon").textContent  = `${Number(ev.carbon_avoided_kg_co2e).toFixed(2)} kg CO2e`;
  if ($("result-bin")) $("result-bin").textContent     = ev.bin_name || `Bin ${ev.bin_id}`;
  
  const card = $("result-card");
  if (card) card.classList.remove("hidden");
  
  if (!isHistory) {
    showToast("Record saved to database!", "success");
    setTimeout(resetState, 8000);
  }
}

// ------ bin alert ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function showAlert(ev) {
  if (ev.status === "ok") {
    if ($("alert-text").textContent.includes(ev.bin_name)) {
      $("alert-banner").classList.add("hidden");
    }
    return;
  }
  $("alert-text").textContent =
    `${ev.bin_name} is FULL (${ev.current_weight_g} g). Please contact ${ev.partner_name || "the recycling partner"}.`;
  $("alert-banner").classList.remove("hidden");
  setTimeout(() => $("alert-banner").classList.add("hidden"), 15000);
}

// ------ reset ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function resetState() {
  if ($("result-card")) $("result-card").classList.add("hidden");
  if ($("result-header-text")) $("result-header-text").classList.add("hidden");
}

// ------ SSE ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
let _sse = null;

function connectSSE() {
  if (_sse) _sse.close();
  _sse = new EventSource("/api/stream");

  _sse.addEventListener("detection_completed",  e => showResult(JSON.parse(e.data)));
  _sse.addEventListener("bin_alert",             e => showAlert(JSON.parse(e.data)));

  _sse.onopen = () => {};
  _sse.onerror = () => { setTimeout(connectSSE, 4000); };
}


// ------ boot ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  let prevState = null;
  // Telemetry loop
  function pollTelemetry() {
    fetch('/api/telemetry', { cache: "no-store" })
      .then(r => r.json())
      .then(data => {
        const telState = document.getElementById('tel-state');
        telState.textContent = data.state || 'OFFLINE';
        if (data.state === 'WAIT_STABLE_WEIGHT') {
            telState.classList.add('pulse');
        } else {
            telState.classList.remove('pulse');
        }
        
        if ((prevState === 'LOCKED' || prevState === 'WAIT_STABLE_WEIGHT') && data.state === 'IDLE' && telState.textContent !== 'DONE') {
            showToast("Capture aborted: Item removed too quickly", "error");
        } else if (prevState === 'LOCKED' && data.state === 'WAIT_STABLE_WEIGHT') {
            showToast("Capture aborted: Weight became unstable", "error");
        }
        prevState = data.state;
        
        document.getElementById('tel-winner').textContent = data.winner || '-';
        document.getElementById('tel-empty').textContent = data.empty || '1.0';
        document.getElementById('tel-weight').textContent = data.weight_stable || '-';
      })
      .catch(err => console.error("Telemetry error", err))
      .finally(() => setTimeout(pollTelemetry, 250));
  }
  pollTelemetry();
  
  // Load initial current detection if available to show immediately
  fetch("/api/current", { cache: "no-store" })
    .then(r => r.json())
    .then(data => {
        if (data && data.record) showResult(data.record, true);
    }).catch(() => {});

  connectSSE();
  
  
});

// Toast Notifications
function showToast(message, type = 'success') {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.innerHTML = '<span>' + (type === 'success' ? '&#10003;' : '&#10007;') + '</span> ' + message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

window.addEventListener('beforeunload', () => { if(_sse) _sse.close(); });
