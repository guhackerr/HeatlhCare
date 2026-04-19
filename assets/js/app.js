const activityMap = {
  ana: {
    user: "Ana Martins",
    action: "Editou anotação",
    time: "Hoje, 14:32",
    ip: "192.168.1.12",
    before: "Paciente: relatou preocupações com trabalho.",
    after: "Paciente: relatou preocupações com trabalho e insônia."
  },
  carlos: {
    user: "Carlos Souza",
    action: "Acessou prontuário",
    time: "Hoje, 10:15",
    ip: "192.168.1.20",
    before: "Consulta em aberto para revisão de histórico.",
    after: "Consulta revisada. Histórico visualizado sem alterações no conteúdo."
  },
  rita: {
    user: "Rita Lopes",
    action: "Exportou dados",
    time: "Ontem, 16:45",
    ip: "192.168.1.34",
    before: "Relatório parcial gerado para conferência.",
    after: "Relatório PDF completo exportado com anexos e auditoria."
  }
};

function setActiveState(elements, activeClass, target) {
  elements.forEach((element) => {
    const isActive = element.dataset.target === target;
    element.classList.toggle(activeClass, isActive);
    element.classList.toggle("text-muted", !isActive);
  });
}

function changeScreen(screenId) {
  const screens = document.querySelectorAll(".screen-content");
  const targetScreen = document.getElementById(`screen-${screenId}`);

  if (!targetScreen) {
    return;
  }

  screens.forEach((screen) => screen.classList.remove("active"));
  targetScreen.classList.add("active");

  setActiveState(document.querySelectorAll(".menu-btn"), "active-menu", screenId);

  const status = document.getElementById("sync-status");
  if (status) {
    status.textContent = "agora";
  }
}

function changeTab(tabId) {
  const tabs = document.querySelectorAll(".tab-content");
  const targetTab = document.getElementById(`tab-${tabId}`);

  if (!targetTab) {
    return;
  }

  tabs.forEach((tab) => tab.classList.remove("active"));
  targetTab.classList.add("active");

  setActiveState(document.querySelectorAll(".tab-btn"), "active-tab", tabId);
}

function selectActivity(key) {
  const activity = activityMap[key];

  if (!activity) {
    return;
  }

  document.getElementById("act-user").textContent = activity.user;
  document.getElementById("act-action").textContent = activity.action;
  document.getElementById("act-time").textContent = activity.time;
  document.getElementById("act-ip").textContent = activity.ip;
  document.getElementById("act-before").textContent = activity.before;
  document.getElementById("act-after").textContent = activity.after;
}

document.addEventListener("click", (event) => {
  const screenButton = event.target.closest("[data-screen]");
  if (screenButton) {
    changeScreen(screenButton.dataset.screen);
    return;
  }

  const tabButton = event.target.closest("[data-tab]");
  if (tabButton) {
    changeTab(tabButton.dataset.tab);
    return;
  }

  const activityCard = event.target.closest("[data-activity]");
  if (activityCard) {
    selectActivity(activityCard.dataset.activity);
  }
});

window.addEventListener("DOMContentLoaded", () => {
  changeScreen("pacientes");
  changeTab("auditoria");
  selectActivity("ana");
});
