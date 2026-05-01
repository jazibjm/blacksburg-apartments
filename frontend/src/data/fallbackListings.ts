import type { Listing, SummaryDetails } from "../components/ListingCard";

export const fallbackListings: Listing[] = [
  {
    id: 1,
    name: "Highlands at Huckleberry Ridge",
    address: "535 Blackrock Dr, Blacksburg, VA 24060",
    price: "$1,625 - $1,835",
    beds: "1-3 Beds",
    amenities: "Pets Allowed, Fitness Center, Pool, In Unit Washer & Dryer, Clubhouse, Maintenance on site, Online Services",
    image_url: "https://images1.apartments.com/i2/SoesktHvIp-BuPWa7ri6kbquRS6HtpzgIcYc93PhLGc/117/highlands-at-huckleberry-ridge-blacksburg-va-building-photo.jpg?p=1",
    url: "https://www.apartments.com/highlands-at-huckleberry-ridge-blacksburg-va/wehdp2l/",
  },
  {
    id: 2,
    name: "Windsor Hills Apartments",
    address: "200 Hampton Ct, Blacksburg, VA 24060",
    price: "$1,184 - $2,891",
    beds: "Studio - 3 Beds",
    amenities: "Pets Allowed, Fitness Center, Pool, In Unit Washer & Dryer, Clubhouse, Maintenance on site, High-Speed Internet",
    image_url: "https://images1.apartments.com/i2/h_kzRif1M9C6SGCIQNW8Kq3zKJUFNo9t9HaUnIxUM8w/117/windsor-hills-apartments-blacksburg-va-pool.jpg?p=1",
    url: "https://www.apartments.com/windsor-hills-apartments-blacksburg-va/kdpdh28/",
  },
  {
    id: 3,
    name: "Collegiate Court Apartments",
    address: "100 Collegiate Ct, Blacksburg, VA 24060",
    price: "$3,500 - $3,900",
    beds: "4 Beds",
    amenities: "Dishwasher, Refrigerator, Kitchen, In Unit Washer & Dryer, Balcony, Range",
    image_url: "https://images1.apartments.com/i2/o4Ow-gUHCx5L6pTP0DKoJwVzD9q5GR0DBY_q7ZORWJg/117/collegiate-court-apartments-blacksburg-va-building-photo.jpg?p=1",
    url: "https://www.apartments.com/collegiate-court-apartments-blacksburg-va/8bcedx3/",
  },
  {
    id: 4,
    name: "Foxridge Apartment Homes",
    address: "750 Hethwood Blvd, Blacksburg, VA 24060",
    price: "$1,359 - $3,344",
    beds: "1-5 Beds",
    amenities: "Pets Allowed, Fitness Center, Pool, Clubhouse, Maintenance on site, Laundry Facilities, Tennis Court",
    image_url: "https://images1.apartments.com/i2/U5oBYZX6Qt64hrJJ3WvbkHUspKoK4S89R7M8WEb1zuU/117/foxridge-apartment-homes-blacksburg-va-pool.jpg?p=1",
    url: "https://www.apartments.com/foxridge-apartment-homes-blacksburg-va/xrqgm5p/",
  },
  {
    id: 5,
    name: "Fieldstone Family",
    address: "300 Fieldstone Ln, Blacksburg, VA 24060",
    price: "$1,081 - $1,241",
    beds: "2-3 Beds",
    amenities: "Pets Allowed, Fitness Center, Dishwasher, In Unit Washer & Dryer, Clubhouse, Maintenance on site, Wheelchair Access",
    image_url: "https://images1.apartments.com/i2/eRuS0QqoLJ0ksQkqu-5_hu0iFKjop5cLLsZpDyKQLVw/117/fieldstone-family-blacksburg-va-primary-photo.jpg?p=1",
    url: "https://www.apartments.com/fieldstone-family-blacksburg-va/740fg0y/",
  },
  {
    id: 6,
    name: "The Summit at Uptown",
    address: "1820 N Main St, Blacksburg, VA 24061",
    price: "$890 - $945",
    beds: "3-4 Beds",
    amenities: "Pets Allowed, Dishwasher, In Unit Washer & Dryer, Stainless Steel Appliances, Hardwood Floors",
    image_url: "https://images1.apartments.com/i2/yLML9Ru8AGyUZkjwyEDvsv0ctHv7EC9awGfmJz1vVD8/117/the-summit-at-uptown-blacksburg-va-building-photo.jpg?p=1",
    url: "https://www.apartments.com/the-summit-at-uptown-blacksburg-va/nrczhrq/",
  },
];

export function buildLocalSummary(listing: Listing): SummaryDetails {
  const amenities = listing.amenities?.split(",").map((item) => item.trim()).filter(Boolean) || [];

  return {
    verdict: `${listing.name || "This option"} is worth comparing if the location, rent, and floor plan fit your search.`,
    bestFor: [
      listing.beds ? `Renters looking for ${listing.beds.toLowerCase()} layouts` : "Students comparing Blacksburg apartments",
      listing.address ? "People prioritizing the listed Blacksburg location" : "Renters who want a quick shortlist",
    ],
    highlights: [
      listing.price ? `Listed rent: ${listing.price}` : "Verify pricing with the leasing office",
      listing.beds ? `Listed floor plans: ${listing.beds}` : "Verify available floor plans",
      amenities.length ? `Amenities include ${amenities.slice(0, 3).join(", ")}` : "Amenities were not captured",
    ],
    tradeoffs: [
      "Confirm current availability, fees, utilities, and renewal terms.",
      "Ask about noise, parking, and maintenance timing during a tour.",
      "Treat review themes as unverified until checked against recent sources.",
    ],
    note: "Showcase summary generated from listing data only.",
  };
}

export function getLocalAssistantAnswer(input: string) {
  const normalized = input.toLowerCase();
  const lowerBudget = fallbackListings
    .filter((listing) => listing.price?.includes("$890") || listing.price?.includes("$1,081") || listing.price?.includes("$1,184"))
    .map((listing) => listing.name)
    .filter(Boolean)
    .join(", ");

  if (normalized.includes("cheap") || normalized.includes("budget") || normalized.includes("affordable")) {
    return `For budget-sensitive browsing, start with ${lowerBudget}. Verify current rent and fees before deciding.`;
  }

  if (normalized.includes("pet")) {
    return "Pet-friendly options in this showcase include Highlands, Windsor Hills, Foxridge, Fieldstone, and Ridgewood-style listings. Always confirm breed, weight, and pet-fee rules.";
  }

  if (normalized.includes("best") || normalized.includes("recommend")) {
    return "For a balanced student shortlist, compare Windsor Hills for price range, Foxridge for amenities, and The Summit at Uptown for lower listed rent. The best fit depends on commute, roommates, and lease terms.";
  }

  return "I can help compare rent ranges, bed counts, amenities, and verification questions. For live AI answers, connect the deployed app to a backend with an OpenAI key.";
}
