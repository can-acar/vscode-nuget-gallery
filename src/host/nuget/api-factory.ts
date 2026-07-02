import NuGetApi from "../nuget/api";

type SourceApiCollection = {
  [url: string]: NuGetApi;
};

class NuGetApiFactory {
  private sourceApiCollection: SourceApiCollection = {};

  public async GetSourceApi(url: string): Promise<NuGetApi> {
    if (url in this.sourceApiCollection) return this.sourceApiCollection[url];

    this.sourceApiCollection[url] = new NuGetApi(url);
    return this.sourceApiCollection[url];
  }

  public Invalidate(): void {
    this.sourceApiCollection = {};
  }
}

export default new NuGetApiFactory();
