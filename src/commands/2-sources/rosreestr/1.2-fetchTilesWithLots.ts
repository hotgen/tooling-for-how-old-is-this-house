import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import chalk from "chalk";

import { generateProcessTile } from "../../../shared/sources/rosreestr";
import { getTerritoryExtent } from "../../../shared/territory";
import { processTiles } from "../../../shared/tiles";

export const fetchTilesWithLots: Command = async ({ logger }) => {
  logger.log(chalk.bold("sources/rosreestr: Fetching tiles with lots"));

  await processTiles({
    initialZoom: 13,
    maxAllowedZoom: 24,
    territoryExtent: await getTerritoryExtent(),
    processTile: generateProcessTile("lot"),
    logger,
  });
};

autoStartCommandIfNeeded(fetchTilesWithLots, __filename);
