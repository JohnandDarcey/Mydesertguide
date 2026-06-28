import {
  assets,
  categories,
  filters,
  golfCourses,
  restaurants,
} from "./data.js";

const app = document.querySelector("#app");

const state = {
  query: "",
  activeFilter: "All",
  sort: "Highest Darcey Rating",
};

function starRating(value) {
  const full = Math.floor(value);
  const half = value % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return `${"★".repeat(full)}${half ? "½" : ""}${"☆".repeat(empty)}`;
}

function filteredRestaurants() {
  const term = state.query.trim().toLowerCase();
  const list = restaurants.filter((item) => {
    const haystack = [
      item.name,
      item.location,
      item.category,
      item.description,
      item.tip,
      ...item.tags,
    ]
      .join(" ")
      .toLowerCase();
    const matchesSearch = !term || haystack.includes(term);
    const matchesFilter =
      state.activeFilter === "All" ||
      item.tags.includes(state.activeFilter);
    return matchesSearch && matchesFilter;
  });

  return list.sort((a, b) => {
    if (state.sort === "Alphabetical") return a.name.localeCompare(b.name);
    if (state.sort === "Newest") return Number(b.isNew) - Number(a.isNew);
    return b.rating - a.rating || a.name.localeCompare(b.name);
  });
}

function icon(name) {
  const paths = {
    search:
      '<circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path>',
    compass:
      '<circle cx="12" cy="12" r="9"></circle><path d="m15.2 8.8-2.1 6.3-6.3 2.1 2.1-6.3 6.3-2.1Z"></path>',
    heart:
      '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"></path>',
    map: '<path d="M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Z"></path><path d="M9 3v15"></path><path d="M15 6v15"></path>',
    plus: '<path d="M12 5v14"></path><path d="M5 12h14"></path>',
    spark:
      '<path d="M12 3l1.8 5.1L19 10l-5.2 1.9L12 17l-1.8-5.1L5 10l5.2-1.9L12 3Z"></path><path d="M5 17l.8 2.2L8 20l-2.2.8L5 23l-.8-2.2L2 20l2.2-.8L5 17Z"></path>',
  };
  return `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg>`;
}

function restaurantCard(item) {
  return `
    <article class="listing-card">
      <div class="listing-image">
        <img src="${item.image}" alt="${item.name} dining atmosphere" loading="lazy" />
        <div class="listing-badges">
          ${item.isNew ? '<span class="badge">New</span>' : ""}
          ${item.isFavorite ? '<span class="badge gold">Darcey Favorite</span>' : ""}
        </div>
      </div>
      <div class="listing-body">
        <div class="eyebrow">${item.location} · ${item.category}</div>
        <div class="card-title-row">
          <h3>${item.name}</h3>
          <div class="stars" aria-label="Darcey Rating ${item.rating} out of 5">${starRating(
            item.rating,
          )}</div>
        </div>
        <p>${item.description}</p>
        <dl class="meta-grid">
          <div><dt>Favorite Dish</dt><dd>${item.favoriteDish}</dd></div>
          <div><dt>Happy Hour</dt><dd>${item.happyHour}</dd></div>
        </dl>
        <div class="micro-ratings" aria-label="Optional Darcey sub-ratings">
          <span>Food ${item.food}</span>
          <span>Atmosphere ${item.atmosphere}</span>
          <span>Value ${item.value}</span>
        </div>
        <div class="tip"><strong>Darcey's Insider Tip</strong><span>${item.tip}</span></div>
        <div class="link-row">
          <a href="${item.website}" target="_blank" rel="noreferrer">Website</a>
          <a href="${item.menu}" target="_blank" rel="noreferrer">Menu</a>
          <a href="${item.maps}" target="_blank" rel="noreferrer">Google Maps</a>
        </div>
      </div>
    </article>
  `;
}

function categoryHref(category) {
  if (category === "Golf") return "#golf";
  if (category === "Hidden Gems") return "#contact";
  return "#guide";
}

