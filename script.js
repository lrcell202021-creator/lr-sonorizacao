/* LR Sonorização — interações do site.
   Configuração: WHATSAPP_NUMBER no formato internacional, só dígitos.
   CITIES: área de atendimento. Edite só este array para incluir ou remover
   cidades. Qualquer localidade fora da lista é considerada não atendida.
   SITE_URL: endereço canônico público (ver também site.config.json). */
const SITE_URL = "https://lrsonorizacao.com.br";
const SITE_HOST = "lrsonorizacao.com.br";
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

const SOLUTION_KITS = {
  essencial: {
    name: "01 | EVENTO ESSENCIAL",
    price: "R$ 350,00",
    tipo: "Aniversário / Festa",
  },
  festa: {
    name: "02 | FESTA NA MEDIDA",
    price: "R$ 700,00",
    tipo: "Aniversário / Festa",
  },
  corporativo: {
    name: "03 | CORPORATIVO | RELIGIOSO",
    price: "R$ 400,00",
    tipo: "Evento corporativo",
  },
  "festa-pronta": {
    name: "04 | FESTA PRA VALER",
    price: "R$ 1.250,00",
    tipo: "Aniversário / Festa",
  },
};

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

function getHeaderOffset() {
  const header = document.getElementById("siteHeader");
  return (header ? header.offsetHeight : 0) + 16;
}

function setHeaderOffsetVar() {
  document.documentElement.style.setProperty(
    "--header-offset",
    `${getHeaderOffset()}px`
  );
}

function resolveScrollTarget(target) {
  if (!target) return target;
  if (target.id === "orcamento") {
    return target.querySelector(".eyebrow") || target;
  }
  return target;
}

function scrollToAnchorTarget(target, behavior = "auto") {
  const scrollTarget = resolveScrollTarget(target);
  if (!scrollTarget) return;
  const top =
    scrollTarget.getBoundingClientRect().top +
    window.scrollY -
    getHeaderOffset();
  window.scrollTo({ top: Math.max(0, top), behavior });
}

