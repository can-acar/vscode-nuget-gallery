import registrations, { Configuration, Router } from "./registrations";
import {
  provideVSCodeDesignSystem,
  vsCodeButton,
  vsCodeCheckbox,
  vsCodeTextField,
  vsCodeDropdown,
  vsCodeOption,
  vsCodePanels,
  vsCodePanelView,
  vsCodePanelTab,
  vsCodeProgressRing,
  vsCodeLink,
} from "@vscode/webview-ui-toolkit";

import { FASTElement, customElement, html, css, when } from "@microsoft/fast-element";

import { PackagesView } from "./components/packages-view";
import { PackageRow } from "./components/package-row";
import { ProjectRow } from "./components/project-row";
import { SettingsView } from "./components/settings-view";
import { SourcesView } from "./components/sources-view";
import { PackageDetailsComponent } from "./components/package-details";

import "./main.css";
import { ExpandableContainer } from "./components/expandable-container";
import { SearchBar } from "./components/search-bar";

provideVSCodeDesignSystem().register(
  registrations(),
  vsCodeButton(),
  vsCodeCheckbox(),
  vsCodeTextField(),
  vsCodePanels(),
  vsCodePanelView(),
  vsCodePanelTab(),
  vsCodeDropdown(),
  vsCodeOption(),
  vsCodeProgressRing(),
  vsCodeLink(),
  PackagesView,
  PackageRow,
  ProjectRow,
  SettingsView,
  SourcesView,
  PackageDetailsComponent,
  ExpandableContainer,
  SearchBar
);

const template = html<VSCodeNuGetGallery>`
  ${when(
    (x) => x.configuration.Configuration != null,
    html<VSCodeNuGetGallery>`
      ${when(
        (x) => x.router.CurrentRoute != "SETTINGS",
        html<VSCodeNuGetGallery>`
          <div class="shell">
            <nav class="main-tabs" aria-label="NuGet sections">
              <button
                type="button"
                class="tab ${(x) => (x.router.CurrentRoute == "BROWSE" ? "active" : "")}"
                @click=${(x) => x.router.Navigate("BROWSE")}
              >
                Packages
              </button>
              <button
                type="button"
                class="tab ${(x) => (x.router.CurrentRoute == "SOURCES" ? "active" : "")}"
                @click=${(x) => x.router.Navigate("SOURCES")}
              >
                Sources
              </button>
            </nav>
            <div class="view">
              ${when(
                (x) => x.router.CurrentRoute == "SOURCES",
                html`<sources-view></sources-view>`,
                html`<packages-view></packages-view>`
              )}
            </div>
          </div>
        `,
        html`<settings-view></settings-view>`
      )}
    `
  )}
`;

const styles = css`
  .shell {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }

  .main-tabs {
    display: flex;
    gap: 2px;
    align-items: center;
    margin-bottom: 8px;
    border-bottom: 1px solid var(--vscode-panelSection-border);
  }

  .tab {
    height: 28px;
    padding: 0 10px;
    color: var(--vscode-tab-inactiveForeground);
    background: transparent;
    border: 0;
    border-bottom: 1px solid transparent;
    cursor: pointer;
  }

  .tab:hover {
    color: var(--vscode-tab-activeForeground);
  }

  .tab.active {
    color: var(--vscode-tab-activeForeground);
    border-bottom-color: var(--vscode-focusBorder);
  }

  .tab:focus-visible {
    outline: 1px solid var(--vscode-focusBorder);
    outline-offset: -1px;
  }

  .view {
    flex: 1;
    min-height: 0;
  }
`;

@customElement({
  name: "canacar-nuget-gallery",
  template,
  styles,
})
export class VSCodeNuGetGallery extends FASTElement {
  @Router router!: Router;
  @Configuration configuration!: Configuration;

  connectedCallback(): void {
    super.connectedCallback();
    this.configuration.Reload();
  }
}
