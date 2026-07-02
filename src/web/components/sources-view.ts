import {
  ExecutionContext,
  FASTElement,
  css,
  customElement,
  html,
  observable,
  repeat,
  when,
} from "@microsoft/fast-element";

import { UPDATE_CONFIGURATION } from "@/common/messaging/core/commands";
import codicon from "@/web/styles/codicon.css";
import { scrollableBase } from "@/web/styles/base.css";
import { Configuration, IMediator } from "../registrations";
import { SourceViewModel } from "../types";

const template = html<SourcesView>`
  <div class="sources-view">
    <div class="toolbar">
      <vscode-button
        appearance="icon"
        title="Add source"
        aria-label="Add source"
        ?disabled=${(x) => x.newSource != null}
        @click=${(x) => x.AddSourceRow()}
      >
        <span class="codicon codicon-add"></span>
      </vscode-button>
      ${when(
        (x) => x.validationMessage,
        html<SourcesView>`<span class="validation">${(x) => x.validationMessage}</span>`
      )}
    </div>

    <div class="sources-grid">
      <div class="grid-header">Name</div>
      <div class="grid-header">URL</div>
      <div class="grid-header actions-header">Actions</div>
      ${repeat(
        (x) => x.sources,
        html<SourceViewModel>`
          ${when(
            (x) => x.EditMode,
            html<SourceViewModel>`
              <vscode-text-field
                class="source-input"
                placeholder="Name"
                :value=${(x) => x.DraftName}
                @input=${(x, c) =>
                  (x.DraftName = (c.event.target! as HTMLInputElement).value)}
              ></vscode-text-field>
              <vscode-text-field
                class="source-input"
                placeholder="URL"
                :value=${(x) => x.DraftUrl}
                @input=${(x, c) =>
                  (x.DraftUrl = (c.event.target! as HTMLInputElement).value)}
              ></vscode-text-field>
              <div class="row-actions">
                <vscode-button
                  appearance="icon"
                  title="Save source"
                  aria-label="Save source"
                  @click=${(x, c: ExecutionContext<SourcesView, any>) =>
                    c.parent.SaveRow(x)}
                >
                  <span class="codicon codicon-check"></span>
                </vscode-button>
                <vscode-button
                  appearance="icon"
                  title="Cancel"
                  aria-label="Cancel"
                  @click=${(x, c: ExecutionContext<SourcesView, any>) =>
                    c.parent.CancelRow(x)}
                >
                  <span class="codicon codicon-close"></span>
                </vscode-button>
              </div>
            `,
            html<SourceViewModel>`
              <div class="source-cell name-cell">
                <span class="source-name">${(x) => x.Name}</span>
                ${when(
                  (x) => !x.Editable,
                  html<SourceViewModel>`<span
                    class="origin-badge"
                    title="Managed by nuget.config"
                    >nuget.config</span
                  >`
                )}
              </div>
              <div class="source-cell url-cell" title=${(x) => x.Url}>${(x) => x.Url}</div>
              <div class="row-actions">
                ${when(
                  (x) => x.Editable,
                  html<SourceViewModel>`
                    <vscode-button
                      appearance="icon"
                      title="Edit source"
                      aria-label="Edit source"
                      @click=${(x, c: ExecutionContext<SourcesView, any>) =>
                        c.parent.EditRow(x)}
                    >
                      <span class="codicon codicon-edit"></span>
                    </vscode-button>
                    <vscode-button
                      appearance="icon"
                      title="Remove source"
                      aria-label="Remove source"
                      @click=${(x, c: ExecutionContext<SourcesView, any>) =>
                        c.parent.RemoveRow(x)}
                    >
                      <span class="codicon codicon-trash"></span>
                    </vscode-button>
                  `
                )}
              </div>
            `
          )}
        `
      )}
    </div>
  </div>
`;

