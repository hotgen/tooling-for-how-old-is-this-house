import * as turf from "@turf/turf";

import { createBboxFeature } from "../helpersForGeometry";
import { TerritoryExtent } from "../territory";
import { GeographicContextFeature } from "./types";

export const generateGeographicContextExtent = (
  territoryExtent: TerritoryExtent,
): GeographicContextFeature & {
  geometry: { type: "Polygon" };
  properties: { category: "geographicContextExtent" };
} => ({
  type: "Feature",
  geometry: turf.truncate(createBboxFeature(territoryExtent, 20000).geometry, {
    precision: 3,
  }),
  properties: { category: "geographicContextExtent" },
});
