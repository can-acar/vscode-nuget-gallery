const en = {
  packages: "Packages",
  sources: "Sources",
  browse: "BROWSE",
  installed: "INSTALLED",
  allProjects: "All",
  prerelease: "Prerelease",
  info: "Info",
  dependencies: "Dependencies",
  authors: "Author(s):",
  license: "License:",
  projectUrl: "Project Url:",
  tags: "Tags:",
  viewLicense: "View License",
  viewProject: "View Project",
  noDependencies: "No dependencies",
  noProjects: "No projects found",
  failedFetchPackages: "Failed to fetch packages. See 'Webview Developer Tools' for more details",
  failedFetchPackage: "Failed to fetch the package from the selected registry.",
  sourceName: "Name",
  sourceUrl: "URL",
  sourceActions: "Actions",
  addSource: "Add source",
  saveSource: "Save source",
  editSource: "Edit source",
  removeSource: "Remove source",
  cancel: "Cancel",
  sourceValidation: "Name and URL are required.",
  nugetConfig: "nuget.config",
  managedByNugetConfig: "Managed by nuget.config",
};

const tr: Partial<typeof en> = {
  packages: "Paketler",
  sources: "Kaynaklar",
  browse: "ARA",
  installed: "YUKLU",
  allProjects: "All",
  prerelease: "Prerelease",
  dependencies: "Bagimliliklar",
  noDependencies: "Bagimlilik yok",
  noProjects: "Proje bulunamadi",
  sourceName: "Ad",
  sourceActions: "Islemler",
  addSource: "Kaynak ekle",
  saveSource: "Kaynagi kaydet",
  editSource: "Kaynagi duzenle",
  removeSource: "Kaynagi sil",
  cancel: "Iptal",
};

type I18nKey = keyof typeof en;

export function t(key: I18nKey): string {
  const language = navigator.language?.toLowerCase() ?? "en";
  if (language.startsWith("tr")) return tr[key] ?? en[key];
  return en[key];
}
