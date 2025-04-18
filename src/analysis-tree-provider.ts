import * as vscode from "vscode";
import { AnalysisResult } from "./websocket-client";

export class AnalysisTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly children?: AnalysisTreeItem[],
    public readonly description?: string,
    public readonly tooltip?: string
  ) {
    super(label, collapsibleState);
    this.description = description;
    this.tooltip = tooltip;
  }
}

export class AnalysisTreeProvider
  implements vscode.TreeDataProvider<AnalysisTreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    AnalysisTreeItem | undefined | null | void
  > = new vscode.EventEmitter<AnalysisTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    AnalysisTreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private currentAnalysis: AnalysisResult | null = null;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  updateAnalysis(analysis: AnalysisResult): void {
    this.currentAnalysis = analysis;
    this.refresh();
  }

  getTreeItem(element: AnalysisTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: AnalysisTreeItem): Thenable<AnalysisTreeItem[]> {
    if (!this.currentAnalysis) {
      return Promise.resolve([]);
    }

    if (!element) {
      // Root level - create analyzer type nodes
      return Promise.resolve(this.createAnalyzerNodes());
    }

    // Return children of the selected node
    return Promise.resolve(element.children || []);
  }

  private createAnalyzerNodes(): AnalysisTreeItem[] {
    if (!this.currentAnalysis) {
      return [];
    }

    const analyzerNodes: AnalysisTreeItem[] = [];
    const { results } = this.currentAnalysis;

    for (const [analyzerType, matches] of Object.entries(results)) {
      if (Array.isArray(matches)) {
        const matchItems = matches.map((match: any, index: number) => {
          const description = `Line ${match.start.line}:${match.start.column} - ${match.start.line}:${match.end.column}`;
          return new AnalysisTreeItem(
            `Match ${index + 1}`,
            vscode.TreeItemCollapsibleState.None,
            undefined,
            description,
            `Value: ${match.value}`
          );
        });

        analyzerNodes.push(
          new AnalysisTreeItem(
            analyzerType,
            vscode.TreeItemCollapsibleState.Expanded,
            matchItems
          )
        );
      }
    }

    return analyzerNodes;
  }
}
