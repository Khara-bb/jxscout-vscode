import * as vscode from "vscode";
import * as https from "https";

const CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds
const GITHUB_API_URL =
  "https://api.github.com/repos/francisconeves97/jxscout-vscode/releases/latest";
const GITHUB_RELEASES_URL =
  "https://github.com/francisconeves97/jxscout-vscode/releases";

export class VersionCheckService {
  private static instance: VersionCheckService;
  private timer: NodeJS.Timeout | undefined;
  private lastCheck: number = 0;

  private constructor() {}

  public static getInstance(): VersionCheckService {
    if (!VersionCheckService.instance) {
      VersionCheckService.instance = new VersionCheckService();
    }
    return VersionCheckService.instance;
  }

  public start(): void {
    // Check immediately on startup
    this.checkForUpdates();

    // Set up periodic checks
    this.timer = setInterval(() => {
      this.checkForUpdates();
    }, CHECK_INTERVAL);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private async checkForUpdates(): Promise<void> {
    const now = Date.now();
    // Don't check if we've checked in the last hour
    if (now - this.lastCheck < CHECK_INTERVAL) {
      return;
    }

    try {
      const latestVersion = await this.getLatestVersion();
      const currentVersion = vscode.extensions.getExtension(
        "jxscout.jxscout-vscode"
      )?.packageJSON.version;

      if (
        latestVersion &&
        currentVersion &&
        this.isNewerVersion(latestVersion, currentVersion)
      ) {
        vscode.window
          .showInformationMessage(
            `A new version of jxscout-vscode (${latestVersion}) is available. You are currently using version ${currentVersion}.`,
            "Update Now"
          )
          .then((selection) => {
            if (selection === "Update Now") {
              vscode.env.openExternal(vscode.Uri.parse(GITHUB_RELEASES_URL));
            }
          });
      }
    } catch (error) {
      console.error("Failed to check for updates:", error);
    }

    this.lastCheck = now;
  }

  private async getLatestVersion(): Promise<string | null> {
    return new Promise((resolve, reject) => {
      https
        .get(
          GITHUB_API_URL,
          {
            headers: {
              "User-Agent": "jxscout-vscode-extension",
            },
          },
          (res) => {
            let data = "";
            res.on("data", (chunk) => {
              data += chunk;
            });
            res.on("end", () => {
              try {
                const release = JSON.parse(data);
                resolve(release.tag_name.replace("v", ""));
              } catch (error) {
                reject(error);
              }
            });
          }
        )
        .on("error", (error) => {
          reject(error);
        });
    });
  }

  private isNewerVersion(latest: string, current: string): boolean {
    const latestParts = latest.split(".").map(Number);
    const currentParts = current.split(".").map(Number);

    for (let i = 0; i < 3; i++) {
      if (latestParts[i] > currentParts[i]) {
        return true;
      }
      if (latestParts[i] < currentParts[i]) {
        return false;
      }
    }
    return false;
  }
}
