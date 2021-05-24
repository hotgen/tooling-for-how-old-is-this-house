import {
  CompressedRosreesterCenter,
  CompressedRosreesterExtent,
  RawRosreestrCenter,
  RawRosreestrExtent,
  SuccessfulFirObjectResponse,
} from "./types";

export const compressRosreestrCenter = (
  center: RawRosreestrCenter,
): CompressedRosreesterCenter => {
  return [center.x, center.y];
};

export const compressRosreestrExtent = (
  extent: RawRosreestrExtent,
): CompressedRosreesterExtent => {
  return [extent.xmin, extent.ymin, extent.xmax, extent.ymax];
};

export const extractCompletionDatesFromFirResponse = (
  firResponse: SuccessfulFirObjectResponse,
): string | undefined => {
  const result =
    firResponse.parcelData.oksYearBuilt ?? firResponse.parcelData.oksYearUsed;

  if (!result || result?.length < 4) {
    return undefined;
  }

  return result;
};

export const checkIfFirResponseContainsExistingBuilding = (
  firResponse: SuccessfulFirObjectResponse,
): boolean =>
  firResponse.parcelData.oksType === "building" &&
  !firResponse.parcelData.dateRemove; /* снят с учёта */
