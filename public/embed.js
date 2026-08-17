/* Goblin Labs persona embed — floating launcher.
 * Usage on any site:
 *   <script src="https://usegoblin.xyz/embed.js"
 *           data-persona="PERSONA_ID" data-label="Ask Mia" defer></script>
 * Optional: data-position="left" (default right), data-accent="#22a03a".
 */
(function () {
  var el =
    document.currentScript ||
    (function () {
      var s = document.getElementsByTagName("script");
      return s[s.length - 1];
    })();
  if (!el) return;

  var persona = el.getAttribute("data-persona");
  if (!persona) {
    console.error("[goblin embed] missing data-persona");
    return;
  }
  var label = el.getAttribute("data-label") || "Talk to us";
  var side = el.getAttribute("data-position") === "left" ? "left" : "right";
  var accent = el.getAttribute("data-accent") || "#22a03a";

  // Derive our origin from this script's own URL so it works on any host.
  var origin = "https://usegoblin.xyz";
  try {
    origin = new URL(el.src).origin;
  } catch (e) {}

  if (window.__goblinEmbedLoaded) return;
  window.__goblinEmbedLoaded = true;

  var open = false;
  var panel;

  function css(node, styles) {
    for (var k in styles) node.style[k] = styles[k];
  }

  // Launcher button
  var btn = document.createElement("button");
  btn.type = "button";
  btn.setAttribute("aria-label", label);
  btn.innerHTML =
    '<span style="display:inline-flex;width:8px;height:8px;border-radius:50%;background:#fff;box-shadow:0 0 8px #fff"></span>' +
    '<span style="font:600 14px/1 Inter,system-ui,sans-serif">' +
    label.replace(/</g, "&lt;") +
    "</span>";
  css(btn, {
    position: "fixed",
    bottom: "20px",
    zIndex: "2147483000",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 18px",
    border: "0",
    borderRadius: "999px",
    background: accent,
    color: "#fff",
    cursor: "pointer",
    boxShadow: "0 8px 30px rgba(0,0,0,.28)",
  });
  btn.style[side] = "20px";

  function buildPanel() {
    panel = document.createElement("div");
    var iframe = document.createElement("iframe");
    iframe.src = origin + "/embed/" + encodeURIComponent(persona);
    iframe.setAttribute("title", label);
    iframe.setAttribute("allow", "camera; microphone; autoplay");
    css(iframe, { width: "100%", height: "100%", border: "0" });
    css(panel, {
      position: "fixed",
      bottom: "84px",
      zIndex: "2147483000",
      width: "min(420px, calc(100vw - 40px))",
      height: "min(640px, calc(100vh - 120px))",
      borderRadius: "18px",
      overflow: "hidden",
      background: "#0d1512",
      boxShadow: "0 24px 70px rgba(0,0,0,.45)",
      display: "none",
    });
    panel.style[side] = "20px";
    panel.appendChild(iframe);
    document.body.appendChild(panel);
  }

  btn.addEventListener("click", function () {
    if (!panel) buildPanel();
    open = !open;
    panel.style.display = open ? "block" : "none";
  });

  document.body.appendChild(btn);
})();
