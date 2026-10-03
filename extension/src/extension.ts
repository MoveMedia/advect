import * as vscode from "vscode";
import {
  AdvectExtensionSettings,
  createExtensionSettings,
  getCustomHtmlData,
} from "./lib";
import { CustomElementSettings } from "@advect/advect.lib";

const knownCWS = new Map<string, CustomElementSettings>();

async function initializeElementsFile(_context: vscode.ExtensionContext) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    return null;
  }

  const workspaceRoot = workspaceFolders[0].uri.fsPath;
  const vscodeDirPath = `${workspaceRoot}/.vscode`;
  const elementsFilePath = `${vscodeDirPath}/advect/.elements.json`;

  const vscodeDirUri = vscode.Uri.file(vscodeDirPath);
  const elementsFileUri = vscode.Uri.file(elementsFilePath);

  try {
    await vscode.workspace.fs.stat(elementsFileUri);
  } catch {
    await vscode.workspace.fs.createDirectory(vscodeDirUri);
    await vscode.workspace.fs.writeFile(
      elementsFileUri,
      new TextEncoder().encode(JSON.stringify(getCustomHtmlData())),
    );
  }
}
async function updateHtmlCustomData(_context: vscode.ExtensionContext) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    return null;
  }

  const workspaceRoot = workspaceFolders[0].uri.fsPath;
  const vscodeDirPath = `${workspaceRoot}/.vscode`;
  const settingsPath = `${vscodeDirPath}/settings.json`;
  const elementsPath = `./.vscode/advect/.elements.json`;
  const settingsUri = vscode.Uri.file(settingsPath);

  try {
    await vscode.workspace.fs.stat(settingsUri);
    const data = await vscode.workspace.fs.readFile(settingsUri);
    const settings = JSON.parse(new TextDecoder().decode(data));

    if (!settings["html.customData"]) {
      settings["html.customData"] = [];
    }

    if (!settings["html.customData"].includes(elementsPath)) {
      settings["html.customData"].push(elementsPath);
      await vscode.workspace.fs.writeFile(
        settingsUri,
        new TextEncoder().encode(JSON.stringify(settings, null, 2)),
      );
    }
  } catch {
    // settings.json doesn't exist, skip
    const newSettings = { "html.customData": [elementsPath] };
    await vscode.workspace.fs.writeFile(
      settingsUri,
      new TextEncoder().encode(JSON.stringify(newSettings, null, 2)),
    );
  }
}

async function loadOrCreateAdvectConfig(_context: vscode.ExtensionContext) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    return null;
  }

  const workspaceRoot = workspaceFolders[0].uri.fsPath;
  const configPath = `${workspaceRoot}/.vscode/advect/config.json`;
  const configUri = vscode.Uri.file(configPath);

  try {
    const data = await vscode.workspace.fs.readFile(configUri);
    return JSON.parse(
      new TextDecoder().decode(data),
    ) as AdvectExtensionSettings;
  } catch {
    const defaultConfig = createExtensionSettings() as AdvectExtensionSettings;
    await vscode.workspace.fs.writeFile(
      configUri,
      new TextEncoder().encode(JSON.stringify(defaultConfig, null, 2)),
    );
    return defaultConfig;
  }
}

async function getWebviewContent(
  context: vscode.ExtensionContext,
  filePath = "",
) {
  const htmlPath = vscode.Uri.joinPath(context.extensionUri, "src", filePath);
  const htmlContent = await vscode.workspace.fs.readFile(htmlPath);
  return new TextDecoder().decode(htmlContent);
}

let panel: vscode.WebviewPanel | undefined | null;
function loadCustomElementFromString(htmlString: string) {
    if (!panel) {
      return;
    }
    panel.webview.postMessage({
      action: "SETTINGS_FROM_STRING",
      value: htmlString,
    });
  }
 async function createAdvectPanel(context: vscode.ExtensionContext){
    if (!panel) {
      panel = vscode.window.createWebviewPanel(
        "advect",
        "Avect Debug",
        vscode.ViewColumn.One,
        { enableScripts: true },
      );
    
      panel.onDidDispose(() => {
        panel = null;
      });
      panel.webview.onDidReceiveMessage(
        (msg: { action: string; value: Record<string, any> }) => {
          switch (msg.action) {
            case "LOG":
              console.log(msg.value);
              break;
            case "LOADED_CWE":
              (msg.value as CustomElementSettings[]).forEach((cwe) => {
                knownCWS.set(cwe.tagName, cwe);
              });
              break;
            default:
              break;
          }
        },
      );
    }
   await Promise.all([
      getWebviewContent(context, "ui/sample-window.html"),
      getWebviewContent(context, "advect/dist/advect.js"),
    ]).then((d) => {
      const [html, js] = d;
      const replacedHTML = html.replace(
        "<!--advect-->",
        `<script type="module">${js}</script>`,
      );
      if (panel) {
        panel.webview.html = replacedHTML;
      }
    });
  }



export function activate(context: vscode.ExtensionContext) {
  initializeElementsFile(context)
    .then(() => updateHtmlCustomData(context))
    .then(() => loadOrCreateAdvectConfig(context));


  const debugCommand = vscode.commands.registerCommand("advect.debug", () => {
      createAdvectPanel(context).then( () => {
        const test_component = `<template advect="test-card" root="shadow" shadow="open"></template>`;
        loadCustomElementFromString(test_component);
      });
  });
  context.subscriptions.push(debugCommand);


  // Create an
  //d show panel

  

  // const provider1 = vscode.languages.registerCompletionItemProvider("html", {
  //   provideCompletionItems(
  //     _document: vscode.TextDocument,
  //     _position: vscode.Position,
  //     _token: vscode.CancellationToken,
  //     _context: vscode.CompletionContext,
  //   ) {

  //     // return all completion items as array
  //     return [

  //     ];
  //   },
  // });

  // context.subscriptions.push(provider1);
}
