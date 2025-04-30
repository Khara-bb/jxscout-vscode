import * as vscode from "vscode";
import { ASTAnalyzerTreeNode } from "./websocket-client";

type ViewScope = "project" | "file";

export class AstAnalysisTreeItem extends vscode.TreeItem {
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

export class AstAnalysisTreeProvider
  implements vscode.TreeDataProvider<AstAnalysisTreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    AstAnalysisTreeItem | undefined | null | void
  > = new vscode.EventEmitter<AstAnalysisTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    AstAnalysisTreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private _scope: ViewScope = "project";
  private _analysisData?: ASTAnalyzerTreeNode;

  getScope(): ViewScope {
    return this._scope;
  }

  setScope(scope: ViewScope) {
    this._scope = scope;
    this.refresh();
  }

  setAnalysisData(data: ASTAnalyzerTreeNode | undefined) {
    this._analysisData = data;
    this.refresh();
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: AstAnalysisTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: AstAnalysisTreeItem): Thenable<AstAnalysisTreeItem[]> {
    if (!this._analysisData) {
      return Promise.resolve([]);
    }

    if (!element) {
      return Promise.resolve([
        new AstAnalysisTreeItem(
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
            new AstAnalysisTreeItem(
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
