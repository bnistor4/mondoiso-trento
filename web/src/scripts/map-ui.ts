export interface MapUiHandlers {
  zoomIn: () => void;
  zoomOut: () => void;
  goHome: () => void;
  togglePhoto: () => void;
  toggleBorders: () => void;
  toggleTraffic: () => void;
  getPhotoOn: () => boolean;
  getBorders: () => boolean;
  getTraffic: () => boolean;
}

export interface CreditLine {
  html: string;
  title?: string;
}

export function initMapUi(handlers: MapUiHandlers, lines: CreditLine[]) {
  syncToggleUi(handlers);

  const pop = document.getElementById("credits-popover")!;
  const popBody = document.getElementById("credits-popover-body")!;
  popBody.innerHTML = lines
    .map((l) => `<p class="glass-credit-line"${l.title ? ` title="${l.title.replace(/"/g, "&quot;")}"` : ""}>${l.html}</p>`)
    .join("");

  const toast = document.getElementById("glass-toast")!;
  let toastT = 0;
  const showToast = (msg: string) => {
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(toastT);
    toastT = window.setTimeout(() => { toast.hidden = true; }, 2200);
  };

  const photoBtn = document.getElementById("ui-photo")!;
  const borderBtn = document.getElementById("ui-borders")!;
  const trafficBtn = document.getElementById("ui-traffic")!;

  const sync = () => syncToggleUi(handlers);

  document.getElementById("ui-zoom-in")!.addEventListener("click", () => handlers.zoomIn());
  document.getElementById("ui-zoom-out")!.addEventListener("click", () => handlers.zoomOut());
  document.getElementById("ui-home")!.addEventListener("click", () => handlers.goHome());
  photoBtn.addEventListener("click", () => { handlers.togglePhoto(); setTimeout(sync, 0); });
  borderBtn.addEventListener("click", () => { handlers.toggleBorders(); sync(); });
  trafficBtn.addEventListener("click", () => { handlers.toggleTraffic(); sync(); });
  document.getElementById("ui-share")!.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      showToast("Link copiato");
    } catch {
      showToast("Copia non riuscita");
    }
  });

  const fsBtn = document.getElementById("ui-fullscreen")!;
  if (!document.fullscreenEnabled) fsBtn.hidden = true;
  else {
    fsBtn.addEventListener("click", () => {
      if (document.fullscreenElement) void document.exitFullscreen();
      else void document.documentElement.requestFullscreen();
    });
  }

  const more = document.getElementById("more-menu")!;
  const moreBtn = document.getElementById("ui-more")!;
  const closeMore = () => { more.hidden = true; moreBtn.setAttribute("aria-expanded", "false"); };
  const fillMore = () => {
    more.innerHTML = "";
    for (const id of ["ui-home", "ui-borders", "ui-traffic", "ui-fullscreen"]) {
      const b = document.getElementById(id)!;
      if (b.hidden) continue;
      const item = document.createElement("button");
      item.type = "button";
      item.className = "glass-more-item";
      item.setAttribute("role", "menuitem");
      item.textContent = b.getAttribute("aria-label") ?? "";
      if (b.classList.contains("glass-btn-toggle")) {
        item.setAttribute("aria-pressed", b.getAttribute("aria-pressed") ?? "false");
      }
      item.addEventListener("click", () => {
        b.click();
        if (b.classList.contains("glass-btn-toggle")) {
          item.setAttribute("aria-pressed", b.getAttribute("aria-pressed") ?? "false");
        }
      });
      more.appendChild(item);
    }
  };
  moreBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!more.hidden) closeMore();
    else { fillMore(); more.hidden = false; moreBtn.setAttribute("aria-expanded", "true"); }
  });

  let creditsOpen = false;
  const infoBtn = document.getElementById("ui-info")!;
  const pillInfo = document.getElementById("credits-info")!;
  const openCredits = () => {
    creditsOpen = true;
    pop.hidden = false;
    pillInfo.setAttribute("aria-expanded", "true");
    infoBtn.setAttribute("aria-expanded", "true");
    pop.querySelector<HTMLElement>("a")?.focus();
  };
  const closeCredits = () => {
    creditsOpen = false;
    pop.hidden = true;
    pillInfo.setAttribute("aria-expanded", "false");
    infoBtn.setAttribute("aria-expanded", "false");
  };
  infoBtn.addEventListener("click", () => (creditsOpen ? closeCredits() : openCredits()));
  pillInfo.addEventListener("click", () => (creditsOpen ? closeCredits() : openCredits()));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (creditsOpen) { closeCredits(); return; }
      closeMore();
    }
    if (["p", "b", "t"].includes(e.key.toLowerCase())) setTimeout(sync, 0);
  });

  document.addEventListener("click", (e) => {
    const t = e.target as Node;
    if (creditsOpen && !pop.contains(t) && !pillInfo.contains(t) && !infoBtn.contains(t)) closeCredits();
    if (!more.hidden && !more.contains(t) && !moreBtn.contains(t)) closeMore();
  });

  return { syncToggleUi: sync, showToast };
}

export function syncToggleUi(h: MapUiHandlers) {
  const set = (id: string, on: boolean) => {
    const el = document.getElementById(id);
    if (el) el.setAttribute("aria-pressed", on ? "true" : "false");
  };
  set("ui-photo", h.getPhotoOn());
  set("ui-borders", h.getBorders());
  set("ui-traffic", h.getTraffic());
}