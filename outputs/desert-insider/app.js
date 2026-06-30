import {
  assets,
  categories,
  filters,
  golfCourses,
  professionals,
  restaurants,
  services,
  thingsToDo,
} from "./data.js";

const app = document.querySelector("#app");

const state = {
  query: "",
  activeFilter: "All",
  sort: "Highest Darcey Rating",
  activeMapPlace: null,
};

const dateNightNames = ["Spencer's", "Giuseppe's", "Mitch's", "California Bistro"];
const happyHourNames = ["Giuseppe's", "Cactus Jack's", "California Bistro", "Bubba's Bones & Brews"];
const featuredRestaurantNames = ["Spencer's", "Lulu"];
const featuredGolfNames = ["Indian Canyons Golf Resort", "The Classic Club"];
const featuredThingsNames = ["The Living Desert", "Palm Springs Aerial Tramway"];
const featuredRestaurantsByFilter = {
  American: ["Lulu", "Tony's Grill and Bar"],
  "Date Night": ["Spencer's", "California Bistro"],
  Patio: ["Lulu", "Spencer's"],
};
function starRating(value) {
  const full = Math.floor(value);
  const half = value % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return `${"★".repeat(full)}${half ? "½" : ""}${"☆".repeat(empty)}`;
}

function filteredRestaurants() {
  const term = state.query.trim().toLowerCase();
  const activeFeatured =
    state.activeFilter === "All" ? pickRestaurants(featuredRestaurantNames) : featuredRestaurantsForFilter(state.activeFilter);
  const featuredNames = new Set(activeFeatured.map((item) => item.name));
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
    const isFeaturedInActiveView = featuredNames.has(item.name);
    return matchesSearch && matchesFilter && !isFeaturedInActiveView;
  });

  return list.sort((a, b) => {
    if (state.sort === "Alphabetical") return a.name.localeCompare(b.name);
    if (state.sort === "Newest") return Number(b.isNew) - Number(a.isNew);
    return b.rating - a.rating || a.name.localeCompare(b.name);
  });
}

function featuredRestaurantsForFilter(filter) {
  if (filter === "All") return [];
  if (featuredRestaurantsByFilter[filter]) {
    return pickRestaurants(featuredRestaurantsByFilter[filter]);
  }

  return restaurants
    .filter((item) => item.tags.includes(filter))
    .sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name))
    .slice(0, 2);
}

function allSearchablePlaces() {
  return [
    ...restaurants.map((item) => ({ ...item, type: "Restaurant" })),
    ...golfCourses.map((item) => ({ ...item, type: "Golf" })),
    ...services.map((item) => ({ ...item, type: "Utility" })),
    ...professionals.map((item) => ({ ...item, type: "Trusted Professional" })),
    ...thingsToDo.map((item) => ({ ...item, type: "Thing To Do" })),
  ];
}

function mapPlaces() {
  return allSearchablePlaces().sort((a, b) => a.location.localeCompare(b.location) || a.name.localeCompare(b.name));
}

function pickRestaurants(names) {
  return names
    .map((name) => restaurants.find((restaurant) => restaurant.name === name))
    .filter(Boolean);
}

function pickGolfCourses(names) {
  return names
    .map((name) => golfCourses.find((course) => course.name === name))
    .filter(Boolean);
}

function pickThingsToDo(names) {
  return names
    .map((name) => thingsToDo.find((thing) => thing.name === name))
    .filter(Boolean);
}

