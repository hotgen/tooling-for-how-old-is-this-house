import * as tilebelt from "@mapbox/tilebelt";
import * as turf from "@turf/turf";
import chalk from "chalk";
import _ from "lodash";

import { eraseLastLineInOutput } from "./helpersForCommands";

export type Tile = [x: number, y: number, zoom: number];

export const stringifyTile = (tile: Tile): string =>
  `${tile[2]}/${tile[0]}/${tile[1]}`;

export const parseTile = (stringifiedTile: string): Tile => {
  const result = stringifiedTile.split("/").map((v) => parseInt(v) ?? 0);
  if (result.length !== 3) {
    throw new Error(
      `Expected 3 parts in stringified tile, got ${result.length}`,
    );
  }

  return result as Tile;
};

export type TileStatus = "complete" | "needsSplitting";
export type CacheStatus = "used" | "notUsed";

export type ProcessTile = (
  tile: Tile,
) => Promise<{
  cacheStatus: CacheStatus;
  tileStatus: TileStatus;
  comment?: string;
}>;

export const processTiles = async ({
  territoryExtent,
  preserveOutput = true,
  initialZoom,
  maxAllowedZoom,
  processTile,
  logger,
}: {
  territoryExtent: turf.Feature<turf.MultiPolygon | turf.Polygon>;
  initialZoom: number;
  maxAllowedZoom: number;
  processTile: ProcessTile;
  logger: Console;
  preserveOutput?: boolean;
}) => {
  const territoryBbox = turf.bbox(territoryExtent);
  const bottomLeftTile = tilebelt.pointToTile(
    territoryBbox[0],
    territoryBbox[1],
    initialZoom,
  ) as Tile;
  const topRightTile = tilebelt.pointToTile(
    territoryBbox[2],
    territoryBbox[3],
    initialZoom,
  ) as Tile;

  const initialTiles: Tile[] = [];
  for (let y = topRightTile[1]; y <= bottomLeftTile[1]; y += 1) {
    for (let x = bottomLeftTile[0]; x <= topRightTile[0]; x += 1) {
      initialTiles.push([x, y, initialZoom]);
    }
  }

  let tiles = initialTiles;
  let nextZoomTiles: Tile[];
  for (let zoom = initialZoom; zoom <= maxAllowedZoom; zoom += 1) {
    const titleMessage = chalk.green(
      `Processing tiles at zoom level ${zoom}...`,
    );
    logger.log(titleMessage);
    nextZoomTiles = [];
    const orderedTiles = _.orderBy(tiles, [
      (tile) => tile[1], // y
      (tile) => tile[0], // x
    ]);
    let firstTileHasBeenProcessed = false;
    for (const tile of orderedTiles) {
      if (
        !turf.intersect(
          tilebelt.tileToGeoJSON(tile) as turf.Polygon,
          territoryExtent.geometry as turf.Polygon,
        )
      ) {
        continue;
      }

      const { cacheStatus, tileStatus, comment } = await processTile(tile);
      if (tileStatus === "needsSplitting") {
        nextZoomTiles.push(...(tilebelt.getChildren(tile) as Tile[]));
      }
      if (!preserveOutput && firstTileHasBeenProcessed) {
        eraseLastLineInOutput(logger);
      }
      firstTileHasBeenProcessed = true;
      logger.log(
        (cacheStatus === "used" ? chalk.gray : chalk.magenta)(
          `  [${tile.join(", ")}]:${
            comment ? ` ${comment}` : ""
          } - ${_.lowerCase(tileStatus)}`,
        ),
      );
    }
    if (!preserveOutput) {
      if (firstTileHasBeenProcessed) {
        eraseLastLineInOutput(logger);
      }
      eraseLastLineInOutput(logger);
      logger.log(`${titleMessage} Done.`);
    } else {
      logger.log(`Done with zoom level ${zoom}.`);
    }

    tiles = nextZoomTiles;
    if (!tiles.length) {
      break;
    }
  }

  if (tiles.length) {
    throw new Error(
      `Max zoom ${maxAllowedZoom} reached, number of tiles on zoom ${
        maxAllowedZoom + 1
      }: ${tiles.length}`,
    );
  }
};
