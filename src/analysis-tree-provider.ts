import * as vscode from "vscode";
import { AnalysisResult, Finding } from "./websocket-client";

export class AnalysisTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly children?: AnalysisTreeItem[],
    public readonly description?: string,
    public readonly tooltip?: string,
    public readonly command?: vscode.Command,
    public readonly range?: vscode.Range
  ) {
    super(label, collapsibleState);
    this.description = description;
    this.tooltip = tooltip;
    this.command = command;
    this.contextValue = "jxscout-item";
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
  private activeDecoration: vscode.TextEditorDecorationType | null = null;
  private activeEditor: vscode.TextEditor | null = null;
  private activeRange: vscode.Range | null = null;
  private selectedItems: Set<AnalysisTreeItem> = new Set();
  private treeView: vscode.TreeView<AnalysisTreeItem> | null = null;

  constructor() {
    // Create the decoration type
    this.activeDecoration = vscode.window.createTextEditorDecorationType({
      backgroundColor: new vscode.ThemeColor(
        "editor.findMatchHighlightBackground"
      ),
      isWholeLine: false,
    });

    // Listen for editor changes to clear highlighting when switching files
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor !== this.activeEditor) {
        this.clearHighlight();
      }
    });

    // Listen for editor clicks to clear highlighting
    vscode.window.onDidChangeTextEditorSelection((event) => {
      if (event.textEditor === this.activeEditor) {
        this.clearHighlight();
      }
    });
  }

  // Set the tree view reference
  setTreeView(treeView: vscode.TreeView<AnalysisTreeItem>): void {
    this.treeView = treeView;
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  clearAnalysis(): void {
    this.currentAnalysis = null;
    this.clearHighlight();
    this.selectedItems.clear();
    this.refresh();
  }

  updateAnalysis(analysis: AnalysisResult): void {
    this.currentAnalysis = analysis;
    this.clearHighlight();
    this.selectedItems.clear();
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
      const nodes = this.createAnalyzerNodes();

      // If there are no findings at all, show the "No interesting stuff found" message
      if (nodes.length === 0) {
        const noFindingsItem = new AnalysisTreeItem(
          "Nothing interesting was found",
          vscode.TreeItemCollapsibleState.None,
          undefined
        );
        return Promise.resolve([noFindingsItem]);
      }

      return Promise.resolve(nodes);
    }

    // Return children of the selected node
    return Promise.resolve(element.children || []);
  }

  private createAnalyzerNodes(): AnalysisTreeItem[] {
    if (!this.currentAnalysis) {
      return [];
    }

    const analyzerNodes: AnalysisTreeItem[] = [];
    const { results, filePath } = this.currentAnalysis;

    for (const [analyzerType, matches] of Object.entries(results)) {
      if (Array.isArray(matches) && matches.length > 0) {
        // Only create nodes for categories with findings
        const matchItems = matches.map((match, index) => {
          // Create the range for this match
          const range = new vscode.Range(
            match.start.line - 1, // Convert to 0-based line number
            match.start.column,
            match.end.line - 1, // Convert to 0-based line number
            match.end.column
          );

          // Create a command to jump to the code location
          const command: vscode.Command = {
            title: "Jump to code",
            command: "jxscout-vscode.highlightAndJump",
            arguments: [filePath, range],
          };

          const item = new AnalysisTreeItem(
            `${match.value}`,
            vscode.TreeItemCollapsibleState.None,
            undefined,
            undefined,
            `${match.value}`,
            command,
            range
          );

          // Ensure the item is enabled and has the correct icon
          item.iconPath = new vscode.ThemeIcon("symbol-keyword");
          return item;
        });

        // Capitalize the analyzer name
        const capitalizedAnalyzerType =
          analyzerType.charAt(0).toUpperCase() + analyzerType.slice(1);

        const analyzerNode = new AnalysisTreeItem(
          capitalizedAnalyzerType,
          vscode.TreeItemCollapsibleState.Expanded,
          matchItems
        );

        // Set icon for analyzer node
        analyzerNode.iconPath = new vscode.ThemeIcon("symbol-class");

        analyzerNodes.push(analyzerNode);
      }
    }

    return analyzerNodes;
  }

  private clearHighlight(): void {
    if (this.activeEditor && this.activeDecoration) {
      this.activeEditor.setDecorations(this.activeDecoration, []);
      this.activeRange = null;
    }
  }

  public highlightRange(editor: vscode.TextEditor, range: vscode.Range): void {
    if (!this.activeDecoration) {
      return;
    }

    this.clearHighlight();
    this.activeEditor = editor;
    this.activeRange = range;
    editor.setDecorations(this.activeDecoration, [range]);
  }

  // Handle keyboard navigation
  public handleKeyNavigation(key: string): void {
    if (!this.treeView) return;

    const selection = this.treeView.selection;
    if (selection.length === 0) return;

    const currentItem = selection[0];
    let nextItem: AnalysisTreeItem | undefined;

    if (key === "ArrowDown") {
      nextItem = this.findNextItem(currentItem);
    } else if (key === "ArrowUp") {
      nextItem = this.findPreviousItem(currentItem);
    }

    if (nextItem) {
      this.treeView.reveal(nextItem, { select: true, focus: true });
    }
  }

  // Find the next item in the tree
  private findNextItem(
    currentItem: AnalysisTreeItem
  ): AnalysisTreeItem | undefined {
    if (!this.currentAnalysis) return undefined;

    // Get all items in the tree
    const allItems = this.getAllItems();
    const currentIndex = allItems.findIndex((item) => item === currentItem);

    if (currentIndex === -1 || currentIndex === allItems.length - 1) {
      return undefined;
    }

    return allItems[currentIndex + 1];
  }

  // Find the previous item in the tree
  private findPreviousItem(
    currentItem: AnalysisTreeItem
  ): AnalysisTreeItem | undefined {
    if (!this.currentAnalysis) return undefined;

    // Get all items in the tree
    const allItems = this.getAllItems();
    const currentIndex = allItems.findIndex((item) => item === currentItem);

    if (currentIndex <= 0) {
      return undefined;
    }

    return allItems[currentIndex - 1];
  }

  // Get all items in the tree
  private getAllItems(): AnalysisTreeItem[] {
    if (!this.currentAnalysis) return [];

    const allItems: AnalysisTreeItem[] = [];
    const analyzerNodes = this.createAnalyzerNodes();

    for (const node of analyzerNodes) {
      allItems.push(node);
      if (node.children) {
        allItems.push(...node.children);
      }
    }

    return allItems;
  }

  // Handle selection
  public handleSelection(item: AnalysisTreeItem, isSelected: boolean): void {
    if (isSelected) {
      this.selectedItems.add(item);
    } else {
      this.selectedItems.delete(item);
    }
  }

  // Get all selected items
  public getSelectedItems(): AnalysisTreeItem[] {
    return Array.from(this.selectedItems);
  }

  // Copy selected items to clipboard
  public copySelectedItems(): void {
    const selectedItems = this.getSelectedItems();
    if (selectedItems.length === 0) return;

    const text = selectedItems.map((item) => item.label).join("\n");
    vscode.env.clipboard.writeText(text);
    vscode.window.showInformationMessage(
      `Copied ${selectedItems.length} items to clipboard`
    );
  }

  // Highlight and jump to code without changing focus
  public highlightAndJumpWithoutFocus(
    filePath: string,
    range: vscode.Range
  ): void {
    vscode.workspace.openTextDocument(filePath).then((document) => {
      vscode.window
        .showTextDocument(document, {
          selection: range,
          preserveFocus: true, // Keep focus on the tree view
        })
        .then((editor) => {
          this.highlightRange(editor, range);
        });
    });
  }

  public dispose(): void {
    this.clearHighlight();
    if (this.activeDecoration) {
      this.activeDecoration.dispose();
      this.activeDecoration = null;
    }
  }
}