function golfCard(item) {
  return `
    <article class="listing-card golf-card">
      <div class="listing-image">
        <img src="${item.image}" alt="${item.name} desert golf atmosphere" loading="lazy" />
      </div>
      <div class="listing-body">
        <div class="eyebrow">${item.location} · ${item.category}</div>
        <div class="card-title-row">
          <h3>${item.name}</h3>
          <div class="stars" aria-label="Darcey Rating ${item.rating} out of 5">${starRating(
            item.rating,
          )}</div>
        </div>
        <p>${item.description}</p>
        <dl class="meta-grid">
          <div><dt>Best For</dt><dd>${item.bestFor}</dd></div>
          <div><dt>Restaurant</dt><dd>${item.restaurant}</dd></div>
        </dl>
        <div class="tip"><strong>Darcey's Golf Tip</strong><span>${item.tip}</span></div>
        <div class="link-row">
          <a href="${item.teeTime}" target="_blank" rel="noreferrer">Book Tee Time</a>
          <a href="${item.website}" target="_blank" rel="noreferrer">Website</a>
          <a href="${item.maps}" target="_blank" rel="noreferrer">Google Maps</a>
        </div>
      </div>
    </article>
  `;
}

function renderListings() {
  const results = filteredRestaurants();
  document.querySelector("#results-count").textContent = `${results.length} curated places`;
  document.querySelector("#listing-grid").innerHTML = results.map(restaurantCard).join("");
}

