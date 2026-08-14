import {
  assets,
  categories,
  filters,
  golfCourses,
  professionals,
  realtorProfile,
  restaurants,
  services,
  shopping,
  thingsToDo,
} from "./data.js?v=20260814-new-hero-art";

const app = document.querySelector("#app");

const state = {
  query: "",
  activeFilter: "All",
  sort: "Highest Darcey Rating",
  activeMapPlace: null,
};

const preferredRestaurantOrder = ["Lulu", "Spencer's", "Palmina by Puglia", "Giuseppe's"];
const dateNightNames = ["Spencer's", "Copley's", "Giuseppe's", "Mitch's", "California Bistro"];
const happyHourNames = ["Lulu", "Giuseppe's", "Cactus Jack's", "California Bistro", "Bubba's Bones & Brews"];
const featuredHappyHourNames = ["Lulu", "Giuseppe's"];
const featuredGolfNames = ["Indian Canyons Golf Resort", "The Classic Club"];
const featuredThingsNames = ["VillageFest", "The Living Desert"];
const featuredShoppingNames = ["Gelson's Rancho Mirage", "World Market"];
const featuredProfessionalNames = ["The Buttercake Studio", "Mr. Beez Termite & Pest Control"];
const homepageCuratedFavorites = [
  { item: restaurants.find((place) => place.name === "Spencer's"), category: "Food & Drink", categoryHref: "/food-drink/", type: "Restaurant" },
  { item: golfCourses.find((place) => place.name === "The Classic Club"), category: "Golf", categoryHref: "/golf/", type: "GolfCourse" },
  { item: thingsToDo.find((place) => place.name === "The Living Desert"), category: "Things to Do", categoryHref: "/things-to-do/", type: "TouristAttraction" },
  { item: shopping.find((place) => place.name === "World Market"), category: "Shopping", categoryHref: "/shopping/", type: "Store" },
].filter(({ item }) => Boolean(item));
const featuredRestaurantsByFilter = {
  American: ["Lulu", "Tony's Grill and Bar"],
  "Date Night": ["Spencer's", "California Bistro"],
  "Happy Hour": featuredHappyHourNames,
  Italian: ["Palmina by Puglia", "Giuseppe's"],
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
    state.activeFilter === "All" ? [] : featuredRestaurantsForFilter(state.activeFilter);
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
    if (state.activeFilter === "All") {
      const aIndex = preferredRestaurantOrder.indexOf(a.name);
      const bIndex = preferredRestaurantOrder.indexOf(b.name);
      if (aIndex !== -1 || bIndex !== -1) {
        return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
      }
    }
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
    ...shopping.map((item) => ({ ...item, type: "Shopping" })),
  ];
}

