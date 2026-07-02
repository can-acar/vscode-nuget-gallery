type GetPackageDetailsRequest = {
  PackageVersionUrl: string;
  SourceUrl: string;
  PackageId?: string;
  Version?: string;
};

type GetPackageDetailsResponse = {
  IsFailure: boolean;
  Package?: PackageDetails;
  Error?: HttpError;
};
