type ParsedVersion = {
  release: Array<number>;
  prerelease: Array<string>;
};

export function compareNuGetVersions(left: string | undefined, right: string | undefined): number {
  if (!left && !right) return 0;
  if (!left) return -1;
  if (!right) return 1;

  const leftVersion = parseNuGetVersion(left);
  const rightVersion = parseNuGetVersion(right);

  for (let i = 0; i < 4; i++) {
    const diff = (leftVersion.release[i] ?? 0) - (rightVersion.release[i] ?? 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }

  if (leftVersion.prerelease.length === 0 && rightVersion.prerelease.length === 0) return 0;
  if (leftVersion.prerelease.length === 0) return 1;
  if (rightVersion.prerelease.length === 0) return -1;

  const max = Math.max(leftVersion.prerelease.length, rightVersion.prerelease.length);
  for (let i = 0; i < max; i++) {
    const leftPart = leftVersion.prerelease[i];
    const rightPart = rightVersion.prerelease[i];
    if (leftPart == undefined && rightPart == undefined) return 0;
    if (leftPart == undefined) return -1;
    if (rightPart == undefined) return 1;

    const leftNumber = tryParseNumber(leftPart);
    const rightNumber = tryParseNumber(rightPart);
    if (leftNumber != null && rightNumber != null && leftNumber !== rightNumber) {
      return leftNumber > rightNumber ? 1 : -1;
    }
    if (leftNumber != null && rightNumber == null) return -1;
    if (leftNumber == null && rightNumber != null) return 1;

    const comparison = leftPart.localeCompare(rightPart, undefined, { sensitivity: "base" });
    if (comparison !== 0) return comparison > 0 ? 1 : -1;
  }

  return 0;
}

function parseNuGetVersion(value: string): ParsedVersion {
  const withoutMetadata = value.split("+")[0];
  const [releasePart, prereleasePart = ""] = withoutMetadata.split("-", 2);
  return {
    release: releasePart.split(".").map((x) => Number.parseInt(x, 10) || 0),
    prerelease: prereleasePart
      ? prereleasePart.split(/[.-]/).filter((x) => x.length > 0)
      : [],
  };
}

function tryParseNumber(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  return Number.parseInt(value, 10);
}
