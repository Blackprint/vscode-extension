let vscode = require('vscode');
let path = require('path');
let fs = require('fs');

let outputChannel = vscode.window.createOutputChannel('Blackprint', 'log');
let resolvedPackage = {};

class BlackprintViewerProvider {
  constructor(context) {
    this.context = context;
    this.pendingError = '';
  }

  unsavedChanges(document, text) {
    const edit = new vscode.WorkspaceEdit();
    const fullRange = new vscode.Range(
      document.positionAt(0),
      document.positionAt(document.getText().length)
    );
    edit.replace(document.uri, fullRange, text);
    vscode.workspace.applyEdit(edit);
  }

  findBlackprintSkeleton(startDir){
    let dir = startDir;
    let skeletons = [];

    // Transverse path to find blackprint.skeleton.json
    while (dir !== path.dirname(dir)) {
      let file = path.join(dir, 'blackprint.skeleton.json');
      if (fs.existsSync(file)) skeletons.push(fs.readFileSync(file, 'utf8'));

      dir = path.dirname(dir);
    }

    return skeletons;
  }

  findBlackprintModules(startDir, webviewPanel) {
    let dir = startDir;
    let blackprintModules = null;

    // Transverse path to find package.json
    while (dir !== path.dirname(dir)) {
      let pj = path.join(dir, 'package.json');
      if (fs.existsSync(pj)) {
        let packageJSON = JSON.parse(fs.readFileSync(pj, 'utf8'));
        if (packageJSON.blackprint?.dependencies == null) continue;
        blackprintModules = packageJSON.blackprint.dependencies;
      }

      // Find node_modules
      let modulePath = path.join(dir, 'node_modules');
      if (fs.existsSync(modulePath)) {
        let modules = {};
        let modulesRoot = [];
        for (let i = 0; i < blackprintModules.length; i++) {
          let name = blackprintModules[i];
          let target = modulePath + '/' + name;

          if (!fs.existsSync(target + '/package.json')) {
            this.pendingError += `Couldn't find module '${name}' in node_modules, have you install it?\n\n`;
            continue;
          }

          let packages = JSON.parse(fs.readFileSync(target + '/package.json', 'utf8'));
          let entryFile = packages.module ?? packages.main;

          modulesRoot.push(target);

          if (!entryFile) {
            let sources = packages.blackprint?.source;
            if (sources) {
              sources = Object.keys(sources);
              for (let j = 0; j < sources.length; j++) {
                let url = decodeURIComponent(webviewPanel.webview.asWebviewUri(vscode.Uri.file(`${target}/${sources[j]}`.split('//').join('/'))).toString());
                modules[url] = name + '/' + sources[j];
              }
            }
          }
          else {
            let url = decodeURIComponent(webviewPanel.webview.asWebviewUri(vscode.Uri.file(`${target}/${entryFile}`)));
            modules[url] = name;
          }
        }

        return {
          list: modules,
          roots: modulesRoot,
        };
      }

      dir = path.dirname(dir);
    }

    return null;
  }

