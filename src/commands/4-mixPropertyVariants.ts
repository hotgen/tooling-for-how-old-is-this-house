import { autoStartCommandIfNeeded, Command } from "@kachkaev/commands";
import * as turf from "@turf/turf";
import chalk from "chalk";
import fs from "fs-extra";
import _ from "lodash";
import sortKeys from "sort-keys";

import { createBeautifyAddress } from "../shared/addresses";
import { deepClean } from "../shared/deepClean";
import { writeFormattedJson } from "../shared/helpersForJson";
import {
  buildGlobalFeatureOrVariantId,
  DataToOmitSelector,
  getMixedOutputLayersFilePath,
  getMixedPropertyVariantsFilePath,
  ListRelevantPropertyVariants,
  matchDataToOmitSelectors,
  MixedOutputLayersFeature,
  MixedOutputLayersFeatureCollection,
  MixedPropertyVariants,
  MixedPropertyVariantsFeature,
  parseDataToOmit,
  pickAddress,
  pickArchitect,
  pickCompletionDates,
  pickFloorCount,
  pickName,
  pickPhoto,
  pickStyle,
  pickUrl,
  pickWikipediaUrl,
  PropertyVariant,
} from "../shared/outputMixing";
import { getTerritoryAddressHandlingConfig } from "../shared/territory";

interface VariantInfoInstance {
  variant: PropertyVariant;
  parentFeature: MixedOutputLayersFeature;
}
interface VariantInfo {
  instances: [VariantInfoInstance, ...VariantInfoInstance[]];
  parsedDataToOmitSelectors?: DataToOmitSelector[];
}

