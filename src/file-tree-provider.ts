import * as vscode from "vscode";

export class FileTreeItem extends vscode.TreeItem {
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

export class FileTreeProvider implements vscode.TreeDataProvider<FileTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    FileTreeItem | undefined | null | void
  > = new vscode.EventEmitter<FileTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    FileTreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private _isProjectScope: boolean = true;

  setScope(isProjectScope: boolean) {
    this._isProjectScope = isProjectScope;
    this.refresh();
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: FileTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: FileTreeItem): Thenable<FileTreeItem[]> {
    if (!element) {
      if (this._isProjectScope) {
        return Promise.resolve([
          new FileTreeItem(
            "src",
            vscode.TreeItemCollapsibleState.Expanded,
            "directory",
            "folder"
          ),
        ]);
      } else {
        return Promise.resolve([
          new FileTreeItem(
            "Current File",
            vscode.TreeItemCollapsibleState.Expanded,
            "file",
            "file-code"
          ),
        ]);
      }
    }

    if (element.contextValue === "directory") {
      return Promise.resolve([
        new FileTreeItem(
          "index.js",
          vscode.TreeItemCollapsibleState.None,
          "file",
          "javascript"
        ),
        new FileTreeItem(
          "utils.js",
          vscode.TreeItemCollapsibleState.None,
          "file",
          "javascript"
        ),
        new FileTreeItem(
          "lib",
          vscode.TreeItemCollapsibleState.Collapsed,
          "directory",
          "folder"
        ),
      ]);
    }

    return Promise.resolve([]);
  }
}