function googleMapEmbed(place) {
  return `https://www.google.com/maps?q=${encodeURIComponent(`${place.name} ${place.location} CA`)}&output=embed`;
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
    mail:
      '<path d="M4 6h16v12H4z"></path><path d="m4 7 8 6 8-6"></path>',
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
  if (category === "Things To Do") return "#things-to-do";
  if (category === "Local Utilities") return "#utilities";
  if (category === "Darcey's Trusted Professionals") return "#professionals";
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

function serviceCard(item) {
  return `
    <article class="listing-card service-listing-card">
      <div class="listing-image service-image">
        <img src="${item.image}" alt="${item.name} logo" loading="lazy" />
        <div class="listing-badges">
          ${item.isNew ? '<span class="badge">New</span>' : ""}
        </div>
      </div>
      <div class="listing-body">
        <div class="eyebrow">${item.location} · ${item.category}</div>
        <div class="card-title-row">
          <h3>${item.name}</h3>
          <div class="stars" aria-label="Darcey Usefulness Rating ${item.rating} out of 5">${starRating(
            item.rating,
          )}</div>
        </div>
        <p>${item.description}</p>
        <dl class="meta-grid">
          <div><dt>Best For</dt><dd>${item.bestFor}</dd></div>
          <div><dt>Detail</dt><dd>${item.detail}</dd></div>
        </dl>
        <div class="tip"><strong>Darcey's Setup Tip</strong><span>${item.tip}</span></div>
        <div class="link-row">
          <a href="${item.website}" target="_blank" rel="noreferrer">Website</a>
          <a href="${item.maps}" target="_blank" rel="noreferrer">Google Maps</a>
        </div>
      </div>
    </article>
  `;
}

function thingToDoCard(item) {
  return `
    <article class="listing-card thing-card">
      <div class="listing-image">
        <img src="${item.image}" alt="${item.name} entrance" loading="lazy" />
        <div class="listing-badges">
          ${item.isNew ? '<span class="badge">New</span>' : ""}
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
          <div><dt>Best For</dt><dd>${item.bestFor}</dd></div>
          <div><dt>Detail</dt><dd>${item.detail}</dd></div>
        </dl>
        <div class="tip"><strong>Darcey's Pro Tip</strong><span>${item.tip}</span></div>
        <div class="link-row">
          <a href="${item.website}" target="_blank" rel="noreferrer">Website</a>
          <a href="${item.maps}" target="_blank" rel="noreferrer">Google Maps</a>
        </div>
      </div>
    </article>
  `;
}

function featuredLinkRow(item) {
  return `
    <div class="featured-link-row">
      ${item.teeTime ? `<a href="${item.teeTime}" target="_blank" rel="noreferrer">Book Tee Time</a>` : ""}
      ${item.website ? `<a href="${item.website}" target="_blank" rel="noreferrer">Website</a>` : ""}
      ${item.menu ? `<a href="${item.menu}" target="_blank" rel="noreferrer">Menu</a>` : ""}
      ${item.maps ? `<a href="${item.maps}" target="_blank" rel="noreferrer">Google Maps</a>` : ""}
    </div>
  `;
}

function expandableFeaturedNote(text) {
  if (text.length < 180) {
    return `<p class="featured-note">${text}</p>`;
  }

  return `
    <div class="featured-note-wrap">
      <p class="featured-note">${text}</p>
      <button class="featured-note-toggle" type="button" aria-expanded="false">Read more</button>
    </div>
  `;
}

function featuredSpotlightCard(item, label, why, actionLabel = "View Details") {
  const ratingLabel = item.rating ? `<span class="featured-rating">${starRating(item.rating)}</span>` : "";
  return `
    <article class="featured-pick-card">
      <div class="featured-media">
        <img src="${item.image}" alt="${item.name} featured image" loading="lazy" />
      </div>
      <div class="featured-content">
        <div class="featured-kicker-row">
          <p class="eyebrow">${label}</p>
          ${ratingLabel}
        </div>
        <h3>${item.name}</h3>
        <div class="featured-why">
          <span>Why Darcey picked it</span>
          ${expandableFeaturedNote(why)}
        </div>
        ${featuredLinkRow(item)}
      </div>
    </article>
  `;
}

function featuredPlaceholders(sectionName) {
  return `
    <div class="featured-listings" aria-label="Featured ${sectionName} listings">
      ${[1, 2]
        .map(
          (number) => `
            <article class="featured-placeholder-card">
              <div class="placeholder-seal">Featured</div>
              <p class="eyebrow">${sectionName} Spotlight</p>
              <h3>Premium feature ${number}</h3>
              <p>Reserved for a standout recommendation with a larger image, Darcey note and direct action link.</p>
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

function restaurantFeaturedListings() {
  const featured = pickRestaurants(featuredRestaurantNames);
  return `
    <div class="featured-listings" aria-label="Featured Restaurant listings">
      ${featured
        .map((restaurant) => featuredSpotlightCard(restaurant, "Featured Restaurant", restaurant.tip))
        .join("")}
    </div>
  `;
}

function thingsFeaturedListings() {
  const featured = pickThingsToDo(featuredThingsNames);
  return `
    <div class="featured-listings" aria-label="Featured Things To Do listings">
      ${featured
        .map((thing) => featuredSpotlightCard(thing, "Featured Thing To Do", thing.tip))
        .join("")}
    </div>
  `;
}

function golfFeaturedListings() {
  const featured = pickGolfCourses(featuredGolfNames);
  return `
    <div class="featured-listings" aria-label="Featured Golf listings">
      ${featured
        .map((course) => featuredSpotlightCard(course, "Featured Golf", course.tip))
        .join("")}
    </div>
  `;
}

function categoryFeaturedShelf() {
  if (state.activeFilter === "All") return "";

  const featured = featuredRestaurantsForFilter(state.activeFilter);
  const cards = Array.from({ length: 2 }, (_, index) => {
    const item = featured[index];
    if (item) {
      return `
        <article class="category-featured-card">
          <img src="${item.image}" alt="${item.name} featured restaurant" loading="lazy" />
          <div class="category-featured-content">
            <div class="category-featured-topline">
              <span>Featured Partner</span>
              <strong>${starRating(item.rating)}</strong>
            </div>
            <h3>${item.name}</h3>
            ${expandableFeaturedNote(item.tip)}
            ${featuredLinkRow(item)}
          </div>
        </article>
      `;
    }

    return `
      <article class="category-featured-card empty">
        <div class="category-featured-content">
          <div class="category-featured-topline">
            <span>Featured Partner</span>
          </div>
          <h3>Premium spot available</h3>
          <p>Reserved for a standout ${state.activeFilter.toLowerCase()} recommendation or paid partner.</p>
          <a href="mailto:john@darceydeetz.com?subject=Featured%20${encodeURIComponent(state.activeFilter)}%20Spot%20for%20My%20Desert%20Guide">Inquire</a>
        </div>
      </article>
    `;
  }).join("");

  return `
    <div class="category-featured-shelf" aria-label="Featured ${state.activeFilter} restaurants">
      <div class="category-featured-heading">
        <div>
          <h3>Featured ${state.activeFilter} Picks</h3>
        </div>
      </div>
      <div class="category-featured-grid">
        ${cards}
      </div>
    </div>
  `;
}

function dateNightSection() {
  const places = pickRestaurants(dateNightNames);
  const featured = pickRestaurants(featuredRestaurantsByFilter["Date Night"]);
  return `
    <section class="section spotlight-section" id="date-night">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Date Night</p>
          <h2>Darcey's date-night shortlist.</h2>
        </div>
        <p>
          Spencer's leads the list when the evening should feel special, with Giuseppe's, Mitch's and California Bistro close behind.
        </p>
      </div>
      <div class="featured-listings" aria-label="Featured Date Night listings">
        ${featured
          .map((restaurant) => featuredSpotlightCard(restaurant, "Featured Date Night", restaurant.tip))
          .join("")}
      </div>
      <div class="listing-grid">
        ${places
          .filter((restaurant) => !featured.some((item) => item.name === restaurant.name))
          .map(restaurantCard)
          .join("")}
      </div>
    </section>
  `;
}

function happyHourSection() {
  const places = pickRestaurants(happyHourNames);
  return `
    <section class="section spotlight-section happy-hour-section" id="happy-hour">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Happy Hour</p>
          <h2>A few easy happy-hour favorites.</h2>
        </div>
        <p>
          Places with the right mix of local energy, reliable drinks and a reason to linger a little longer.
        </p>
      </div>
      ${featuredPlaceholders("Happy Hour")}
      <div class="listing-grid">
        ${places.map(restaurantCard).join("")}
      </div>
    </section>
  `;
}

function thingsToDoSection() {
  const featured = new Set(featuredThingsNames);
  return `
    <section class="section spotlight-section things-section" id="things-to-do">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Things To Do</p>
          <h2>Darcey's favorite ways to spend a desert day.</h2>
        </div>
        <p>
          Experiences, local outings and easy recommendations for clients, family and friends who want to enjoy the valley beyond dinner.
        </p>
      </div>
      ${thingsFeaturedListings()}
      <div class="listing-grid">
        ${thingsToDo.filter((thing) => !featured.has(thing.name)).map(thingToDoCard).join("")}
      </div>
    </section>
  `;
}

function utilitiesSection() {
  return `
    <section class="section services-section" id="utilities">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Local Utilities</p>
          <h2>The practical desert list clients always need.</h2>
        </div>
        <div class="utility-guide-panel">
          <p>
            A great home guide should include all the practical information you'll need after you move in.
            I've included some of the most important utility links here, but if you'd like a convenient,
            comprehensive printable reference to keep on hand, you can download it below.
          </p>
          <p>
            Keep this guide handy for move-in day and beyond. It includes essential Coachella Valley utility providers,
            service setup information, and important contact numbers - all in one easy-to-reference document.
          </p>
          <a class="button dark utility-download-button" href="./assets/downloads/darceys-utility-guide.png" download="darceys-utility-guide.png">${icon("download")} Download Darcey's Utility Guide</a>
        </div>
      </div>
      <div class="listing-grid">
        ${services.map(serviceCard).join("")}
      </div>
      <div class="services-cta">
        <p>Have a local utility Darcey should include?</p>
        <a class="button dark" href="mailto:john@darceydeetz.com?subject=Utility%20Recommendation%20for%20My%20Desert%20Guide&body=Hi%20John%2C%0A%0AI%20have%20a%20local%20utility%20recommendation%20for%20My%20Desert%20Guide.%0A%0AName%3A%0ACategory%3A%0ALocation%20or%20service%20area%3A%0AWebsite%20or%20phone%3A%0AWhy%20you%20recommend%20them%3A%0A%0AThank%20you!">${icon("plus")} Submit a Utility</a>
      </div>
    </section>
  `;
}

function professionalsSection() {
  return `
    <section class="section professionals-section" id="professionals">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Darcey's Trusted Professionals</p>
          <h2>Local Pros</h2>
        </div>
        <p>
          Insurance contacts, home vendors and other trusted professionals clients may need as they settle into desert life.
        </p>
      </div>
      ${featuredPlaceholders("Trusted Professionals")}
      <div class="listing-grid">
        ${professionals.map(serviceCard).join("")}
      </div>
      <div class="services-cta">
        <p>Have a trusted professional Darcey should consider?</p>
        <a class="button dark" href="mailto:john@darceydeetz.com?subject=Trusted%20Professional%20Recommendation%20for%20My%20Desert%20Guide&body=Hi%20John%2C%0A%0AI%20have%20a%20trusted%20professional%20recommendation%20for%20My%20Desert%20Guide.%0A%0AName%3A%0ACategory%3A%0ALocation%20or%20service%20area%3A%0AWebsite%20or%20phone%3A%0AWhy%20you%20recommend%20them%3A%0A%0AThank%20you!">${icon("plus")} Submit a Pro</a>
      </div>
    </section>
  `;
}

function renderListings() {
  const results = filteredRestaurants();
  document.querySelector("#results-count").textContent = `${results.length} curated places`;
  document.querySelector("#category-featured").innerHTML = categoryFeaturedShelf();
  document.querySelector("#listing-grid").innerHTML = results.map(restaurantCard).join("");
}

function renderMap() {
  const places = mapPlaces();
  if (!state.activeMapPlace) state.activeMapPlace = places[0].name;
  const activePlace = places.find((place) => place.name === state.activeMapPlace) || places[0];

  document.querySelector("#map-frame").src = googleMapEmbed(activePlace);

  document.querySelector("#map-place-list").innerHTML = places
    .map(
      (place) => `
        <button
          class="map-place-button ${place.name === activePlace.name ? "active" : ""}"
          data-map-place="${place.name}"
          aria-label="Show ${place.name} on the guide map"
        >
          <span>${place.name}</span>
          <small>${place.location} · ${place.type}</small>
        </button>
      `,
    )
    .join("");

  document.querySelector("#map-detail").innerHTML = `
    <p class="eyebrow">${activePlace.location} · ${activePlace.type}</p>
    <h3>${activePlace.name}</h3>
    <p>${activePlace.description}</p>
    <a href="${activePlace.maps}" target="_blank" rel="noreferrer">Open in Google Maps</a>
  `;

  document.querySelectorAll(".map-place-button").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeMapPlace = button.dataset.mapPlace;
      renderMap();
    });
  });
}

