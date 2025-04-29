import * as vscode from "vscode";

type ViewMode = "explorer" | "analysis";
type ViewScope = "project" | "file";

export class JxscoutTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly contextValue: string,
    public readonly iconName?: string
  ) {
    super(label, collapsibleState);
    if (iconName) {
      this.iconPath = new vscode.ThemeIcon(iconName);
    }
  }
}

export class JxscoutTreeProvider
  implements vscode.TreeDataProvider<JxscoutTreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    JxscoutTreeItem | undefined | null | void
  > = new vscode.EventEmitter<JxscoutTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    JxscoutTreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private _scope: ViewScope = "project";
  private _mode: ViewMode = "explorer";

  constructor(viewMode: ViewMode = "explorer") {
    this._mode = viewMode;
  }

  getScope(): ViewScope {
    return this._scope;
  }

  setScope(scope: ViewScope) {
    this._scope = scope;
    this.refresh();
  }

  setMode(mode: ViewMode) {
    this._mode = mode;
    this.refresh();
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: JxscoutTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: JxscoutTreeItem): Thenable<JxscoutTreeItem[]> {
    if (this._mode === "explorer") {
      return this.getFileExplorerChildren(element);
    } else {
      return this.getAstAnalysisChildren(element);
    }
  }

  private getFileExplorerChildren(
    element?: JxscoutTreeItem
  ): Thenable<JxscoutTreeItem[]> {
    if (!element) {
      if (this._scope === "project") {
        return Promise.resolve([
          new JxscoutTreeItem(
            "src",
            vscode.TreeItemCollapsibleState.Expanded,
            "directory",
            "folder"
          ),
        ]);
      } else {
        return Promise.resolve([
          new JxscoutTreeItem(
            "Current File Structure",
            vscode.TreeItemCollapsibleState.Expanded,
            "directory",
            "file-code"
          ),
        ]);
      }
    }

    if (element.contextValue === "directory") {
      return Promise.resolve([
        new JxscoutTreeItem(
          "index.js",
          vscode.TreeItemCollapsibleState.None,
          "file",
          "javascript"
        ),
        new JxscoutTreeItem(
          "utils.js",
          vscode.TreeItemCollapsibleState.None,
          "file",
          "javascript"
        ),
        new JxscoutTreeItem(
          "lib",
          vscode.TreeItemCollapsibleState.Collapsed,
          "directory",
          "folder"
        ),
      ]);
    }

    return Promise.resolve([]);
  }

  private getAstAnalysisChildren(
    element?: JxscoutTreeItem
  ): Thenable<JxscoutTreeItem[]> {
    if (!element) {
      const scope = this._scope === "project" ? "(Project)" : "(Current File)";
      return Promise.resolve([
        new JxscoutTreeItem(
          `Program ${scope}`,
          vscode.TreeItemCollapsibleState.Expanded,
          "ast-root",
          "symbol-namespace"
        ),
      ]);
    }

    if (element.contextValue === "ast-root") {
      return Promise.resolve([
        new JxscoutTreeItem(
          "Function Declaration",
          vscode.TreeItemCollapsibleState.Collapsed,
          "ast-node",
          "symbol-method"
        ),
        new JxscoutTreeItem(
          "Variable Declaration",
          vscode.TreeItemCollapsibleState.Collapsed,
          "ast-node",
          "symbol-variable"
        ),
      ]);
    }

    if (element.contextValue === "ast-node") {
      return Promise.resolve([
        new JxscoutTreeItem(
          "Parameters",
          vscode.TreeItemCollapsibleState.Collapsed,
          "ast-detail",
          "symbol-parameter"
        ),
        new JxscoutTreeItem(
          "Body",
          vscode.TreeItemCollapsibleState.Collapsed,
          "ast-detail",
          "symbol-field"
        ),
      ]);
    }

    return Promise.resolve([]);
  }
}
