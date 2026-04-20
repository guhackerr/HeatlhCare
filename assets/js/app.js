const state = {
  user: {
    name: "Ana Martins",
    twoFactor: "enabled",
    timeout: 5
  },
  patients: [
    {
      id: "p1",
      name: "João Silveira",
      cpf: "123.456.789-00",
      birthDate: "2005-03-18",
      phone: "(11) 99876-1000",
      socialName: "",
      email: "joao@email.com",
      guardian: "Marta Silveira"
    },
    {
      id: "p2",
      name: "Maria Costa",
      cpf: "987.654.321-00",
      birthDate: "1993-11-04",
      phone: "(11) 99777-4400",
      socialName: "Mari Costa",
      email: "maria@email.com",
      guardian: ""
    }
  ],
  sessions: [
    {
      id: "s1",
      patientId: "p1",
      date: "2026-04-22",
      time: "09:00",
      status: "Confirmada"
    },
    {
      id: "s2",
      patientId: "p2",
      date: "2026-04-23",
      time: "14:30",
      status: "Agendada"
    }
  ],
  evolutions: [
    {
      id: "e1",
      sessionId: "s1",
      version: 1,
      author: "Ana Martins",
      createdAt: "2026-04-20 09:15",
      note: "Paciente relata ansiedade antecipatória e melhora no sono."
    }
  ],
  audit: [
    "2026-04-20 08:00 • Sistema • Backup diário concluído com retenção de 30 dias.",
    "2026-04-20 08:10 • Sistema • Log append-only validado em armazenamento separado."
  ]
};

let inactivityRemaining = state.user.timeout * 60;
let inactivityTimer;
let toastTimer;

function formatMasked(value, visible = 4) {
  if (!value) {
    return "Não informado";
  }

  const tail = value.slice(-visible);
  return `••••••${tail}`;
}

function getPatientById(id) {
  return state.patients.find((patient) => patient.id === id);
}

function getSessionById(id) {
  return state.sessions.find((session) => session.id === id);
}

function calculateAge(birthDate) {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }

  return age;
}

function addAuditEntry(message) {
  const timestamp = new Date().toLocaleString("pt-BR");
  state.audit.unshift(`${timestamp} • ${message}`);
  renderAudit();
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2400);
}

function changeScreen(screenId) {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.toggle("active", screen.id === `screen-${screenId}`);
  });

  document.querySelectorAll(".nav-link").forEach((button) => {
    button.classList.toggle("active", button.dataset.screen === screenId);
  });
}

function renderPatients() {
  const patientList = document.getElementById("patient-list");
  patientList.innerHTML = "";

  state.patients.forEach((patient) => {
    const item = document.createElement("article");
    item.className = "list-item";
    item.innerHTML = `
      <strong>${patient.socialName || patient.name}</strong>
      <div class="meta">Nome civil: ${patient.name}</div>
      <div class="meta">CPF criptografado: ${formatMasked(patient.cpf)}</div>
      <div class="meta">Telefone criptografado: ${formatMasked(patient.phone)}</div>
      <div class="meta">Responsável legal: ${patient.guardian || "Não aplicável"}</div>
    `;
    patientList.appendChild(item);
  });
}

function renderSessionOptions() {
  const selects = [document.getElementById("session-patient")];
  selects.forEach((select) => {
    select.innerHTML = '<option value="">Selecione um paciente</option>';
    state.patients.forEach((patient) => {
      const option = document.createElement("option");
      option.value = patient.id;
      option.textContent = patient.socialName || patient.name;
      select.appendChild(option);
    });
  });
}

function renderSessions() {
  const sessionList = document.getElementById("session-list");
  const evolutionSession = document.getElementById("evolution-session");

  sessionList.innerHTML = "";
  evolutionSession.innerHTML = '<option value="">Selecione uma sessão</option>';

  state.sessions.forEach((session) => {
    const patient = getPatientById(session.patientId);
    const label = `${patient ? patient.name : "Paciente"} • ${session.date} ${session.time}`;

    const item = document.createElement("article");
    item.className = "list-item";
    item.innerHTML = `
      <strong>${label}</strong>
      <div class="meta">Status: ${session.status}</div>
      <div class="meta">Metadado protegido: ${formatMasked(`${session.date} ${session.time}`, 5)}</div>
    `;
    sessionList.appendChild(item);

    const option = document.createElement("option");
    option.value = session.id;
    option.textContent = label;
    evolutionSession.appendChild(option);
  });
}

