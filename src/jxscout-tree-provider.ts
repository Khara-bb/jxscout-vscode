import * as vscode from "vscode";
import { ASTAnalyzerTreeNode } from "./websocket-client";

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
  private _analysisData?: ASTAnalyzerTreeNode;

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

  setAnalysisData(data: ASTAnalyzerTreeNode | undefined) {
    this._analysisData = data;
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
    if (!this._analysisData) {
      return Promise.resolve([]);
    }

    if (!element) {
      return Promise.resolve([
        new JxscoutTreeItem(
          this._analysisData.label || "AST Analysis",
          vscode.TreeItemCollapsibleState.Expanded,
          "ast-root",
          "symbol-namespace"
        ),
      ]);
    }

    if (element.contextValue === "ast-root" && this._analysisData.children) {
      return Promise.resolve(
        this._analysisData.children.map(
          (child) =>
            new JxscoutTreeItem(
              child.label || "Node",
              child.children?.length
                ? vscode.TreeItemCollapsibleState.Collapsed
                : vscode.TreeItemCollapsibleState.None,
              "ast-node",
              child.iconPath || "symbol-method"
            )
        )
      );
    }

    return Promise.resolve([]);
  }
}
