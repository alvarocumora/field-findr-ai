import { defineMcp } from "@lovable.dev/mcp-js";
import searchListings from "./tools/search-listings";
import getListing from "./tools/get-listing";
import listProjects from "./tools/list-projects";

export default defineMcp({
  name: "oferta-terrenos-mcp",
  title: "OFERTA TERRENOS",
  version: "0.1.0",
  instructions:
    "Tools to search and read land listings and development projects (loteos) published on OFERTA TERRENOS, the Chilean/LATAM marketplace for land parcels. Use `search_listings` to discover parcels by city, price, or area; `get_listing` to inspect a single parcel; and `list_projects` to browse active developments.",
  tools: [searchListings, getListing, listProjects],
});
