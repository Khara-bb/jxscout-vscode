import * as vscode from "vscode";

export class AstTreeItem extends vscode.TreeItem {
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

export class AstTreeProvider implements vscode.TreeDataProvider<AstTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    AstTreeItem | undefined | null | void
  > = new vscode.EventEmitter<AstTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    AstTreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private _isProjectScope: boolean = true;

  setScope(isProjectScope: boolean) {
    this._isProjectScope = isProjectScope;
    this.refresh();
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: AstTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: AstTreeItem): Thenable<AstTreeItem[]> {
    if (!element) {
      const scope = this._isProjectScope ? "(Project)" : "(Current File)";
      return Promise.resolve([
        new AstTreeItem(
          `Program ${scope}`,
          vscode.TreeItemCollapsibleState.Expanded,
          "ast-root",
          "symbol-namespace"
        ),
      ]);
    }

    if (element.contextValue === "ast-root") {
      return Promise.resolve([
        new AstTreeItem(
          "Function Declaration",
          vscode.TreeItemCollapsibleState.Collapsed,
          "ast-node",
          "symbol-method"
        ),
        new AstTreeItem(
          "Variable Declaration",
          vscode.TreeItemCollapsibleState.Collapsed,
          "ast-node",
          "symbol-variable"
        ),
      ]);
    }

    if (element.contextValue === "ast-node") {
      return Promise.resolve([
        new AstTreeItem(
          "Parameters",
          vscode.TreeItemCollapsibleState.Collapsed,
          "ast-detail",
          "symbol-parameter"
        ),
        new AstTreeItem(
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