function initAnchorScroll() {
  setHeaderOffsetVar();

  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;

    const hash = link.getAttribute("href");
    if (!hash || hash === "#") return;

    const target = document.querySelector(hash);
    if (!target) return;

    event.preventDefault();

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    scrollToAnchorTarget(target, reduceMotion ? "auto" : "smooth");

    if (window.history.pushState) {
      window.history.pushState(null, "", hash);
    }
  });

  const scrollInitialHash = () => {
    const hash = window.location.hash;
    if (!hash) return;
    scrollToAnchorTarget(document.querySelector(hash), "auto");
  };

  scrollInitialHash();
  window.addEventListener("load", scrollInitialHash, { once: true });
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
    setHeaderOffsetVar();
    const offset = getHeaderOffset();

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

  const applySolutionKit = () => {
    const params = new URLSearchParams(window.location.search);
    const kit = SOLUTION_KITS[params.get("kit") || ""];
    if (!kit || !fields.mensagem) return;

    fields.mensagem.value =
      `Tenho interesse no kit ${kit.name} (a partir de ${kit.price}).\n` +
      "Quero que a LR ajuste essa estrutura ao meu evento.";

    if (kit.tipo && fields.tipo) {
      const match = Array.from(fields.tipo.options).find(
        (option) => option.value === kit.tipo
      );
      if (match) fields.tipo.value = kit.tipo;
    }

    saveDraft();

    if (window.history.replaceState) {
      window.history.replaceState(null, "", `${window.location.pathname}#orcamento`);
    }

    const orcamento = document.getElementById("orcamento");
    if (orcamento) {
      requestAnimationFrame(() => scrollToAnchorTarget(orcamento, "auto"));
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
  applySolutionKit();
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

// MP3, nao o WAV original: o WAV e 24 bits e alguns navegadores de celular o
// tocam como 16 bits, o que vira ruido branco.
const ASSISTANT_AUDIO_SRC = "assets/vinheta-lr.mp3?v=1";
const ASSISTANT_VOLUME = 0.28;
const ASSISTANT_PANEL_TRANSITION_MS = 320;
const ASSISTANT_STORAGE = {
  audio: "lr-assistant-audio",
  dismissed: "lr-assistant-dismissed",
};

function assistantPref() {
  try {
    return localStorage.getItem(ASSISTANT_STORAGE.audio);
  } catch {
    return null;
  }
}

function setAssistantPref(value) {
  try {
    if (value) localStorage.setItem(ASSISTANT_STORAGE.audio, value);
    else localStorage.removeItem(ASSISTANT_STORAGE.audio);
  } catch {
    /* storage indisponível */
  }
}

function isAssistantDismissed() {
  try {
    return localStorage.getItem(ASSISTANT_STORAGE.dismissed) === "1";
  } catch {
    return false;
  }
}

function setAssistantDismissed() {
  try {
    localStorage.setItem(ASSISTANT_STORAGE.dismissed, "1");
  } catch {
    /* storage indisponível */
  }
}

function getAssistantMessage(state) {
  if (state === "playing") {
    return "Trilha ativa. Aproveite a navegação — estou por aqui se quiser pausar ou silenciar.";
  }
  if (state === "finished") {
    return "Trilha finalizada. Se quiser ouvir novamente, toque em ouvir essa mensagem.";
  }
  if (state === "paused") {
    return "Trilha pausada. Toque em retomar quando quiser continuar ouvindo.";
  }
  if (state === "error") {
    return "A trilha ainda não está disponível neste momento. Você pode continuar navegando normalmente.";
  }
  if (isAssistantDismissed()) {
    return "Posso ajudar com a trilha sonora ou atalhos do site. O que prefere?";
  }

  const path = (window.location.pathname || "").toLowerCase();
  if (path.includes("solucoes-prontas")) {
    return "Conheça nossos kits com uma trilha especial da LR Sonorização. Quer ativar o som?";
  }
  return "Olá! Sou o assistente da LR Sonorização. Quer ouvir o que preparamos enquanto conhece nossos serviços?";
}

const ASSISTANT_ORCAMENTO_MESSAGE =
  "Preparando seu evento? Ative nossa trilha e navegue com a vibe LR.";

function buildAssistantMarkup() {
  const solutionsHref = (window.location.pathname || "")
    .toLowerCase()
    .includes("solucoes-prontas")
    ? "index.html#orcamento"
    : "solucoes-prontas.html";

  return `
    <div class="lr-assistant" id="lrAssistant">
      <audio class="lr-assistant-audio" id="lrAssistantAudio" preload="metadata">
        <source src="${ASSISTANT_AUDIO_SRC}" type="audio/mpeg">
      </audio>

      <div
        class="lr-assistant-panel"
        id="lrAssistantPanel"
        role="dialog"
        aria-modal="false"
        aria-labelledby="lrAssistantTitle"
        aria-hidden="true"
        hidden
      >
        <div class="lr-assistant-header">
          <div class="lr-assistant-avatar" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M12 3a4 4 0 0 0-4 4v6a4 4 0 0 0 8 0V7a4 4 0 0 0-4-4zm-6 8a6 6 0 0 0 12 0h2a8 8 0 0 1-7 7.93V22h-2v-3.07A8 8 0 0 1 4 11h2z"/>
            </svg>
          </div>
          <div class="lr-assistant-heading">
            <p class="lr-assistant-title" id="lrAssistantTitle">Assistente LR</p>
            <p class="lr-assistant-subtitle">Experiência sonora</p>
          </div>
          <button type="button" class="lr-assistant-close" id="lrAssistantClose" aria-label="Fechar assistente">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M6 6l12 12M18 6L6 18"/>
            </svg>
          </button>
        </div>

        <div class="lr-assistant-body">
          <p class="lr-assistant-message" id="lrAssistantMessage"></p>

          <div class="lr-assistant-actions">
            <button type="button" class="lr-assistant-btn lr-assistant-btn--primary" id="lrAssistantPlay">
              Ouvir essa mensagem
            </button>
            <button type="button" class="lr-assistant-btn" id="lrAssistantPause" hidden>
              Pausar
            </button>
            <button type="button" class="lr-assistant-btn" id="lrAssistantMute" hidden>
              Silenciar
            </button>
          </div>

          <div class="lr-assistant-links">
            <a href="${solutionsHref}" id="lrAssistantSolutions">Ver soluções</a>
            <button type="button" class="lr-assistant-link-btn" id="lrAssistantWhatsApp">WhatsApp</button>
          </div>

          <button type="button" class="lr-assistant-dismiss" id="lrAssistantDismiss">
            Não perguntar de novo
          </button>
        </div>
      </div>

      <button
        type="button"
        class="lr-assistant-toggle"
        id="lrAssistantToggle"
        aria-label="Abrir assistente LR"
        aria-controls="lrAssistantPanel"
        aria-expanded="false"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M12 3a4 4 0 0 0-4 4v6a4 4 0 0 0 8 0V7a4 4 0 0 0-4-4zm-6 8a6 6 0 0 0 12 0h2a8 8 0 0 1-7 7.93V22h-2v-3.07A8 8 0 0 1 4 11h2z"/>
        </svg>
        <span class="lr-assistant-badge" id="lrAssistantBadge" hidden aria-hidden="true"></span>
      </button>
    </div>
  `;
}

function initSoundAssistant() {
  if (document.getElementById("lrAssistant")) return;

  document.body.insertAdjacentHTML("beforeend", buildAssistantMarkup());

  const root = document.getElementById("lrAssistant");
  const panel = document.getElementById("lrAssistantPanel");
  const toggle = document.getElementById("lrAssistantToggle");
  const closeBtn = document.getElementById("lrAssistantClose");
  const messageEl = document.getElementById("lrAssistantMessage");
  const playBtn = document.getElementById("lrAssistantPlay");
  const pauseBtn = document.getElementById("lrAssistantPause");
  const muteBtn = document.getElementById("lrAssistantMute");
  const dismissBtn = document.getElementById("lrAssistantDismiss");
  const whatsappBtn = document.getElementById("lrAssistantWhatsApp");
  const badge = document.getElementById("lrAssistantBadge");
  const audio = document.getElementById("lrAssistantAudio");

  if (
    !root ||
    !panel ||
    !toggle ||
    !messageEl ||
    !playBtn ||
    !pauseBtn ||
    !muteBtn ||
    !audio
  ) {
    return;
  }

  audio.volume = ASSISTANT_VOLUME;

  let isOpen = false;
  let isPlaying = false;
  let isMuted = false;
  let audioReady = true;
  let resumeListenerAttached = false;
  let autoMinimizeTimer = 0;
  let panelCloseTimer = 0;
  let audioBlobUrl = "";
  let audioBlobRequested = false;

  // O Firebase Hosting entrega o MP3 comprimido (br/gzip), e resposta
  // comprimida nao aceita pedido por faixa de bytes. O Chrome do Android
  // busca midia por faixas e para a trilha no meio. Baixar o arquivo inteiro
  // e tocar de um blob local elimina os pedidos por faixa.
  function prefetchAudio() {
    if (audioBlobRequested || !window.fetch || !window.URL) return;
    audioBlobRequested = true;
    fetch(ASSISTANT_AUDIO_SRC)
      .then((response) => (response.ok ? response.blob() : Promise.reject()))
      .then((blob) => {
        audioBlobUrl = URL.createObjectURL(blob);
        useAudioBlob();
      })
      .catch(() => {
        audioBlobRequested = false;
      });
  }

  // Trocar a fonte reinicia a trilha: so troca parada no inicio ou no fim.
  function useAudioBlob() {
    if (!audioBlobUrl || audio.src === audioBlobUrl || !audio.paused) return;
    if (audio.currentTime > 0 && !audio.ended) return;
    audio.src = audioBlobUrl;
  }

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  function setMessage(state) {
    messageEl.textContent = getAssistantMessage(state);
  }

  function syncControls() {
    playBtn.hidden = isPlaying;
    pauseBtn.hidden = !isPlaying;
    muteBtn.hidden = !isPlaying && !isMuted;

    if (isPlaying) {
      muteBtn.textContent = isMuted ? "Ativar som" : "Silenciar";
      root.classList.add("is-playing");
      badge.hidden = false;
    } else {
      root.classList.remove("is-playing");
      badge.hidden = true;
    }

    if (isMuted) root.classList.add("is-muted");
    else root.classList.remove("is-muted");
  }

  function openPanel() {
    if (isOpen) return;

    window.clearTimeout(panelCloseTimer);
    isOpen = true;
    panel.hidden = false;
    panel.classList.remove("is-closing");
    panel.setAttribute("aria-hidden", "false");
    toggle.setAttribute("aria-expanded", "true");
    root.classList.add("is-open");
    setMessage(isPlaying ? "playing" : audioReady ? null : "error");
    prefetchAudio();

    if (prefersReducedMotion) {
      panel.classList.add("is-visible");
      return;
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        panel.classList.add("is-visible");
      });
    });
  }

  function closePanel() {
    if (!isOpen) return;

    isOpen = false;
    panel.classList.remove("is-visible");
    panel.classList.add("is-closing");
    panel.setAttribute("aria-hidden", "true");
    toggle.setAttribute("aria-expanded", "false");
    root.classList.remove("is-open");

    const transitionMs = prefersReducedMotion ? 0 : ASSISTANT_PANEL_TRANSITION_MS;

    window.clearTimeout(panelCloseTimer);
    panelCloseTimer = window.setTimeout(() => {
      panel.classList.remove("is-closing");
      panel.hidden = true;
    }, transitionMs);
  }

  function scheduleAutoMinimize() {
    window.clearTimeout(autoMinimizeTimer);
    autoMinimizeTimer = window.setTimeout(() => {
      if (isPlaying) closePanel();
    }, 2600);
  }

  function attachResumeOnInteraction() {
    if (resumeListenerAttached || assistantPref() !== "on") return;
    resumeListenerAttached = true;
    prefetchAudio();

    const resume = () => {
      if (assistantPref() !== "on" || isPlaying || !audioReady) return;
      playAudio().finally(() => {
        document.removeEventListener("pointerdown", resume);
        document.removeEventListener("keydown", resume);
        resumeListenerAttached = false;
      });
    };

    document.addEventListener("pointerdown", resume, { once: true });
    document.addEventListener("keydown", resume, { once: true });
  }

  async function playAudio() {
    if (!audioReady) {
      setMessage("error");
      return;
    }

    try {
      useAudioBlob();
      if (audio.ended || audio.currentTime >= (audio.duration || 0)) {
        audio.currentTime = 0;
      }
      audio.muted = isMuted;
      await audio.play();
      isPlaying = true;
      setAssistantPref("on");
      setMessage("playing");
      syncControls();
      scheduleAutoMinimize();
    } catch {
      setMessage(null);
      attachResumeOnInteraction();
    }
  }

  function pauseAudio() {
    audio.pause();
    isPlaying = false;
    setAssistantPref("off");
    setMessage("paused");
    syncControls();
  }

  function toggleMute() {
    isMuted = !isMuted;
    audio.muted = isMuted;
    syncControls();
  }

  toggle.addEventListener("click", () => {
    if (isOpen) closePanel();
    else openPanel();
  });

  closeBtn?.addEventListener("click", closePanel);

  playBtn.addEventListener("click", () => {
    playAudio();
  });

  pauseBtn.addEventListener("click", pauseAudio);
  muteBtn.addEventListener("click", toggleMute);

  dismissBtn?.addEventListener("click", () => {
    setAssistantDismissed();
    pauseAudio();
    root.classList.remove("is-attention");
    closePanel();
    setMessage(null);
  });

  whatsappBtn?.addEventListener("click", () => {
    openWhatsApp(DEFAULT_MESSAGE);
  });

  audio.addEventListener("ended", () => {
    isPlaying = false;
    isMuted = false;
    audio.muted = false;
    setAssistantPref("off");
    setMessage("finished");
    syncControls();
  });

  audio.addEventListener("error", () => {
    audioReady = false;
    playBtn.disabled = true;
    pauseBtn.hidden = true;
    muteBtn.hidden = true;
    setMessage("error");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen) closePanel();
  });

  document.addEventListener("pointerdown", (event) => {
    if (!isOpen) return;
    if (root.contains(event.target)) return;
    closePanel();
  });

  const orcamento = document.getElementById("orcamento");
  if (orcamento && "IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (isPlaying) return;
          if (!isOpen) return;
          if (entry.isIntersecting) {
            messageEl.textContent = ASSISTANT_ORCAMENTO_MESSAGE;
          } else {
            setMessage(null);
          }
        });
      },
      { threshold: 0.35 }
    );
    sectionObserver.observe(orcamento);
  }

  syncControls();
  setMessage(null);

  if (assistantPref() === "on" && audioReady) {
    attachResumeOnInteraction();
    root.classList.add("is-ready");
  } else if (!isAssistantDismissed() && assistantPref() !== "off") {
    root.classList.add("is-attention");
    if (!prefersReducedMotion) {
      window.setTimeout(() => {
        if (!isOpen) openPanel();
      }, 1800);
    } else {
      openPanel();
    }
  }
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
  initAnchorScroll();
  initScrollState();
  initBackToTop();
  initQuoteForm();
  initLightingQuoteHint();
  initScrollReveal();
  initSoundAssistant();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
