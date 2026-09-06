/* LR Sonorização — interações do site.
   Configuração: WHATSAPP_NUMBER no formato internacional, só dígitos.
   CITIES: área de atendimento. Edite só este array para incluir ou remover
   cidades. Qualquer localidade fora da lista é considerada não atendida. */
const WHATSAPP_NUMBER = "5511915200199";

const CITIES = [
  { name: "Águas de Lindóia", uf: "SP", served: true },
  { name: "Amparo", uf: "SP", served: true },
  { name: "Andradas", uf: "SP", served: true },
  { name: "Artur Nogueira", uf: "SP", served: true },
  { name: "Campinas", uf: "SP", served: true },
  { name: "Conchal", uf: "SP", served: true },
  { name: "Espírito Santo do Pinhal", uf: "SP", served: true },
  { name: "Estiva Gerbi", uf: "SP", served: true },
  { name: "Holambra", uf: "SP", served: true },
  { name: "Itapira", uf: "SP", served: true },
  { name: "Jaguariúna", uf: "SP", served: true },
  { name: "Limeira", uf: "SP", served: true },
  { name: "Lindóia", uf: "SP", served: true },
  { name: "Mogi Guaçu", uf: "SP", served: true },
  { name: "Mogi Mirim", uf: "SP", served: true },
  { name: "Pedreira", uf: "SP", served: true },
  { name: "Santo Antônio de Posse", uf: "SP", served: true },
  { name: "Serra Negra", uf: "SP", served: true },
];

const DEFAULT_MESSAGE =
  "Olá! Quero solicitar um orçamento para um evento com a LR Sonorização.\n\n" +
  "Tipo de evento: \n" +
  "Data: \n" +
  "Local: \n" +
  "Público estimado: \n\n" +
  "Gostaria de saber as opções de sonorização.";

const DRAFT_KEY = "lr-orcamento-rascunho";

function whatsappUrl(message) {
  const text = encodeURIComponent(message || "");
  return `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${text}`;
}

/* Abre o WhatsApp em nova aba; se o navegador bloquear o popup, navega na
   própria aba para o usuário não ficar sem resposta. */
function openWhatsApp(message) {
  const url = whatsappUrl(message);
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) window.location.href = url;
}

function initWhatsAppLinks() {
  const url = whatsappUrl(DEFAULT_MESSAGE);
  document
    .querySelectorAll("#whatsappButton, #whatsappFloat")
    .forEach((link) => link.setAttribute("href", url));
}

function initNav() {
  const header = document.getElementById("siteHeader");
  const toggle = document.getElementById("navToggle");
  const panel = document.getElementById("navLinks");
  if (!header || !toggle || !panel) return;

  const setOpen = (open) => {
    header.classList.toggle("nav-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute(
      "aria-label",
      open ? "Fechar menu de navegação" : "Abrir menu de navegação"
    );
  };

  toggle.addEventListener("click", () => {
    setOpen(!header.classList.contains("nav-open"));
  });

  panel.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !header.classList.contains("nav-open")) return;
    setOpen(false);
    toggle.focus();
  });

  document.addEventListener("click", (event) => {
    if (!header.classList.contains("nav-open")) return;
    if (!header.contains(event.target)) setOpen(false);
  });

  // Ao voltar para o layout de desktop o painel deixa de existir: limpa o estado.
  const desktop = window.matchMedia("(min-width: 1200px)");
  const onBreakpoint = (event) => {
    if (event.matches) setOpen(false);
  };

  if (typeof desktop.addEventListener === "function") {
    desktop.addEventListener("change", onBreakpoint);
  } else if (typeof desktop.addListener === "function") {
    desktop.addListener(onBreakpoint);
  }
}

/* Marca o link da seção visível e liga a sombra do header depois do primeiro
   scroll. Tudo agrupado em um único listener com requestAnimationFrame. */