function mapPlaces() {
  return [
    ...restaurants.map((item) => ({ ...item, type: "Restaurant" })),
    ...golfCourses.map((item) => ({ ...item, type: "Golf" })),
    ...thingsToDo.map((item) => ({ ...item, type: "Thing To Do" })),
    ...shopping.map((item) => ({ ...item, type: "Shopping" })),
  ].sort((a, b) => a.location.localeCompare(b.location) || a.name.localeCompare(b.name));
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

function pickShopping(names) {
  return names
    .map((name) => shopping.find((place) => place.name === name))
    .filter(Boolean);
}

function pickProfessionals(names) {
  return names
    .map((name) => professionals.find((professional) => professional.name === name))
    .filter(Boolean);
}

function googleMapEmbed(place) {
  return `https://www.google.com/maps?q=${encodeURIComponent(`${place.name} ${place.location} CA`)}&output=embed`;
}

function attr(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function placeSlug(value = "") {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function analyticsAttrs(item, type) {
  const image = item.image || item.images?.[0] || "";
  return `data-guide-place="${attr(item.name)}" data-guide-category="${attr(
    item.category || type,
  )}" data-guide-type="${attr(type)}" data-guide-slug="${placeSlug(item.name)}" data-track-impression="true" data-guide-image="${attr(image)}" data-guide-rating="${attr(
    item.rating || "",
  )}"`;
}

function curatedFavoritesSection() {
  return `
    <section class="section home-curated" aria-label="Curated favorites">
      <div class="section-heading home-curated-heading">
        <div>
          <p class="eyebrow">Curated Favorites</p>
          <h2>A taste of Darcey's desert.</h2>
        </div>
        <p>A few standout recommendations across the guide—each one personally worth sharing.</p>
      </div>
      <div class="home-curated-grid">
        ${homepageCuratedFavorites.map(({ item, category, categoryHref, type }) => {
          const slug = placeSlug(item.name);
          return `
            <article class="home-curated-card" data-guide-place="${attr(item.name)}" data-guide-category="${attr(category)}" data-guide-type="${attr(type)}" data-guide-slug="${slug}" data-category-slug="${categoryHref.replaceAll("/", "")}" data-guide-image="${attr(item.image)}" data-guide-rating="${attr(item.rating || "")}">
              <a class="home-curated-card-link" href="/place/${slug}/" aria-label="View Darcey's recommendation for ${attr(item.name)}" data-analytics-event="curated_favorite_click" data-analytics-category="${attr(category)}" data-analytics-label="${attr(item.name)}"></a>
              <div class="home-curated-media"><img src="${item.image}" alt="${attr(item.name)}" loading="lazy" decoding="async" /></div>
              <div class="featured-content">
                <p class="eyebrow">${attr(category)} · ${attr(item.location || "Coachella Valley")}</p>
                <h3>${attr(item.name)}</h3>
                <p>${attr(item.description)}</p>
                <a class="home-curated-category-link" href="${categoryHref}" data-category-link data-category-name="${attr(category)}" data-category-slug="${categoryHref.replaceAll("/", "")}">Explore ${attr(category)} <span aria-hidden="true">→</span></a>
              </div>
            </article>`;
        }).join("")}
      </div>
    </section>`;
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
    message:
      '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"></path>',
    phone:
      '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z"></path>',
  };
  return `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg>`;
}

function contactActionLinks(className = "") {
  return `
    <div class="contact-actions ${className}" aria-label="Contact ${realtorProfile.firstName}">
      <a href="sms:${realtorProfile.phoneHref}">${icon("message")}<span>Text Darcey</span></a>
      <a href="tel:${realtorProfile.phoneHref}">${icon("phone")}<span>Call Darcey</span></a>
      <a href="mailto:${realtorProfile.email}">${icon("mail")}<span>Email Darcey</span></a>
    </div>
  `;
}

function expandableTip(label, text) {
  if (text.length < 165) {
    return `<div class="tip"><strong>${label}</strong><span>${text}</span></div>`;
  }

  return `
    <div class="tip tip-note-wrap">
      <strong>${label}</strong>
      <span class="tip-note">${text}</span>
      <button class="tip-note-toggle" type="button" aria-expanded="false">Read more</button>
    </div>
  `;
}

function restaurantCard(item) {
  return `
    <article class="listing-card" ${analyticsAttrs(item, "Restaurant")}>
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
        ${expandableTip("Darcey's Insider Tip", item.tip)}
        <div class="link-row">
          <a href="${item.website}" target="_blank" rel="noreferrer">Website</a>
          <a href="${item.menu}" target="_blank" rel="noreferrer">Menu</a>
          <a href="${item.maps}" target="_blank" rel="noreferrer">Google Maps</a>
        </div>
      </div>
    </article>
  `;
}

function golfCard(item) {
  return `
    <article class="listing-card golf-card" ${analyticsAttrs(item, "Golf")}>
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
        ${expandableTip("Darcey's Golf Tip", item.tip)}
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
  const imageTone = item.imageStyle === "photo" ? " service-image-photo" : "";
  const tipLabel = item.category === "Electric" || item.category === "Water" || item.category === "Electric & Water"
    ? "Darcey's Setup Tip"
    : "Darcey's Tip";
  const serviceImages = item.images?.length
    ? `<div class="service-image-grid">${item.images
        .map((image) => `<img src="${image}" alt="${item.name}" loading="lazy" />`)
        .join("")}</div>`
    : `<img src="${item.image}" alt="${item.name} logo" loading="lazy" />`;

  return `
    <article class="listing-card service-listing-card" ${analyticsAttrs(item, "Service")}>
      <div class="listing-image service-image${imageTone}">
        ${serviceImages}
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
        ${expandableTip(tipLabel, item.tip)}
        <div class="link-row">
          ${item.website ? `<a href="${item.website}" target="_blank" rel="noreferrer">Website</a>` : ""}
          ${item.phone ? `<a href="tel:${item.phone.replace(/\D/g, "")}">Call ${item.phone}</a>` : ""}
          ${item.email ? `<a href="mailto:${item.email}">Email</a>` : ""}
          ${item.maps ? `<a href="${item.maps}" target="_blank" rel="noreferrer">Google Maps</a>` : ""}
        </div>
      </div>
    </article>
  `;
}

function thingToDoCard(item) {
  return `
    <article class="listing-card thing-card" ${analyticsAttrs(item, "Thing To Do")}>
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
        ${expandableTip("Darcey's Pro Tip", item.tip)}
        <div class="link-row">
          <a href="${item.website}" target="_blank" rel="noreferrer">Website</a>
          <a href="${item.maps}" target="_blank" rel="noreferrer">Google Maps</a>
        </div>
      </div>
    </article>
  `;
}

function shoppingCard(item) {
  return `
    <article class="listing-card shopping-card" ${analyticsAttrs(item, "Shopping")}>
      <div class="listing-image">
        <img src="${item.image}" alt="${item.name} shopping destination" loading="lazy" />
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
        ${expandableTip("Darcey's Shopping Tip", item.tip)}
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
      ${item.phone ? `<a href="tel:${item.phone.replace(/\D/g, "")}">Call ${item.phone}</a>` : ""}
      ${item.email ? `<a href="mailto:${item.email}">Email</a>` : ""}
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
  const cardTone = item.imageStyle === "photo" ? " featured-pick-photo" : "";
  const media = item.images?.length
    ? `<div class="featured-media-gallery">${item.images
        .map((image) => `<img src="${image}" alt="${item.name} featured image" loading="lazy" />`)
        .join("")}</div>`
    : `<img src="${item.image}" alt="${item.name} featured image" loading="lazy" />`;

  return `
    <article class="featured-pick-card${cardTone}" ${analyticsAttrs(
      item,
      label.replace(/^Featured\s+/, "") || "Featured",
    )}>
      <div class="featured-media">
        ${media}
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

function thingsFeaturedListings() {
  const featured = pickThingsToDo(featuredThingsNames);
  return `
    <div class="featured-listings things-featured-listings" aria-label="Featured Things To Do listings">
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
        <article class="category-featured-card" ${analyticsAttrs(item, "Restaurant")}>
          <img src="${item.image}" alt="${item.name} featured restaurant" loading="lazy" />
          <div class="category-featured-content">
            <div class="category-featured-topline">
              <span>Featured</span>
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
            <span>Featured</span>
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
  const featured = pickRestaurants(featuredHappyHourNames);
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
      <div class="featured-listings" aria-label="Featured Happy Hour listings">
        ${featured
          .map((restaurant) => featuredSpotlightCard(restaurant, "Featured Happy Hour", restaurant.tip))
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

function shoppingSection() {
  const featured = pickShopping(featuredShoppingNames);
  return `
    <section class="section spotlight-section shopping-section" id="shopping">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Shopping</p>
          <h2>Darcey's favorite places to browse, shop and linger.</h2>
        </div>
        <p>
          A few local shopping stops worth knowing, from gourmet markets and entertaining shortcuts
          to home finds, gifts and little discoveries that make desert living more fun.
        </p>
      </div>
      <div class="featured-listings" aria-label="Featured Shopping listings">
        ${featured
          .map((place) => featuredSpotlightCard(place, "Featured Shopping", place.tip))
          .join("")}
      </div>
      <div class="listing-grid">
        ${shopping
          .filter((place) => !featured.some((item) => item.name === place.name))
          .map(shoppingCard)
          .join("")}
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

const professionalCategoryOrder = [
  "Landscaping & Garden Care",
  "Pool Service",
  "Mortgage Lending",
  "Pest Control",
  "Insurance",
  "Cable & Internet",
  "Garbage & Recycling",
  "Tax Services",
  "Custom Cakes & Desserts",
];

function groupedProfessionalCards(items) {
  const groups = items.reduce((collection, item) => {
    const category = item.category || "Trusted Professionals";
    if (!collection.has(category)) collection.set(category, []);
    collection.get(category).push(item);
    return collection;
  }, new Map());
  const orderedCategories = [
    ...professionalCategoryOrder.filter((category) => groups.has(category)),
    ...Array.from(groups.keys()).filter((category) => !professionalCategoryOrder.includes(category)),
  ];

  return orderedCategories
    .map(
      (category) => `
        <div class="professional-group">
          <div class="professional-group-heading">
            <h3>${category}</h3>
          </div>
          <div class="listing-grid">
            ${groups.get(category).map(serviceCard).join("")}
          </div>
        </div>
      `,
    )
    .join("");
}

function professionalsSection() {
  const featured = pickProfessionals(featuredProfessionalNames);
  const regularProfessionals = professionals.filter(
    (professional) => !featured.some((item) => item.name === professional.name),
  );
  return `
    <section class="section professionals-section" id="professionals">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Darcey's Trusted Professionals</p>
          <h2>Local Pros</h2>
        </div>
        <p>
          Trusted local professionals for your home and peace of mind. From insurance contacts and home service providers
          to reliable local experts, these are the people I confidently recommend to help make life in the desert a little easier.
        </p>
      </div>
      <div class="featured-listings" aria-label="Featured Trusted Professional listings">
        ${featured
          .map((professional) => featuredSpotlightCard(professional, "Featured Professional", professional.tip))
          .join("")}
      </div>
      <div class="professional-groups">
        ${groupedProfessionalCards(regularProfessionals)}
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

function render() {
  app.innerHTML = `
    <main id="top">
      <section class="hero hero-image-map" aria-label="My Desert Guide featured navigation">
        <img
          class="hero-art hero-art-desktop"
          src="${assets.hero}"
          alt="My Desert Guide featuring Darcey Deetz and a Palm Springs desert landscape"
          fetchpriority="high"
          decoding="async"
        />
        <img
          class="hero-art hero-art-mobile"
          src="${assets.heroMobile}"
          alt=""
          aria-hidden="true"
          decoding="async"
        />
        <header class="hero-live-header">
          <a class="hero-live-brand" href="#top">My Desert Guide <span aria-hidden="true">♥</span></a>
          <nav class="hero-live-nav" aria-label="Primary guide navigation">
            <a href="/food-drink/" data-category-link data-category-name="Food &amp; Drink" data-category-slug="food-drink">Food &amp; Drink</a>
            <a href="/golf/" data-category-link data-category-name="Golf" data-category-slug="golf">Golf</a>
            <a href="/things-to-do/" data-category-link data-category-name="Things to Do" data-category-slug="things-to-do">Things to Do</a>
            <a href="/shopping/" data-category-link data-category-name="Shopping" data-category-slug="shopping">Shopping</a>
          </nav>
          <details class="hero-mobile-menu">
            <summary>Menu</summary>
            <nav aria-label="Mobile guide navigation">
              <a href="/food-drink/" data-category-link data-category-name="Food &amp; Drink" data-category-slug="food-drink">Food &amp; Drink</a>
              <a href="/golf/" data-category-link data-category-name="Golf" data-category-slug="golf">Golf</a>
              <a href="/things-to-do/" data-category-link data-category-name="Things to Do" data-category-slug="things-to-do">Things to Do</a>
              <a href="/shopping/" data-category-link data-category-name="Shopping" data-category-slug="shopping">Shopping</a>
            </nav>
          </details>
        </header>
        <div class="hero-live-copy">
          <p class="hero-kicker">Your Guide to</p>
          <h1>The Desert</h1>
          <div class="hero-divider" aria-hidden="true"><span>♥</span></div>
          <p class="hero-description">
            <span class="hero-description-desktop">Food &amp; drink, happy hours, golf, things to do, trusted local pros, and all the best of desert living—recommended by <em>Darcey.</em></span>
            <span class="hero-description-mobile">Food &amp; drink, happy hours, golf, things to do, trusted local pros, and all the best of desert living—recommended by <em>Darcey.</em></span>
          </p>
          <div class="hero-curator hero-curator-mobile" aria-label="${realtorProfile.fullName}, ${realtorProfile.professionalIdentifier}">
            <p class="hero-curator-name">${realtorProfile.curatorLabel} ${realtorProfile.fullName}</p>
            <p class="hero-curator-role">${realtorProfile.professionalIdentifier}</p>
          </div>
          <div class="hero-live-actions">
            <a class="button dark hero-explore" href="#browse-guide" data-analytics-event="explore_desert_click" data-analytics-category="Homepage" data-analytics-label="Explore the Desert">Explore the Desert</a>
            <a class="button hero-about" href="#about-darcey">About Darcey</a>
          </div>
          <nav class="hero-mobile-nav" aria-label="Mobile guide categories">
            <a href="/food-drink/" data-category-link data-category-name="Food &amp; Drink" data-category-slug="food-drink">Food &amp; Drink</a>
            <a href="/golf/" data-category-link data-category-name="Golf" data-category-slug="golf">Golf</a>
            <a href="/things-to-do/" data-category-link data-category-name="Things to Do" data-category-slug="things-to-do">Things to Do</a>
            <a href="/shopping/" data-category-link data-category-name="Shopping" data-category-slug="shopping">Shopping</a>
          </nav>
          ${contactActionLinks("hero-contact-actions")}
          <a class="hero-mobile-curated" href="#browse-guide">
            <span aria-hidden="true">☆</span> Curated Favorites
          </a>
        </div>
        <a class="hero-hotspot hotspot-header-food" href="/food-drink/" aria-label="Food &amp; Drink" data-category-link data-category-name="Food &amp; Drink" data-category-slug="food-drink"></a>
        <a class="hero-hotspot hotspot-header-golf" href="/golf/" aria-label="Golf" data-category-link data-category-name="Golf" data-category-slug="golf"></a>
        <a class="hero-hotspot hotspot-header-things" href="/things-to-do/" aria-label="Things to Do" data-category-link data-category-name="Things to Do" data-category-slug="things-to-do"></a>
        <a class="hero-hotspot hotspot-header-shopping" href="/shopping/" aria-label="Shopping" data-category-link data-category-name="Shopping" data-category-slug="shopping"></a>
        <a class="hero-hotspot hotspot-header-utilities" href="/utilities/" aria-label="Utilities" data-category-link data-category-name="Utilities" data-category-slug="utilities"></a>
        <a class="hero-hotspot hotspot-header-trusted" href="/trusted-professionals/" aria-label="Trusted Professionals" data-category-link data-category-name="Trusted Professionals" data-category-slug="trusted-professionals"></a>
        <a class="hero-hotspot hotspot-header-text" href="sms:${realtorProfile.phoneHref}" aria-label="Text Darcey"></a>
        <a class="hero-hotspot hotspot-header-call" href="tel:${realtorProfile.phoneHref}" aria-label="Call Darcey"></a>
        <a class="hero-hotspot hotspot-header-email" href="mailto:${realtorProfile.email}" aria-label="Email Darcey"></a>
        <a class="hero-hotspot hotspot-explore" href="#browse-guide" aria-label="Explore the Desert" data-analytics-event="explore_desert_click" data-analytics-category="Homepage" data-analytics-label="Explore the Desert"></a>
        <a class="hero-hotspot hotspot-about" href="#about-darcey" aria-label="About Darcey"></a>
        <a class="hero-hotspot hotspot-connect-text" href="sms:${realtorProfile.phoneHref}" aria-label="Text Darcey"></a>
        <a class="hero-hotspot hotspot-connect-call" href="tel:${realtorProfile.phoneHref}" aria-label="Call Darcey"></a>
        <a class="hero-hotspot hotspot-connect-email" href="mailto:${realtorProfile.email}" aria-label="Email Darcey"></a>
      </section>

      <section class="section guide-categories" id="browse-guide" aria-label="Guide categories">
        <div class="category-heading">
          <div class="category-heading-desktop">
            <p class="eyebrow">Browse the guide</p>
            <h2>Start with what you need.</h2>
          </div>
          <div class="category-heading-mobile">
            <p class="eyebrow">Start with what you need</p>
            <h2>Explore by category</h2>
            <div class="category-heading-divider" aria-hidden="true"><span>♥</span></div>
          </div>
        </div>
        <div class="category-strip">
          ${categories
            .map(
              (category) => `
                <a href="${category.href}" class="category-tile" data-category-link data-category-name="${category.label}" data-category-slug="${category.href.replaceAll("/", "")}">
                  <img
                    src="${category.image}"
                    srcset="${category.imageSmall} 480w, ${category.image} 900w"
                    sizes="(max-width: 760px) calc(50vw - 28px), (max-width: 1050px) calc(33vw - 28px), calc(33vw - 52px)"
                    alt="${category.alt}"
                    loading="lazy"
                    decoding="async"
                  />
                  <span class="category-tile-overlay" aria-hidden="true"></span>
                  <strong>${category.label}</strong>
                  <span class="category-explore">Explore <span aria-hidden="true">→</span></span>
                </a>
              `,
            )
            .join("")}
        </div>
      </section>

      <section class="section intro welcome-note" id="about-darcey">
        <img class="darcey-note-photo" src="${realtorProfile.headshot}" alt="${realtorProfile.fullName} smiling in the desert" />
        <div>
          <p class="eyebrow">A note from Darcey</p>
          <h2>A personal guide to the desert <span class="no-break">I love.</span></h2>
        </div>
        <div class="welcome-copy">
          <p class="welcome-summary">My Desert Guide is a collection of the food, golf, local businesses, and experiences I genuinely recommend to clients, friends, and family.</p>
          <div class="welcome-details" id="darcey-bio-details" aria-hidden="true">
            <p>Every favorite is chosen because it is somewhere I would happily send the people I care about most.</p>
            <p>Consider this my personal welcome to the Coachella Valley—and an invitation to experience the desert like a local.</p>
          </div>
          <button class="bio-toggle" id="bio-toggle" type="button" aria-expanded="false" aria-controls="darcey-bio-details">Read More</button>
        </div>
      </section>

      <section
        class="section real-estate-cta"
        id="contact"
        aria-label="Coachella Valley real estate with Darcey"
        data-analytics-impression="real_estate_cta_impression"
        data-analytics-category="Real Estate"
        data-analytics-label="Homepage real estate CTA"
      >
        <div class="real-estate-lead">
          <div class="darcey-cta-card">
            <img class="darcey-cta-photo" src="${realtorProfile.portrait}" alt="${realtorProfile.fullName}" />
            <p class="dre-line">${realtorProfile.fullName} · ${realtorProfile.dre}</p>
          </div>
          <div>
            <p class="eyebrow">Love Where You Live</p>
            <h2>Thinking about making the desert home?</h2>
          </div>
        </div>
        <div class="real-estate-copy">
          <p>Whether you're buying, selling, or simply exploring what's possible, Darcey can help you navigate Coachella Valley real estate with the same local knowledge behind this guide.</p>
          <div class="real-estate-actions">
            <a class="button dark" href="${realtorProfile.homeSearchUrl}" target="_blank" rel="noreferrer" data-analytics-event="real_estate_home_search_click" data-analytics-category="Real Estate" data-analytics-label="Explore Desert Homes">Explore Desert Homes</a>
            <a class="real-estate-talk-link" href="sms:${realtorProfile.phoneHref}" data-analytics-event="real_estate_contact_click" data-analytics-category="Real Estate" data-analytics-label="Talk With Darcey">Talk With Darcey <span aria-hidden="true">→</span></a>
          </div>
        </div>
      </section>

      ${curatedFavoritesSection()}

      <section class="section home-install-card" data-install-card hidden aria-label="Add Darcey's Guide to your phone">
        <div>
          <p class="eyebrow">Take Darcey's Guide With You ♡</p>
          <h2>Add the guide to your phone.</h2>
          <p>Keep Darcey's favorite places, local recommendations and trusted resources close whenever you need them.</p>
        </div>
        <button class="button dark" type="button" data-install-button>Add to My Phone</button>
      </section>

      <footer class="home-footer">
        <div>
          <a class="home-footer-brand" href="#top">My Desert Guide <span aria-hidden="true">♥</span></a>
          <p>Darcey's personal guide to the best of desert living.</p>
        </div>
        <nav class="home-footer-nav" aria-label="Footer guide navigation">
          ${categories.map((category) => `<a href="${category.href}" data-category-link data-category-name="${category.label}" data-category-slug="${category.href.replaceAll("/", "")}">${category.label}</a>`).join("")}
        </nav>
        <div class="home-footer-contact">
          <a href="/saved/">Saved Places ♡</a>
          <a href="sms:${realtorProfile.phoneHref}">Text Darcey</a>
          <a href="tel:${realtorProfile.phoneHref}">Call Darcey</a>
          <a href="mailto:${realtorProfile.email}">Email Darcey</a>
        </div>
        <p class="home-footer-legal">${realtorProfile.fullName} · ${realtorProfile.dre} · ${realtorProfile.brokerage} · ${realtorProfile.brokerageDre}</p>
      </footer>
    </main>
  `;

  document.querySelector("#bio-toggle").addEventListener("click", (event) => {
    const details = document.querySelector("#darcey-bio-details");
    const isExpanded = details.classList.toggle("expanded");
    details.setAttribute("aria-hidden", String(!isExpanded));
    event.currentTarget.setAttribute("aria-expanded", String(isExpanded));
    event.currentTarget.textContent = isExpanded ? "Show Less" : "Read More";
  });

  document.addEventListener("click", (event) => {
    const toggle = event.target.closest(".featured-note-toggle, .tip-note-toggle");
    if (!toggle) return;

    const wrap = toggle.closest(".featured-note-wrap, .tip-note-wrap");
    const isExpanded = wrap.classList.toggle("expanded");
    toggle.setAttribute("aria-expanded", String(isExpanded));
    toggle.textContent = isExpanded ? "Show less" : "Read more";
  });

}

const legacyCategoryRoutes = {
  "#guide": "/food-drink/",
  "#restaurants": "/food-drink/",
  "#date-night": "/food-drink/",
  "#happy-hour": "/food-drink/",
  "#golf": "/golf/",
  "#things-to-do": "/things-to-do/",
  "#shopping": "/shopping/",
  "#utilities": "/utilities/",
  "#professionals": "/trusted-professionals/",
  "#map": "/#browse-guide",
};

const legacyCategoryRoute = legacyCategoryRoutes[window.location.hash.toLowerCase()];
if (legacyCategoryRoute) window.location.replace(legacyCategoryRoute);
else render();