function handleAlertSignup(form) {
  const emailInput = form.querySelector("input[name='email']");
  const email = emailInput.value.trim();
  if (!email) return;

  if (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost") {
    const subject = encodeURIComponent("Please add me to My Desert Guide alerts");
    const body = encodeURIComponent(`Please add ${email} to the My Desert Guide new recommendation alerts list.`);
    window.location.href = `mailto:john@darceydeetz.com?subject=${subject}&body=${body}`;
    return;
  }

  const formData = new FormData(form);
  fetch("/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(formData).toString(),
  })
    .then(() => {
      form.reset();
      document.querySelector("#signup-message").textContent =
        "You are on the list. We will send a note when new recommendations are added.";
    })
    .catch(() => {
      document.querySelector("#signup-message").textContent =
        "Something did not go through. Please email john@darceydeetz.com and we will add you.";
    });
}

function render() {
  app.innerHTML = `
    <header class="site-header">
      <a class="brand" href="#top" aria-label="My Desert Guide home">
        <span>My Desert Guide</span>
        <small>Darcey's favorites all in one place</small>
      </a>
      <nav aria-label="Primary navigation">
        <a href="#guide">Guide</a>
        <a href="#map">Map</a>
        <a href="#utilities">Utilities</a>
        <a href="#professionals">Pros</a>
        <a href="#alerts">Alerts</a>
        <a href="#contact">Contact</a>
        <a class="nav-cta" href="https://darceydeetz.com" target="_blank" rel="noreferrer">Real Estate Help</a>
      </nav>
    </header>

    <main id="top">
      <section class="hero">
        <img src="${assets.hero}" alt="Elegant Coachella Valley desert patio at golden hour" />
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <div class="hero-title-wrap">
            <h1>
              <span class="hero-title-line hero-title-my">My</span>
              <span class="hero-title-line hero-title-desert">Desert<span class="hero-heart" aria-hidden="true">${icon("heart")}</span></span>
              <span class="hero-title-line">Guide</span>
            </h1>
          </div>
          <p>Restaurants, happy hours, golf, things to do, trusted local pros, and all the best of desert living—recommended by Darcey.</p>
          <div class="hero-actions">
            <a class="button primary" href="#guide">${icon("compass")} Explore the Guide</a>
            <a class="button secondary" href="https://darceydeetz.com" target="_blank" rel="noreferrer">${icon("heart")} Visit Darcey's Real Estate Website</a>
          </div>
        </div>
      </section>

      <section class="section intro welcome-note">
        <img class="darcey-note-photo" src="./assets/people/darcey-headshot-web.jpg" alt="Darcey Deetz smiling in the desert" />
        <div>
          <p class="eyebrow">A note from Darcey</p>
          <h2>A personal guide to the desert <span class="no-break">I love.</span></h2>
        </div>
        <div class="welcome-copy">
          <p>
            The Coachella Valley is so much more than beautiful weather and palm trees. It's the incredible people,
            unforgettable restaurants, world-class golf, unique local businesses, and hidden gems that make living here
            such a joy.
          </p>
          <p>
            This guide is a collection of the places I genuinely recommend to my clients, friends, and family. From my
            favorite restaurants and happy hours to golf courses, trusted local vendors, shopping, entertainment,
            wellness, and neighborhood treasures, every recommendation has been chosen because it's somewhere I'd
            happily send the people I care about most.
          </p>
          <p>
            Consider this my personal welcome to the desert, a guide designed to help you experience the Coachella
            Valley like a local and discover all the reasons so many of us are proud to call it home.
          </p>
        </div>
      </section>

      <section class="section real-estate-cta" aria-label="Real estate help from Darcey">
        <img class="darcey-cta-photo" src="./assets/people/darcey-front-web.jpg" alt="Darcey Deetz" />
        <div>
          <p class="eyebrow">Real estate help</p>
          <h2>Thinking about a move in the desert?</h2>
        </div>
        <div class="real-estate-copy">
          <p>
            If this guide has you picturing life in the Coachella Valley, Darcey can help with the
            homes, neighborhoods and next steps.
          </p>
          <p class="dre-line">Darcey Deetz · CA DRE 01374659</p>
          <a class="button dark" href="https://darceydeetz.com" target="_blank" rel="noreferrer">
            ${icon("heart")} Visit Darcey's Real Estate Website
          </a>
        </div>
      </section>

      <section class="section guide-categories" aria-label="Guide categories">
        <div class="category-heading">
          <p class="eyebrow">Browse the guide</p>
          <h2>Start with what you need.</h2>
        </div>
        <div class="category-strip">
          ${categories
            .map(
              (category) => `
                <a href="${categoryHref(category)}" class="category-tile">
                  <strong>${category}</strong>
                </a>
              `,
            )
            .join("")}
        </div>
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
        ${restaurantFeaturedListings()}

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
        <div id="category-featured"></div>
        <div class="results-line">
          <span id="results-count"></span>
          <span>★★★★★ = Darcey Rating, not Google or Yelp.</span>
        </div>
        <div id="listing-grid" class="listing-grid"></div>
      </section>

      ${dateNightSection()}

      ${happyHourSection()}

      ${thingsToDoSection()}

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
        ${golfFeaturedListings()}
        <div class="listing-grid golf-grid">
          ${golfCourses.filter((course) => !featuredGolfNames.includes(course.name)).map(golfCard).join("")}
        </div>
      </section>

      ${utilitiesSection()}

      ${professionalsSection()}

      <section class="section map-section" id="map">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Explore by area</p>
            <h2>Interactive Map</h2>
          </div>
          <p>
            Choose a recommendation to see it on a real street map with city labels, nearby roads and a direct Google Maps link.
          </p>
        </div>
        <div class="map-layout">
          <div class="guide-map">
            <iframe
              id="map-frame"
              title="Detailed map for selected My Desert Guide recommendation"
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
              src=""
            ></iframe>
          </div>
          <aside class="map-side">
            <div id="map-detail" class="map-detail"></div>
            <div id="map-place-list" class="map-place-list" aria-label="Map locations"></div>
          </aside>
        </div>
      </section>

      <section class="section signup-section" id="alerts">
        <div>
          <p class="eyebrow">New recommendations</p>
          <h2>Get an alert when Darcey adds a new favorite.</h2>
          <p>Join the update list for fresh restaurants, golf picks and desert finds as the guide grows.</p>
        </div>
        <form class="signup-form" name="recommendation-alerts" method="POST" data-netlify="true">
          <input type="hidden" name="form-name" value="recommendation-alerts" />
          <label>
            <span>First name</span>
            <input type="text" name="first-name" autocomplete="given-name" placeholder="First name" />
          </label>
          <label>
            <span>Email</span>
            <input type="email" name="email" autocomplete="email" placeholder="you@example.com" required />
          </label>
          <button class="button dark" type="submit">${icon("mail")} Sign Up for Alerts</button>
          <p id="signup-message" class="signup-message" aria-live="polite"></p>
        </form>
      </section>

      <section class="section contact" id="contact">
        <div class="contact-main">
          <img class="contact-photo" src="./assets/people/darcey-headshot-web.jpg" alt="Darcey Deetz" />
          <div>
            <p class="eyebrow">Contact Darcey</p>
            <h2>Have a local favorite Darcey should know about?</h2>
            <p>Send the name, location and what makes it special. For real estate help, Darcey is always happy to point you in the right direction.</p>
            <div class="darcey-contact-card">
              <h3>Darcey Deetz</h3>
              <p>CA DRE 01374659</p>
              <a href="mailto:darcey@darceydeetz.com">darcey@darceydeetz.com</a>
              <a href="tel:17608081449">760-808-1449</a>
              <a href="https://darceydeetz.com" target="_blank" rel="noreferrer">darceydeetz.com</a>
            </div>
          </div>
        </div>
        <div class="contact-links">
          <a href="mailto:john@darceydeetz.com?subject=My%20Desert%20Guide%20Recommendation&body=Hi%20John%2C%0A%0AI%20have%20a%20recommendation%20for%20My%20Desert%20Guide.%0A%0AName%3A%0ALocation%3A%0ACategory%20%28restaurant%2C%20hidden%20gem%2C%20golf%20course%2C%20etc.%29%3A%0AWhat%20makes%20it%20special%3A%0AWebsite%20or%20Instagram%20%28if%20available%29%3A%0A%0AThank%20you!" class="submit-link">Submit a Recommendation</a>
          <a href="mailto:john@darceydeetz.com?subject=Restaurant%20Recommendation%20for%20My%20Desert%20Guide">Restaurant</a>
          <a href="mailto:john@darceydeetz.com?subject=Hidden%20Gem%20for%20My%20Desert%20Guide">Hidden Gem</a>
          <a href="mailto:john@darceydeetz.com?subject=Golf%20Course%20Recommendation%20for%20My%20Desert%20Guide">Golf Course</a>
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

  document.addEventListener("click", (event) => {
    const toggle = event.target.closest(".featured-note-toggle");
    if (!toggle) return;

    const wrap = toggle.closest(".featured-note-wrap");
    const isExpanded = wrap.classList.toggle("expanded");
    toggle.setAttribute("aria-expanded", String(isExpanded));
    toggle.textContent = isExpanded ? "Show less" : "Read more";
  });

  document.querySelector(".signup-form").addEventListener("submit", (event) => {
    event.preventDefault();
    handleAlertSignup(event.currentTarget);
  });

  renderListings();
  renderMap();
}

render();
