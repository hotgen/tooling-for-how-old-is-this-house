import path from "path";

import { getTerritoryDirPath } from "../territory";

export const getOutputDirPath = (): string =>
  path.resolve(getTerritoryDirPath(), "output");

export const getMixedOutputLayersFileName = (): string =>
  path.resolve(getOutputDirPath(), "mixed-output-layers.geojson");

export const getMixedPropertyVariantsFileName = (): string =>
  path.resolve(getOutputDirPath(), "mixed-property-variants.geojson");

export const getUploadFileName = (): string =>
  path.resolve(getOutputDirPath(), "upload.geojson");
