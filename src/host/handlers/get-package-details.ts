import { IRequestHandler } from "@/common/messaging/core/types";
import nugetApiFactory from "../nuget/api-factory";
import * as vscode from "vscode";

export class GetPackageDetails
  implements IRequestHandler<GetPackageDetailsRequest, GetPackageDetailsResponse>
{
  async HandleAsync(request: GetPackageDetailsRequest): Promise<GetPackageDetailsResponse> {
    if (!request.SourceUrl) return this.GetError("SourceUrl is empty");
    if (!request.PackageId) return this.GetError("PackageId is empty");
    if (!request.Version) return this.GetError("Version is empty");

    let api = await nugetApiFactory.GetSourceApi(request.SourceUrl);
    try {
      let packageDetails = await api.GetPackageDetailsAsync(request.PackageId, request.Version);
      let result: GetPackageDetailsResponse = {
        IsFailure: false,
        Package: packageDetails.data,
      };
      return result;
    } catch (err: any) {
      vscode.window.showErrorMessage(
        `Failed to fetch package details: ${err.message}`,
      );
      return this.GetError('Failed to fetch package details');
    }
  }

  private GetError(error: string): GetPackageDetailsResponse {
    let result: GetPackageDetailsResponse = {
      IsFailure: true,
      Error: {
        Message: error,
      },
    };
    return result;
  }
}
