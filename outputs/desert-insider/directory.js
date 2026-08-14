const categoryGrid = document.querySelector("[data-category-grid]");

if (categoryGrid) {
  const cards = [...categoryGrid.querySelectorAll("[data-recommendation-card]")];
  const search = document.querySelector("[data-category-search]");
  const location = document.querySelector("[data-location-filter]");
  const filters = [...document.querySelectorAll("[data-filter-button], [data-tag-filter]")];
  const summary = document.querySelector("[data-results-summary]");
  const requestedExperience = new URLSearchParams(window.location.search).get("experience");
  let activeFilter = requestedExperience
    ? { kind: "experience", value: requestedExperience }
    : { kind: "experience", value: "All" };

  const selectedButton = filters.find((filter) => (filter.dataset.filterValue || filter.dataset.tagFilter) === activeFilter.value);
  if (selectedButton) filters.forEach((button) => button.classList.toggle("active", button === selectedButton));
  else if (requestedExperience) filters.forEach((button) => button.classList.remove("active"));

  function render() {
    const term = search?.value.trim().toLowerCase() || "";
    const city = location?.value || "All";
    let visible = 0;

    cards.forEach((card) => {
      const matchesSearch = !term || card.dataset.search.includes(term);
      const matchesCity = city === "All" || card.dataset.city === city;
      const tags = card.dataset.tags.split("|");
      const experiences = (card.dataset.experiences || "").split("|").filter(Boolean);
      const matchesFilter =
        activeFilter.value === "All" ||
        (activeFilter.kind === "tag" ? tags.includes(activeFilter.value) : experiences.includes(activeFilter.value));
      const show = matchesSearch && matchesCity && matchesFilter;
      card.hidden = !show;
      if (show) visible += 1;
    });

    categoryGrid.querySelectorAll("[data-card-section]").forEach((section) => {
      const sectionCards = [...section.querySelectorAll("[data-recommendation-card]")];
      section.hidden = sectionCards.length > 0 && sectionCards.every((card) => card.hidden);
    });

    if (summary) summary.textContent = `${visible} recommendation${visible === 1 ? "" : "s"}`;
    document.querySelector("[data-empty-results]").hidden = visible !== 0;
  }

  search?.addEventListener("input", render);
  location?.addEventListener("change", () => {
    render();
    document.dispatchEvent(new CustomEvent("mdg:analytics", {
      detail: { eventName: "location_filter_selected", details: { category: document.body.dataset.category, location: location.value } },
    }));
  });
  filters.forEach((filter) => {
    filter.addEventListener("click", () => {
      activeFilter = {
        kind: filter.dataset.filterKind || "tag",
        value: filter.dataset.filterValue || filter.dataset.tagFilter,
      };
      filters.forEach((button) => button.classList.toggle("active", button === filter));
      render();
      const url = new URL(window.location.href);
      if (activeFilter.kind === "experience" && activeFilter.value !== "All") url.searchParams.set("experience", activeFilter.value);
      else url.searchParams.delete("experience");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
      document.dispatchEvent(new CustomEvent("mdg:analytics", {
        detail: {
          eventName: activeFilter.kind === "tag" ? "more_filter_selected" : "primary_filter_selected",
          details: { category: document.body.dataset.category, filter: activeFilter.value },
        },
      }));
    });
  });
  render();
}

const utilityConcierge = document.querySelector("[data-utility-concierge]");

if (utilityConcierge) {
  const select = utilityConcierge.querySelector("[data-utility-city-select]");
  const results = utilityConcierge.querySelector("[data-utility-city-results]");
  const panels = [...utilityConcierge.querySelectorAll("[data-utility-city-panel]")];
  const filterButtons = [...document.querySelectorAll("[data-utility-filter]")];
  const browseCards = [...document.querySelectorAll("[data-utility-provider-grid] [data-utility-provider-card]")];
  const empty = document.querySelector("[data-utility-empty]");
  let selectorOpened = false;

  function analytics(eventName, details = {}) {
    document.dispatchEvent(new CustomEvent("mdg:analytics", { detail: { eventName, details } }));
  }

  function trackSelectorOpened() {
    if (selectorOpened) return;
    selectorOpened = true;
    analytics("utility_city_selector_opened", { category: "Utilities Setup" });
  }

  select.addEventListener("focus", trackSelectorOpened, { once: true });
  select.addEventListener("pointerdown", trackSelectorOpened, { once: true });
  select.addEventListener("change", () => {
    const city = select.value;
    results.hidden = !city;
    panels.forEach((panel) => { panel.hidden = panel.dataset.utilityCityPanel !== city; });
    if (!city) return;
    analytics("utility_city_selected", { category: "Utilities Setup", selectedCity: city });
    results.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.utilityFilter;
      let visible = 0;
      filterButtons.forEach((candidate) => candidate.classList.toggle("active", candidate === button));
      browseCards.forEach((card) => {
        const show = filter === "All" || card.dataset.utilityType === filter;
        card.hidden = !show;
        if (show) visible += 1;
      });
      empty.hidden = visible !== 0;
      analytics("utility_category_viewed", { category: "Utilities Setup", utilityCategory: filter });
    });
  });
}