function render() {
  app.innerHTML = `
    <header class="site-header">
      <a class="brand" href="#top" aria-label="The Desert Insider home">
        <span>The Desert Insider</span>
        <small>by Darcey Deetz</small>
      </a>
      <nav aria-label="Primary navigation">
        <a href="#guide">Guide</a>
        <a href="#contact">Contact</a>
        <a class="nav-cta" href="https://darceydeetz.com" target="_blank" rel="noreferrer">Real Estate Help</a>
      </nav>
    </header>

    <main id="top">
      <section class="hero">
        <img src="${assets.hero}" alt="Elegant Coachella Valley desert patio at golden hour" />
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <p class="kicker">Darcey's personal Coachella Valley guide</p>
          <div class="hero-title-wrap">
            <h1>
              <span class="hero-title-line hero-title-the">The</span>
              <span class="hero-title-line">Desert</span>
              <span class="hero-title-line">Insider</span>
            </h1>
            <div class="hero-heart" aria-hidden="true">${icon("heart")}</div>
          </div>
          <p>Darcey's Guide to Restaurants, Happy Hours & Local Favorites</p>
          <div class="hero-actions">
            <a class="button primary" href="#guide">${icon("compass")} Explore the Guide</a>
            <a class="button secondary" href="https://darceydeetz.com" target="_blank" rel="noreferrer">${icon("heart")} Visit Darcey's Website</a>
          </div>
        </div>
      </section>

      <section class="section intro welcome-note">
        <img class="darcey-note-photo" src="./assets/people/darcey-headshot-web.jpg" alt="Darcey Deetz smiling in the desert" />
        <div>
          <p class="eyebrow">A note from Darcey</p>
          <h2>A personal guide to the desert <span class="no-break">I love.</span></h2>
        </div>
        <p>
          This is a heartfelt collection of the restaurants, happy hours, neighborhood favorites
          and little local gems my clients and I come back to again and again. I created it as a
          personal welcome to the Coachella Valley, and as a love letter to the places that make
          life in the desert feel warm, connected and special.
        </p>
      </section>

      <section class="section real-estate-cta" aria-label="Real estate help from Darcey">
        <img class="darcey-cta-photo" src="./assets/people/darcey-front-web.jpg" alt="Darcey Deetz" />
        <div>
          <p class="eyebrow">Real estate help</p>
          <h2>Thinking about a move in the desert?</h2>
        </div>
        <p>
          If this guide has you picturing life in the Coachella Valley, Darcey can help with the
          homes, neighborhoods and next steps.
        </p>
        <a class="button dark" href="https://darceydeetz.com" target="_blank" rel="noreferrer">
          ${icon("heart")} Visit Darcey's Website
        </a>
      </section>

      <section class="section category-strip" aria-label="Guide categories">
        ${categories
          .map(
            (category, index) => `
              <a href="${categoryHref(category)}" class="category-tile">
                <strong>${category}</strong>
              </a>
            `,
          )
          .join("")}
      </section>

      <section class="section feature-grid">
        <article class="feature large">
          <img src="${assets.restaurants}" alt="Premium restaurant table in the desert" />
          <div>
            <p class="eyebrow">Restaurants</p>
            <h2>Darcey's short list, with the details people actually ask for.</h2>
          </div>
        </article>
        <article class="feature">
          <img src="${assets.happyHour}" alt="Elegant desert happy hour cocktails" />
          <div>
            <p class="eyebrow">Happy Hours</p>
            <h3>Where to go, what to order, and when to arrive.</h3>
          </div>
        </article>
        <article class="feature">
          <img src="${assets.neighborhoods}" alt="Palm Springs street and desert mountains" />
          <div>
            <p class="eyebrow">Hidden Gems</p>
            <h3>Small local finds worth sharing.</h3>
          </div>
        </article>
      </section>

      <section class="section guide" id="guide">
        <div class="section-heading">
          <div>
            <p class="eyebrow">The Guide</p>
            <h2>Restaurants</h2>
          </div>
          <p>
            Darcey's Star Ratings are personal recommendations based on places Darcey confidently
            recommends, along with a few favorites shared by her clients.
          </p>
        </div>

        <div class="guide-tools">
          <label class="search-box">
            ${icon("search")}
            <input id="search-input" type="search" placeholder="Search restaurants, tips, cuisines..." />
          </label>
          <label class="sort-box">
            <span>Sort</span>
            <select id="sort-select">
              <option>Highest Darcey Rating</option>
              <option>Newest</option>
              <option>Alphabetical</option>
            </select>
          </label>
        </div>
        <div class="filter-row">
          <button class="filter-chip active" data-filter="All">All</button>
          ${filters.map((filter) => `<button class="filter-chip" data-filter="${filter}">${filter}</button>`).join("")}
        </div>
        <div class="results-line">
          <span id="results-count"></span>
          <span>★★★★★ = Darcey Rating, not Google or Yelp.</span>
        </div>
        <div id="listing-grid" class="listing-grid"></div>
      </section>

      <section class="section golf-guide" id="golf">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Golf</p>
            <h2>Darcey's Desert Golf Picks</h2>
          </div>
          <p>
            A few favorite courses for beautiful views, strong conditions, great restaurants and the kind of round worth recommending.
          </p>
        </div>
        <div class="listing-grid golf-grid">
          ${golfCourses.map(golfCard).join("")}
        </div>
      </section>

      <section class="section contact" id="contact">
        <div>
          <p class="eyebrow">Send us a favorite</p>
          <h2>Have a restaurant, hidden gem or golf course Darcey should know about?</h2>
          <p>Send us the name, location and what makes it special. We love hearing what clients and friends are discovering around the desert.</p>
        </div>
        <div class="contact-links">
          <a href="mailto:john@darceydeetz.com?subject=Desert%20Insider%20Recommendation&body=Hi%20John%2C%0A%0AI%20have%20a%20recommendation%20for%20The%20Desert%20Insider.%0A%0AName%3A%0ALocation%3A%0ACategory%20%28restaurant%2C%20hidden%20gem%2C%20golf%20course%2C%20etc.%29%3A%0AWhat%20makes%20it%20special%3A%0AWebsite%20or%20Instagram%20%28if%20available%29%3A%0A%0AThank%20you!" class="submit-link">Submit a Recommendation</a>
          <a href="mailto:john@darceydeetz.com?subject=Restaurant%20Recommendation%20for%20The%20Desert%20Insider">Restaurant</a>
          <a href="mailto:john@darceydeetz.com?subject=Hidden%20Gem%20for%20The%20Desert%20Insider">Hidden Gem</a>
          <a href="mailto:john@darceydeetz.com?subject=Golf%20Course%20Recommendation%20for%20The%20Desert%20Insider">Golf Course</a>
        </div>
      </section>
    </main>
  `;

  document.querySelector("#search-input").addEventListener("input", (event) => {
    state.query = event.target.value;
    renderListings();
  });

  document.querySelector("#sort-select").addEventListener("change", (event) => {
    state.sort = event.target.value;
    renderListings();
  });

  document.querySelectorAll(".filter-chip").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeFilter = button.dataset.filter;
      document.querySelectorAll(".filter-chip").forEach((chip) => chip.classList.remove("active"));
      button.classList.add("active");
      renderListings();
    });
  });

  renderListings();
}

render();