  resolveCustomTextEditor(document, webviewPanel, _token) {
    let filePath = document.uri.fsPath;
    let fileName = path.basename(filePath);
    let modules = this.findBlackprintModules(filePath, webviewPanel);
    let modulesUri = modules?.list ?? {};

    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, 'out'),
        ...(getNodeModulesPaths(filePath)).map(vscode.Uri.file),
      ],
    };

    // Handle messages from the webview
    webviewPanel.webview.onDidReceiveMessage(async action => {
      if (action.type === 'loadSketch') {
        webviewPanel.webview.postMessage({
          type: 'loadSketch',
          data: { json: document.getText() }
        });
      }
      else if (action.type === 'openExtensionSettings'){
        vscode.commands.executeCommand('workbench.action.openSettings', '@ext:Blackprint.blackprint-vscode-extension');
      }
      else if (action.type === 'unsavedChanges') {
        this.unsavedChanges(document, action.data.text);
      }
      else if (action.type === 'editorConsoleLog') {
        outputChannel.appendLine(`[Editor Log (${fileName})] ${action.data.message}`);
      }
      else if (action.type === 'resolveNpmPackage') {
        try {
          let temp = resolvedPackage[action.data.name] ??= require.resolve(action.data.name);

          webviewPanel.webview.postMessage({
            type: 'resolvedNpmPackage',
            data: {
              name: action.data.name,
              url: decodeURIComponent(webviewPanel.webview.asWebviewUri(vscode.Uri.file(temp))),
            }
          });
        } catch(e) {
          webviewPanel.webview.postMessage({
            type: 'resolvedNpmPackage',
            data: { name: action.data.name, url: null }
          });
        }
      }
      else if (action.type === 'runBlackprintCLI') {
        this.runBlackprintOnTerminal(filePath, action.data.withRemote, webviewPanel);
      }
      else if (action.type === 'runSocketRelay') {
        this.runSocketRelay(filePath, webviewPanel);
      }
    });

    // Clean up the listener when the webview is disposed
    webviewPanel.onDidDispose(() => {
      outputChannel.appendLine(`[Blackprint Editor] webview disposed`);
    });

    return new Promise((resolve, reject) => {
      fs.readFile(__dirname + "/../../out/index.html", 'utf8', (err, data) => {
        if (err) {
          outputChannel.appendLine(`[Blackprint Editor] Error reading index.html: ${err.message}`);
          outputChannel.show(true); // Show the output channel
          return reject(err);
        }

        let skeletons = this.findBlackprintSkeleton(filePath);
        let uri = vscode.Uri.file(this.context.asAbsolutePath('out'));
        let outUri = webviewPanel.webview.asWebviewUri(uri).toString();

        // Get whitelisted URLs from VSCode settings to override Webview CSP
        let config = vscode.workspace.getConfiguration('blackprint');
        let whitelistedUrls = config.get('whitelistedUrls', []);

        data = data.replace('/*blackprintModules*/1', JSON.stringify(modulesUri));
        data = data.replace('/*blackprintSkeletons*/1', JSON.stringify(skeletons));
        data = data.replace('/*blackprintCspWhitelist*/', whitelistedUrls.join(' '));

        outputChannel.appendLine(`[Blackprint Editor] found ${skeletons.length} blackprint.skeleton.json file, and ${modules.roots.length} node module root`);
        outputChannel.appendLine(`[Blackprint Editor] there are ${whitelistedUrls.length} custom whitelisted URL, make sure you aware of it`);

        webviewPanel.webview.html = data.replace(/\(out-folder\)/g, outUri);
        resolve();
      });
    });
  }

  async runBlackprintOnTerminal(filePath, withRemote, webviewPanel){
    // Get the selected runtime from VSCode settings
    const config = vscode.workspace.getConfiguration('blackprint');
    const runtime = config.get('runtime', 'node');
    let remotePort = withRemote ? 8745 : null;

    // Show confirmation message with runtime information
    let confirmation = await vscode.window.showWarningMessage(
      `Are you sure to run this Blackprint file on your terminal using ${runtime}?\nMake sure you're aware of this action. ` + filePath,
      'Allow', 'Reject'
    );

    if(confirmation !== 'Allow') {
      webviewPanel.webview.postMessage({
        type: 'runBlackprintCLICallback',
        data: {
          success: false,
          error: "Can't execute Blackprint in your terminal due to permission",
        }
      });
      return;
    }

    // Execute the appropriate command based on the selected runtime
    try {
      let command;
      const remoteArg = withRemote ? `--remote=`+remotePort : '';

      switch(runtime) {
        case 'Node.js':
          command = `node --import @blackprint/engine/nodejs-loader "${filePath}" ${remoteArg}`;
          break;
        case 'Bun':
          command = `bun run --preload @blackprint/engine/bun-loader "${filePath}" ${remoteArg}`;
          break;
        default:
          throw new Error(`Unsupported runtime: ${runtime}`);
      }

      // Execute the command in the terminal
      const terminal = vscode.window.createTerminal('Blackprint: ' + path.basename(filePath));
      terminal.sendText(command);
      terminal.show(true);

      webviewPanel.webview.postMessage({
        type: 'runBlackprintCLICallback',
        data: {
          success: true,
          port: remotePort,
          runtime: runtime,
          command: command
        }
      });

    } catch (error) {
      webviewPanel.webview.postMessage({
        type: 'runBlackprintCLICallback',
        data: {
          success: false,
          error: `Failed to execute Blackprint: ${error.message}`,
        }
      });
    }
  }

  async runSocketRelay(filePath, webviewPanel){
    let remotePort = 8748;
    let confirmation = await vscode.window.showWarningMessage("Are you sure to run Blackprint Relay Server on your terminal?\nMake sure you're aware of this action.", 'Allow', 'Reject');
    if(confirmation !== 'Allow') {
      webviewPanel.webview.postMessage({
        type: 'runSocketRelayCallback',
        data: {
          success: false,
          error: "Can't execute relay server in your terminal due to permission",
        }
      });
      return;
    }

    try {
      const remoteArg = remotePort ? `--remote=`+remotePort : '';
      let command = `npx blackprint run:relay ${remoteArg}`;

      // Execute the command in the terminal
      const terminal = vscode.window.createTerminal('Blackprint Relay Server');
      terminal.sendText(command);
      terminal.show(true);

      webviewPanel.webview.postMessage({
        type: 'runSocketRelayCallback',
        data: {
          success: true,
          port: remotePort,
        }
      });

    } catch (error) {
      webviewPanel.webview.postMessage({
        type: 'runSocketRelayCallback',
        data: {
          success: false,
          error: `Failed to execute Blackprint: ${error.message}`,
        }
      });
    }
  }
}

