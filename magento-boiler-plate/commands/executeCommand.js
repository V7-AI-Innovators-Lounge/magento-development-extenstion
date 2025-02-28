const vscode = require('vscode');
const { exec } = require('child_process');

function executeMagentoCommand(command) {
    vscode.window.showInformationMessage(`Running: ${command}`);

    exec(command, { cwd: vscode.workspace.rootPath }, (error, stdout, stderr) => {
        if (error) {
            vscode.window.showErrorMessage(`Error: ${stderr}`);
            return;
        }
        vscode.window.showInformationMessage(stdout);
    });
}

module.exports = { executeMagentoCommand };
