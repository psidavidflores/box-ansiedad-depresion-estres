(function () {
  "use strict";

  const app = document.getElementById("app");
  const toast = document.getElementById("toast");
  let library = null;
  let testGroups = [];
  let toastTimer = null;

  const categoryStyles = [
    { accent: "#67ddd4", icon: "◌" },
    { accent: "#c81787", icon: "♡" },
    { accent: "#f9c234", icon: "✦" },
    { accent: "#ef7439", icon: "✧" },
    { accent: "#4f8cff", icon: "◈" }
  ];
  const descriptions = {
    "Autoestima": "Guías y materiales para trabajar autoconcepto, valoración personal y fortalezas.",
    "Dependencia emocional": "Recursos de consulta y apoyo para comprender vínculos y autonomía emocional.",
    "Diccionarios": "Material de referencia para explorar emociones, actitudes, conductas y conceptos relacionados.",
    "Guía entrevista a adolescentes": "Apoyo estructurado para preparar entrevistas y explorar áreas relevantes.",
    "Guías de ayuda y actividades": "Fichas, cuadernillos y guías para abordar ansiedad, depresión, estrés y hábitos.",
    "Habilidades Sociales": "Recursos para acompañar habilidades emocionales, comunicación y relaciones interpersonales.",
    "Libros": "Biblioteca de consulta sobre ansiedad, autoestima, depresión, estrés y enfoques de intervención.",
    "Panico": "Material de apoyo para comprender el pánico, el miedo, las fobias y su abordaje.",
    "Técnicas de relajación": "Ejercicios y guías de respiración, relajación y regulación fisiológica.",
    "Test de detección": "Instrumentos, cuestionarios, manuales y hojas de corrección organizados por área.",
    "Tratamiento estrés postraumatico": "Material de consulta sobre estrés postraumático y recursos de acompañamiento."
  };

  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char];
    });
  }

  function formatBytes(bytes) {
    if (!bytes) return "0 KB";
    const units = ["B", "KB", "MB", "GB"];
    let value = bytes;
    let index = 0;
    while (value >= 1024 && index < units.length - 1) { value /= 1024; index += 1; }
    return (index === 0 ? Math.round(value) : value.toFixed(value >= 10 ? 0 : 1)) + " " + units[index];
  }

  function segmentPath(path) {
    return path.split("/").map(encodeURIComponent).join("/");
  }

  function resourceUrl(path) {
    return "recursos/" + segmentPath(path);
  }

  function previewUrl(resource) {
    if (resource.preview) return "previews/" + encodeURIComponent(resource.preview);
    if ([".jpg", ".jpeg", ".png"].includes(resource.extension)) return resourceUrl(resource.path);
    return "";
  }

  function currentRoute() {
    const hash = window.location.hash.replace(/^#/, "") || "catalogo";
    if (hash === "tests") return { type: "tests" };
    if (hash.startsWith("test/")) return { type: "testGroup", id: decodeURIComponent(hash.slice(5)) };
    if (hash.startsWith("categoria/")) return { type: "category", name: decodeURIComponent(hash.slice(10)) };
    return { type: "catalog" };
  }

  function styleFor(index) { return categoryStyles[index % categoryStyles.length]; }

  function categoryList() {
    return library.categories;
  }

  function renderShell(title, kicker, countText) {
    return '<p class="eyebrow">' + esc(kicker) + '</p>' +
      '<div class="page-heading"><h1>' + esc(title) + '</h1><p>' + esc(countText) + '</p></div>';
  }

  function renderCatalog() {
    const categories = categoryList();
    app.innerHTML = renderShell("Ansiedad, depresión y estrés", "BOX · BIBLIOTECA PROFESIONAL", library.totalFiles + " archivos organizados") +
      '<div class="toolbar"><label class="search-box"><span>⌕</span><input id="category-search" type="search" placeholder="Buscar temática…" aria-label="Buscar temática"></label><span class="count-pill">' + categories.length + " categorías disponibles</span></div>" +
      '<div id="category-grid" class="category-grid"></div>';
    const search = document.getElementById("category-search");
    const grid = document.getElementById("category-grid");
    function draw() {
      const query = search.value.trim().toLowerCase();
      const filtered = categories.filter(function (category) { return (category.name + " " + category.description).toLowerCase().includes(query); });
      grid.innerHTML = filtered.length ? filtered.map(renderCategoryCard).join("") : '<div class="empty-state"><strong>No encontramos esa temática</strong>Prueba con otra palabra.</div>';
    }
    search.addEventListener("input", draw);
    draw();
  }

  function renderCategoryCard(category) {
    const style = styleFor(category.index);
    return '<a class="category-card" style="--accent:' + style.accent + '" href="#categoria/' + encodeURIComponent(category.name) + '">' +
      '<div class="category-top"><span>' + esc(category.label) + '</span><span>' + category.count + ' archivos</span></div>' +
      '<div class="category-icon" aria-hidden="true">' + style.icon + '</div>' +
      '<h2>' + esc(category.name) + '</h2><p>' + esc(category.description) + '</p>' +
      '<div class="category-action"><span>Explorar recursos →</span><span aria-hidden="true">+</span></div></a>';
  }

  function renderCategory(category) {
    const style = styleFor(category.index);
    app.innerHTML = '<a class="back-link" href="#catalogo">← Volver al catálogo</a>' +
      '<div class="category-summary"><div><p class="eyebrow">' + esc(category.label) + '</p><h1>' + esc(category.name) + '</h1></div><p>' + category.count + ' archivos</p></div>' +
      '<div class="toolbar"><label class="search-box"><span>⌕</span><input id="resource-search" type="search" placeholder="Buscar en esta sección…" aria-label="Buscar en esta sección"></label><button id="download-section" class="download-section" style="--accent:' + style.accent + '">⇩ Descargar sección</button></div>' +
      '<div id="resource-grid" class="resource-grid"></div>';
    const search = document.getElementById("resource-search");
    const grid = document.getElementById("resource-grid");
    const draw = function () {
      const query = search.value.trim().toLowerCase();
      const filtered = category.resources.filter(function (resource) { return resource.name.toLowerCase().includes(query); });
      grid.innerHTML = filtered.length ? filtered.map(function (resource) { return renderResource(resource, style); }).join("") : '<div class="empty-state"><strong>No encontramos ese archivo</strong>Prueba con otra palabra.</div>';
    };
    search.addEventListener("input", draw);
    document.getElementById("download-section").addEventListener("click", function () { downloadSection(category); });
    draw();
  }

  function testCategory() {
    return library.categories.find(function (item) { return item.name === "Test de detección"; });
  }

  function groupFileTypes(resources) {
    const types = [];
    resources.forEach(function (resource) {
      if (!types.includes(resource.type)) types.push(resource.type);
    });
    return types.slice(0, 5).map(function (type) { return '<span class="format-pill">' + esc(type) + '</span>'; }).join("");
  }

  function renderTestGroupCard(group) {
    const style = styleFor(group.index);
    return '<a class="category-card test-group-card" style="--accent:' + style.accent + '" href="#test/' + encodeURIComponent(group.id) + '">' +
      '<div class="category-top"><span>TEST</span><span>' + group.resources.length + ' archivos</span></div>' +
      '<div class="category-icon" aria-hidden="true">' + style.icon + '</div>' +
      '<h2>' + esc(group.name) + '</h2><p>' + esc(group.description) + '</p>' +
      '<div class="group-formats">' + groupFileTypes(group.resources) + '</div>' +
      '<div class="category-action"><span>Ver materiales →</span><span aria-hidden="true">+</span></div></a>';
  }

  function renderTestGroups(category) {
    app.innerHTML = '<a class="back-link" href="#catalogo">← Volver al catálogo</a>' +
      '<div class="category-summary"><div><p class="eyebrow">' + esc(category.label) + '</p><h1>Tests de detección</h1></div><p>' + testGroups.length + ' tests · ' + category.count + ' archivos</p></div>' +
      '<div class="toolbar"><label class="search-box"><span>⌕</span><input id="test-search" type="search" placeholder="Buscar test…" aria-label="Buscar test"></label><button id="download-tests" class="download-section" style="--accent:' + styleFor(category.index).accent + '">⇩ Descargar todos los tests</button></div>' +
      '<div id="test-grid" class="category-grid"></div>';
    const search = document.getElementById("test-search");
    const grid = document.getElementById("test-grid");
    function draw() {
      const query = search.value.trim().toLowerCase();
      const filtered = testGroups.filter(function (group) {
        const files = group.resources.map(function (resource) { return resource.name; }).join(" ");
        return (group.name + " " + group.description + " " + files).toLowerCase().includes(query);
      });
      grid.innerHTML = filtered.length ? filtered.map(renderTestGroupCard).join("") : '<div class="empty-state"><strong>No encontramos ese test</strong>Prueba con otra palabra.</div>';
    }
    search.addEventListener("input", draw);
    document.getElementById("download-tests").addEventListener("click", function () { downloadSection(category); });
    draw();
  }

  function renderTestGroup(group) {
    const category = testCategory();
    const style = styleFor(group.index);
    app.innerHTML = '<a class="back-link" href="#tests">← Volver a tests</a>' +
      '<div class="category-summary"><div><p class="eyebrow">TEST DE DETECCIÓN</p><h1>' + esc(group.name) + '</h1></div><p>' + group.resources.length + ' archivos</p></div>' +
      '<p class="group-description">' + esc(group.description) + '</p>' +
      '<div class="toolbar"><label class="search-box"><span>⌕</span><input id="resource-search" type="search" placeholder="Buscar en este test…" aria-label="Buscar en este test"></label><button id="download-section" class="download-section" style="--accent:' + style.accent + '">⇩ Descargar test completo</button></div>' +
      '<div id="resource-grid" class="resource-grid"></div>';
    const search = document.getElementById("resource-search");
    const grid = document.getElementById("resource-grid");
    const draw = function () {
      const query = search.value.trim().toLowerCase();
      const filtered = group.resources.filter(function (resource) { return resource.name.toLowerCase().includes(query); });
      grid.innerHTML = filtered.length ? filtered.map(function (resource) { return renderResource(resource, style); }).join("") : '<div class="empty-state"><strong>No encontramos ese archivo</strong>Prueba con otra palabra.</div>';
    };
    search.addEventListener("input", draw);
    document.getElementById("download-section").addEventListener("click", function () { downloadSection({ name: group.name, count: group.resources.length, resources: group.resources }); });
    draw();
  }

  function renderResource(resource, style) {
    const preview = previewUrl(resource);
    const media = preview ? '<img loading="lazy" src="' + preview + '" alt="Vista previa de ' + esc(resource.name) + '">' : '<span class="resource-type" style="--accent:' + style.accent + '">' + esc(resource.type) + '</span>';
    return '<article class="resource-card"><div class="resource-preview" style="--preview:' + style.accent + '">' + media + '</div><div class="resource-body"><h3>' + esc(resource.name) + '</h3><p class="resource-meta">' + esc(resource.type) + ' · ' + formatBytes(resource.sizeBytes) + '</p><a class="download-button" download href="' + resourceUrl(resource.path) + '">⇩ Descargar</a></div></article>';
  }

  function renderTests() {
    const category = testCategory();
    if (category) renderTestGroups(category);
  }

  function updateNav(route) {
    const isTests = route.type === "tests" || route.type === "testGroup";
    document.querySelectorAll("[data-nav]").forEach(function (link) {
      link.classList.toggle("is-active", (isTests && link.dataset.nav === "tests") || (!isTests && link.dataset.nav === "catalogo"));
    });
  }

  function render() {
    if (!library) return;
    const route = currentRoute();
    window.scrollTo(0, 0);
    setTimeout(function () { window.scrollTo(0, 0); }, 0);
    updateNav(route);
    if (route.type === "tests") return renderTests();
    if (route.type === "testGroup") {
      const group = testGroups.find(function (item) { return item.id === route.id; });
      return group ? renderTestGroup(group) : renderTests();
    }
    if (route.type === "category") {
      const category = library.categories.find(function (item) { return item.name === route.name; });
      if (!category) return renderCatalog();
      return category.name === "Test de detección" && testGroups.length ? renderTestGroups(category) : renderCategory(category);
    }
    renderCatalog();
  }

  function notify(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("is-visible"); }, 4800);
  }

  function crc32(bytes) {
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i += 1) {
      crc ^= bytes[i];
      for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function u16(value) { return [value & 255, (value >>> 8) & 255]; }
  function u32(value) { return [value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255]; }
  function concat(chunks) { const total = chunks.reduce(function (sum, chunk) { return sum + chunk.length; }, 0); const output = new Uint8Array(total); let offset = 0; chunks.forEach(function (chunk) { output.set(chunk, offset); offset += chunk.length; }); return output; }

  async function downloadSection(category) {
    const estimatedMb = category.resources.reduce(function (sum, resource) { return sum + resource.sizeBytes; }, 0) / 1024 / 1024;
    if (estimatedMb > 320) return notify("Esta sección pesa aproximadamente " + Math.round(estimatedMb) + " MB. Para evitar errores de memoria, descarga los archivos individualmente o por subcarpetas.");
    notify("Preparando la descarga de " + category.count + " archivos…");
    try {
      const encoder = new TextEncoder();
      const localFiles = [];
      for (const resource of category.resources) {
        const response = await fetch(resourceUrl(resource.path));
        if (!response.ok) throw new Error(resource.name);
        localFiles.push({ resource: resource, data: new Uint8Array(await response.arrayBuffer()) });
      }
      const chunks = [];
      const entries = [];
      let offset = 0;
      localFiles.forEach(function (file) {
        const name = encoder.encode(file.resource.path.replace(/[\\:*?"<>|]/g, "-") );
        const header = new Uint8Array([0x50,0x4b,0x03,0x04, ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(crc32(file.data)), ...u32(file.data.length), ...u32(file.data.length), ...u16(name.length), ...u16(0)]);
        chunks.push(header, name, file.data);
        entries.push({ name: name, crc: crc32(file.data), size: file.data.length, offset: offset });
        offset += header.length + name.length + file.data.length;
      });
      const centralStart = offset;
      entries.forEach(function (entry) {
        const central = new Uint8Array([0x50,0x4b,0x01,0x02, ...u16(20), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(entry.crc), ...u32(entry.size), ...u32(entry.size), ...u16(entry.name.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(entry.offset)]);
        chunks.push(central, entry.name);
        offset += central.length + entry.name.length;
      });
      const centralSize = offset - centralStart;
      chunks.push(new Uint8Array([0x50,0x4b,0x05,0x06, ...u16(0), ...u16(0), ...u16(entries.length), ...u16(entries.length), ...u32(centralSize), ...u32(centralStart), ...u16(0)]));
      const blob = new Blob([concat(chunks)], { type: "application/zip" });
      const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = category.name.toLowerCase().replace(/[^a-z0-9]+/gi, "-") + ".zip"; link.click();
      setTimeout(function () { URL.revokeObjectURL(link.href); }, 1500);
      notify("Descarga preparada correctamente.");
    } catch (error) {
      notify("No se pudo preparar la sección completa. Usa las descargas individuales.");
    }
  }

  window.addEventListener("hashchange", render);
  Promise.all([
    fetch("resources.json").then(function (response) { if (!response.ok) throw new Error("resources"); return response.json(); }),
    fetch("test-groups.json").then(function (response) { if (!response.ok) throw new Error("test-groups"); return response.json(); })
  ]).then(function (results) {
    const data = results[0];
    const groupsData = results[1];
    const category = data.categories.find(function (item) { return item.name === groupsData.category; });
    const resources = category ? category.resources : [];
    testGroups = groupsData.groups.map(function (group, index) {
      const matches = resources.filter(function (resource) {
        return group.pathPrefixes.some(function (prefix) { return resource.path.startsWith(prefix); });
      });
      return Object.assign({}, group, { index: index, resources: matches });
    }).filter(function (group) { return group.resources.length; });
    library = data;
    document.getElementById("side-total").textContent = data.totalFiles + " archivos disponibles.";
    render();
  }).catch(function () { app.innerHTML = '<div class="empty-state"><strong>No se pudo cargar la biblioteca</strong>Revisa que el archivo resources.json esté publicado junto a esta página.</div>'; });
}());
