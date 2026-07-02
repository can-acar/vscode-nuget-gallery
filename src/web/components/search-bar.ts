import { FASTElement, css, customElement, html, observable, repeat } from "@microsoft/fast-element";

import codicon from "@/web/styles/codicon.css";
import { Configuration } from "../registrations";
import lodash from "lodash";
import { ProjectViewModel } from "../types";
import { t } from "../i18n";

const template = html<SearchBar>`
  <div class="search-bar">
    <div class="search-bar-left">
      <vscode-text-field
        class="search-text-field"
        @input=${(x, c) => x.FilterInputEvent(c.event.target!)}
      >
        <span slot="start" class="codicon codicon-search"></span>
      </vscode-text-field>
      <vscode-button appearance="icon" @click=${(x) => x.ReloadClicked()}>
        <span class="codicon codicon-refresh"></span>
      </vscode-button>
    </div>
    <div class="search-bar-right">
      <vscode-dropdown
        class="project-dropdown"
        :value=${(x) => x.selectedProjectPath}
        @change=${(x, c) =>
          x.SelectProject((c.event.target as HTMLInputElement).value)}
      >
        <vscode-option value="">${() => t("allProjects")}</vscode-option>
        ${repeat(
          (x) => x.projects,
          html<ProjectViewModel>`
            <vscode-option :value="${(x) => x.Path}">${(x) => x.Name}</vscode-option>
          `
        )}
      </vscode-dropdown>
      <vscode-dropdown
        :value=${(x) => x.selectedSourceUrl}
        @change=${(x, c) => x.SelectSource((c.event.target as HTMLInputElement).value)}
      >
        ${repeat(
          (x) => x.configuration.Configuration!.Sources,
          html<Source>` <vscode-option :value="${(x) => x.Url}">${(x) => x.Name}</vscode-option> `
        )}
      </vscode-dropdown>
      <vscode-checkbox
        :checked="${(x) => x.prerelase}"
        @change=${(x, c) => x.PrerelaseChangedEvent(c.event.target!)}
        >${() => t("prerelease")}</vscode-checkbox
      >
    </div>
  </div>
`;
const styles = css`
  .search-bar {
    display: flex;
    gap: 10px;
    justify-content: space-between;
    margin-bottom: 10px;

    .search-bar-left {
      flex: 1;
      display: flex;
      gap: 4px;
      .search-text-field {
        flex: 1;
        max-width: 340px;
        min-width: 140px;
      }
    }
    .search-bar-right {
      display: flex;
      gap: 10px;

      .project-dropdown {
        min-width: 180px;
        width: 28vw;
        max-width: 440px;
      }
    }
  }
`;

export type FilterEvent = {
  Query: string;
  Prerelease: boolean;
  SourceUrl: string;
};

@customElement({
  name: "search-bar",
  template,
  styles: [codicon, styles],
})
export class SearchBar extends FASTElement {
  @Configuration configuration!: Configuration;
  delayedPackagesLoader = lodash.debounce(() => this.EmitFilterChangedEvent(), 500);
  @observable prerelase: boolean = true;
  @observable filterQuery: string = "";
  @observable projects: Array<ProjectViewModel> = [];
  @observable selectedProjectPath: string = "";
  @observable selectedSourceUrl: string = "";

  connectedCallback(): void {
    super.connectedCallback();
    this.selectedSourceUrl = this.configuration.Configuration?.Sources[0].Url ?? "";
    this.EmitFilterChangedEvent();
  }

  PrerelaseChangedEvent(target: EventTarget) {
    this.prerelase = (target as HTMLInputElement).checked;
    this.EmitFilterChangedEvent();
  }

  FilterInputEvent(target: EventTarget) {
    this.filterQuery = (target as HTMLInputElement).value;
    this.delayedPackagesLoader();
  }

  SelectSource(url: string) {
    this.selectedSourceUrl = url;
    this.EmitFilterChangedEvent();
  }

  SelectProject(projectPath: string) {
    this.selectedProjectPath = projectPath;
    this.$emit("project-selected", projectPath);
  }

  ReloadClicked() {
    this.$emit("reload-invoked");
  }

  EmitFilterChangedEvent() {
    let filterEvent: FilterEvent = {
      Query: this.filterQuery,
      Prerelease: this.prerelase,
      SourceUrl: this.selectedSourceUrl,
    };
    this.$emit("filter-changed", filterEvent);
  }
}