function initScrollState() {
  const header = document.getElementById("siteHeader");
  const backToTop = document.getElementById("backToTop");
  const links = Array.from(
    document.querySelectorAll('.nav-links a[href^="#"]')
  );

  const targets = links
    .map((link) => ({ link, section: document.querySelector(link.hash) }))
    .filter((item) => item.section);

  const update = () => {
    const offset = (header ? header.offsetHeight : 0) + 12;

    if (header) {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    }

    if (backToTop) {
      backToTop.classList.toggle("is-visible", window.scrollY > 700);
    }

    let current = null;
    targets.forEach((item) => {
      if (item.section.getBoundingClientRect().top <= offset) current = item;
    });

    targets.forEach((item) => {
      if (item === current) item.link.setAttribute("aria-current", "true");
      else item.link.removeAttribute("aria-current");
    });
  };

  let queued = false;
  const onScroll = () => {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(() => {
      queued = false;
      update();
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  update();
}

function initBackToTop() {
  const button = document.getElementById("backToTop");
  if (!button) return;

  button.addEventListener("click", () => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    const brand = document.querySelector(".brand");
    if (brand) brand.focus({ preventScroll: true });
  });
}

function formatDate(value) {
  // input[type=date] entrega "AAAA-MM-DD"; mostramos no formato brasileiro.
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}

function normalizeCity(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function findCity(value) {
  const key = normalizeCity(value);
  if (!key) return null;
  return CITIES.find((city) => normalizeCity(city.name) === key) || null;
}

function filterCities(value) {
  const key = normalizeCity(value);
  if (!key) return [];
  return CITIES.filter((city) => normalizeCity(city.name).includes(key));
}

function whatsappDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

/* Aceita 10 ou 11 dígitos nacionais. Se a pessoa colar +55, o DDI sai. */
function nationalWhatsAppDigits(value) {
  let digits = whatsappDigits(value);
  if (digits.startsWith("55") && digits.length >= 12) {
    digits = digits.slice(2);
  }
  return digits.slice(0, 11);
}

function formatWhatsApp(value) {
  const digits = nationalWhatsAppDigits(value);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function isValidWhatsApp(value) {
  const length = nationalWhatsAppDigits(value).length;
  return length === 10 || length === 11;
}

function initLightingQuoteHint() {
  const cta = document.querySelector('[data-quote-topic="iluminacao"]');
  const form = document.getElementById("quoteForm");
  if (!cta || !form) return;

  cta.addEventListener("click", () => {
    const mensagem = form.elements.mensagem;
    if (mensagem && !mensagem.value.trim()) {
      mensagem.value = "Gostaria de incluir iluminação no orçamento.";
      form.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });
}

function initQuoteForm() {
  const form = document.getElementById("quoteForm");
  if (!form) return;

  const status = document.getElementById("formStatus");
  const SUCCESS_MESSAGE =
    "Seu briefing acabou de ser enviado. Entraremos em contato em até 48 horas.\nObrigado pela preferência!";

  const setFormStatus = (text, isSuccess) => {
    if (!status) return;
    status.classList.toggle("is-success", Boolean(isSuccess));
    status.textContent = text || "";
  };
  const fields = {
    nome: form.elements.nome,
    tipo: form.elements.tipo,
    data: form.elements.data,
    dataIndefinida: form.elements.dataIndefinida,
    cidade: form.elements.cidade,
    local: form.elements.local,
    endereco: form.elements.endereco,
    publico: form.elements.publico,
    telefone: form.elements.telefone,
    mensagem: form.elements.mensagem,
    tecnicoPA: form.elements.tecnicoPA,
  };

  const listbox = document.getElementById("cidade-listbox");
  const cityToggle = document.getElementById("cidadeToggle");
  const cityCombo = fields.cidade ? fields.cidade.closest(".city-combo") : null;
  let selectedCity = findCity(fields.cidade ? fields.cidade.value : "");
  let activeIndex = -1;
  let currentMatches = [];

  const required = [
    { input: fields.nome, message: "Informe seu nome." },
    { input: fields.tipo, message: "Escolha o tipo de evento." },
    { input: fields.telefone, message: "Informe seu WhatsApp." },
  ];

  const cityMessage = "Infelizmente não atendemos sua localidade.";

  const showError = (input, message) => {
    if (!input) return;
    const wrapper = input.closest(".field-confirm") || input.closest(".field");
    if (wrapper) wrapper.classList.toggle("has-error", Boolean(message));

    const slot = document.getElementById(`err-${input.id}`);
    if (slot) slot.textContent = message || "";

    input.setAttribute("aria-invalid", message ? "true" : "false");
  };

  const syncDateState = () => {
    if (!fields.data || !fields.dataIndefinida) return;
    const undefinedDate = fields.dataIndefinida.checked;
    fields.data.disabled = undefinedDate;
    if (undefinedDate) fields.data.value = "";
  };

  const servedCities = () => CITIES.filter((city) => city.served);

  const setCityListOpen = (open) => {
    if (fields.cidade) fields.cidade.setAttribute("aria-expanded", String(open));
    if (cityToggle) cityToggle.setAttribute("aria-expanded", String(open));
    if (cityCombo) cityCombo.classList.toggle("is-open", open);
  };

  const closeCityList = () => {
    if (!listbox || !fields.cidade) return;
    listbox.classList.remove("is-open");
    listbox.hidden = true;
    listbox.innerHTML = "";
    currentMatches = [];
    setCityListOpen(false);
    activeIndex = -1;
  };

  const selectCity = (city) => {
    selectedCity = city;
    if (fields.cidade) fields.cidade.value = city.name;
    showError(fields.cidade, city.served ? "" : cityMessage);
    closeCityList();
  };

  const renderCityList = (matches) => {
    if (!listbox || !fields.cidade) return;

    currentMatches = matches;
    listbox.innerHTML = "";
    if (!matches.length) {
      closeCityList();
      return;
    }

    matches.forEach((city, index) => {
      const item = document.createElement("li");
      item.setAttribute("role", "option");
      item.id = `cidade-opt-${index}`;
      item.textContent = `${city.name} — ${city.uf}`;
      item.addEventListener("mousedown", (event) => {
        event.preventDefault();
        selectCity(city);
      });
      listbox.appendChild(item);
    });

    listbox.removeAttribute("hidden");
    listbox.classList.add("is-open");
    setCityListOpen(true);
    activeIndex = -1;
  };

  const setActiveOption = (index) => {
    if (!listbox) return;
    const items = Array.from(listbox.children);
    items.forEach((item, i) => item.classList.toggle("is-active", i === index));
    activeIndex = index;
    if (items[index]) fields.cidade.setAttribute("aria-activedescendant", items[index].id);
    else fields.cidade.removeAttribute("aria-activedescendant");
  };

  const validateCity = () => {
    if (!fields.cidade) return "";
    const typed = fields.cidade.value.trim();
    if (!typed) {
      selectedCity = null;
      return "";
    }

    const match = selectedCity && normalizeCity(selectedCity.name) === normalizeCity(typed)
      ? selectedCity
      : findCity(typed);

    selectedCity = match;
    if (!match || !match.served) return cityMessage;
    return "";
  };

  const validate = () => {
    let firstInvalid = null;

    required.forEach(({ input, message }) => {
      if (input === fields.telefone) return;
      const empty = !input.value.trim();
      showError(input, empty ? message : "");
      if (empty && !firstInvalid) firstInvalid = input;
    });

    if (fields.telefone) {
      const digits = nationalWhatsAppDigits(fields.telefone.value);
      const phoneError = !digits
        ? "Informe seu WhatsApp."
        : isValidWhatsApp(fields.telefone.value)
          ? ""
          : "Informe um WhatsApp válido, com DDD.";
      showError(fields.telefone, phoneError);
      if (phoneError && !firstInvalid) firstInvalid = fields.telefone;
    }

    const cityError = validateCity();
    showError(fields.cidade, cityError);
    if (cityError && !firstInvalid) firstInvalid = fields.cidade;

    if (fields.tecnicoPA) {
      const confirmed = fields.tecnicoPA.checked;
      showError(
        fields.tecnicoPA,
        confirmed ? "" : "Marque a caixa de autorização do técnico de PA para enviar o briefing."
      );
      if (!confirmed && !firstInvalid) firstInvalid = fields.tecnicoPA;
    }

    return firstInvalid;
  };

  required.forEach(({ input }) => {
    input.addEventListener("input", () => {
      if (input.value.trim()) showError(input, "");
    });
    input.addEventListener("change", () => {
      if (input.value.trim()) showError(input, "");
    });
  });

  if (fields.dataIndefinida) {
    fields.dataIndefinida.addEventListener("change", syncDateState);
  }

  if (fields.tecnicoPA) {
    fields.tecnicoPA.addEventListener("change", () => {
      if (fields.tecnicoPA.checked) {
        showError(fields.tecnicoPA, "");
        setFormStatus("");
      }
    });
  }

  if (fields.telefone) {
    fields.telefone.addEventListener("beforeinput", (event) => {
      if (event.inputType && event.inputType.includes("Paste")) return;
      if (event.data && /\D/.test(event.data)) event.preventDefault();
    });
    fields.telefone.addEventListener("input", () => {
      fields.telefone.value = formatWhatsApp(fields.telefone.value);
      if (isValidWhatsApp(fields.telefone.value)) showError(fields.telefone, "");
    });
  }

  const hideHintOnFocus = (input, hint) => {
    if (!input) return;
    input.addEventListener("focus", () => {
      input.placeholder = "";
    });
    input.addEventListener("blur", () => {
      if (!input.value.trim()) input.placeholder = hint;
    });
  };

  hideHintOnFocus(fields.telefone, "(xx) xxxxx-xxxx");

  hideHintOnFocus(
    fields.local,
    "Salão, Clube, espaço aberto, chácara, outros"
  );

  if (fields.mensagem) {
    hideHintOnFocus(
      fields.mensagem,
      "Conte como você imaginou o seu evento.\nPode escrever o que vier à sua mente, qualquer ideia."
    );
  }

  if (fields.cidade) {
    fields.cidade.addEventListener("input", () => {
      selectedCity = findCity(fields.cidade.value);
      showError(fields.cidade, "");
      renderCityList(filterCities(fields.cidade.value));
    });

    fields.cidade.addEventListener("focus", () => {
      const typed = fields.cidade.value.trim();
      if (typed) renderCityList(filterCities(typed));
    });

    fields.cidade.addEventListener("blur", () => {
      window.setTimeout(() => {
        closeCityList();
        const cityError = validateCity();
        if (fields.cidade.value.trim()) showError(fields.cidade, cityError);
      }, 120);
    });

    if (cityToggle) {
      cityToggle.addEventListener("mousedown", (event) => {
        event.preventDefault();
      });
      cityToggle.addEventListener("click", () => {
        if (listbox.classList.contains("is-open")) {
          closeCityList();
          return;
        }
        const typed = fields.cidade.value.trim();
        renderCityList(typed ? filterCities(typed) : servedCities());
        fields.cidade.focus();
      });
    }

    fields.cidade.addEventListener("keydown", (event) => {
      if (listbox.hidden) return;
      const items = Array.from(listbox.children);
      if (!items.length) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveOption((activeIndex + 1) % items.length);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveOption((activeIndex - 1 + items.length) % items.length);
      } else if (event.key === "Enter" && activeIndex >= 0) {
        event.preventDefault();
        if (currentMatches[activeIndex]) selectCity(currentMatches[activeIndex]);
      } else if (event.key === "Escape") {
        closeCityList();
      }
    });
  }

  const buildMessage = () => {
    const lines = [
      "Olá! Quero solicitar um orçamento para um evento com a LR Sonorização.",
      "",
      `Nome: ${fields.nome.value.trim()}`,
      `Tipo de evento: ${fields.tipo.value}`,
      "Técnico de PA: SIM — operação do sistema durante o evento",
    ];

    let dateValue = "";
    if (fields.dataIndefinida && fields.dataIndefinida.checked) {
      dateValue = "Ainda não definida";
    } else if (fields.data.value) {
      dateValue = formatDate(fields.data.value);
    }

    const optional = [
      ["Data", dateValue],
      ["Cidade", selectedCity ? selectedCity.name : fields.cidade.value.trim()],
      ["Local do evento", fields.local.value.trim()],
      ["Endereço do local", fields.endereco ? fields.endereco.value.trim() : ""],
      ["Público estimado", fields.publico.value.trim()],
      ["Meu WhatsApp", fields.telefone.value.trim()],
    ];

    optional.forEach(([label, value]) => {
      if (value) lines.push(`${label}: ${value}`);
    });

    const details = fields.mensagem.value.trim();
    if (details) lines.push("", `Detalhes: ${details}`);

    return lines.join("\n");
  };

  const saveDraft = () => {
    // Armazenamento local é opcional: falha em modo privado sem quebrar o form.
    try {
      const draft = {};
      Object.entries(fields).forEach(([key, input]) => {
        if (!input) return;
        if (input.type === "checkbox") {
          draft[key] = String(input.checked);
          return;
        }
        draft[key] = input.value;
      });
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (error) {
      /* sem persistência disponível */
    }
  };

  const restoreDraft = () => {
    try {
      const stored = window.localStorage.getItem(DRAFT_KEY);
      if (!stored) return;
      const draft = JSON.parse(stored);
      Object.entries(fields).forEach(([key, input]) => {
        if (!input || typeof draft[key] !== "string") return;
        if (input.type === "checkbox") {
          input.checked = false;
          return;
        }
        input.value = draft[key];
      });
      selectedCity = findCity(fields.cidade.value);
      if (fields.local) {
        const oldExample = fields.local.value.trim().toLowerCase();
        if (oldExample === "espaço villa bella" || oldExample === "espaco villa bella") {
          fields.local.value = "";
        }
      }
      if (fields.dataIndefinida) fields.dataIndefinida.checked = false;
      if (fields.telefone) {
        fields.telefone.value = formatWhatsApp(fields.telefone.value);
      }
      syncDateState();
      saveDraft();
    } catch (error) {
      /* rascunho inválido: segue com o form vazio */
    }
  };

  restoreDraft();
  form.addEventListener("input", saveDraft);
  form.addEventListener("change", saveDraft);

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const firstInvalid = validate();
    if (firstInvalid) {
      setFormStatus(
        firstInvalid === fields.tecnicoPA
          ? "Marque a caixa de autorização do técnico de PA para enviar o briefing."
          : "Confira os campos destacados para continuar."
      );
      firstInvalid.focus();
      return;
    }

    setFormStatus(SUCCESS_MESSAGE, true);
    openWhatsApp(buildMessage());
  });
}

function initScrollReveal() {
  const targets = document.querySelectorAll(
    ".service, .testimonial, .equipment-grid div, .cable-levels > div, .lighting-scenes article, .quote-grid .field"
  );
  if (!targets.length) return;

  // Respeita quem prefere menos animação.
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("reveal", "visible"));
    return;
  }

  targets.forEach((el) => el.classList.add("reveal"));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08 }
  );

  targets.forEach((el) => observer.observe(el));
}

function init() {
  initWhatsAppLinks();
  initNav();
  initScrollState();
  initBackToTop();
  initQuoteForm();
  initLightingQuoteHint();
  initScrollReveal();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
