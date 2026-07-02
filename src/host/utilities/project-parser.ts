import fs from "fs";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import xpath from "xpath";
import * as path from "path";

type CentralPackageVersion = {
  Id: string;
  Version: string;
  Condition?: string;
  Node: any;
};

type CentralPackageInfo = {
  Path: string;
  ManagePackageVersionsCentrally: boolean;
  Versions: Map<string, Array<CentralPackageVersion>>;
};

export default class ProjectParser {
  static Parse(projectPath: string): Project {
    let projectContent = fs.readFileSync(projectPath, "utf8");
    let document = new DOMParser().parseFromString(projectContent);
    if (document == undefined) throw `${projectPath} has invalid content`;

    let centralPackageInfo = this.LoadCentralPackageInfo(projectPath);
    let packagesReferences = xpath.select(
      "//*[local-name()='ItemGroup']/*[local-name()='PackageReference']",
      document
    ) as Node[];
    let project: Project = {
      Path: projectPath,
      Name: path.basename(projectPath),
      Packages: Array(),
    };

    (packagesReferences || []).forEach((p: any) => {
      let id = this.GetAttribute(p, "Include") ?? this.GetAttribute(p, "Update");
      if (!id) return;

      let versionOverride = this.GetAttribute(p, "VersionOverride") ?? this.GetChildText(p, "VersionOverride");
      let version = this.GetAttribute(p, "Version") ?? this.GetChildText(p, "Version");
      let packageInfo: ProjectPackage = {
        Id: id,
        Version: "",
        VersionSource: "missing",
        CanUpdate: true,
      };

      if (versionOverride) {
        packageInfo.Version = versionOverride;
        packageInfo.VersionSource = "override";
      } else if (version) {
        packageInfo.Version = version;
        packageInfo.VersionSource = "project";
      } else {
        let centralVersions = centralPackageInfo?.Versions.get(id.toLowerCase()) ?? [];
        if (centralVersions.length > 0) {
          packageInfo.Version = centralVersions[0].Version;
          packageInfo.VersionSource = "central";
          packageInfo.CentralVersionPath = centralPackageInfo?.Path;

          let conditionalVersions = centralVersions.filter((x) => x.Condition);
          if (centralVersions.length > 1 || conditionalVersions.length > 0) {
            packageInfo.CanUpdate = false;
            packageInfo.UpdateBlockedReason =
              "Multiple or conditional central package versions must be edited manually.";
          }
        }
      }

      project.Packages.push(packageInfo);
    });

    return project;
  }

  static IsCentralPackageManagementEnabled(projectPath: string): boolean {
    return this.LoadCentralPackageInfo(projectPath)?.ManagePackageVersionsCentrally === true;
  }

  static UpdateCentralPackageVersion(
    projectPath: string,
    packageId: string,
    version: string
  ): boolean {
    let info = this.LoadCentralPackageInfo(projectPath);
    if (!info) return false;

    let versions = info.Versions.get(packageId.toLowerCase()) ?? [];
    if (versions.length !== 1 || versions[0].Condition) return false;

    versions[0].Node.setAttribute("Version", version);
    this.WriteDocument(info.Path, versions[0].Node.ownerDocument);
    return true;
  }

  static UpsertCentralPackageVersion(projectPath: string, packageId: string, version: string): boolean {
    let info = this.LoadCentralPackageInfo(projectPath);
    if (!info) return false;

    if (this.UpdateCentralPackageVersion(projectPath, packageId, version)) return true;

    let document = this.LoadDocument(info.Path);
    let itemGroup = this.GetFirstElement(document, "ItemGroup");
    if (!itemGroup) {
      itemGroup = document.createElement("ItemGroup");
      document.documentElement.appendChild(itemGroup);
    }

    let packageVersion = document.createElement("PackageVersion");
    packageVersion.setAttribute("Include", packageId);
    packageVersion.setAttribute("Version", version);
    itemGroup.appendChild(packageVersion);
    this.WriteDocument(info.Path, document);
    return true;
  }

  static EnsurePackageReference(
    projectPath: string,
    packageId: string,
    version: string | undefined,
    useCentralVersion: boolean
  ): void {
    let document = this.LoadDocument(projectPath);
    let existing = (xpath.select(
      `//*[local-name()='PackageReference' and (@Include='${packageId}' or @Update='${packageId}')]`,
      document
    ) as Array<any>)[0];

    if (existing) {
      if (!useCentralVersion && version) existing.setAttribute("Version", version);
      this.WriteDocument(projectPath, document);
      return;
    }

    let itemGroup = this.GetFirstElement(document, "ItemGroup");
    if (!itemGroup) {
      itemGroup = document.createElement("ItemGroup");
      document.documentElement.appendChild(itemGroup);
    }

    let packageReference = document.createElement("PackageReference");
    packageReference.setAttribute("Include", packageId);
    if (!useCentralVersion && version) packageReference.setAttribute("Version", version);
    itemGroup.appendChild(packageReference);
    this.WriteDocument(projectPath, document);
  }

  private static LoadCentralPackageInfo(projectPath: string): CentralPackageInfo | null {
    let centralPath = this.FindNearestCentralPackageFile(path.dirname(projectPath));
    if (!centralPath) return null;

    let document = this.LoadDocument(centralPath);
    let manageCentrally =
      this.GetDocumentText(document, "ManagePackageVersionsCentrally").toLowerCase() === "true";
    let versionNodes = xpath.select(
      "//*[local-name()='ItemGroup']/*[local-name()='PackageVersion']",
      document
    ) as Array<any>;
    let versions = new Map<string, Array<CentralPackageVersion>>();

    versionNodes.forEach((node) => {
      let id = this.GetAttribute(node, "Include") ?? this.GetAttribute(node, "Update");
      let version = this.GetAttribute(node, "Version") ?? this.GetChildText(node, "Version");
      if (!id || !version) return;

      let list = versions.get(id.toLowerCase()) ?? [];
      list.push({
        Id: id,
        Version: version,
        Condition: this.GetAttribute(node, "Condition"),
        Node: node,
      });
      versions.set(id.toLowerCase(), list);
    });

    return {
      Path: centralPath,
      ManagePackageVersionsCentrally: manageCentrally,
      Versions: versions,
    };
  }

  private static FindNearestCentralPackageFile(startDir: string): string | null {
    let dir = startDir;
    while (true) {
      let candidate = path.join(dir, "Directory.Packages.props");
      if (fs.existsSync(candidate)) return candidate;

      let parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }

    return null;
  }

  private static LoadDocument(filePath: string): Document {
    let content = fs.readFileSync(filePath, "utf8");
    let document = new DOMParser().parseFromString(content);
    if (document == undefined) throw `${filePath} has invalid content`;
    return document;
  }

  private static WriteDocument(filePath: string, document: Document): void {
    fs.writeFileSync(filePath, new XMLSerializer().serializeToString(document), "utf8");
  }

  private static GetAttribute(node: any, name: string): string | undefined {
    return node.attributes?.getNamedItem(name)?.value;
  }

  private static GetChildText(node: any, name: string): string | undefined {
    let value = xpath.select(`string(*[local-name()='${name}'])`, node);
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
  }

  private static GetDocumentText(document: Document, name: string): string {
    let value = xpath.select(`string(//*[local-name()='${name}'])`, document);
    return typeof value === "string" ? value.trim() : "";
  }

  private static GetFirstElement(document: Document, name: string): any {
    return (xpath.select(`//*[local-name()='${name}']`, document) as Array<any>)[0];
  }
}
