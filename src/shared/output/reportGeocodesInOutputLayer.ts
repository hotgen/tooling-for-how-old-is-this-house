import * as turf from "@turf/turf";
import _ from "lodash";

import { ReportedGeocode, reportGeocodes } from "../geocoding";
import { OutputLayer, OutputLayerGeometry } from "./types";

export const reportGeocodesInOutputLayer = async ({
  source,
  logger,
  outputLayer,
}: {
  logger: Console;
  source: string;
  outputLayer: OutputLayer;
}) => {
  const reportedGeocodes: ReportedGeocode[] = [];

  for (const feature of outputLayer.features) {
    const normalizedAddress = feature.properties.normalizedAddress;
    if (!normalizedAddress) {
      continue;
    }

    if (feature.geometry) {
      const point = turf.pointOnFeature(
        feature as turf.Feature<OutputLayerGeometry>,
      );
      reportedGeocodes.push({
        normalizedAddress,
        coordinates: point.geometry.coordinates.map((coordinate) =>
          _.round(coordinate, 6),
        ) as [number, number],
        knownAt: feature.properties.knownAt,
      });
    } else {
      reportedGeocodes.push({ normalizedAddress });
    }
  }

  await reportGeocodes({
    logger,
    reportedGeocodes,
    source,
  });
};
