import * as vscode from "vscode";
import { ASTAnalyzerTreeNode } from "./websocket-client";

type ViewScope = "project" | "file";

export class AstAnalysisTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly contextValue: string,
    public readonly iconName?: string,
    public readonly children?: ASTAnalyzerTreeNode[],
    public readonly data?: any
  ) {
    super(label, collapsibleState);
    if (iconName) {
      this.iconPath = new vscode.ThemeIcon(iconName);
    }
  }
}

type State = "loading" | "asset-not-found" | "success" | "empty";

export class AstAnalysisTreeProvider
  implements vscode.TreeDataProvider<AstAnalysisTreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    AstAnalysisTreeItem | undefined | null | void
  > = new vscode.EventEmitter<AstAnalysisTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    AstAnalysisTreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private _scope: ViewScope = "file";
  private _analysisData?: ASTAnalyzerTreeNode;
  private _state: State = "loading";

  getScope(): ViewScope {
    return this._scope;
  }

  setScope(scope: ViewScope) {
    this._scope = scope;
    this.refresh();
  }

  setState(state: State) {
    this._state = state;
    if (state !== "success") {
      this._analysisData = undefined;
    }
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
    if (this._state === "empty") {
      return Promise.resolve([]);
    }

    if (this._state === "loading") {
      return Promise.resolve([
        new AstAnalysisTreeItem(
          "Loading analysis...",
          vscode.TreeItemCollapsibleState.None,
          "loading",
          "loading~spin"
        ),
      ]);
    }

    if (this._state === "asset-not-found") {
      return Promise.resolve([
        new AstAnalysisTreeItem(
          "This file is not tracked by jxscout",
          vscode.TreeItemCollapsibleState.None,
          "empty",
          "info"
        ),
      ]);
    }

    if (!this._analysisData?.children?.length) {
      return Promise.resolve([
        new AstAnalysisTreeItem(
          "No AST Analysis matches found",
          vscode.TreeItemCollapsibleState.None,
          "empty",
          "info"
        ),
      ]);
    }

    if (!element) {
      return Promise.resolve(
        this._analysisData.children.map(
          (child) =>
            new AstAnalysisTreeItem(
              child.label || "Root",
              child.children?.length
                ? vscode.TreeItemCollapsibleState.Expanded
                : vscode.TreeItemCollapsibleState.None,
              child.type || "navigation",
              child.type === "match" ? "symbol-method" : "symbol-namespace",
              child.children,
              child.data
            )
        )
      );
    }

    if (element.contextValue === "navigation" && element.children) {
      return Promise.resolve(
        element.children.map(
          (child) =>
            new AstAnalysisTreeItem(
              child.label || "Node",
              child.children?.length
                ? vscode.TreeItemCollapsibleState.Expanded
                : vscode.TreeItemCollapsibleState.None,
              child.type || "navigation",
              child.type === "match" ? "symbol-method" : "symbol-namespace",
              child.children,
              child.data
            )
        )
      );
    }

    if (element.contextValue === "match" && element.data) {
      return Promise.resolve([
        new AstAnalysisTreeItem(
          `Value: ${element.data.value}`,
          vscode.TreeItemCollapsibleState.None,
          "match-value",
          "symbol-string"
        ),
      ]);
    }

    return Promise.resolve([]);
  }
}
