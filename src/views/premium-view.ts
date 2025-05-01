import * as vscode from "vscode";

export class PremiumView {
  private static instance: PremiumView | undefined;
  private view: vscode.WebviewView | undefined;

  private constructor() {}

  public static getInstance(): PremiumView {
    if (!PremiumView.instance) {
      PremiumView.instance = new PremiumView();
    }
    return PremiumView.instance;
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext<unknown>,
    token: vscode.CancellationToken
  ) {
    this.view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
    };
    webviewView.webview.html = this.getWebviewContent();
  }

  private getWebviewContent(): string {
    return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                    padding: 1.5rem;
                    background: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    margin: 0;
                }
                .container {
                    max-width: 100%;
                    text-align: center;
                }
                .icon {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                    color: #6c5ce7;
                }
                h1 {
                    font-size: 1.5rem;
                    margin-bottom: 0.75rem;
                    color: var(--vscode-editor-foreground);
                }
                p {
                    font-size: 1rem;
                    line-height: 1.5;
                    margin-bottom: 1.5rem;
                    color: var(--vscode-descriptionForeground);
                }
                .features {
                    text-align: left;
                    margin: 1.5rem 0;
                    padding: 0;
                }
                .features li {
                    margin-bottom: 0.75rem;
                    display: flex;
                    align-items: center;
                    font-size: 0.9rem;
                }
                .features li:before {
                    content: "✓";
                    color: #6c5ce7;
                    margin-right: 0.75rem;
                    font-weight: bold;
                }
                .button {
                    background: #6c5ce7;
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    font-size: 1rem;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: background 0.3s;
                    text-decoration: none;
                    display: inline-block;
                }
                .button:hover {
                    background: #5b4bc4;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="icon">🚀</div>
                <h1>Unlock Project Analysis</h1>
                <p>Upgrade to jxscout Premium to analyze your entire project and get deeper insights into your codebase.</p>
                
                <ul class="features">
                    <li>Analyze multiple files simultaneously</li>
                    <li>Get project-wide code patterns and insights</li>
                    <li>Track code quality across your entire project</li>
                    <li>Advanced project statistics and metrics</li>
                </ul>

                <a href="https://jxscout.com/premium" class="button">Upgrade to Premium</a>
            </div>
        </body>
        </html>`;
  }
}
