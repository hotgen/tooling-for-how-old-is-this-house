import * as turf from "@turf/turf";
import _ from "lodash";

import { deepClean } from "../deepClean";
import { readFetchedOsmFeatureCollection } from "../sources/osm";
import { OsmFeatureProperties } from "../sources/osm/types";
import { TerritoryExtent } from "../territory";
import { generateGeographicContextExtent } from "./generateGeographicContextExtent";
import {
  GeographicContextFeature,
  GeographicContextFeatureCollection,
  GeographicContextFeatureProperties,
} from "./types";

const mapOsmPropertiesToLevel = ({
  level,
  bridge,
  tunnel,
}: OsmFeatureProperties): number | undefined => {
  const parsedLevel = parseInt(level ?? "");
  if (parsedLevel) {
    return parsedLevel;
  }

  if (bridge) {
    return 1;
  }
  if (tunnel) {
    return -1;
  }

  return undefined;
};
const mapOsmPropertiesToGeographicContextProperties = (
  geometryType: turf.GeometryTypes,
  properties: OsmFeatureProperties,
): GeographicContextFeatureProperties | undefined => {
  const { natural, landuse, highway, waterway, railway, name } = properties;
  const isArea = geometryType === "Polygon" || geometryType === "MultiPolygon";

  if (natural === "wetland" && isArea) {
    return { category: "wetland" };
  }

  if ((natural === "water" || landuse === "reservoir" || waterway) && isArea) {
    return { category: "water" };
  }

  if (isArea) {
    return undefined;
  }

  const level = mapOsmPropertiesToLevel(properties);

  // https://wiki.openstreetmap.org/wiki/Key:waterway
  switch (waterway) {
    case undefined:
      break;
    case "river":
    case "riverbank":
    case "canal":
      return { category: "waterway", name, level, relativeSize: 1 };
    case "stream":
      return { category: "waterway", name, level, relativeSize: 0.5 };
    default:
      return undefined;
  }

  // https://wiki.openstreetmap.org/wiki/Key:highway
  switch (highway) {
    case undefined:
      break;
    case "motorway":
    case "trunk":
    case "trunk_link":
      return { category: "roadway", name, level, relativeSize: 2 };
    case "primary":
    case "primary_link":
    case "secondary":
    case "secondary_link":
      return { category: "roadway", name, level, relativeSize: 1 };
    case "tertiary":
    case "tertiary_link":
      return { category: "roadway", name, level, relativeSize: 0.7 };
    case "construction":
    case "residential":
    case "unclassified":
      return { category: "roadway", name, level, relativeSize: 0.5 };
    case "pedestrian": // highway=pedestrian + no name is likely a service road
      return name
        ? { category: "roadway", name, level, relativeSize: 0.5 }
        : undefined;
    default:
      return undefined;
  }

  // https://wiki.openstreetmap.org/wiki/Key:railway
  switch (railway) {
    case undefined:
      break;

    case "rail":
      return {
        category: "railway",
        relativeSize: properties.usage === "main" ? 1 : 0.7,
        level,
      };
    case "abandoned":
    case "construction":
    case "disused":
    case "funicular":
    case "light_rail":
    case "monorail":
    case "narrow_gauge":
    case "tram":
      return {
        category: "railway",
        relativeSize: 0.5,
        level,
      };
    default:
  }

  return undefined;
};

const categoryZIndexLookup: Record<
  GeographicContextFeatureProperties["category"],
  number
> = {
  geographicContextExtent: 0,
  wetland: 1,
  water: 2,
  waterway: 3,
  roadway: 4,
  railway: 5,
};

export const generateGeographicContext = async (
  territoryExtent: TerritoryExtent,
): Promise<GeographicContextFeatureCollection> => {
  const features: GeographicContextFeature[] = [];

  const geographicContextExtent = generateGeographicContextExtent(
    territoryExtent,
  );
  const clipBbox = turf.bbox(geographicContextExtent);

  const railways =
    (await readFetchedOsmFeatureCollection("railways"))?.features || [];
  const roads =
    (await readFetchedOsmFeatureCollection("roads"))?.features || [];
  const waterObjects =
    (await readFetchedOsmFeatureCollection("water-objects"))?.features || [];

  [...railways, ...roads, ...waterObjects].forEach((osmFeature) => {
    const properties = mapOsmPropertiesToGeographicContextProperties(
      osmFeature.geometry.type,
      osmFeature.properties,
    );
    if (properties) {
      features.push({
        type: "Feature",
        geometry: turf.simplify(turf.bboxClip(osmFeature.geometry, clipBbox), {
          tolerance: 0.000005,
        }).geometry,
        properties: deepClean(properties),
      });
    }
  });

  return {
    type: "FeatureCollection",
    features: [
      geographicContextExtent,
      ..._.orderBy(features, [
        ({ properties }) => ("level" in properties ? properties.level ?? 0 : 0),
        ({ properties }) => categoryZIndexLookup[properties.category],
      ]),
    ],
  };
};
