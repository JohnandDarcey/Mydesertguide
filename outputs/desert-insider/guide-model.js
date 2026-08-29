import {
  golfCourses,
  professionals,
  restaurants,
  services,
  shopping,
  spaBeauty,
  thingsToDo,
  utilityCities,
  utilityServiceAreas,
} from "./data.js";

export const guideProfile = {
  guideId: "darcey-my-desert-guide",
  profileId: "darcey-deetz",
  guideName: "Darcey's Guide",
  siteName: "My Desert Guide",
  realtorName: "Darcey Deetz",
  curatorLabel: "Curated by",
  professionalIdentifier: "Palm Springs & Coachella Valley Realtor®",
  realtorDre: "CA DRE 01374659",
  brokerage: "Pinnacle Realty Advisors",
  brokerageDre: "CA DRE 02220139",
  phoneDisplay: "760-808-1449",
  phoneHref: "+17608081449",
  email: "darcey@darceydeetz.com",
  website: "https://darceydeetz.com",
  homeSearchUrl: "https://darceydeetz.com/home-search/listings",
  siteUrl: "https://mydesertguide.com",
};

export function slugify(value = "") {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const definitions = [
  {
    slug: "food-drink",
    label: "Food & Drink",
    eyebrow: "Eat and drink well",
    intro: "Darcey's personal picks for memorable dinners, lively happy hours, easy brunches and dependable local favorites.",
    image: "/assets/category-cards/food-drink-900.jpg",
    imageAlt: "Outdoor dining in the Palm Springs area",
    schemaType: "Restaurant",
    collection: restaurants,
  },
  {
    slug: "golf",
    label: "Golf",
    eyebrow: "Desert golf",
    intro: "Beautiful courses Darcey recommends for mountain views, excellent conditions, strong value and a complete desert day.",
    image: "/assets/category-cards/golf-900.jpg",
    imageAlt: "A desert golf course framed by palms and mountains",
    schemaType: "GolfCourse",
    collection: golfCourses,
  },
  {
    slug: "things-to-do",
    label: "Things to Do",
    eyebrow: "Make a desert day",
    intro: "The experiences Darcey chooses for visiting friends, family days, culture, scenery and a true sense of the Coachella Valley.",
    image: "/assets/category-cards/things-to-do-900.jpg",
    imageAlt: "The Palm Springs Aerial Tramway above the desert",
    schemaType: "TouristAttraction",
    collection: thingsToDo,
  },
  {
    slug: "shopping",
    label: "Shopping",
    eyebrow: "Find something special",
    intro: "A curated mix of places worth browsing, from Palm Springs gifts and design finds to golf gear, familiar favorites and El Paseo style.",
    image: "/assets/category-cards/shopping-900.jpg",
    imageAlt: "Shopping for home and entertaining finds in Palm Springs",
    schemaType: "Store",
    collection: shopping,
  },
  {
    slug: "spa-beauty",
    label: "Spa & Beauty",
    eyebrow: "Relax and refresh",
    intro: "A curated edit of desert spas, nail care, hair and beauty professionals for a little restoration, polish and self-care.",
    image: "/assets/spa-beauty/the-spa-at-seche.jpg",
    imageAlt: "A private mineral bath at The Spa at Séc-he in Palm Springs",
    schemaType: "HealthAndBeautyBusiness",
    collection: spaBeauty,
  },
  {
    slug: "utilities",
    label: "Utilities Setup",
    eyebrow: "Settle in smoothly",
    intro: "Choose your city to find the electric, gas, water, internet and cable providers that typically serve your Coachella Valley home.",
    image: "/assets/category-cards/local-utilities-900.jpg",
    imageAlt: "A beautifully maintained desert neighborhood",
    schemaType: "Organization",
    collection: services,
  },
  {
    slug: "trusted-professionals",
    label: "Trusted Professionals",
    eyebrow: "People Darcey trusts",
    intro: "Local professionals and service providers Darcey is comfortable recommending to clients, friends and family.",
    image: "/assets/services/chicago-title-team.png",
    imageAlt: "Christian and Shana Bailey of Chicago Title in Palm Springs",
    schemaType: "ProfessionalService",
    collection: professionals,
  },
];

function usefulTags(item) {
  const explicit = Array.isArray(item.tags) ? item.tags.filter((tag) => tag !== "Favorites") : [];
  const derived = [item.category, ...(item.serviceAreas || []), ...(item.aliases || [])];
  if (item.bestFor) {
    derived.push(
      ...String(item.bestFor)
        .split(/,|\band\b/i)
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 2 && tag.length < 34),
    );
  }
  return [...new Set([...explicit, ...derived].filter(Boolean))].slice(0, 5);
}

