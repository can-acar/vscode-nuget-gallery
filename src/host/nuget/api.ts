import protocolHostClient from "./protocol-host-client";

type GetPackagesResponse = {
  data: Array<Package>;
};

type GetPackageResponse = {
  isError: boolean;
  errorMessage: string | undefined;
  data: Package | undefined;
};

type GetPackageDetailsResponse = {
  data: PackageDetails;
};

export default class NuGetApi {
  constructor(private readonly url: string) {}

  async GetPackagesAsync(
    filter: string,
    prerelease: boolean,
    skip: number,
    take: number
  ): Promise<GetPackagesResponse> {
    return {
      data: await protocolHostClient.Search(this.url, filter, prerelease, skip, take),
    };
  }

  async GetPackageAsync(id: string, prerelease: boolean): Promise<GetPackageResponse> {
    try {
      return {
        isError: false,
        errorMessage: undefined,
        data: await protocolHostClient.GetPackage(this.url, id, prerelease),
      };
    } catch (err) {
      return {
        isError: true,
        errorMessage: err instanceof Error ? err.message : String(err),
        data: undefined,
      };
    }
  }

  async GetPackageDetailsAsync(
    packageId: string,
    version: string
  ): Promise<GetPackageDetailsResponse> {
    return {
      data: await protocolHostClient.GetPackageDetails(this.url, packageId, version),
    };
  }
}
