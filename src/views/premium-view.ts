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
                    padding: 1rem;
                    background: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                    margin: 0;
                }
                .container {
                    max-width: 100%;
                }
                .icon {
                    font-size: 2rem;
                    margin-bottom: 0.5rem;
                    color: #6c5ce7;
                    text-align: center;
                }
                h1 {
                    font-size: 1.2rem;
                    margin-bottom: 0.5rem;
                    color: var(--vscode-editor-foreground);
                    text-align: center;
                }
                p {
                    font-size: 0.9rem;
                    line-height: 1.4;
                    margin-bottom: 1rem;
                    color: var(--vscode-descriptionForeground);
                    text-align: center;
                }
                .features {
                    text-align: left;
                    margin: 1rem 0;
                    padding: 0;
                }
                .features li {
                    margin-bottom: 0.5rem;
                    display: flex;
                    align-items: center;
                    font-size: 0.85rem;
                }
                .features li:before {
                    content: "✓";
                    color: #6c5ce7;
                    margin-right: 0.5rem;
                    font-weight: bold;
                }
                .button-container {
                    text-align: center;
                    margin-top: 1rem;
                }
                .button {
                    background: #6c5ce7;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    font-size: 0.9rem;
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
                <h1>Unlock Advanced Features</h1>
                
                <ul class="features">
                    <li>Project level AST analysis</li>
                    <li>Enchanced project navigation</li>
                    <li>Visualize HTML, JS and Source Map relationships</li>
                </ul>

                <div class="button-container">
                    <a href="https://vscode.jxscout.app" class="button">Learn more</a>
                </div>
            </div>
        </body>
        </html>`;
  }
}
