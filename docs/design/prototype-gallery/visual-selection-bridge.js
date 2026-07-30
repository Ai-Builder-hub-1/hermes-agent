(function visualSelectionBridge() {
  const config = window.HERMES_VISUAL_SELECTION_BRIDGE || {};
  const selector = "[data-review-id]";
  const storageKey = "hermes.visualSelectionBridge.lastSelection";
  let active = false;
  let hovered = null;
  let selected = null;
  let selectedReviewTarget = null;
  let selectedCandidate = null;
  let currentCandidates = [];

  const style = document.createElement("style");
  style.textContent = `
    .hvsb-trigger {
      position: fixed;
      right: 18px;
      bottom: 18px;
      z-index: 2147483000;
      border: 1px solid rgba(23, 29, 27, .16);
      border-radius: 999px;
      background: #171d1b;
      color: #fff;
      box-shadow: 0 18px 45px rgba(23, 29, 27, .18);
      cursor: pointer;
      font: 760 13px/1.1 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      padding: 11px 14px;
    }
    .hvsb-trigger[data-active="true"] {
      background: #1f7a59;
      box-shadow: 0 0 0 5px rgba(31, 122, 89, .14), 0 18px 45px rgba(23, 29, 27, .18);
    }
    .hvsb-outline {
      position: fixed;
      z-index: 2147482997;
      pointer-events: none;
      border: 2px solid #1f7a59;
      border-radius: 10px;
      box-shadow: 0 0 0 9999px rgba(23, 29, 27, .10), 0 0 0 5px rgba(31, 122, 89, .12);
      display: none;
    }
    .hvsb-tag {
      position: fixed;
      z-index: 2147482998;
      pointer-events: none;
      display: none;
      max-width: min(420px, calc(100vw - 24px));
      border-radius: 8px;
      background: #171d1b;
      color: #fff;
      box-shadow: 0 12px 30px rgba(23, 29, 27, .20);
      font: 700 12px/1.25 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      padding: 8px 10px;
    }
    .hvsb-tag span {
      color: rgba(255, 255, 255, .66);
      display: block;
      font-weight: 600;
      margin-top: 2px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .hvsb-panel {
      position: fixed;
      right: 18px;
      bottom: 68px;
      z-index: 2147482999;
      width: min(420px, calc(100vw - 28px));
      border: 1px solid rgba(23, 29, 27, .14);
      border-radius: 14px;
      background: rgba(255, 255, 255, .96);
      box-shadow: 0 24px 70px rgba(23, 29, 27, .22);
      color: #171d1b;
      display: none;
      overflow: hidden;
      backdrop-filter: blur(18px);
      font: 13px/1.35 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .hvsb-panel[data-open="true"] { display: block; }
    .hvsb-panel-header {
      align-items: start;
      background: #f7faf8;
      border-bottom: 1px solid rgba(23, 29, 27, .10);
      display: flex;
      gap: 12px;
      justify-content: space-between;
      padding: 13px 14px;
    }
    .hvsb-panel-title {
      font-weight: 800;
      margin: 0;
    }
    .hvsb-panel-subtitle {
      color: #66736f;
      font-size: 12px;
      margin-top: 3px;
      word-break: break-word;
    }
    .hvsb-close {
      border: 1px solid rgba(23, 29, 27, .12);
      border-radius: 8px;
      background: #fff;
      color: #66736f;
      cursor: pointer;
      font: inherit;
      padding: 5px 8px;
    }
    .hvsb-panel-body { display: grid; gap: 10px; padding: 14px; }
    .hvsb-label {
      color: #66736f;
      display: block;
      font-size: 11px;
      font-weight: 800;
      margin-bottom: 5px;
    }
    .hvsb-input {
      border: 1px solid rgba(23, 29, 27, .16);
      border-radius: 9px;
      color: #171d1b;
      font: 13px/1.35 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      min-height: 76px;
      padding: 9px 10px;
      resize: vertical;
      width: 100%;
    }
    .hvsb-output {
      background: #f4f6f4;
      border: 1px solid rgba(23, 29, 27, .10);
      border-radius: 9px;
      color: #28322f;
      font: 12px/1.45 "SF Mono", ui-monospace, Menlo, Monaco, Consolas, monospace;
      max-height: 154px;
      overflow: auto;
      padding: 10px;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .hvsb-candidates {
      display: grid;
      gap: 6px;
      max-height: 155px;
      overflow: auto;
    }
    .hvsb-candidate {
      align-items: center;
      background: #fff;
      border: 1px solid rgba(23, 29, 27, .12);
      border-radius: 9px;
      color: #171d1b;
      cursor: pointer;
      display: grid;
      gap: 2px;
      grid-template-columns: minmax(0, 1fr) auto;
      padding: 8px 9px;
      text-align: left;
      width: 100%;
    }
    .hvsb-candidate[data-selected="true"] {
      background: #e8f4ee;
      border-color: rgba(31, 122, 89, .34);
      color: #165c43;
    }
    .hvsb-candidate strong {
      display: block;
      font: 760 12px/1.25 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .hvsb-candidate span {
      color: #66736f;
      display: block;
      font-size: 11px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .hvsb-candidate em {
      color: #66736f;
      font-size: 11px;
      font-style: normal;
      justify-self: end;
    }
    .hvsb-actions { display: flex; flex-wrap: wrap; gap: 8px; }
    .hvsb-action {
      border: 1px solid rgba(23, 29, 27, .14);
      border-radius: 8px;
      background: #fff;
      color: #171d1b;
      cursor: pointer;
      font: 760 12px/1 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      padding: 9px 10px;
    }
    .hvsb-action.primary {
      background: #1f7a59;
      border-color: #1f7a59;
      color: #fff;
    }
    .hvsb-status {
      color: #66736f;
      font-size: 12px;
      min-height: 16px;
    }
    @media (max-width: 720px) {
      .hvsb-trigger { left: 14px; right: 14px; text-align: center; }
      .hvsb-panel { left: 14px; right: 14px; width: auto; }
    }
  `;
  document.head.appendChild(style);

  const trigger = document.createElement("button");
  trigger.className = "hvsb-trigger";
  trigger.type = "button";
  trigger.textContent = "Select UI";
  trigger.setAttribute("aria-pressed", "false");

  const outline = document.createElement("div");
  outline.className = "hvsb-outline";

  const tag = document.createElement("div");
  tag.className = "hvsb-tag";

  const panel = document.createElement("section");
  panel.className = "hvsb-panel";
  panel.setAttribute("aria-live", "polite");
  panel.innerHTML = `
    <div class="hvsb-panel-header">
      <div>
        <p class="hvsb-panel-title">Visual selection captured</p>
        <div class="hvsb-panel-subtitle" data-hvsb-subtitle>Select a dashboard region to create a paste-ready request.</div>
      </div>
      <button class="hvsb-close" type="button" data-hvsb-close>Close</button>
    </div>
    <div class="hvsb-panel-body">
      <label>
        <span class="hvsb-label">Change request</span>
        <textarea class="hvsb-input" data-hvsb-instruction placeholder="Describe what you want changed about this selected region."></textarea>
      </label>
      <div>
        <span class="hvsb-label">Selection hierarchy</span>
        <div class="hvsb-candidates" data-hvsb-candidates></div>
      </div>
      <div>
        <span class="hvsb-label">Paste this into Codex</span>
        <pre class="hvsb-output" data-hvsb-output></pre>
      </div>
      <div class="hvsb-actions">
        <button class="hvsb-action primary" type="button" data-hvsb-copy-request>Copy request</button>
        <button class="hvsb-action" type="button" data-hvsb-copy-json>Copy JSON</button>
        <button class="hvsb-action" type="button" data-hvsb-save>Save locally</button>
      </div>
      <div class="hvsb-status" data-hvsb-status></div>
    </div>
  `;

  document.body.append(outline, tag, panel, trigger);

  const subtitle = panel.querySelector("[data-hvsb-subtitle]");
  const instruction = panel.querySelector("[data-hvsb-instruction]");
  const output = panel.querySelector("[data-hvsb-output]");
  const status = panel.querySelector("[data-hvsb-status]");
  const candidatesList = panel.querySelector("[data-hvsb-candidates]");

  function isBridgeUi(element) {
    return Boolean(element?.closest?.(".hvsb-trigger, .hvsb-panel, .hvsb-tag, .hvsb-outline"));
  }

  function nearestReviewTarget(element) {
    if (!element || isBridgeUi(element)) return null;
    return element.closest(selector);
  }

  function selectableTarget(element) {
    if (!element || isBridgeUi(element)) return null;
    if (["HTML", "BODY"].includes(element.tagName)) return null;
    const candidates = inferCandidates(element);
    return candidates[0]?.element || nearestReviewTarget(element);
  }

  function labelFor(element) {
    return element?.dataset.reviewLabel || element?.getAttribute("aria-label") || element?.dataset.reviewId || "Selected region";
  }

  function textSnippet(element, maxLength = 80) {
    const text = (element?.innerText || element?.textContent || "").replace(/\s+/g, " ").trim();
    return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
  }

  function slugify(value) {
    return String(value || "item")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "item";
  }

  function closestText(element, selector, fallback = "") {
    const match = element?.closest?.(selector) || element?.querySelector?.(selector);
    return textSnippet(match, 54) || fallback;
  }

  function directText(element) {
    if (!element) return "";
    const direct = Array.from(element.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    return direct || textSnippet(element, 54);
  }

  function roleFor(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return null;
    const classList = element.classList;
    const tag = element.tagName.toLowerCase();
    if (classList.contains("label")) return { kind: "metric-label", title: "Metric label", scope: "text" };
    if (classList.contains("section-label")) return { kind: "section-label", title: "Section label", scope: "text" };
    if (classList.contains("badge")) return { kind: "badge", title: "Badge", scope: "status" };
    if (classList.contains("metric")) return { kind: "metric-card", title: "Metric card", scope: "component" };
    if (classList.contains("side-item")) return { kind: "sidebar-item", title: "Sidebar item", scope: "navigation" };
    if (classList.contains("action")) return { kind: "decision-item", title: "Decision item", scope: "component" };
    if (classList.contains("provider")) return { kind: "provider-lane", title: "Provider lane", scope: "component" };
    if (classList.contains("unit")) return { kind: "business-unit-card", title: "Business-unit card", scope: "component" };
    if (classList.contains("card")) return { kind: "card", title: "Card", scope: "container" };
    if (classList.contains("chart")) return { kind: "chart", title: "Chart area", scope: "visualization" };
    if (classList.contains("line")) return { kind: "chart-series", title: "Chart series", scope: "visualization" };
    if (classList.contains("meter")) return { kind: "meter", title: "Meter", scope: "visualization" };
    if (tag === "strong" || tag === "b") return { kind: "value", title: "Value", scope: "text" };
    if (tag === "p") return { kind: "helper-text", title: "Helper text", scope: "text" };
    if (tag === "h1" || tag === "h2" || tag === "h3") return { kind: "heading", title: "Heading", scope: "text" };
    if (tag === "button") return { kind: "button", title: "Button", scope: "control" };
    if (tag === "a") return { kind: "link", title: "Link", scope: "control" };
    if (tag === "tr") return { kind: "table-row", title: "Table row", scope: "table" };
    if (tag === "td" || tag === "th") return { kind: "table-cell", title: "Table cell", scope: "table" };
    if (tag === "li") return { kind: "list-item", title: "List item", scope: "list" };
    if (tag === "span" && textSnippet(element, 48)) return { kind: "inline-text", title: "Text", scope: "text" };
    return null;
  }

  function candidateLabel(element, role) {
    if (!element || !role) return "Selected element";
    if (role.kind === "metric-card") return closestText(element, ".label", "Metric card");
    if (role.kind === "metric-label") return directText(element);
    if (role.kind === "value") return directText(element);
    if (role.kind === "helper-text") return directText(element);
    if (role.kind === "sidebar-item") return directText(element);
    if (role.kind === "badge") return directText(element);
    if (role.kind === "decision-item") return closestText(element, "strong", "Decision item");
    if (role.kind === "provider-lane") return closestText(element, "strong", "Provider lane");
    if (role.kind === "business-unit-card") return closestText(element, "strong", "Business-unit card");
    if (role.kind === "card") return closestText(element, "h2", "Card");
    if (role.kind === "table-row") return directText(element);
    if (role.kind === "table-cell") return directText(element);
    if (role.kind === "chart-series") {
      if (element.classList.contains("media")) return "Media Engine series";
      if (element.classList.contains("hermes")) return "Nous Hermes Agent series";
      if (element.classList.contains("khashi")) return "Khashi VC series";
    }
    return directText(element) || role.title;
  }

  function inferCandidates(element) {
    if (!element || isBridgeUi(element)) return [];
    const reviewTarget = nearestReviewTarget(element);
    if (!reviewTarget) return [];
    const candidates = [];
    const seen = new Set();
    let current = element;
    while (current && current !== document.body) {
      if (isBridgeUi(current)) break;
      const role = roleFor(current);
      if (role) {
        const selectorPath = cssPathFor(current);
        const key = selectorPath || `${role.kind}:${candidates.length}`;
        if (!seen.has(key)) {
          const label = candidateLabel(current, role);
          candidates.push({
            element: current,
            reviewTarget,
            reviewId: reviewTarget.dataset.reviewId,
            role: role.kind,
            scope: role.scope,
            title: role.title,
            label,
            virtualId: `${reviewTarget.dataset.reviewId}.${role.kind}.${slugify(label)}`,
            selector: selectorPath,
          });
          seen.add(key);
        }
      }
      if (current === reviewTarget) break;
      current = current.parentElement;
    }
    if (!seen.has(`region:${reviewTarget.dataset.reviewId}`)) {
      candidates.push({
        element: reviewTarget,
        reviewTarget,
        reviewId: reviewTarget.dataset.reviewId,
        role: "review-region",
        scope: "region",
        title: "Parent region",
        label: labelFor(reviewTarget),
        virtualId: reviewTarget.dataset.reviewId,
        selector: cssPathFor(reviewTarget),
      });
    }
    return candidates;
  }

  function elementSummary(element) {
    if (!element) return "";
    const text = (element.innerText || element.textContent || "").replace(/\s+/g, " ").trim();
    const clippedText = text.length > 80 ? `${text.slice(0, 77)}...` : text;
    const className = typeof element.className === "string" && element.className.trim()
      ? `.${element.className.trim().split(/\s+/).slice(0, 3).join(".")}`
      : "";
    return `${element.tagName.toLowerCase()}${className}${clippedText ? ` · ${clippedText}` : ""}`;
  }

  function cssPathFor(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return "";
    const parts = [];
    let current = element;
    while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.body) {
      if (current.dataset?.reviewId) {
        parts.unshift(`[data-review-id="${current.dataset.reviewId}"]`);
        break;
      }
      const tag = current.tagName.toLowerCase();
      const parent = current.parentElement;
      if (!parent) {
        parts.unshift(tag);
        break;
      }
      const sameTagSiblings = Array.from(parent.children).filter((child) => child.tagName === current.tagName);
      const index = sameTagSiblings.indexOf(current) + 1;
      parts.unshift(sameTagSiblings.length > 1 ? `${tag}:nth-of-type(${index})` : tag);
      current = parent;
    }
    return parts.join(" > ");
  }

  function drawOverlay(element) {
    if (!active || !element) {
      outline.style.display = "none";
      tag.style.display = "none";
      return;
    }
    const rect = element.getBoundingClientRect();
    outline.style.display = "block";
    outline.style.left = `${Math.max(6, rect.left)}px`;
    outline.style.top = `${Math.max(6, rect.top)}px`;
    outline.style.width = `${Math.max(0, Math.min(rect.width, window.innerWidth - rect.left - 6))}px`;
    outline.style.height = `${Math.max(0, Math.min(rect.height, window.innerHeight - rect.top - 6))}px`;
    outline.style.borderRadius = getComputedStyle(element).borderRadius || "10px";

    const reviewTarget = nearestReviewTarget(element);
    const id = reviewTarget?.dataset.reviewId || "unmapped-element";
    const label = element !== reviewTarget ? elementSummary(element) : labelFor(reviewTarget || element);
    tag.innerHTML = `Smart target<span>${id} · ${label}</span>`;
    tag.style.display = "block";
    tag.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - 430))}px`;
    tag.style.top = `${Math.max(8, rect.top - tag.offsetHeight - 8)}px`;
  }

  function selectionPayload() {
    const reviewId = selectedCandidate?.reviewId || selectedReviewTarget?.dataset.reviewId || selected?.dataset.reviewId || "";
    const label = selectedCandidate?.label || (selectedReviewTarget ? labelFor(selectedReviewTarget) : selected ? labelFor(selected) : "");
    return {
      schemaVersion: 1,
      source: "visual-selection-bridge",
      project: config.projectId || "nous-hermes-agent",
      surface: config.surfaceId || document.title || "unknown-surface",
      file: config.file || "",
      reviewId,
      label,
      selectionMode: "smart",
      selectedRole: selectedCandidate?.role || "",
      selectedScope: selectedCandidate?.scope || "",
      virtualId: selectedCandidate?.virtualId || "",
      selectedElement: selectedCandidate ? `${selectedCandidate.title}: ${selectedCandidate.label}` : selected ? elementSummary(selected) : "",
      selectedElementSelector: selectedCandidate?.selector || (selected ? cssPathFor(selected) : ""),
      instruction: instruction.value.trim(),
      url: window.location.href,
      capturedAt: new Date().toISOString(),
    };
  }

  function requestText(payload) {
    const humanInstruction = payload.instruction || "Describe the desired change here.";
    const firstLine = payload.selectedElement
      ? `Change ${payload.virtualId || "the selected inner element"} inside ${payload.reviewId}.`
      : `Change ${payload.reviewId} (${payload.label}).`;
    const lines = [
      firstLine,
      "",
      humanInstruction,
      "",
      `Project: ${payload.project}`,
      `Surface: ${payload.surface}`,
      `File: ${payload.file}`,
      `Source: ${payload.source}`,
    ];
    if (payload.selectedElement) {
      lines.splice(
        4,
        0,
        `Selected element: ${payload.selectedElement}`,
        `Virtual ID: ${payload.virtualId}`,
        `Element selector: ${payload.selectedElementSelector}`,
      );
    }
    return lines.join("\n");
  }

  function renderSelection() {
    const payload = selectionPayload();
    subtitle.textContent = payload.reviewId
      ? `${payload.virtualId || payload.reviewId} · ${payload.selectedElement || payload.label}`
      : "Select a dashboard region to create a paste-ready request.";
    output.textContent = payload.reviewId ? requestText(payload) : "No selection yet. Turn on Select UI, then click a highlighted dashboard region.";
    status.textContent = "";
  }

  function setSelectedCandidate(candidate) {
    if (!candidate) return;
    selectedCandidate = candidate;
    selected = candidate.element;
    selectedReviewTarget = candidate.reviewTarget;
    drawOverlay(candidate.element);
    renderCandidateList();
    renderSelection();
  }

  function renderCandidateList() {
    candidatesList.innerHTML = "";
    if (!currentCandidates.length) {
      const empty = document.createElement("div");
      empty.className = "hvsb-status";
      empty.textContent = "No inferred selection hierarchy yet.";
      candidatesList.appendChild(empty);
      return;
    }
    currentCandidates.forEach((candidate, index) => {
      const button = document.createElement("button");
      button.className = "hvsb-candidate";
      button.type = "button";
      button.dataset.selected = String(candidate === selectedCandidate);
      button.innerHTML = `<strong>${candidate.title}: ${candidate.label}</strong><span>${candidate.virtualId}</span><em>${candidate.scope}</em>`;
      button.addEventListener("click", () => setSelectedCandidate(currentCandidates[index]));
      candidatesList.appendChild(button);
    });
  }

  async function copyText(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const temp = document.createElement("textarea");
    temp.value = text;
    temp.style.position = "fixed";
    temp.style.opacity = "0";
    document.body.appendChild(temp);
    temp.select();
    document.execCommand("copy");
    temp.remove();
  }

  function saveSelection() {
    const payload = selectionPayload();
    localStorage.setItem(storageKey, JSON.stringify(payload, null, 2));
    status.textContent = "Saved locally in this browser.";
  }

  function setActive(nextActive) {
    active = nextActive;
    trigger.dataset.active = String(active);
    trigger.setAttribute("aria-pressed", String(active));
    trigger.textContent = active ? "Selecting UI..." : "Select UI";
    if (!active) drawOverlay(null);
  }

  trigger.addEventListener("click", () => setActive(!active));

  panel.querySelector("[data-hvsb-close]").addEventListener("click", () => {
    panel.dataset.open = "false";
    setActive(false);
  });

  panel.querySelector("[data-hvsb-copy-request]").addEventListener("click", async () => {
    if (!selected) return;
    await copyText(requestText(selectionPayload()));
    status.textContent = "Copied. Paste it into Codex chat.";
  });

  panel.querySelector("[data-hvsb-copy-json]").addEventListener("click", async () => {
    if (!selected) return;
    await copyText(JSON.stringify(selectionPayload(), null, 2));
    status.textContent = "Copied JSON payload.";
  });

  panel.querySelector("[data-hvsb-save]").addEventListener("click", saveSelection);
  instruction.addEventListener("input", renderSelection);

  document.addEventListener("mousemove", (event) => {
    if (!active) return;
    hovered = selectableTarget(event.target);
    drawOverlay(hovered);
  }, true);

  document.addEventListener("click", (event) => {
    if (!active) return;
    const sourceElement = isBridgeUi(event.target) ? null : event.target;
    const reviewTarget = nearestReviewTarget(sourceElement);
    if (!reviewTarget) return;
    event.preventDefault();
    event.stopPropagation();
    currentCandidates = inferCandidates(sourceElement);
    const targetCandidate = currentCandidates[0];
    selected = targetCandidate.element;
    selectedReviewTarget = reviewTarget;
    selectedCandidate = targetCandidate;
    panel.dataset.open = "true";
    if (!instruction.value.trim()) {
      instruction.value = `Update ${targetCandidate.virtualId} so it better matches the intended dashboard experience.`;
    }
    renderCandidateList();
    renderSelection();
    drawOverlay(selected);
  }, true);

  window.addEventListener("scroll", () => drawOverlay(hovered || selected), true);
  window.addEventListener("resize", () => drawOverlay(hovered || selected));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setActive(false);
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "s") {
      event.preventDefault();
      setActive(!active);
    }
  });

  renderSelection();
})();
