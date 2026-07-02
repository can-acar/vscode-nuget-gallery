import { spawn } from "child_process";
import path from "path";
import * as vscode from "vscode";

type ProtocolCommand = "list-sources" | "search" | "get-package" | "get-package-details";

type ProtocolRequest = {
  Command: ProtocolCommand;
  SourceName?: string;
  SourceUrl?: string;
  PackageId?: string;
  Version?: string;
  Filter?: string;
  Prerelease?: boolean;
  Skip?: number;
  Take?: number;
  WorkspaceFolders?: Array<string>;
};

type ProtocolResponse<T> = {
  IsFailure: boolean;
  Data?: T;
  Error?: {
    Message: string;
  };
};

class ProtocolHostClient {
  private extensionPath: string = "";

  Initialize(extensionPath: string) {
    this.extensionPath = extensionPath;
  }

  async ListSources(): Promise<Array<Source>> {
    return this.Send<Array<Source>>({
      Command: "list-sources",
    });
  }

  async Search(
    sourceUrl: string,
    filter: string,
    prerelease: boolean,
    skip: number,
    take: number
  ): Promise<Array<Package>> {
    return this.Send<Array<Package>>({
      Command: "search",
      SourceUrl: sourceUrl,
      Filter: filter,
      Prerelease: prerelease,
      Skip: skip,
      Take: take,
    });
  }

  async GetPackage(
    sourceUrl: string,
    packageId: string,
    prerelease: boolean
  ): Promise<Package> {
    return this.Send<Package>({
      Command: "get-package",
      SourceUrl: sourceUrl,
      PackageId: packageId,
      Prerelease: prerelease,
    });
  }

  async GetPackageDetails(
    sourceUrl: string,
    packageId: string,
    version: string
  ): Promise<PackageDetails> {
    return this.Send<PackageDetails>({
      Command: "get-package-details",
      SourceUrl: sourceUrl,
      PackageId: packageId,
      Version: version,
      Prerelease: true,
    });
  }

  private async Send<T>(request: ProtocolRequest): Promise<T> {
    if (!this.extensionPath) {
      throw new Error("Protocol host has not been initialized.");
    }

    const protocolHostPath = path.join(
      this.extensionPath,
      "dist",
      "protocol-host",
      "CanNugetGallery.ProtocolHost.dll"
    );

    const requestBody = JSON.stringify({
      ...request,
      WorkspaceFolders: vscode.workspace.workspaceFolders?.map((x) => x.uri.fsPath) ?? [],
    });

    return new Promise<T>((resolve, reject) => {
      const child = spawn("dotnet", [protocolHostPath], {
        env: this.BuildEnvironment(),
        stdio: ["pipe", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";

      const timeout = setTimeout(() => {
        child.kill();
        reject(new Error("NuGet protocol host timed out."));
      }, 45000);

      child.stdout.on("data", (chunk) => (stdout += chunk.toString()));
      child.stderr.on("data", (chunk) => (stderr += chunk.toString()));
      child.on("error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });
      child.on("close", (code) => {
        clearTimeout(timeout);
        if (code !== 0) {
          reject(new Error(stderr || `NuGet protocol host exited with code ${code}.`));
          return;
        }

        try {
          const response = JSON.parse(stdout) as ProtocolResponse<T>;
          if (response.IsFailure) {
            reject(new Error(response.Error?.Message ?? "NuGet protocol host failed."));
            return;
          }

          resolve(response.Data as T);
        } catch (err) {
          reject(
            new Error(
              `Failed to parse NuGet protocol host response: ${
                err instanceof Error ? err.message : String(err)
              }`
            )
          );
        }
      });

      child.stdin.write(requestBody);
      child.stdin.end();
    });
  }

  private BuildEnvironment(): NodeJS.ProcessEnv {
    const env: NodeJS.ProcessEnv = { ...process.env };
    const httpConfig = vscode.workspace.getConfiguration("http");
    const configuredProxy = httpConfig.get<string>("proxy");
    const proxyStrictSsl = httpConfig.get<boolean>("proxyStrictSSL");

    if (configuredProxy) {
      env.HTTP_PROXY = configuredProxy;
      env.HTTPS_PROXY = configuredProxy;
      env.http_proxy = configuredProxy;
      env.https_proxy = configuredProxy;
    }

    if (proxyStrictSsl === false) {
      env.NUGET_CERT_REVOCATION_MODE = "offline";
    }

    return env;
  }
}

export default new ProtocolHostClient();
