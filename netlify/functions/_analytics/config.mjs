const reportRecipients = (process.env.ANALYTICS_REPORT_TO || "john@darceydeetz.com,darcey@darceydeetz.com")
  .split(",")
  .map((email) => email.trim())
  .filter(Boolean);

const leadRecipients = (process.env.LEAD_NOTIFICATION_TO || process.env.ANALYTICS_REPORT_TO || "john@darceydeetz.com,darcey@darceydeetz.com")
  .split(",")
  .map((email) => email.trim())
  .filter(Boolean);

export const GUIDE_CONFIG = {
  guideId: "darcey-my-desert-guide",
  profileId: "darcey-deetz",
  timezone: "America/Los_Angeles",
  siteName: "My Desert Guide",
  reportName: "My Desert Guide Daily Pulse",
  reportSubheading: "Darcey's guide performance at a glance",
  realtorName: "Darcey Deetz",
  realtorDre: "CA DRE 01374659",
  recipient: reportRecipients,
  leadRecipient: leadRecipients,
  fromEmail: process.env.ANALYTICS_FROM_EMAIL || "My Desert Guide <reports@mydesertguide.com>",
  siteUrl: (process.env.SITE_URL || process.env.URL || "https://mydesertguide.com").replace(/\/$/, ""),
  dashboardPath: "/admin/analytics.html",
};

export const TRACKED_EVENTS = new Set([
  "guide_view",
  "category_view",
  "homepage_category_click",
  "curated_favorite_click",
  "explore_desert_click",
  "place_view",
  "darcey_website_click",
  "real_estate_contact_click",
  "darcey_call_click",
  "darcey_text_click",
  "darcey_email_click",
  "maps_click",
  "business_website_click",
  "menu_click",
  "favorite_save",
  "install_cta_displayed",
  "install_cta_clicked",
  "ios_instructions_opened",
  "native_prompt_opened",
  "native_prompt_accepted",
  "native_prompt_dismissed",
  "pwa_install_confirmed",
  "pwa_standalone_launch",
  "experience_tile_clicked",
  "darceys_desert_pick_clicked",
  "recommendation_clicked",
  "recommendation_directions_click",
  "recommendation_external_click",
  "shopping_experience_tile_selected",
  "shopping_pick_clicked",
  "specialized_collection_recommendation_clicked",
  "explore_hiking_clicked",
  "explore_coffee_clicked",
  "find_starbucks_click",
  "location_filter_selected",
  "primary_filter_selected",
  "more_filter_selected",
  "utilities_page_viewed",
  "utility_check_availability_click",
  "utility_guide_download",
  "utility_phone_click",
  "utility_provider_click",
  "utility_provider_website_click",
  "utility_start_service_click",
  "real_estate_cta_impression",
  "real_estate_home_search_click",
  "lead_form_started",
  "lead_form_submitted",
  "buyer_guide_requested",
]);

export const CLIENT_ENGAGEMENT_EVENTS = new Set([
  "darcey_website_click",
  "darcey_call_click",
  "darcey_text_click",
  "darcey_email_click",
  "maps_click",
  "favorite_save",
  "real_estate_contact_click",
  "lead_form_submitted",
]);

export const EVENT_TOTAL_KEYS = {
  guide_view: "guideViews",
  category_view: "categoryViews",
  homepage_category_click: "homepageCategoryClicks",
  curated_favorite_click: "curatedFavoriteClicks",
  explore_desert_click: "exploreDesertClicks",
  place_view: "placeViews",
  darcey_website_click: "darceyWebsiteClicks",
  real_estate_contact_click: "realEstateContactClicks",
  darcey_call_click: "darceyCallClicks",
  darcey_text_click: "darceyTextClicks",
  darcey_email_click: "darceyEmailClicks",
  maps_click: "mapsClicks",
  business_website_click: "businessWebsiteClicks",
  menu_click: "menuClicks",
  favorite_save: "favoriteSaves",
  install_cta_displayed: "installCtaDisplayed",
  install_cta_clicked: "installCtaClicked",
  ios_instructions_opened: "iosInstructionsOpened",
  native_prompt_opened: "nativePromptOpened",
  native_prompt_accepted: "nativePromptAccepted",
  native_prompt_dismissed: "nativePromptDismissed",
  pwa_install_confirmed: "pwaInstallConfirmed",
  pwa_standalone_launch: "pwaStandaloneLaunches",
  real_estate_cta_impression: "realEstateCtaImpressions",
  real_estate_home_search_click: "realEstateHomeSearchClicks",
  lead_form_started: "leadFormStarts",
  lead_form_submitted: "leadSubmissions",
  buyer_guide_requested: "buyerGuideRequests",
};

const categoryImages = {
  "Food & Drink": "./assets/restaurants/spencers-patio.png",
  "Happy Hour": "./assets/ig_0e3d77dee4f981a0016a41593366a88199baafbc65d93660f5.png",
  Golf: "./assets/golf/indian-canyons-web.jpg",
  "Things To Do": "./assets/things-to-do/the-living-desert.png",
  Shopping: "./assets/world-market-palm-springs.png",
  "Local Utilities": "./assets/downloads/darceys-utility-guide.png",
  "Darcey's Trusted Professionals": "./assets/services/buttercake-studio-cake.png",
  "Local Services": "./assets/services/buttercake-studio-cake.png",
  Map: "./assets/ig_0e3d77dee4f981a0016a4158c7a0448199ba2561148808bc2a.png",
  Contact: "./assets/people/darcey-headshot-web.jpg",
};

export function dashboardUrl() {
  return `${GUIDE_CONFIG.siteUrl}${GUIDE_CONFIG.dashboardPath}`;
}

export function absoluteUrl(path = "") {
  if (!path) return `${GUIDE_CONFIG.siteUrl}/`;
  if (/^https?:\/\//i.test(path)) return path;

  const normalized = path.startsWith("./")
    ? path.slice(1)
    : path.startsWith("/")
      ? path
      : `/${path}`;

  return `${GUIDE_CONFIG.siteUrl}${normalized}`;
}

export function imageUrl(path = "", width = 900, height = 520) {
  const source = path || "./assets/ig_0e3d77dee4f981a0016a4158c7a0448199ba2561148808bc2a.png";
  if (/\.svg($|\?)/i.test(source) || /^https?:\/\//i.test(source)) {
    return absoluteUrl(source);
  }

  const normalized = source.startsWith("./")
    ? `/${source.slice(2)}`
    : source.startsWith("/")
      ? source
      : `/${source}`;
  const params = new URLSearchParams({
    url: normalized,
    w: String(width),
    h: String(height),
    fit: "cover",
    q: "74",
  });

  return `${GUIDE_CONFIG.siteUrl}/.netlify/images?${params.toString()}`;
}

export function categoryImage(category = "") {
  return categoryImages[category] || categoryImages["Food & Drink"];
}