const styles = css`
  .sources-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    color: var(--vscode-editor-foreground);
  }

  .toolbar {
    display: flex;
    gap: 8px;
    align-items: center;
    min-height: 32px;
    padding: 4px 0;
  }

  .validation {
    color: var(--vscode-errorForeground);
  }

  .sources-grid {
    display: grid;
    grid-template-columns: minmax(140px, 28%) minmax(220px, 1fr) 82px;
    overflow: auto;
    border-top: 1px solid var(--vscode-panelSection-border);
    border-left: 1px solid var(--vscode-panelSection-border);
  }

  .grid-header,
  .source-cell,
  .row-actions,
  .source-input {
    min-width: 0;
    border-right: 1px solid var(--vscode-panelSection-border);
    border-bottom: 1px solid var(--vscode-panelSection-border);
  }

  .grid-header {
    padding: 6px;
    font-weight: 600;
    color: var(--vscode-descriptionForeground);
    background-color: var(--vscode-sideBar-background);
  }

  .actions-header {
    text-align: center;
  }

  .source-cell {
    display: flex;
    gap: 6px;
    align-items: center;
    padding: 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .name-cell,
  .url-cell {
    min-height: 28px;
  }

  .source-name,
  .url-cell {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .origin-badge {
    flex: 0 0 auto;
    padding: 0 4px;
    border: 1px solid var(--vscode-descriptionForeground);
    border-radius: 3px;
    font-size: 10px;
    color: var(--vscode-descriptionForeground);
  }

  .row-actions {
    display: flex;
    gap: 2px;
    align-items: center;
    justify-content: center;
    min-height: 34px;
  }

  .source-input {
    width: 100%;
  }
`;

@customElement({
  name: "sources-view",
  template,
  styles: [codicon, scrollableBase, styles],
})
export class SourcesView extends FASTElement {
  @Configuration configuration!: Configuration;
  @IMediator mediator!: IMediator;
  @observable newSource: SourceViewModel | null = null;
  @observable sources: Array<SourceViewModel> = [];
  @observable validationMessage: string = "";

  connectedCallback(): void {
    super.connectedCallback();
    this.LoadSources();
  }

  private LoadSources() {
    this.sources =
      this.configuration.Configuration?.Sources.map((x) => new SourceViewModel(x)) ?? [];
    this.newSource = null;
    this.validationMessage = "";
  }

  private CloseOpenRows() {
    this.sources.filter((x) => x.EditMode == true).forEach((x) => x.Cancel());
    if (this.newSource != null) {
      this.sources.splice(this.sources.indexOf(this.newSource), 1);
      this.newSource = null;
    }
  }

  private async UpdateConfiguration() {
    let currentConfiguration = this.configuration.Configuration;
    if (currentConfiguration == null) return;

    await this.mediator.PublishAsync<
      UpdateConfigurationRequest,
      UpdateConfigurationResponse
    >(UPDATE_CONFIGURATION, {
      Configuration: {
        SkipRestore: currentConfiguration.SkipRestore,
        CredentialProviderFolder: currentConfiguration.CredentialProviderFolder,
        Sources: this.sources.map((x) => x.GetModel()),
      },
    });
    await this.configuration.Reload();
    this.LoadSources();
  }

  AddSourceRow() {
    this.CloseOpenRows();
    this.validationMessage = "";
    this.newSource = new SourceViewModel();
    this.newSource.Edit();
    this.sources.push(this.newSource);
  }

  EditRow(source: SourceViewModel) {
    this.CloseOpenRows();
    this.validationMessage = "";
    source.Edit();
  }

  RemoveRow(source: SourceViewModel) {
    if (!source.Editable) return;
    this.sources.splice(this.sources.indexOf(source), 1);
    this.UpdateConfiguration();
  }

  SaveRow(source: SourceViewModel) {
    source.DraftName = source.DraftName.trim();
    source.DraftUrl = source.DraftUrl.trim();
    if (source.DraftName == "" || source.DraftUrl == "") {
      this.validationMessage = "Name and URL are required.";
      return;
    }

    this.validationMessage = "";
    if (this.newSource?.Id == source.Id) this.newSource = null;
    source.Save();
    this.UpdateConfiguration();
  }

  CancelRow(source: SourceViewModel) {
    this.validationMessage = "";
    if (this.newSource?.Id == source.Id) {
      this.sources.splice(this.sources.indexOf(source), 1);
      this.newSource = null;
      return;
    }

    source.Cancel();
  }
}