export const mixPropertyVariants: Command = async ({ logger }) => {
  logger.log(chalk.bold("Mixing property variants"));

  process.stdout.write(chalk.green("Loading mixed output layers..."));
  const inputFileName = getMixedOutputLayersFilePath();
  const inputFeatureCollection = (await fs.readJson(
    inputFileName,
  )) as MixedOutputLayersFeatureCollection;

  process.stdout.write(` Done.\n`);
  process.stdout.write(chalk.green("Indexing property variants..."));

  const variantInfoLookup: Record<string, VariantInfo> = {};
  const dataToOmitIssues: string[] = [];

  for (const inputFeature of inputFeatureCollection.features) {
    const propertyVariants = inputFeature.properties.variants;
    for (const propertyVariant of propertyVariants) {
      const globalVariantId = buildGlobalFeatureOrVariantId(
        propertyVariant.source,
        propertyVariant.id,
      );

      const variantInfoInstance: VariantInfoInstance = {
        variant: propertyVariant,
        parentFeature: inputFeature,
      };

      let variantInfo = variantInfoLookup[globalVariantId];
      if (!variantInfo) {
        variantInfo = {
          instances: [variantInfoInstance],
          parsedDataToOmitSelectors: parseDataToOmit(
            propertyVariant.dataToOmit,
            (issue) => dataToOmitIssues.push(issue),
          ),
        };
        variantInfoLookup[globalVariantId] = variantInfo;
      } else {
        variantInfo.instances.push(variantInfoInstance);
      }
    }
  }

  // Check for mismatching variants
  const variantIdsWithMismatchedValues: string[] = [];
  for (const [variantId, variantInfo] of Object.entries(variantInfoLookup)) {
    const modelInstance = variantInfo.instances[0];
    const modelVariantToCompareWith = _.omit(modelInstance.variant, "distance");
    for (const instance of variantInfo.instances) {
      if (instance === modelInstance) {
        continue;
      }
      if (
        !_.isEqual(
          _.omit(instance.variant, "distance"),
          modelVariantToCompareWith,
        )
      ) {
        variantIdsWithMismatchedValues.push(variantId);
        break;
      }
    }
  }

  process.stdout.write(` Done.\n`);

  dataToOmitIssues.forEach((issue) => logger.log(chalk.yellow(issue)));

  if (variantIdsWithMismatchedValues.length) {
    logger.log(
      chalk.red(
        `\nSome property variants do not equal to themselves. Looks like you’ve edited the data that was generated by the previous command. Please re-run it.\n  ${variantIdsWithMismatchedValues
          .slice(0, 10)
          .join("\n  ")}`,
      ),
    );
  }

  process.stdout.write(chalk.green("Finding geometry to omit..."));
  const inputFeaturesToOmit = new Set<MixedOutputLayersFeature>();

  for (const variantInfo of Object.values(variantInfoLookup)) {
    if (!variantInfo.parsedDataToOmitSelectors) {
      continue;
    }
    for (const { parentFeature } of variantInfo.instances) {
      if (
        matchDataToOmitSelectors(
          variantInfo.parsedDataToOmitSelectors,
          parentFeature.properties.geometrySource,
          parentFeature.properties.geometryId,
        )
      ) {
        inputFeaturesToOmit.add(parentFeature);
      }
    }
  }

  process.stdout.write(` Features omitted: ${inputFeaturesToOmit.size}.\n`);

  process.stdout.write(
    chalk.green("Assigning property variants to features..."),
  );

  const inputFeatureByPropertyVariant: Record<
    string,
    MixedOutputLayersFeature
  > = {};
  for (const [variantId, variantInfo] of Object.entries(variantInfoLookup)) {
    const instancesWithoutOmittedFeatures = variantInfo.instances.filter(
      (instance) => !inputFeaturesToOmit.has(instance.parentFeature),
    );

    const instancesOrderedByDistance = _.orderBy(
      instancesWithoutOmittedFeatures,
      (instance) => instance.variant.distance,
    );

    if (instancesOrderedByDistance[0]) {
      inputFeatureByPropertyVariant[variantId] =
        instancesOrderedByDistance[0].parentFeature;
    }
  }

  process.stdout.write(` Done.\n`);
  process.stdout.write(chalk.green("Mixing property variants..."));

  const addressHandlingConfig = await getTerritoryAddressHandlingConfig(logger);

  const outputFeatures: MixedPropertyVariantsFeature[] = [];
  for (const inputFeature of inputFeatureCollection.features) {
    if (inputFeaturesToOmit.has(inputFeature)) {
      continue;
    }

    const allPropertyVariants = inputFeature.properties.variants;
    const propertyVariants: PropertyVariant[] = [];
    const dataToOmitSelectors: DataToOmitSelector[] = [];

    allPropertyVariants.forEach((propertyVariant) => {
      const globalVariantId = buildGlobalFeatureOrVariantId(
        propertyVariant.source,
        propertyVariant.id,
      );

      if (inputFeatureByPropertyVariant[globalVariantId] !== inputFeature) {
        return;
      }

      propertyVariants.push(propertyVariant);

      const variantInfo = variantInfoLookup[globalVariantId];
      if (!variantInfo) {
        throw new Error("Unexpected empty variantInfo. This is a bug.");
      }

      if (variantInfo.parsedDataToOmitSelectors) {
        dataToOmitSelectors.push(...variantInfo.parsedDataToOmitSelectors);
      }
    });

    const listRelevantPropertyVariants: ListRelevantPropertyVariants = (
      propertySelectors,
    ) =>
      propertyVariants.filter((propertyVariant) => {
        const propertyNames = Object.keys(propertyVariant);

        return (
          !matchDataToOmitSelectors(
            dataToOmitSelectors,
            propertyVariant.source,
            propertyVariant.id,
            propertySelectors,
          ) &&
          propertyNames.some((propertyName) =>
            propertySelectors.some((propertyNameThatShouldNotBeOmitted) =>
              propertyName.startsWith(propertyNameThatShouldNotBeOmitted),
            ),
          )
        );
      });

    const payloadForPick = {
      listRelevantPropertyVariants,
      logger,
      targetBuildArea: turf.area(inputFeature),
    };

    const mixedPropertyVariants: MixedPropertyVariants = {
      geometryId: inputFeature.properties.geometryId,
      geometrySource: inputFeature.properties.geometrySource,
      ...pickAddress({ ...payloadForPick, addressHandlingConfig }),
      ...pickArchitect(payloadForPick),
      ...pickCompletionDates(payloadForPick),
      ...pickFloorCount(payloadForPick),
      ...pickName(payloadForPick),
      ...pickPhoto(payloadForPick),
      ...pickStyle(payloadForPick),
      ...pickUrl(payloadForPick),
      ...pickWikipediaUrl(payloadForPick),
    };

    outputFeatures.push(
      turf.feature(
        inputFeature.geometry,
        deepClean(sortKeys(mixedPropertyVariants)),
      ),
    );
  }

  process.stdout.write(` Done.\n`);
  process.stdout.write(chalk.green(`Beautifying picked addresses...`));

  const knownAddresses: string[] = [];
  for (const outputFeature of outputFeatures) {
    const address = outputFeature.properties.address;
    if (address) {
      knownAddresses.push(address);
    }
  }

  const beautifyAddress = createBeautifyAddress(
    knownAddresses,
    addressHandlingConfig,
  );

  for (const outputFeature of outputFeatures) {
    const address = outputFeature.properties.address;
    if (address) {
      outputFeature.properties.derivedBeautifiedAddress = beautifyAddress(
        address,
      );
    }
  }

  process.stdout.write(` Done.\n`);
  process.stdout.write(chalk.green(`Saving...`));

  const resultFileName = getMixedPropertyVariantsFilePath();
  const outputFeatureCollection = turf.featureCollection(outputFeatures);
  await writeFormattedJson(resultFileName, outputFeatureCollection);

  logger.log(` Result saved to ${chalk.magenta(resultFileName)}`);
};

autoStartCommandIfNeeded(mixPropertyVariants, __filename);
