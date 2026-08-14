const categoryGrid = document.querySelector("[data-category-grid]");

if (categoryGrid) {
  const cards = [...categoryGrid.querySelectorAll("[data-recommendation-card]")];
  const search = document.querySelector("[data-category-search]");
  const location = document.querySelector("[data-location-filter]");
  const filters = [...document.querySelectorAll("[data-tag-filter]")];
  const summary = document.querySelector("[data-results-summary]");
  let activeTag = "All";

  function render() {
    const term = search.value.trim().toLowerCase();
    const city = location.value;
    let visible = 0;

    cards.forEach((card) => {
      const matchesSearch = !term || card.dataset.search.includes(term);
      const matchesCity = city === "All" || card.dataset.city === city;
      const tags = card.dataset.tags.split("|");
      const matchesTag = activeTag === "All" || tags.includes(activeTag);
      const show = matchesSearch && matchesCity && matchesTag;
      card.hidden = !show;
      if (show) visible += 1;
    });

    summary.textContent = `${visible} recommendation${visible === 1 ? "" : "s"}`;
    document.querySelector("[data-empty-results]").hidden = visible !== 0;
  }

  search.addEventListener("input", render);
  location.addEventListener("change", render);
  filters.forEach((filter) => {
    filter.addEventListener("click", () => {
      activeTag = filter.dataset.tagFilter;
      filters.forEach((button) => button.classList.toggle("active", button === filter));
      render();
      document.dispatchEvent(new CustomEvent("mdg:analytics", {
        detail: { eventName: "category_view", details: { category: document.body.dataset.category, filter: activeTag } },
      }));
    });
  });
  render();
}
