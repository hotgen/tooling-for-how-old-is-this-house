import turf from "@turf/turf";
import * as envalid from "envalid";
import fs from "fs-extra";
import { load } from "js-yaml";
import path from "path";

import { cleanEnv } from "./cleanEnv";

export const getRegionDirPath = (): string => {
  const env = cleanEnv({
    REGION_VAR_DIR: envalid.str({}),
  });

  return path.resolve(env.REGION_VAR_DIR);
};

export interface RegionConfig {
  name?: string;

  extent?: {
    elementsToCombine?: Array<
      { type: "osmRelation"; relationId: number } | { type: never }
    >;
  };

  sources?: {
    mingkh?: {
      houseLists?: Array<
        | {
            regionUrl?: string;
            cityUrl?: string;
          }
        | undefined
      >;
    };
    mkrf?: {
      fallbackAddressSelectorsForObjectsWithoutGeometry?: string[] | string[][];
    };
  };
}

export const getRegionConfigFilePath = (): string =>
  path.resolve(getRegionDirPath(), `region-config.yml`);

export const getRegionConfig = async (): Promise<RegionConfig> => {
  return load(await fs.readFile(getRegionConfigFilePath(), "utf8")) as any;
};

export const getRegionExtentFilePath = (): string =>
  path.resolve(getRegionDirPath(), `region-extent.geojson`);

export const getRegionExtent = async (): Promise<
  turf.Feature<turf.Polygon | turf.MultiPolygon>
> => {
  return fs.readJson(getRegionExtentFilePath());
};