function renderEvolutions() {
  const evolutionList = document.getElementById("evolution-list");
  evolutionList.innerHTML = "";

  const sorted = [...state.evolutions].sort((a, b) => b.version - a.version);

  sorted.forEach((evolution) => {
    const session = getSessionById(evolution.sessionId);
    const patient = session ? getPatientById(session.patientId) : null;
    const item = document.createElement("article");
    item.className = "list-item";
    item.innerHTML = `
      <strong>${patient ? patient.name : "Paciente"} • versão ${evolution.version}</strong>
      <div class="meta">${evolution.createdAt} • por ${evolution.author}</div>
      <p>${evolution.note}</p>
    `;
    evolutionList.appendChild(item);
  });
}

function renderAudit() {
  const auditLog = document.getElementById("audit-log");
  auditLog.innerHTML = "";

  state.audit.forEach((entry) => {
    const item = document.createElement("div");
    item.className = "audit-entry";
    item.textContent = entry;
    auditLog.appendChild(item);
  });
}

function appendMiniLog(targetId, message) {
  const log = document.getElementById(targetId);
  const line = document.createElement("div");
  line.className = "audit-entry";
  line.textContent = `${new Date().toLocaleTimeString("pt-BR")} • ${message}`;
  log.prepend(line);
}

function updateSessionStatusLabel() {
  const minutes = String(Math.floor(inactivityRemaining / 60)).padStart(2, "0");
  const seconds = String(inactivityRemaining % 60).padStart(2, "0");
  const status = document.getElementById("session-status");
  status.textContent = `Sessão desbloqueada • timeout em ${minutes}:${seconds}`;
}

function lockScreen(reason = "Bloqueio manual acionado.") {
  document.getElementById("lock-overlay").classList.add("visible");
  document.getElementById("lock-overlay").setAttribute("aria-hidden", "false");
  addAuditEntry(`${state.user.name} • ${reason}`);
  showToast("Tela protegida com sucesso.");
}

function unlockScreen() {
  document.getElementById("lock-overlay").classList.remove("visible");
  document.getElementById("lock-overlay").setAttribute("aria-hidden", "true");
  inactivityRemaining = state.user.timeout * 60;
  updateSessionStatusLabel();
  addAuditEntry(`${state.user.name} • Reautenticação simulada concluída.`);
}

function resetInactivityTimer() {
  inactivityRemaining = state.user.timeout * 60;
  updateSessionStatusLabel();
}

function startInactivityCountdown() {
  clearInterval(inactivityTimer);
  inactivityTimer = setInterval(() => {
    inactivityRemaining -= 1;
    updateSessionStatusLabel();

    if (inactivityRemaining <= 0) {
      inactivityRemaining = state.user.timeout * 60;
      lockScreen("Timeout de inatividade expirou.");
    }
  }, 1000);
}

function applyAppearance(formData) {
  const root = document.documentElement;
  root.dataset.theme = formData.get("theme");
  root.dataset.fontSize = formData.get("fontSize");
  root.dataset.fontFamily = formData.get("fontFamily");
  addAuditEntry(`${state.user.name} • Atualizou aparência e acessibilidade.`);
  showToast("Aparência aplicada no protótipo.");
}

function applyPreferences(formData) {
  document.documentElement.dataset.density = formData.get("density");
  addAuditEntry(`${state.user.name} • Salvou preferências de uso (${formData.get("language")}, ${formData.get("notifications")}).`);
  showToast("Preferências registradas.");
}

document.addEventListener("click", (event) => {
  const navButton = event.target.closest("[data-screen]");
  if (navButton) {
    changeScreen(navButton.dataset.screen);
    return;
  }

  const providerButton = event.target.closest("[data-provider]");
  if (providerButton) {
    const provider = providerButton.dataset.provider;
    appendMiniLog("identity-log", `${provider} vinculado via fluxo OAuth2 simulado.`);
    addAuditEntry(`${state.user.name} • Vinculou provedor ${provider}.`);
    showToast(`${provider} conectado de forma simulada.`);
    return;
  }

  const integrationButton = event.target.closest("[data-integration]");
  if (integrationButton) {
    const integration = integrationButton.dataset.integration;
    const messages = {
      backup: "Backup em nuvem configurado com criptografia simulada e retenção de 30 dias.",
      google: "Google vinculado como provedor de identidade.",
      microsoft: "Microsoft vinculado como provedor de identidade."
    };

    appendMiniLog("integration-log", messages[integration]);
    addAuditEntry(`${state.user.name} • Configurou integração ${integration}.`);
    showToast("Integração simulada com sucesso.");
  }
});

