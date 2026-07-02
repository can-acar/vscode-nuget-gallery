type UpdateType = "INSTALL" | "UNINSTALL";

type UpdateProjectRequest = {
  ProjectPath: string;
  PackageId: string;
  SourceUrl?: string;
  Version?: string;
  Type: UpdateType;
};

type UpdateProjectResponse = {
  Project: Project;
};