function absoluteAsset(path = "") {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return path.replace(/^\.\//, "/");
}

function experienceTypes(item, category) {
  const tags = Array.isArray(item.tags) ? item.tags : [];
  const searchable = [item.name, item.category, item.bestFor, ...tags].filter(Boolean).join(" ").toLowerCase();
  const isFavorite = Boolean(item.isFavorite || Number(item.rating) >= 5);
  const experiences = [];

  if (category.slug === "food-drink") {
    if (!searchable.includes("coffee")) experiences.push("Dinner");
    if (searchable.includes("happy hour")) experiences.push("Happy Hour");
    if (searchable.includes("brunch") || searchable.includes("breakfast")) experiences.push("Brunch");
    if (searchable.includes("coffee")) experiences.push("Coffee");
    if (searchable.includes("casual")) experiences.push("Casual");
    if (searchable.includes("patio") || searchable.includes("outdoor seating")) experiences.push("Patio Dining");
  }

  if (category.slug === "things-to-do") {
    const isHiking = searchable.includes("hiking") || searchable.includes("outdoor activity");
    if (isHiking) experiences.push("Outdoors");
    if (
      !isHiking && (
        searchable.includes("art & culture") ||
        searchable.includes("aviation history") ||
        searchable.includes("gardens & culture") ||
        searchable.includes("architecture")
      )
    ) experiences.push("Arts & Culture");
    if (["Indian Canyons", "Tahquitz Canyon", "The Living Desert", "Desert View Loop / Palm Springs Aerial Tramway", "Sunnylands"].includes(item.name)) experiences.push("Desert Experiences");
    if (searchable.includes("sports & entertainment") || searchable.includes("holiday event") || searchable.includes("street fair") || searchable.includes("live music")) experiences.push("Entertainment");
    if (item.name === "VillageFest") experiences.push("Markets & Local Life");
    if (["The Living Desert", "Palm Springs Air Museum", "Coachella Valley Firebirds", "Palm Springs Festival of Lights Parade", "VillageFest"].includes(item.name)) experiences.push("Family");
  }

  if (category.slug === "shopping") {
    if (searchable.includes("fashion") || searchable.includes("women's") || searchable.includes("boutique")) experiences.push("Fashion");
    if (searchable.includes("gift") || searchable.includes("souvenir") || searchable.includes("sweets")) experiences.push("Gifts");
    if (searchable.includes("home") || searchable.includes("design")) experiences.push("Home + Design");
    if (searchable.includes("art") || searchable.includes("vintage") || searchable.includes("midcentury")) experiences.push("Art + Vintage");
    if (searchable.includes("golf") || searchable.includes("sporting goods")) experiences.push("Golf + Sport");
    if (searchable.includes("luxury") || searchable.includes("el paseo")) experiences.push("Luxury");
    if (searchable.includes("familiar favorite") || searchable.includes("department store")) experiences.push("Familiar Favorites");
  }

  if (isFavorite) experiences.push("Darcey's Favorites");
  return [...new Set(experiences)];
}

function normalizePlace(item, category) {
  const slug = item.slug || slugify(item.name);
  const normalizedTags = usefulTags(item);
  const normalizedExperiences = experienceTypes(item, category);
  return {
    guideId: guideProfile.guideId,
    profileId: guideProfile.profileId,
    placeId: `place-${slug}`,
    recommendationId: `${guideProfile.guideId}:place-${slug}`,
    slug,
    url: `/place/${slug}/`,
    name: item.name,
    city: item.location || "",
    category: category.label,
    categorySlug: category.slug,
    subcategory: item.category || "",
    description: item.description || "",
    cardDescription: item.cardDescription,
    darceysTake: item.tip || "",
    tags: normalizedTags,
    experienceTypes: normalizedExperiences,
    attributes: normalizedTags.filter((tag) => !normalizedExperiences.includes(tag) && tag !== item.location && tag !== item.category),
    editorialLabels: [item.featuredLabel, item.hikingPickLabel, item.coffeePickLabel, item.familiarFavoriteLabel].filter(Boolean),
    isFavorite: Boolean(item.isFavorite || Number(item.rating) >= 5),
    isNew: Boolean(item.isNew),
    image: absoluteAsset(item.image || item.images?.[0] || category.image),
    images: (item.images || []).map(absoluteAsset),
    brandLogo: item.brandLogo ? absoluteAsset(item.brandLogo) : undefined,
    imageAlt: item.imageAlt || `${item.name}${item.location ? ` in ${item.location}` : ""}`,
    address: item.address || "",
    phone: item.phone || "",
    email: item.email || "",
    website: item.website || "",
    menu: item.menu || "",
    directions: item.maps || "",
    teeTime: item.teeTime || "",
    hours: item.hours || "",
    latitude: Number.isFinite(item.latitude) ? item.latitude : null,
    longitude: Number.isFinite(item.longitude) ? item.longitude : null,
    rating: item.rating || null,
    detail: item.detail || "",
    bestFor: item.bestFor || "",
    favoriteDish: item.favoriteDish || "",
    happyHour: item.happyHour || "",
    restaurant: item.restaurant || "",
    providerId: item.providerId || "",
    aliases: item.aliases || [],
    serviceAreas: item.serviceAreas || [],
    additionalLocations: item.additionalLocations || [],
    startServiceUrl: item.startServiceUrl || "",
    availabilityUrl: item.availabilityUrl || "",
    primaryAction: item.primaryAction || "",
    websiteLabel: item.websiteLabel,
    websiteAnalyticsEvent: item.websiteAnalyticsEvent,
    directionsLabel: item.directionsLabel,
    quickInfo: Array.isArray(item.quickInfo) ? item.quickInfo : undefined,
    goodToKnow: item.goodToKnow,
    photoCredit: item.photoCredit,
    hikingPickLabel: item.hikingPickLabel,
    coffeePickLabel: item.coffeePickLabel,
    familiarFavoriteLabel: item.familiarFavoriteLabel,
    featuredLabel: item.featuredLabel,
    schemaType: item.schemaType || category.schemaType,
  };
}

export const categoryDefinitions = definitions.map(({ collection, ...category }) => ({
  ...category,
  places: collection.map((item) => normalizePlace(item, category)),
}));

export const allPlaces = categoryDefinitions.flatMap((category) => category.places);

export const utilityProviders = categoryDefinitions.find((category) => category.slug === "utilities")?.places || [];

export const utilityDirectory = {
  cities: utilityCities,
  serviceAreas: utilityServiceAreas,
  providers: utilityProviders,
};

export const masterPlaces = allPlaces.map((place) => ({
  placeId: place.placeId,
  slug: place.slug,
  name: place.name,
  city: place.city,
  category: place.category,
  categorySlug: place.categorySlug,
  subcategory: place.subcategory,
  description: place.description,
  cardDescription: place.cardDescription,
  image: place.image,
  images: place.images,
  brandLogo: place.brandLogo,
  address: place.address,
  phone: place.phone,
  email: place.email,
  website: place.website,
  menu: place.menu,
  directions: place.directions,
  teeTime: place.teeTime,
  hours: place.hours,
  latitude: place.latitude,
  longitude: place.longitude,
  schemaType: place.schemaType,
  providerId: place.providerId,
  aliases: place.aliases,
  serviceAreas: place.serviceAreas,
  additionalLocations: place.additionalLocations,
  startServiceUrl: place.startServiceUrl,
  availabilityUrl: place.availabilityUrl,
  primaryAction: place.primaryAction,
  websiteLabel: place.websiteLabel,
  websiteAnalyticsEvent: place.websiteAnalyticsEvent,
  directionsLabel: place.directionsLabel,
  quickInfo: place.quickInfo,
  goodToKnow: place.goodToKnow,
  photoCredit: place.photoCredit,
  hikingPickLabel: place.hikingPickLabel,
  coffeePickLabel: place.coffeePickLabel,
  familiarFavoriteLabel: place.familiarFavoriteLabel,
  experienceTypes: place.experienceTypes,
  attributes: place.attributes,
  editorialLabels: place.editorialLabels,
}));

export const guideRecommendations = allPlaces.map((place) => ({
  recommendationId: place.recommendationId,
  guideId: place.guideId,
  profileId: place.profileId,
  placeId: place.placeId,
  personalNote: place.darceysTake,
  tags: place.tags,
  experienceTypes: place.experienceTypes,
  attributes: place.attributes,
  editorialLabels: place.editorialLabels,
  isFavorite: place.isFavorite,
  isNew: place.isNew,
  rating: place.rating,
  bestFor: place.bestFor,
  favoriteDish: place.favoriteDish,
  happyHour: place.happyHour,
  detail: place.detail,
  quickInfo: place.quickInfo,
  goodToKnow: place.goodToKnow,
}));

export function getCategory(slug) {
  return categoryDefinitions.find((category) => category.slug === slug);
}

export function getPlace(slug) {
  return allPlaces.find((place) => place.slug === slug);
}