// console.log(vscode.window.showQuickPick(["Do nothing", "Run remote server (make sure you're aware on what you're doing)"]))

function getNodeModulesPaths(filePath) {
  if (!filePath) return [];

  const paths = [];
  let currentDir = path.dirname(filePath);

  while (true) {
    const nodeModulesPath = path.join(currentDir, 'node_modules');
    if (fs.existsSync(nodeModulesPath)) paths.push(nodeModulesPath);

    const parentDir = path.dirname(currentDir);
    if (!parentDir || parentDir.length < 4 || parentDir === currentDir) break; // Reached the root directory
    currentDir = parentDir;
  }

  return paths;
}

module.exports = {
  activate(context) {
    context.subscriptions.push(vscode.window.registerCustomEditorProvider('blackprint.viewer', new BlackprintViewerProvider(context), {
      webviewOptions: {
        retainContextWhenHidden: true,
      }
    }));

    let openAsTextCommand = vscode.commands.registerCommand('blackprint.openAsText', function (uri) {
      let documentUri = uri;

      // If no URI is provided (called from context menu without selection),
      if (!documentUri) {
        let activeEditor = vscode.window.activeTextEditor;
        if (activeEditor && activeEditor.document.fileName.endsWith('.bpi')) {
          documentUri = activeEditor.document.uri;
        } else {
          vscode.window.showWarningMessage('Please select a .bpi file or have one open in the editor.');
          return;
        }
      }

      vscode.workspace.openTextDocument(documentUri).then(document => {
        vscode.window.showTextDocument(document);
      }).catch(err => {
        vscode.window.showErrorMessage('Failed to open file as text: ' + err.message);
      });
    });

    context.subscriptions.push(openAsTextCommand);

    let newFileCommand = vscode.commands.registerCommand('blackprint.newFile', function () {
      vscode.window.showInputBox({
        prompt: 'Enter the name for the new Blackprint file',
        placeHolder: 'my_blackprint.bpi'
      }).then(fileName => {
        if (fileName) {
          if (!fileName.endsWith('.bpi')) fileName += '.bpi';

          let workspaceFolders = vscode.workspace.workspaceFolders;
          let folderPath = workspaceFolders && workspaceFolders.length > 0 ? workspaceFolders[0].uri.fsPath : '';
          let filePath = path.join(folderPath, fileName);

          // Create the file with basic content
          let defaultContent = JSON.stringify({
            instance: {},
          }, null, 2);

          fs.writeFile(filePath, defaultContent, 'utf8', (err) => {
            if (err) {
              vscode.window.showErrorMessage('Failed to create new Blackprint file: ' + err.message);
              return;
            }

            // Open the newly created file
            vscode.workspace.openTextDocument(vscode.Uri.file(filePath)).then(document => {
              vscode.window.showTextDocument(document);
            });
          });
        }
      });
    });

    context.subscriptions.push(newFileCommand);

    vscode.workspace.onDidSaveTextDocument(function (document) {
      outputChannel.appendLine(`[Blackprint Editor] saved: ${document.fileName}`);
    });
  },
  deactivate() {
    outputChannel.dispose();
  }
};