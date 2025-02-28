const vscode = require('vscode');
const { executeMagentoCommand } = require('./executeCommand');

function registerMagentoCommands(context) {
    let magentoCommandPalette = vscode.commands.registerCommand('magentoBoilerplate.commandPalette', function () {
        vscode.window.showQuickPick([
            'Setup Upgrade (setup:upgrade)',
            'Flush Cache (cache:flush)',
            'Reindex (indexer:reindex)',
            'Enable Module (module:enable)',
            'Disable Module (module:disable)',
            'Check Module Status (module:status)',
            'Set Production Mode (deploy:mode:set production)',
            'Set Developer Mode (deploy:mode:set developer)'
        ], { placeHolder: 'Select Magento Command' }).then(choice => {
            if (!choice) return;

            let command = '';

            switch (choice) {
                case 'Setup Upgrade (setup:upgrade)':
                    command = 'php bin/magento setup:upgrade';
                    break;
                case 'Flush Cache (cache:flush)':
                    command = 'php bin/magento cache:flush';
                    break;
                case 'Reindex (indexer:reindex)':
                    command = 'php bin/magento indexer:reindex';
                    break;
                case 'Enable Module (module:enable)':
                    vscode.window.showInputBox({ prompt: 'Enter module name to enable (e.g., Vendor_Module)' }).then(moduleName => {
                        if (moduleName) executeMagentoCommand(`php bin/magento module:enable ${moduleName}`);
                    });
                    return;
                case 'Disable Module (module:disable)':
                    vscode.window.showInputBox({ prompt: 'Enter module name to disable (e.g., Vendor_Module)' }).then(moduleName => {
                        if (moduleName) executeMagentoCommand(`php bin/magento module:disable ${moduleName}`);
                    });
                    return;
                case 'Check Module Status (module:status)':
                    command = 'php bin/magento module:status';
                    break;
                case 'Set Production Mode (deploy:mode:set production)':
                    command = 'php bin/magento deploy:mode:set production';
                    break;
                case 'Set Developer Mode (deploy:mode:set developer)':
                    command = 'php bin/magento deploy:mode:set developer';
                    break;
                default:
                    vscode.window.showErrorMessage('Unknown Magento command.');
                    return;
            }

            executeMagentoCommand(command);
        });
    });

    context.subscriptions.push(magentoCommandPalette);
}

module.exports = { registerMagentoCommands };