document.addEventListener("submit", (event) => {
  event.preventDefault();

  if (event.target.id === "identity-form") {
    const data = new FormData(event.target);
    appendMiniLog("identity-log", `Conta criada para ${data.get("fullName")} com hash/salt simulado.`);
    addAuditEntry(`${data.get("fullName")} • Identidade manual criada com criptografia simulada.`);
    event.target.reset();
    showToast("Identidade criada.");
    return;
  }

  if (event.target.id === "patient-form") {
    const data = new FormData(event.target);
    const age = calculateAge(data.get("birthDate"));
    const guardian = data.get("guardian").trim();

    if (age < 18 && !guardian) {
      showToast("Informe o responsável legal para pacientes menores de idade.");
      return;
    }

    state.patients.unshift({
      id: `p${Date.now()}`,
      name: data.get("name"),
      cpf: data.get("cpf"),
      birthDate: data.get("birthDate"),
      phone: data.get("phone"),
      socialName: data.get("socialName"),
      email: data.get("email"),
      guardian
    });

    renderPatients();
    renderSessionOptions();
    addAuditEntry(`${state.user.name} • Cadastrou paciente ${data.get("name")}.`);
    event.target.reset();
    showToast("Paciente cadastrado.");
    return;
  }

  if (event.target.id === "session-form") {
    const data = new FormData(event.target);
    state.sessions.unshift({
      id: `s${Date.now()}`,
      patientId: data.get("patientId"),
      date: data.get("date"),
      time: data.get("time"),
      status: data.get("status")
    });

    renderSessions();
    addAuditEntry(`${state.user.name} • Registrou sessão protegida para ${data.get("date")} ${data.get("time")}.`);
    event.target.reset();
    showToast("Sessão registrada.");
    return;
  }

  if (event.target.id === "evolution-form") {
    const data = new FormData(event.target);
    const versions = state.evolutions.filter((item) => item.sessionId === data.get("sessionId"));
    const nextVersion = versions.length + 1;

    state.evolutions.unshift({
      id: `e${Date.now()}`,
      sessionId: data.get("sessionId"),
      version: nextVersion,
      author: state.user.name,
      createdAt: new Date().toLocaleString("pt-BR"),
      note: data.get("note")
    });

    renderEvolutions();
    addAuditEntry(`${state.user.name} • Versionou evolução clínica v${nextVersion}.`);
    event.target.reset();
    showToast("Evolução versionada.");
    return;
  }

  if (event.target.id === "appearance-form") {
    applyAppearance(new FormData(event.target));
    return;
  }

  if (event.target.id === "preferences-form") {
    applyPreferences(new FormData(event.target));
    return;
  }

  if (event.target.id === "security-form") {
    const data = new FormData(event.target);
    state.user.twoFactor = data.get("twoFactor");
    state.user.timeout = Number(data.get("timeout"));
    resetInactivityTimer();
    addAuditEntry(`${state.user.name} • Atualizou política de segurança (2FA ${state.user.twoFactor}).`);
    showToast("Política de segurança salva.");
  }
});

["click", "keydown", "mousemove"].forEach((eventName) => {
  document.addEventListener(eventName, resetInactivityTimer);
});

document.addEventListener("keydown", (event) => {
  if (event.shiftKey && event.key.toLowerCase() === "l") {
    lockScreen("Bloqueio manual via atalho.");
  }
});

document.getElementById("lock-button").addEventListener("click", () => {
  lockScreen("Bloqueio manual pelo painel lateral.");
});

document.getElementById("unlock-button").addEventListener("click", unlockScreen);

document.getElementById("simulate-sync").addEventListener("click", () => {
  addAuditEntry("Sistema • Sincronização segura simulada via HTTPS/TLS 1.2+.");
  showToast("Sincronização segura simulada.");
});

window.addEventListener("DOMContentLoaded", () => {
  renderPatients();
  renderSessionOptions();
  renderSessions();
  renderEvolutions();
  renderAudit();
  updateSessionStatusLabel();
  startInactivityCountdown();
});
