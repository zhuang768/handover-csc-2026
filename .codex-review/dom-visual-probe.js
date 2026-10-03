/*
 * Review-only, read-only DOM diagnostic. No dependencies or product imports.
 * Paste this function expression into tab.playwright.evaluate's function argument.
 * If that API accepts a source string, evaluate `(${source})(options)` where source
 * is this file's text and options is a literal such as { offset: 0, maxControls: 60 }.
 * It does not fetch, read storage/form values, change DOM/styles, scroll or focus.
 * Ratios and target sizes are diagnostic candidates, never a WCAG conformance claim.
 */
(function domVisualProbe(options = {}) {
  const LIMIT = Math.floor(Math.min(120, Math.max(1, Number(options && options.maxControls) || 60)));
  const OFFSET = Math.max(0, Math.floor(Number(options && options.offset) || 0));
  const SELECTOR = [
    "button", "input:not([type='hidden'])", "select", "textarea", "a[href]", "summary",
    "[role='button']", "[role='link']", "[role='checkbox']", "[role='radio']",
    "[role='switch']", "[role='tab']", "[role='combobox']", "[role='menuitem']",
    "[role='option']", "[role='slider']", "[role='spinbutton']", "[tabindex]",
  ].join(",");
  const width = document.documentElement.clientWidth;
  const height = document.documentElement.clientHeight;
  const styleCache = new Map();
  const styleOf = (element) => {
    if (!styleCache.has(element)) styleCache.set(element, getComputedStyle(element));
    return styleCache.get(element);
  };
  const rectOf = (r) => ({
    x: r.x, y: r.y, width: r.width, height: r.height,
    top: r.top, right: r.right, bottom: r.bottom, left: r.left,
  });
  const intersectsViewport = (r) => r.width > 0 && r.height > 0
    && r.right > 0 && r.bottom > 0 && r.left < width && r.top < height;
  const chainOf = (element) => {
    const chain = [];
    for (let node = element; node instanceof Element; node = node.parentElement) chain.push(node);
    return chain;
  };
  const visible = (element) => {
    if (!element || !element.getClientRects().length) return false;
    if (!intersectsViewport(element.getBoundingClientRect())) return false;
    return chainOf(element).every((node) => {
      const s = styleOf(node);
      return s.display !== "none" && s.visibility !== "hidden"
        && s.visibility !== "collapse" && Number(s.opacity) !== 0;
    });
  };
  const matches = (element, selector) => {
    try { return element.matches(selector); } catch { return false; }
  };
  const shortText = (value) => String(value || "")
    .replace(/https?:\/\/\S+/gi, "[URL]")
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[email]")
    .replace(/\b[A-Za-z0-9_-]{20,}\b/g, "[token]")
    .replace(/\s+/g, " ").trim().slice(0, 32);
  // Read only a few text nodes. Never inspect value/defaultValue or form contents.
  const shortNodeText = (node) => {
    let text = "";
    let visits = 0;
    const walk = (current) => {
      if (!current || ++visits > 40 || text.length > 80) return;
      if (current.nodeType === Node.TEXT_NODE) { text += ` ${current.nodeValue || ""}`; return; }
      if (!(current instanceof Element)) return;
      if (matches(current, "input,textarea,select,option,script,style,pre,code,[contenteditable]")) return;
      if (current.getAttribute("aria-hidden") === "true") return;
      for (const child of current.childNodes) walk(child);
    };
    walk(node);
    return shortText(text);
  };
  const labelOf = (element) => {
    const direct = shortText(element.getAttribute("aria-label"));
    if (direct) return direct;
    const ids = (element.getAttribute("aria-labelledby") || "").split(/\s+/).filter(Boolean).slice(0, 3);
    const named = shortText(ids.map((id) => shortNodeText(document.getElementById(id))).join(" "));
    if (named) return named;
    const labels = element.labels ? Array.from(element.labels) : [];
    const associated = shortText(labels.slice(0, 2).map(shortNodeText).join(" "));
    if (associated) return associated;
    if (!matches(element, "input,textarea,select")) return shortNodeText(element) || "[unlabelled control]";
    return "[no explicit label]";
  };
  const parseColor = (value) => {
    if (value === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
    const match = /^rgba?\(([^)]+)\)$/i.exec(value || "");
    if (!match) return null; // color(), lab(), gradients and named colors are not guessed.
    const parts = match[1].trim().replace(/[,/]/g, " ").split(/\s+/);
    if (parts.length !== 3 && parts.length !== 4) return null;
    const channel = (v) => v.endsWith("%") ? Number.parseFloat(v) * 2.55 : Number(v);
    const channels = parts.slice(0, 3).map(channel);
    const a = parts.length === 4
      ? (parts[3].endsWith("%") ? Number.parseFloat(parts[3]) / 100 : Number(parts[3])) : 1;
    if (channels.some((v) => !Number.isFinite(v) || v < 0 || v > 255)
      || !Number.isFinite(a) || a < 0 || a > 1) return null;
    return { r: channels[0], g: channels[1], b: channels[2], a };
  };
  const composite = (front, back) => ({
    r: front.r * front.a + back.r * (1 - front.a),
    g: front.g * front.a + back.g * (1 - front.a),
    b: front.b * front.a + back.b * (1 - front.a), a: 1,
  });
  const rgb = (c) => c ? { r: c.r, g: c.g, b: c.b, alpha: c.a } : null;
  const luminance = (c) => {
    const linear = (v) => { const s = v / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * linear(c.r) + 0.7152 * linear(c.g) + 0.0722 * linear(c.b);
  };
  const ratioOf = (a, b) => {
    const x = luminance(a), y = luminance(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };
  const backgroundOf = (element) => {
    const reasons = new Set();
    const layers = [];
    let opaqueIndex = -1;
    const chain = chainOf(element);
    for (const node of chain) {
      const s = styleOf(node);
      if (Number(s.opacity) !== 1) reasons.add("css-opacity-on-element-or-ancestor");
      if (s.mixBlendMode && s.mixBlendMode !== "normal") reasons.add("blend-mode");
      if (s.filter && s.filter !== "none") reasons.add("filter");
      const backdrop = s.backdropFilter || s.webkitBackdropFilter;
      if (backdrop && backdrop !== "none") reasons.add("backdrop-filter");
      const mask = s.maskImage || s.webkitMaskImage;
      if (mask && mask !== "none") reasons.add("mask");
      // An ancestor pseudo-element may overlay a child even if that child has opaque paint.
      for (const pseudo of ["::before", "::after"]) {
        const p = getComputedStyle(node, pseudo);
        if (!p.content || p.content === "none" || p.content === "normal") continue;
        const pc = parseColor(p.backgroundColor);
        if ((pc && pc.a > 0) || (p.backgroundImage && p.backgroundImage !== "none")) reasons.add("painted-pseudo-element");
      }
      if (opaqueIndex >= 0) continue; // Opaque paint hides further background layers, but not opacity/filter effects.
      if (s.backgroundImage && s.backgroundImage !== "none") reasons.add("gradient-or-background-image");
      const color = parseColor(s.backgroundColor);
      if (!color) { reasons.add("unsupported-background-color"); continue; }
      if (color.a > 0 && color.a < 1) reasons.add("translucent-background-paint");
      layers.push(color);
      if (color.a === 1) opaqueIndex = layers.length - 1;
    }
    let color = null;
    if (opaqueIndex < 0) reasons.add("unresolved-canvas-background-no-opaque-ancestor");
    else {
      color = layers[opaqueIndex];
      for (let i = opaqueIndex - 1; i >= 0; i--) color = composite(layers[i], color);
    }
    return { color, reasons: Array.from(reasons) };
  };
  const textContrastOf = (element, reportedInactive, hasText) => {
    const s = styleOf(element);
    const foreground = parseColor(s.color);
    const background = backgroundOf(element);
    const reasons = [...background.reasons];
    if (s.textShadow && s.textShadow !== "none") reasons.push("text-shadow");
    if ((s.backgroundClip || s.webkitBackgroundClip) === "text") reasons.push("background-clipped-to-text");
    if (hasText) {
      const descendants = Array.from(element.querySelectorAll("span,strong,em,b,i,small"));
      if (descendants.length > 40) reasons.push("text-descendant-scan-limited");
      for (const child of descendants.slice(0, 40)) {
        if (visible(child) && shortNodeText(child) && styleOf(child).color !== s.color) {
          reasons.push("mixed-descendant-text-colors"); break;
        }
      }
    }
    if (!foreground) reasons.push("unsupported-foreground-color");
    else if (foreground.a !== 1) reasons.push("foreground-alpha");
    const effectiveForeground = foreground && background.color ? composite(foreground, background.color) : null;
    const provisionalRatio = effectiveForeground && background.color ? ratioOf(effectiveForeground, background.color) : null;
    const reliableSolidPair = reasons.length === 0 && provisionalRatio !== null;
    const fontSize = Number.parseFloat(s.fontSize);
    const fontWeight = Number.parseFloat(s.fontWeight);
    const largeByCss = fontSize >= 24 || (fontSize >= 18.6666666667 && fontWeight >= 700);
    return {
      computedForeground: s.color,
      effectiveSolidBackground: rgb(background.color),
      effectiveForeground: rgb(effectiveForeground),
      ratio: reliableSolidPair ? provisionalRatio : null,
      provisionalRatio: reliableSolidPair ? null : provisionalRatio,
      largeTextByCssCandidate: largeByCss,
      normalTextRatioCandidate: reliableSolidPair && hasText && !reportedInactive ? provisionalRatio >= 4.5 : null,
      largeTextRatioCandidate: reliableSolidPair && hasText && !reportedInactive ? provisionalRatio >= 3 : null,
      evaluation: reportedInactive ? "reported-inactive-control-text-exempt-verify-disabled-behavior"
        : !hasText ? "no-control-text-use-label-or-nontext-audit"
          : reliableSolidPair ? "solid-color-ratio-candidate-not-conformance" : "manual-verification-required",
      manualVerificationReasons: reasons,
    };
  };
  const nativeToggle = (element) => element.tagName === "INPUT" && ["checkbox", "radio"].includes(element.type);
  const targetOf = (element) => {
    const candidates = [{ node: element, source: "control" }];
    if (nativeToggle(element) && element.labels) {
      for (const label of element.labels) candidates.push({ node: label, source: "associated-native-label" });
    }
    const areas = [];
    for (const candidate of candidates) {
      if (!visible(candidate.node)) continue;
      const boxes = Array.from(candidate.node.getClientRects()).filter(intersectsViewport);
      for (const box of boxes) areas.push({ ...candidate, box });
    }
    // Do not claim the union of separated inline-label fragments is one hit area.
    areas.sort((a, b) => b.box.width * b.box.height - a.box.width * a.box.height);
    const chosen = areas[0];
    if (!chosen) return null;
    const box = chosen.box;
    const activationHit = (x, y) => {
      if (x < 0 || y < 0 || x >= width || y >= height) return null;
      const hit = document.elementFromPoint(x, y);
      if (!hit) return false;
      if (element === hit || element.contains(hit)) return true;
      if (chosen.source !== "associated-native-label" || !chosen.node.contains(hit)) return false;
      // Links/buttons inside a label need not activate its checkbox.
      const nested = hit.closest("a[href],button,input,select,textarea,[role='button'],[role='link']");
      return !nested || nested === element || !chosen.node.contains(nested);
    };
    const insetX = Math.min(3, box.width / 4), insetY = Math.min(3, box.height / 4);
    const centerHit = activationHit(box.left + box.width / 2, box.top + box.height / 2);
    const cornerHits = [
      [box.left + insetX, box.top + insetY], [box.right - insetX, box.top + insetY],
      [box.left + insetX, box.bottom - insetY], [box.right - insetX, box.bottom - insetY],
    ].map(([x, y]) => activationHit(x, y));
    const dimensions44 = box.width >= 44 && box.height >= 44;
    return {
      source: chosen.source, rect: rectOf(box),
      labelFragmentCount: chosen.source === "associated-native-label" ? chosen.node.getClientRects().length : null,
      centerHit, cornerHits,
      fullyInsideViewport: box.left >= 0 && box.top >= 0 && box.right <= width && box.bottom <= height,
      project44DimensionsCandidate: dimensions44,
      manualHitVerification: centerHit !== true || cornerHits.some((hit) => hit !== true),
      caveat: "Geometry/hit-test only; handlers, disabled behavior, custom labels and target spacing require interaction checks.",
      textNode: chosen.node, // Internal only; removed before serialization.
    };
  };
  const describe = (element) => ({
    tag: element.tagName.toLowerCase(), role: element.getAttribute("role"),
    type: element.tagName === "INPUT" ? element.type : null, label: labelOf(element),
  });
  const fontOf = (element) => {
    const s = styleOf(element);
    return { family: s.fontFamily, size: s.fontSize, weight: s.fontWeight,
      lineHeight: s.lineHeight, variantNumeric: s.fontVariantNumeric };
  };
  const candidates = Array.from(document.querySelectorAll(SELECTOR));
  const measured = [];
  for (const element of candidates) {
    const internalTarget = targetOf(element);
    if (!internalTarget) continue;
    const { textNode, ...target } = internalTarget;
    const nativeDisabled = matches(element, ":disabled");
    const ariaDisabled = element.getAttribute("aria-disabled") === "true";
    const reportedInactive = nativeDisabled || ariaDisabled;
    const textInput = matches(element, "input,textarea,select") && !nativeToggle(element)
      && !["color", "range", "image", "file"].includes(element.type);
    const hasText = Boolean(shortNodeText(textNode)) || textInput;
    measured.push({
      ...describe(element), controlRect: rectOf(element.getBoundingClientRect()),
      nativeControlVisible: visible(element), target,
      disabled: { native: nativeDisabled, aria: ariaDisabled,
        pointerEvents: styleOf(element).pointerEvents, behaviorVerified: false },
      tabIndex: element.tabIndex, ariaBusy: element.getAttribute("aria-busy"),
      checked: nativeToggle(element) ? element.checked : element.getAttribute("aria-checked"),
      selected: element.getAttribute("aria-selected"), expanded: element.getAttribute("aria-expanded"),
      font: fontOf(textNode), contrast: textContrastOf(textNode, reportedInactive, hasText),
    });
  }
  const active = document.activeElement;
  let focus = { controlActive: false, caveat: "This snapshot never moves focus; inspect each keyboard destination separately." };
  if (active instanceof Element && active !== document.body && active !== document.documentElement) {
    const s = styleOf(active);
    const r = active.getBoundingClientRect();
    const outlineWidth = Number.parseFloat(s.outlineWidth) || 0;
    const outlineOffset = Number.parseFloat(s.outlineOffset) || 0;
    const reach = Math.max(0, outlineWidth + outlineOffset);
    const clipping = chainOf(active).slice(1).filter((node) => {
      const ps = styleOf(node), pr = node.getBoundingClientRect();
      const x = /(hidden|clip|auto|scroll)/.test(ps.overflowX) && (r.left - reach < pr.left || r.right + reach > pr.right);
      const y = /(hidden|clip|auto|scroll)/.test(ps.overflowY) && (r.top - reach < pr.top || r.bottom + reach > pr.bottom);
      return x || y;
    }).slice(0, 6).map((node) => ({ tag: node.tagName.toLowerCase(), rect: rectOf(node.getBoundingClientRect()),
      overflowX: styleOf(node).overflowX, overflowY: styleOf(node).overflowY }));
    focus = {
      ...describe(active), controlActive: true, inViewport: visible(active), matchesFocusVisible: matches(active, ":focus-visible"),
      rect: rectOf(r), outline: { color: s.outlineColor, style: s.outlineStyle, width: s.outlineWidth, offset: s.outlineOffset },
      boxShadow: s.boxShadow.slice(0, 180), border: { color: s.borderColor, style: s.borderStyle, width: s.borderWidth },
      markerStyleCandidate: outlineWidth > 0 && !["none", "hidden"].includes(s.outlineStyle) || s.boxShadow !== "none",
      possibleClippingAncestors: clipping, manualVerificationRequired: true,
      caveat: "A shadow/border may be decorative; visual focus contrast, occlusion and complete visibility are not proven.",
    };
  }
  const localOverflow = [];
  const allElements = Array.from(document.querySelectorAll("*"));
  for (const node of allElements.slice(0, 1200)) {
    if (!visible(node) || node === document.body || node === document.documentElement) continue;
    const s = styleOf(node);
    if (node.scrollWidth > node.clientWidth + 1 && ["auto", "scroll", "hidden", "clip"].includes(s.overflowX)) {
      localOverflow.push({ tag: node.tagName.toLowerCase(), role: node.getAttribute("role"),
        overflowX: s.overflowX, clientWidth: node.clientWidth, scrollWidth: node.scrollWidth,
        rect: rectOf(node.getBoundingClientRect()) });
      if (localOverflow.length >= 12) break;
    }
  }
  let fonts = { supported: false };
  if (document.fonts) {
    const faces = Array.from(document.fonts);
    const counts = {};
    for (const face of faces) counts[face.status] = (counts[face.status] || 0) + 1;
    fonts = {
      supported: true, status: document.fonts.status, count: faces.length, statusCounts: counts,
      faces: faces.slice(0, 16).map((face) => ({ family: face.family, style: face.style, weight: face.weight, status: face.status })),
      truncated: faces.length > 16,
      caveat: "CSS family and FontFaceSet status do not prove which glyph font was rendered; inspect rendered fonts/Network separately.",
    };
  }
  const samples = Array.from(document.querySelectorAll("body,h1,h2,main p,label"))
    .filter(visible).slice(0, 8).map((element) => ({ tag: element.tagName.toLowerCase(), font: fontOf(element) }));
  const scroller = document.scrollingElement || document.documentElement;
  return {
    probe: "handover-dom-visual-probe-v1", htmlLang: document.documentElement.lang,
    viewport: { width, height, innerWidth: window.innerWidth, innerHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      visualViewport: window.visualViewport ? { width: window.visualViewport.width,
        height: window.visualViewport.height, scale: window.visualViewport.scale,
        offsetTop: window.visualViewport.offsetTop, offsetLeft: window.visualViewport.offsetLeft } : null },
    scroll: { x: window.scrollX, y: window.scrollY, width: scroller.scrollWidth, height: scroller.scrollHeight,
      documentHorizontalOverflow: scroller.scrollWidth > width + 1,
      bodyScrollWidth: document.body ? document.body.scrollWidth : null,
      localOverflow, scanLimitedToFirstElements: Math.min(allElements.length, 1200) },
    controls: { candidateCount: candidates.length, viewportVisibleCount: measured.length,
      offset: OFFSET, limit: LIMIT, truncated: OFFSET > 0 || measured.length > OFFSET + LIMIT,
      summary: { below44Dimensions: measured.filter((c) => !c.target.project44DimensionsCandidate).length,
        manualHitVerification: measured.filter((c) => c.target.manualHitVerification).length,
        manualContrastVerification: measured.filter((c) => c.contrast.manualVerificationReasons.length).length },
      items: measured.slice(OFFSET, OFFSET + LIMIT) },
    fonts, typographySamples: samples, focus,
    limitations: [
      "Only this viewport and current state; no keyboard, hover, event, API, storage or accessibility-tree verification.",
      "Labels are shortened/redacted; no input/textarea values, complete handovers, URLs, user IDs or credentials are returned.",
      "Gradients/images, opacity, filters, pseudo paint and unresolved canvas require manual contrast verification.",
      "Ratios cover computed text color only; placeholders, SVG/icon/border/nontext contrast, CJK size equivalence and all focus states need separate checks.",
      "Native labels are valid default toggle targets; custom controls and nonrectangular/occluded hit areas need actual interaction checks.",
      "Disabled text is not labelled a WCAG failure; project 44px geometry remains reported even for inactive controls.",
      "No whole-page WCAG AA claim. Output may be paginated with offset/maxControls; unreported items are not passes.",
    ],
  };
})
