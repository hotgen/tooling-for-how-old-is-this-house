import * as turf from "@turf/turf";
import axios from "axios";
import chalk from "chalk";
import _ from "lodash";
import osmtogeojson from "osmtogeojson";
import path from "path";

import { getSerialisedNow } from "../helpersForJson";
import { getRegionDirPath, getRegionExtent } from "../region";

export const getOsmDirPath = () => {
  return path.resolve(getRegionDirPath(), "sources", "osm");
};

export const getFetchedOsmBuildingsFilePath = (): string => {
  return path.resolve(getOsmDirPath(), "fetched-buildings.geojson");
};

export const getFetchedOsmBoundariesFilePath = (): string => {
  return path.resolve(getOsmDirPath(), "fetched-boundaries.geojson");
};

export const fetchGeojsonFromOverpassApi = async ({
  query,
}: {
  logger?: Console;
  query: string;
}): Promise<turf.FeatureCollection<turf.GeometryObject>> => {
  process.stdout.write(chalk.green("Preparing to make Overpass API query..."));

  const regionExtent = await getRegionExtent();
  if (!regionExtent.geometry) {
    throw new Error("Unexpected empty geometry in regionExtent");
  }
  if (regionExtent.geometry?.type === "MultiPolygon") {
    throw new Error(
      "Fetching OSM for multipolygons is not yet supported. Please amend the script.",
    );
  }

  const pointsInOuterRing = (regionExtent.geometry as turf.Polygon)
    .coordinates[0];

  if (!pointsInOuterRing) {
    throw new Error("Unexpected undefined outer ring in the polygon");
  }

  const serializedPolygonForOverpassApi = `poly:"${pointsInOuterRing
    .flatMap((point) => [point[1], point[0]])
    .join(" ")}"`;

  process.stdout.write(" Done.\n");

  process.stdout.write(chalk.green("Calling Overpass API..."));

  const osmData = (
    await axios.post(
      "https://overpass-api.de/api/interpreter",
      query.replace(/\{\{region_extent\}\}/g, serializedPolygonForOverpassApi),
      {
        responseType: "json",
      },
    )
  ).data;

  process.stdout.write(" Done.\n");
  process.stdout.write(chalk.green("Converting OSM data to geojson..."));

  const geojsonData = osmtogeojson(osmData);

  process.stdout.write(" Done.\n");

  process.stdout.write(chalk.green("Post-processing..."));

  // Add metadata
  (geojsonData as any).properties = {
    fetchedAt: getSerialisedNow(),
  };

  // Reorder features by id (helps reduce diffs following subsequent fetches)
  geojsonData.features = _.orderBy(geojsonData.features, (feature) => {
    const [osmType, numericId] = `${feature.id}`.split("/");

    return `${osmType}/${(numericId ?? "").padStart(12, "0")}`;
  });

  // Remove feature ids given that there is a property with the same value
  geojsonData.features.forEach((feature) => {
    if (!feature.properties?.id) {
      throw new Error(`Unexpected missing id property in ${feature.id}`);
    }
    if (feature.properties?.id !== feature.id) {
      throw new Error(
        `feature.id (${feature.id}) does not match feature.properties.id (${feature.properties?.id})`,
      );
    }
    delete feature.id;
  });

  process.stdout.write(" Done.\n");

  return geojsonData as turf.FeatureCollection<turf.GeometryObject>;
};
