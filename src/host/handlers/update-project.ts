import { IRequestHandler } from "@/common/messaging/core/types";
import * as vscode from "vscode";
import ProjectParser from "../utilities/project-parser";
import TaskExecutor from "../utilities/task-executor";

export default class UpdateProject implements IRequestHandler<UpdateProjectRequest, UpdateProjectResponse> {
  async HandleAsync(request: UpdateProjectRequest): Promise<UpdateProjectResponse> {
    let skipRestore = vscode.workspace.getConfiguration("CanNugetGallery").get<boolean>("skipRestore") ?? false;

    if (request.Type !== "UNINSTALL" && request.Version) {
      let project = ProjectParser.Parse(request.ProjectPath);
      let projectPackage = project.Packages.find((x) => x.Id == request.PackageId);
      if (
        projectPackage?.VersionSource == "central" &&
        projectPackage.CanUpdate !== false &&
        ProjectParser.UpdateCentralPackageVersion(
          request.ProjectPath,
          request.PackageId,
          request.Version
        )
      ) {
        return { Project: ProjectParser.Parse(request.ProjectPath) };
      }

      if (ProjectParser.IsCentralPackageManagementEnabled(request.ProjectPath)) {
        ProjectParser.EnsurePackageReference(
          request.ProjectPath,
          request.PackageId,
          request.Version,
          true
        );
        ProjectParser.UpsertCentralPackageVersion(
          request.ProjectPath,
          request.PackageId,
          request.Version
        );
        return { Project: ProjectParser.Parse(request.ProjectPath) };
      }
    }

    let command = request.Type == "UNINSTALL" ? "remove" : "add";
    let args: Array<string> = [command, request.ProjectPath.replace(/\\/g, "/"), "package", request.PackageId];
    if (request.Type !== "UNINSTALL") {
      args.push("-v");
      args.push(request.Version!);
      if (skipRestore) args.push("--no-restore");
      if (request.SourceUrl) {
        args.push("-s");
        args.push(this.NormalizeSourceForDotnet(request.SourceUrl));
      }
    }

    let task = new vscode.Task(
      { type: "dotnet", task: `dotnet add/remove package` },
      vscode.TaskScope.Workspace,
      "vscode-nuget-manager",
      "dotnet",
      new vscode.ShellExecution("dotnet", args)
    );
    task.presentationOptions.reveal = vscode.TaskRevealKind.Silent;

    await TaskExecutor.ExecuteTask(task);

    let updatedProject = ProjectParser.Parse(request.ProjectPath);
    let result: UpdateProjectResponse = {
      Project: updatedProject,
    };
    return result;
  }

  private NormalizeSourceForDotnet(source: string): string {
    try {
      let uri = vscode.Uri.parse(source);
      if (uri.scheme == "file") return uri.fsPath;
    } catch {}

    return source;
  }
}
