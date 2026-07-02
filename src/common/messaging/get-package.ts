type GetPackageRequest = {
  Url: string;
  Id: string;
  Prerelease?: boolean;
};

type GetPackageResponse = {
  IsFailure: boolean;
  Package?: Package;
  Error?: HttpError;
};
