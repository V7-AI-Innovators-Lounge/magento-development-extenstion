const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { fetchAIResponse } = require('./fetchAIResponse');
const { generateMagentoBoilerplate } = require('./generateMagentoBoilerplate');
const { registerMagentoCommands } = require('./commands/magentoCommands');
const { askMagentoAI } = require('./commands/debugMagento');
const { askMagentoCodeAI } = require('./commands/generateMagentoCode');
const { askMagentoUnitTest } = require('./commands/generateUnitTest');
const { generateDeliveryMethod } = require('./generateDeliveryMethod');
const { generatePaymentGateway } = require('./generatePaymentGateway');

function activate(context) {

    // Command for Module Creation
    let createModuleCommand = vscode.commands.registerCommand('magentoBoilerplate.createModule', function () {
        vscode.window.showInputBox({ prompt: 'Enter Vendor Name (e.g., Ashish)' }).then(vendor => {
            if (!vendor) {
                vscode.window.showErrorMessage("Vendor name is required.");
                return;
            }

            vscode.window.showInputBox({ prompt: 'Enter Module Name (e.g., CustomModule)' }).then(module => {
                if (!module) {
                    vscode.window.showErrorMessage("Module name is required.");
                    return;
                }

                const wsFolders = vscode.workspace.workspaceFolders;
                if (!wsFolders) {
                    vscode.window.showErrorMessage("Open a workspace folder to generate the module.");
                    return;
                }

                const workspaceDir = wsFolders[0].uri.fsPath;
                const vendorDir = path.join(workspaceDir, vendor);
                const moduleDir = path.join(vendorDir, module);

                createMagentoModuleStructure(vendorDir, moduleDir, vendor, module);

                vscode.window.showInformationMessage(`Magento Module ${vendor}_${module} created successfully!`);
            });
        });
    });

    // Command for Table & Related Files
    let createTableCommand = vscode.commands.registerCommand('magentoBoilerplate.createTable', async function () {
        const vendor = await vscode.window.showInputBox({ prompt: 'Enter Vendor Name (e.g., Ashish)' });
        if (!vendor) return vscode.window.showErrorMessage("Vendor name is required.");
    
        const module = await vscode.window.showInputBox({ prompt: 'Enter Module Name (e.g., CustomModule)' });
        if (!module) return vscode.window.showErrorMessage("Module name is required.");
    
        const tableName = await vscode.window.showInputBox({ prompt: 'Enter Table Name (e.g., custom_table)' });
        if (!tableName) return vscode.window.showErrorMessage("Table name is required.");
    
        let columns = [];
        let primaryKeySet = false;
        let addMoreColumns = true;
    
        while (addMoreColumns) {
            const columnName = await vscode.window.showInputBox({ prompt: 'Enter Column Name (e.g., id, name, price)' });
            if (!columnName) break;
    
            const columnType = await vscode.window.showQuickPick(['int', 'varchar', 'text', 'decimal'], { placeHolder: 'Select Column Type' });
            if (!columnType) return vscode.window.showErrorMessage("Column type is required.");
    
            let columnLength = "";
            if (columnType === 'varchar' || columnType === 'decimal') {
                columnLength = await vscode.window.showInputBox({ prompt: 'Enter Column Length (e.g., 255 for varchar, 10,2 for decimal)', value: '255' });
            }
    
            const isNullable = await vscode.window.showQuickPick(['Yes', 'No'], { placeHolder: 'Should this column be NULLABLE?' });
            const nullable = isNullable === 'Yes';
    
            let isPrimary = false;
            let identity = false;
    
            if (!primaryKeySet) { // Ask for primary key selection once
                const makePrimary = await vscode.window.showQuickPick(['Yes', 'No'], { placeHolder: `Is this column the PRIMARY KEY?` });
                isPrimary = makePrimary === 'Yes';
    
                if (isPrimary) {
                    primaryKeySet = true; // Only one column can be primary key
                    if (columnType === 'int') {
                        const makeIdentity = await vscode.window.showQuickPick(['Yes', 'No'], { placeHolder: 'Should this column be AUTO_INCREMENT (IDENTITY)?' });
                        identity = makeIdentity === 'Yes';
                    }
                }
            }
    
            columns.push({
                name: columnName,
                type: columnType,
                length: columnLength,
                nullable: nullable,
                primary: isPrimary,
                identity: identity
            });
    
            const moreColumns = await vscode.window.showQuickPick(['Yes', 'No'], { placeHolder: 'Do you want to add more columns?' });
            if (moreColumns === 'No') addMoreColumns = false;
        }
    
        // If no primary key was selected, force the user to choose one
        if (!primaryKeySet) {
            const primaryKeyColumn = await vscode.window.showQuickPick(columns.map(col => col.name), { placeHolder: 'Select a column to be PRIMARY KEY' });
            if (!primaryKeyColumn) return vscode.window.showErrorMessage("You must select a primary key column.");
            
            // Mark the selected column as primary key
            columns = columns.map(col => {
                if (col.name === primaryKeyColumn) {
                    col.primary = true;
                    if (col.type === 'int') col.identity = true; // Assume auto-increment for int primary keys
                }
                return col;
            });
        }
    
        const wsFolders = vscode.workspace.workspaceFolders;
        if (!wsFolders) return vscode.window.showErrorMessage("Open a workspace folder to generate the table structure.");
        
        const workspaceDir = wsFolders[0].uri.fsPath;
        const moduleDir = path.join(workspaceDir, vendor, module);
    
        createTableStructure(moduleDir, vendor, module, tableName, columns);
    
        vscode.window.showInformationMessage(`Table ${tableName} and related model files created successfully!`);
    });

    let createObserverCommand = vscode.commands.registerCommand('magentoBoilerplate.createObserver', async function () {
        try {
            const vendor = await promptUser("Enter Vendor Name (e.g., Ashish)");
            if (!vendor) return showError("Vendor name is required.");
    
            const module = await promptUser("Enter Module Name (e.g., CustomModule)");
            if (!module) return showError("Module name is required.");
    
            const eventName = await promptUser("Enter Event Name (e.g., customer_login)");
            if (!eventName) return showError("Event name is required.");
    
            const observerName = await promptUser("Enter Observer Class Name (e.g., CustomerLoginObserver)");
            if (!observerName) return showError("Observer class name is required.");
    
            const wsFolders = vscode.workspace.workspaceFolders;
            if (!wsFolders) return showError("Open a workspace folder to generate the observer.");
    
            const workspaceDir = wsFolders[0].uri.fsPath;
            const moduleDir = path.join(workspaceDir, vendor, module);
            const observerDir = path.join(moduleDir, 'Observer');
            const eventFilePath = path.join(moduleDir, 'etc', 'events.xml');
    
            createObserverFile(observerDir, vendor, module, observerName);
            updateEventsXml(eventFilePath, vendor, module, observerName, eventName);
    
            vscode.window.showInformationMessage(`Observer ${observerName} for event ${eventName} created successfully in ${vendor}_${module}.`);
        } catch (error) {
            vscode.window.showErrorMessage("Error: " + error.message);
        }
    });
    
    
    let createCliCommand = vscode.commands.registerCommand('magentoBoilerplate.createCliCommand', function () {
        vscode.window.showInputBox({ prompt: 'Enter Vendor Name (e.g., Ashish)' }).then(vendor => {
            if (!vendor) {
                vscode.window.showErrorMessage("Vendor name is required.");
                return;
            }
    
            vscode.window.showInputBox({ prompt: 'Enter Module Name (e.g., CustomModule)' }).then(module => {
                if (!module) {
                    vscode.window.showErrorMessage("Module name is required.");
                    return;
                }
    
                vscode.window.showInputBox({ prompt: 'Enter Command Name (e.g., custom:hello)' }).then(commandName => {
                    if (!commandName) {
                        vscode.window.showErrorMessage("Command name is required.");
                        return;
                    }
    
                    const wsFolders = vscode.workspace.workspaceFolders;
                    if (!wsFolders) {
                        vscode.window.showErrorMessage("Open a workspace folder to generate the CLI command.");
                        return;
                    }
    
                    const workspaceDir = wsFolders[0].uri.fsPath;
                    const moduleDir = path.join(workspaceDir, vendor, module);
                    const cliDir = path.join(moduleDir, 'Console', 'Command');
    
                    if (!fs.existsSync(cliDir)) fs.mkdirSync(cliDir, { recursive: true });
    
                    let cliCommandContent = `<?php
                        namespace ${vendor}\\${module}\\Console\\Command;
                        
                        use Magento\\Framework\\App\\State;
                        use Symfony\\Component\\Console\\Command\\Command;
                        use Symfony\\Component\\Console\\Input\\InputInterface;
                        use Symfony\\Component\\Console\\Output\\OutputInterface;
                        
                        class CustomCommand extends Command {
                            protected function configure() {
                                $this->setName('${commandName}')
                                    ->setDescription('Custom CLI Command');
                            }
                        
                            protected function execute(InputInterface $input, OutputInterface $output) {
                                $output->writeln('Hello from ${commandName}!');
                                return 0;
                            }
                        }`;
                    fs.writeFileSync(path.join(cliDir, 'CustomCommand.php'), cliCommandContent);
    
                    const diFilePath = path.join(moduleDir, 'etc', 'di.xml');
                    let diContent = `<?xml version="1.0"?>
                        <config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="urn:magento:framework/ObjectManager/etc/config.xsd">
                            <type name="Magento\\Framework\\Console\\CommandList">
                                <arguments>
                                    <argument name="commands" xsi:type="array">
                                        <item name="${vendor}_${module}_CustomCommand" xsi:type="object">${vendor}\\${module}\\Console\\Command\\CustomCommand</item>
                                    </argument>
                                </arguments>
                            </type>
                        </config>`;
                    fs.writeFileSync(diFilePath, diContent);
    
                    vscode.window.showInformationMessage(`CLI Command ${commandName} created successfully in ${vendor}_${module}.`);
                });
            });
        });
    });

    let createControllerCommand = vscode.commands.registerCommand('magentoBoilerplate.createController', function () {
        vscode.window.showInputBox({ prompt: 'Enter Vendor Name (e.g., Ashish)' }).then(vendor => {
            if (!vendor) {
                vscode.window.showErrorMessage("Vendor name is required.");
                return;
            }
    
            vscode.window.showInputBox({ prompt: 'Enter Module Name (e.g., CustomModule)' }).then(module => {
                if (!module) {
                    vscode.window.showErrorMessage("Module name is required.");
                    return;
                }
    
                vscode.window.showQuickPick(['adminhtml', 'frontend'], { placeHolder: 'Select Area (Adminhtml or Frontend)' }).then(area => {
                    if (!area) {
                        vscode.window.showErrorMessage("Area selection is required.");
                        return;
                    }
    
                    vscode.window.showInputBox({ prompt: 'Enter Route ID (e.g., admin for Admin, customroute for Frontend)' }).then(routeId => {
                        if (!routeId) {
                            vscode.window.showErrorMessage("Route ID is required.");
                            return;
                        }
    
                        vscode.window.showInputBox({ prompt: 'Enter Front Name (e.g., custommodule)' }).then(frontName => {
                            if (!frontName) {
                                vscode.window.showErrorMessage("Front Name is required.");
                                return;
                            }
    
                            vscode.window.showInputBox({ prompt: 'Enter Controller Name (e.g., Test)' }).then(controller => {
                                if (!controller) {
                                    vscode.window.showErrorMessage("Controller name is required.");
                                    return;
                                }
    
                                vscode.window.showInputBox({ prompt: 'Enter Action Name (e.g., Index)' }).then(action => {
                                    if (!action) {
                                        vscode.window.showErrorMessage("Action name is required.");
                                        return;
                                    }
    
                                    const wsFolders = vscode.workspace.workspaceFolders;
                                    if (!wsFolders) {
                                        vscode.window.showErrorMessage("Open a workspace folder to generate the Controller.");
                                        return;
                                    }
    
                                    const workspaceDir = wsFolders[0].uri.fsPath;
                                    const moduleDir = path.join(workspaceDir, vendor, module);
                                    const controllerDir = path.join(moduleDir, 'Controller', controller);
                                    const etcPath = path.join(moduleDir, 'etc');
    
                                    if (!fs.existsSync(controllerDir)) fs.mkdirSync(controllerDir, { recursive: true });
    
                                    createControllerFile(controllerDir, vendor, module, area, controller, action);
                                    createRoutesFile(etcPath, vendor, module, area, routeId, frontName);
    
                                    vscode.window.showInformationMessage(`Controller ${controller}\\${action}.php created successfully in ${vendor}_${module} with routes.xml!`);
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    let createRepositoryCommand = vscode.commands.registerCommand('magentoBoilerplate.createRepository', function () {
        vscode.window.showInputBox({ prompt: 'Enter Vendor Name (e.g., Ashish)' }).then(vendor => {
            if (!vendor) {
                vscode.window.showErrorMessage("Vendor name is required.");
                return;
            }
    
            vscode.window.showInputBox({ prompt: 'Enter Module Name (e.g., CustomModule)' }).then(module => {
                if (!module) {
                    vscode.window.showErrorMessage("Module name is required.");
                    return;
                }
    
                vscode.window.showInputBox({ prompt: 'Enter Model Name (e.g., Product)' }).then(modelName => {
                    if (!modelName) {
                        vscode.window.showErrorMessage("Model name is required.");
                        return;
                    }
    
                    const wsFolders = vscode.workspace.workspaceFolders;
                    if (!wsFolders) {
                        vscode.window.showErrorMessage("Open a workspace folder to generate the repository.");
                        return;
                    }
    
                    const workspaceDir = wsFolders[0].uri.fsPath;
                    const moduleDir = path.join(workspaceDir, vendor, module);
                    const apiPath = path.join(moduleDir, 'Api');
                    const repositoryPath = path.join(moduleDir, 'Model', 'Repository');
    
                    if (!fs.existsSync(apiPath)) fs.mkdirSync(apiPath, { recursive: true });
                    if (!fs.existsSync(repositoryPath)) fs.mkdirSync(repositoryPath, { recursive: true });
    
                    createRepositoryFiles(apiPath, repositoryPath, vendor, module, modelName);
    
                    vscode.window.showInformationMessage(`Repository and Interface for ${modelName} created successfully in ${vendor}_${module}!`);
                });
            });
        });
    });
    
    let createCronJobCommand = vscode.commands.registerCommand('magentoBoilerplate.createCronJob', function () {
        vscode.window.showInputBox({ prompt: 'Enter Vendor Name (e.g., Ashish)' }).then(vendor => {
            if (!vendor) {
                vscode.window.showErrorMessage("Vendor name is required.");
                return;
            }
    
            vscode.window.showInputBox({ prompt: 'Enter Module Name (e.g., CustomModule)' }).then(module => {
                if (!module) {
                    vscode.window.showErrorMessage("Module name is required.");
                    return;
                }
    
                vscode.window.showInputBox({ prompt: 'Enter Cron Job Name (e.g., UpdateProductStock)' }).then(cronJob => {
                    if (!cronJob) {
                        vscode.window.showErrorMessage("Cron job name is required.");
                        return;
                    }
    
                    const wsFolders = vscode.workspace.workspaceFolders;
                    if (!wsFolders) {
                        vscode.window.showErrorMessage("Open a workspace folder to generate the cron job.");
                        return;
                    }
    
                    const workspaceDir = wsFolders[0].uri.fsPath;
                    const moduleDir = path.join(workspaceDir, vendor, module);
                    const cronPath = path.join(moduleDir, 'Cron');
                    const etcPath = path.join(moduleDir, 'etc');
    
                    if (!fs.existsSync(cronPath)) fs.mkdirSync(cronPath, { recursive: true });
                    if (!fs.existsSync(etcPath)) fs.mkdirSync(etcPath, { recursive: true });
    
                    createCronJobFiles(cronPath, etcPath, vendor, module, cronJob);
    
                    vscode.window.showInformationMessage(`Cron job ${cronJob} created successfully in ${vendor}_${module}!`);
                });
            });
        });
    });

    let createHelperCommand = vscode.commands.registerCommand('magentoBoilerplate.createHelper', function () {
        vscode.window.showInputBox({ prompt: 'Enter Vendor Name (e.g., Ashish)' }).then(vendor => {
            if (!vendor) {
                vscode.window.showErrorMessage("Vendor name is required.");
                return;
            }
    
            vscode.window.showInputBox({ prompt: 'Enter Module Name (e.g., CustomModule)' }).then(module => {
                if (!module) {
                    vscode.window.showErrorMessage("Module name is required.");
                    return;
                }
    
                vscode.window.showInputBox({ prompt: 'Enter Helper Class Name (e.g., Data)' }).then(helperName => {
                    if (!helperName) {
                        vscode.window.showErrorMessage("Helper class name is required.");
                        return;
                    }
    
                    const wsFolders = vscode.workspace.workspaceFolders;
                    if (!wsFolders) {
                        vscode.window.showErrorMessage("Open a workspace folder to generate the Helper.");
                        return;
                    }
    
                    const workspaceDir = wsFolders[0].uri.fsPath;
                    const moduleDir = path.join(workspaceDir, vendor, module);
                    const helperPath = path.join(moduleDir, 'Helper');
    
                    if (!fs.existsSync(helperPath)) fs.mkdirSync(helperPath, { recursive: true });
    
                    createHelperFile(helperPath, vendor, module, helperName);
    
                    vscode.window.showInformationMessage(`Helper class ${helperName}.php created successfully in ${vendor}_${module}!`);
                });
            });
        });
    });

    let createGraphQLCommand = vscode.commands.registerCommand('magentoBoilerplate.createGraphQL', function () {
        vscode.window.showInputBox({ prompt: 'Enter Vendor Name (e.g., Ashish)' }).then(vendor => {
            if (!vendor) {
                vscode.window.showErrorMessage("Vendor name is required.");
                return;
            }
    
            vscode.window.showInputBox({ prompt: 'Enter Module Name (e.g., CustomModule)' }).then(module => {
                if (!module) {
                    vscode.window.showErrorMessage("Module name is required.");
                    return;
                }
    
                vscode.window.showInputBox({ prompt: 'Enter GraphQL Query Name (e.g., GetProductData)' }).then(queryName => {
                    if (!queryName) {
                        vscode.window.showErrorMessage("Query name is required.");
                        return;
                    }
    
                    const wsFolders = vscode.workspace.workspaceFolders;
                    if (!wsFolders) {
                        vscode.window.showErrorMessage("Open a workspace folder to generate the GraphQL schema.");
                        return;
                    }
    
                    const workspaceDir = wsFolders[0].uri.fsPath;
                    const moduleDir = path.join(workspaceDir, vendor, module);
                    const graphqlPath = path.join(moduleDir, 'etc', 'graphql');
                    const resolverPath = path.join(moduleDir, 'Model', 'Resolver');
    
                    if (!fs.existsSync(graphqlPath)) fs.mkdirSync(graphqlPath, { recursive: true });
                    if (!fs.existsSync(resolverPath)) fs.mkdirSync(resolverPath, { recursive: true });
    
                    appendOrCreateGraphQLSchema(graphqlPath, vendor, module, queryName);
                    createGraphQLResolver(resolverPath, vendor, module, queryName);
    
                    vscode.window.showInformationMessage(`GraphQL query & resolver created successfully in ${vendor}_${module}!`);
                });
            });
        });
    });
    
    let createApiCommand = vscode.commands.registerCommand('magentoBoilerplate.createApi', function () {
        vscode.window.showInputBox({ prompt: 'Enter Vendor Name (e.g., Ashish)' }).then(vendor => {
            if (!vendor) {
                vscode.window.showErrorMessage("Vendor name is required.");
                return;
            }
    
            vscode.window.showInputBox({ prompt: 'Enter Module Name (e.g., CustomModule)' }).then(module => {
                if (!module) {
                    vscode.window.showErrorMessage("Module name is required.");
                    return;
                }
    
                vscode.window.showInputBox({ prompt: 'Enter API Endpoint Name (e.g., custom-endpoint)' }).then(apiName => {
                    if (!apiName) {
                        vscode.window.showErrorMessage("API name is required.");
                        return;
                    }
    
                    vscode.window.showQuickPick(['GET', 'POST'], { placeHolder: 'Select API Method' }).then(apiMethod => {
                        if (!apiMethod) {
                            vscode.window.showErrorMessage("API method is required.");
                            return;
                        }
    
                        const wsFolders = vscode.workspace.workspaceFolders;
                        if (!wsFolders) {
                            vscode.window.showErrorMessage("Open a workspace folder to generate the API.");
                            return;
                        }
    
                        const workspaceDir = wsFolders[0].uri.fsPath;
                        const moduleDir = path.join(workspaceDir, vendor, module);
                        const apiPath = path.join(moduleDir, 'etc');
                        const interfacePath = path.join(moduleDir, 'Api');
                        const modelPath = path.join(moduleDir, 'Model');
                        const controllerPath = path.join(moduleDir, 'Controller', 'Api');
    
                        if (!fs.existsSync(apiPath)) fs.mkdirSync(apiPath, { recursive: true });
                        if (!fs.existsSync(interfacePath)) fs.mkdirSync(interfacePath, { recursive: true });
                        if (!fs.existsSync(modelPath)) fs.mkdirSync(modelPath, { recursive: true });
                        if (!fs.existsSync(controllerPath)) fs.mkdirSync(controllerPath, { recursive: true });
    
                        appendOrCreateWebapiXml(apiPath, vendor, module, apiName, apiMethod);
                        createApiInterface(interfacePath, vendor, module, apiName);
                        createApiModel(modelPath, vendor, module, apiName);
                        createApiController(controllerPath, vendor, module, apiName, apiMethod);
    
                        vscode.window.showInformationMessage(`API Endpoint for ${apiName} created successfully in ${vendor}_${module}!`);
                    });
                });
            });
        });
    });

    let copilotCommand = vscode.commands.registerCommand('magentoBoilerplate.copilot', async function () {
        const query = await vscode.window.showInputBox({ prompt: 'Ask AI anything (e.g., How to create a Magento 2 module?)' });
        if (!query) {
            vscode.window.showErrorMessage("You need to enter a question!");
            return;
        }

        vscode.window.showInformationMessage("Fetching AI response...");

        try {
            const response = await fetchAIResponse(query);
            showSidebar(response);  // Show AI response in Sidebar instead of Notification
        } catch (error) {
            vscode.window.showErrorMessage("Error fetching AI response: " + error.message);
        }
    });

    let magentoCommandPalette = vscode.commands.registerCommand('magentoBoilerplate.commandPalette', async function () {
        const command = await vscode.window.showQuickPick([
            'Clear Magento Cache',
            'Run Magento Reindex',
            'Flush Cache Storage',
            'Check Magento Status',
            'Deploy Static Content',
            'Run Magento Upgrade',
            'Enable Developer Mode',
            'Enable Production Mode',
            'Enable Maintenance Mode',
            'Disable Maintenance Mode'
        ], { placeHolder: 'Choose a Magento Command' });

        if (!command) return;

        runMagentoCommand(command);
    });

    let aiDebugCommand = vscode.commands.registerCommand('magentoBoilerplate.debugMagentoAI', async function () {
        askMagentoAI();
    });

    let aiCodeCommand = vscode.commands.registerCommand('magentoBoilerplate.aiCodeGenerator', async function () {
        askMagentoCodeAI();
    });

    let generateUnitTestCommand = vscode.commands.registerCommand('magentoBoilerplate.generateUnitTest', async function () {
        askMagentoUnitTest();
    });
    
    let createAdminMenuCommand = vscode.commands.registerCommand('magentoBoilerplate.createAdminMenu', async function () {
        const vendor = await vscode.window.showInputBox({ prompt: 'Enter Vendor Name (e.g., Venture7)' });
        if (!vendor) return vscode.window.showErrorMessage("Vendor name is required.");

        const module = await vscode.window.showInputBox({ prompt: 'Enter Module Name (e.g., CustomModule)' });
        if (!module) return vscode.window.showErrorMessage("Module name is required.");

        const menuId = await vscode.window.showInputBox({ prompt: 'Enter Menu Item ID (e.g., Vendor_Custom::menuid)' });
        if (!menuId) return vscode.window.showErrorMessage("Menu Item ID is required.");

        const menuTitle = await vscode.window.showInputBox({ prompt: 'Enter Menu Title (e.g., Menu Title)' });
        if (!menuTitle) return vscode.window.showErrorMessage("Menu Title is required.");

        const sortOrder = await vscode.window.showInputBox({ prompt: 'Enter Sort Order (e.g., 20)' });
        if (!sortOrder) return vscode.window.showErrorMessage("Sort Order is required.");

        // Optionally, prompt for parent, action, and resource
        const parent = await vscode.window.showInputBox({ prompt: 'Enter Parent Menu Item ID (Optional)' });
        const action = await vscode.window.showInputBox({ prompt: 'Enter Action URL (Optional)' });
        const resource = await vscode.window.showInputBox({ prompt: 'Enter ACL Resource (Optional)' });

        const wsFolders = vscode.workspace.workspaceFolders;
        if (!wsFolders) return vscode.window.showErrorMessage("Open a workspace folder to update the admin menu.");

        const workspaceDir = wsFolders[0].uri.fsPath;
        const moduleDir = path.join(workspaceDir, vendor, module);

        const menuItem = {
            id: menuId,
            title: menuTitle,
            sortOrder: sortOrder,
            vendor: vendor,
            module: module,
            parent: parent,
            action: action,
            resource: resource
        };

        appendAdminMenuEntry(moduleDir, menuItem);
        vscode.window.showInformationMessage(`Admin menu item "${menuTitle}" processed successfully!`);
    });

    let createDeliveryMethodCommand = vscode.commands.registerCommand('magentoBoilerplate.createDeliveryMethod', async function () {
        const vendor = await vscode.window.showInputBox({ prompt: 'Enter Vendor Name (e.g., Ashish)' });
        if (!vendor) return vscode.window.showErrorMessage('Vendor name is required.');

        const moduleName = await vscode.window.showInputBox({ prompt: 'Enter Module Name (e.g., Delivery)' });
        if (!moduleName) return vscode.window.showErrorMessage('Module name is required.');

        const methodCode = await vscode.window.showInputBox({ prompt: 'Enter Shipping Method Code (e.g., deliverymethod)' });
        if (!methodCode) return vscode.window.showErrorMessage('Shipping method code is required.');

        const title = await vscode.window.showInputBox({ prompt: 'Enter Shipping Method Title (e.g., Delivery Method)' });
        if (!title) return vscode.window.showErrorMessage('Shipping method title is required.');

        const methodName = await vscode.window.showInputBox({ prompt: 'Enter Shipping Method Name (e.g., Delivery Method)' });
        if (!methodName) return vscode.window.showErrorMessage('Shipping method name is required.');

        const priceInput = await vscode.window.showInputBox({ prompt: 'Enter Fixed Shipping Price (e.g., 5.00)' });
        if (!priceInput) return vscode.window.showErrorMessage('Shipping price is required.');
        const fixedPrice = parseFloat(priceInput);
        if (isNaN(fixedPrice)) return vscode.window.showErrorMessage('Invalid shipping price.');

        const wsFolders = vscode.workspace.workspaceFolders;
        if (!wsFolders) return vscode.window.showErrorMessage("Open a workspace folder to generate the delivery method.");
        const workspaceDir = wsFolders[0].uri.fsPath;

        // Create the module directory at: <workspace>/<Vendor>/<Module>
        const moduleDir = path.join(workspaceDir, vendor, moduleName);

        generateDeliveryMethod(vendor, moduleName, methodCode, title, methodName, fixedPrice, moduleDir);
        vscode.window.showInformationMessage("Delivery method module generated successfully!");
    });

    let createPaymentGatewayCommand = vscode.commands.registerCommand('magentoBoilerplate.createPaymentGateway', async function () {
        const vendor = await vscode.window.showInputBox({ prompt: 'Enter Vendor Name (e.g., Ashish)' });
        if (!vendor) return vscode.window.showErrorMessage('Vendor name is required.');

        const moduleName = await vscode.window.showInputBox({ prompt: 'Enter Module Name (e.g., PaymentGateway)' });
        if (!moduleName) return vscode.window.showErrorMessage('Module name is required.');

        const methodCode = await vscode.window.showInputBox({ prompt: 'Enter Payment Method Code (e.g., paymentmethod)' });
        if (!methodCode) return vscode.window.showErrorMessage('Payment method code is required.');

        const title = await vscode.window.showInputBox({ prompt: 'Enter Payment Method Title (e.g., Payment Method)' });
        if (!title) return vscode.window.showErrorMessage('Payment method title is required.');

        const sortOrderInput = await vscode.window.showInputBox({ prompt: 'Enter Sort Order (e.g., 10)' });
        if (!sortOrderInput) return vscode.window.showErrorMessage('Sort order is required.');
        const sortOrder = parseInt(sortOrderInput, 10);
        if (isNaN(sortOrder)) return vscode.window.showErrorMessage('Invalid sort order.');

        const orderStatus = await vscode.window.showInputBox({ prompt: 'Enter New Order Status (e.g., pending)' });
        if (!orderStatus) return vscode.window.showErrorMessage('Order status is required.');

        const wsFolders = vscode.workspace.workspaceFolders;
        if (!wsFolders) return vscode.window.showErrorMessage("Open a workspace folder to generate the payment gateway module.");
        const workspaceDir = wsFolders[0].uri.fsPath;

        // Create the module directory at: <workspace>/<Vendor>/<Module>
        const moduleDir = path.join(workspaceDir, vendor, moduleName);

        generatePaymentGateway(vendor, moduleName, methodCode, title, sortOrder, orderStatus, moduleDir);
        vscode.window.showInformationMessage("Payment gateway module generated successfully!");
    });

    let explainCodeCommand = vscode.commands.registerCommand('magentoBoilerplate.explainCode', function () {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage("No active editor found.");
            return;
        }

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);

        if (!selectedText.trim()) {
            vscode.window.showErrorMessage("No code selected! Please highlight some code.");
            return;
        }

        vscode.window.showInformationMessage("Opening Perplexity AI for code explanation...");

        searchOnPerplexity(selectedText);
    });
        
     
    context.subscriptions.push(createModuleCommand, createTableCommand, createObserverCommand, createCliCommand, createControllerCommand, createRepositoryCommand, createCronJobCommand, createHelperCommand, createGraphQLCommand, createApiCommand, copilotCommand, magentoCommandPalette, aiDebugCommand, createAdminMenuCommand, createDeliveryMethodCommand, createPaymentGatewayCommand, aiCodeCommand, generateUnitTestCommand, explainCodeCommand);
}

async function promptUser(prompt) {
    return await vscode.window.showInputBox({ prompt });
}

function showError(message) {
    vscode.window.showErrorMessage(message);
}

function createObserverFile(observerDir, vendor, module, observerName) {
    if (!fs.existsSync(observerDir)) fs.mkdirSync(observerDir, { recursive: true });

    let className = capitalize(observerName);
    let observerContent = `<?php
namespace ${vendor}\\${module}\\Observer;

use Magento\\Framework\\Event\\ObserverInterface;
use Magento\\Framework\\Event\\Observer;

class ${className} implements ObserverInterface {
    public function execute(Observer $observer) {
        // Your custom logic here
    }
}`;
    fs.writeFileSync(path.join(observerDir, `${className}.php`), observerContent);
}

function updateEventsXml(eventFilePath, vendor, module, observerName, eventName) {
    let className = capitalize(observerName);

    let newEventContent = `<event name="${eventName}">
        <observer name="${vendor}_${module}_${className}" instance="${vendor}\\${module}\\Observer\\${className}"/>
    </event>`;

    if (!fs.existsSync(eventFilePath)) {
        // Create a new events.xml file
        let eventContent = `<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="urn:magento:framework:Event/etc/events.xsd">
    ${newEventContent}
</config>`;
        fs.writeFileSync(eventFilePath, eventContent);
    } else {
        // Append the event if not already present
        let existingContent = fs.readFileSync(eventFilePath, 'utf8');
        if (!existingContent.includes(`<event name="${eventName}">`)) {
            existingContent = existingContent.replace('</config>', `    ${newEventContent}\n</config>`);
            fs.writeFileSync(eventFilePath, existingContent);
        }
    }
}

/**
 * Function to display AI response in a Sidebar Webview Panel.
 */
function showSidebar(response) {
    const panel = vscode.window.createWebviewPanel(
        'magentoCopilot',
        'Magento Copilot',
        vscode.ViewColumn.Two,
        { enableScripts: true } // Allows JavaScript execution in Webview
    );

    panel.webview.html = getWebviewContent(response);
}

/**
 * Generates HTML content for the sidebar panel.
 */
function getWebviewContent(response) {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Magento Copilot</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 15px; }
                h2 { color: #007acc; }
                pre { padding: 10px; border-radius: 5px; white-space: pre-wrap; word-wrap: break-word; }
            </style>
        </head>
        <body>
            <h2>Magento Copilot AI Response</h2>
            <pre>${response}</pre>
        </body>
        </html>
    `;
}

function runMagentoCommand(command) {
    const terminal = vscode.window.createTerminal(`Magento Command`);
    
    switch (command) {
        case 'Clear Magento Cache':
            terminal.sendText('php bin/magento cache:clean');
            break;
        case 'Run Magento Reindex':
            terminal.sendText('php bin/magento indexer:reindex');
            break;
        case 'Flush Cache Storage':
            terminal.sendText('php bin/magento cache:flush');
            break;
        case 'Check Magento Status':
            terminal.sendText('php bin/magento --version');
            break;
        case 'Deploy Static Content':
            terminal.sendText('php bin/magento setup:static-content:deploy -f');
            break;
        case 'Run Magento Upgrade':
            terminal.sendText('php bin/magento setup:upgrade');
            break;
        case 'Enable Developer Mode':
            terminal.sendText('php bin/magento deploy:mode:set developer');
            break;
        case 'Enable Production Mode':
            terminal.sendText('php bin/magento deploy:mode:set production');
            break;
        case 'Enable Maintenance Mode':
            terminal.sendText('php bin/magento maintenance:enable');
            break;
        case 'Disable Maintenance Mode':
            terminal.sendText('php bin/magento maintenance:disable');
            break;
    }

    terminal.show();
}

/**
 * Appends or creates an admin menu XML file for a Magento module.
 *
 * Expected properties on menuItem:
 * - id: Unique menu item identifier (e.g., "testsub" or "Vendor_Module::testsub")
 * - title: Display title (e.g., "SubMenu")
 * - sortOrder: Sort order (e.g., "20")
 * - vendor: Vendor name (e.g., "ashish" or "Ashish")
 * - module: Module name (e.g., "test" or "Test")
 * - parent: (Optional) Parent menu item ID (if this is a child menu item)
 * - action: (Optional) Action URL; if not provided, defaults to "index/index/index"
 * - resource: (Optional) ACL resource; if not provided, defaults to "Vendor_Module::menuId"
 */
function appendAdminMenuEntry(moduleDir, menuItem) {
    // Normalize vendor and module names so that the first letter is capitalized.
    const normalizedVendor = capitalize(menuItem.vendor);
    const normalizedModule = capitalize(menuItem.module);

    // Default action to "index/index/index" if not provided.
    if (!menuItem.action || menuItem.action.trim() === '') {
        menuItem.action = "index/index/index";
    }

    // Default resource if not provided:
    // If menuItem.id already contains "::", use it directly;
    // otherwise, set resource to "Vendor_Module::menuId" (using the normalized names).
    if (!menuItem.resource || menuItem.resource.trim() === '') {
        if (menuItem.id.includes("::")) {
            menuItem.resource = menuItem.id;
        } else {
            menuItem.resource = `${normalizedVendor}_${normalizedModule}::${menuItem.id}`;
        }
    }

    const menuFilePath = path.join(moduleDir, 'etc', 'adminhtml', 'menu.xml');
    const menuDirPath = path.dirname(menuFilePath);

    // Create the directory if it doesn't exist.
    if (!fs.existsSync(menuDirPath)) {
        fs.mkdirSync(menuDirPath, { recursive: true });
    }

    // Build the new menu item as an <add ... /> element.
    let newMenuItemXml = `<add id="`;
    // If the provided id does not contain "::", prefix it with normalizedVendor_normalizedModule::
    if (!menuItem.id.includes("::")) {
        newMenuItemXml += `${normalizedVendor}_${normalizedModule}::${menuItem.id}"`;
    } else {
        newMenuItemXml += `${menuItem.id}"`;
    }
    newMenuItemXml += ` title="${menuItem.title}" module="${normalizedVendor}_${normalizedModule}" sortOrder="${menuItem.sortOrder}"`;
    if (menuItem.parent) {
        newMenuItemXml += ` parent="${menuItem.parent}"`;
    }
    newMenuItemXml += ` action="${menuItem.action}"`;
    newMenuItemXml += ` resource="${menuItem.resource}"`;
    newMenuItemXml += ` />`;

    // If the file doesn't exist, create a new one with the basic XML structure.
    if (!fs.existsSync(menuFilePath)) {
        const newXml = `<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Config/etc/menu.xsd">
    <menu>
        ${newMenuItemXml}
    </menu>
</config>`;
        fs.writeFileSync(menuFilePath, newXml);
        console.log("Admin menu file created successfully.");
        return;
    }

    // If the file exists, read its contents.
    let xmlContent = fs.readFileSync(menuFilePath, 'utf8');

    // Check if the menu item already exists.
    if (xmlContent.includes(`id="${menuItem.id}"`)) {
        console.log("Menu item already exists.");
        return;
    }

    // Insert the new menu item before the closing </menu> tag.
    if (xmlContent.indexOf('</menu>') !== -1) {
        xmlContent = xmlContent.replace('</menu>', `    ${newMenuItemXml}\n</menu>`);
    } else if (xmlContent.indexOf('</config>') !== -1) {
        xmlContent = xmlContent.replace('</config>', `  <menu>\n    ${newMenuItemXml}\n  </menu>\n</config>`);
    } else {
        xmlContent += `\n<menu>\n    ${newMenuItemXml}\n</menu>`;
    }

    fs.writeFileSync(menuFilePath, xmlContent);
    console.log("Admin menu updated successfully.");
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}


function createMagentoModuleStructure(vendorDir, moduleDir, vendor, module) {
    if (!fs.existsSync(vendorDir)) fs.mkdirSync(vendorDir, { recursive: true });
    if (!fs.existsSync(moduleDir)) fs.mkdirSync(moduleDir, { recursive: true });

    const etcPath = path.join(moduleDir, 'etc');
    if (!fs.existsSync(etcPath)) fs.mkdirSync(etcPath, { recursive: true });

    // Create registration.php
const registrationContent = `<?php
\\Magento\\Framework\\Component\\ComponentRegistrar::register(
    \\Magento\\Framework\\Component\\ComponentRegistrar::MODULE,
    '${vendor}_${module}',
    __DIR__
);`;
        fs.writeFileSync(path.join(moduleDir, 'registration.php'), registrationContent);

    // Create etc/module.xml
const moduleXmlContent = `<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="urn:magento:framework:Module/etc/module.xsd">
    <module name="${vendor}_${module}" setup_version="1.0.0"/>
</config>`;

        fs.writeFileSync(path.join(etcPath, 'module.xml'), moduleXmlContent);
}

function createTableStructure(moduleDir, vendor, module, tableName, columns) {
    const etcPath = path.join(moduleDir, 'etc');
    if (!fs.existsSync(etcPath)) fs.mkdirSync(etcPath, { recursive: true });

    const modelPath = path.join(moduleDir, 'Model');
    if (!fs.existsSync(modelPath)) fs.mkdirSync(modelPath, { recursive: true });

    const resourceModelPath = path.join(modelPath, 'ResourceModel');
    if (!fs.existsSync(resourceModelPath)) fs.mkdirSync(resourceModelPath, { recursive: true });

    const modelFolderPath = path.join(resourceModelPath, tableName);
    if (!fs.existsSync(modelFolderPath)) fs.mkdirSync(modelFolderPath, { recursive: true });

    // Append or Create db_schema.xml
    appendOrCreateDbSchemaXml(etcPath, tableName, columns, vendor, module);

    // Create Model, ResourceModel, and Collection
    createModelFiles(modelPath, resourceModelPath, modelFolderPath, vendor, module, tableName);
}

function appendOrCreateDbSchemaXml(etcPath, tableName, columns, vendor, module) {
    const schemaPath = path.join(etcPath, 'db_schema.xml');
    let schemaContent = '';

    if (fs.existsSync(schemaPath)) {
        schemaContent = fs.readFileSync(schemaPath, 'utf-8');

        // Check if the table already exists
        if (schemaContent.includes(`<table name="${tableName}"`)) {
            vscode.window.showWarningMessage(`Table ${tableName} already exists in db_schema.xml.`);
            return;
        }

        schemaContent = schemaContent.replace('</schema>', ''); // Remove closing tag to append new table
    } else {
        schemaContent = `<?xml version="1.0"?>
<schema xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="urn:magento:framework:Setup/Declaration/Schema/etc/schema.xsd">
`;
    }

    let columnDefinitions = columns.map(col => {
        let type = col.type.toLowerCase();
        let lengthAttribute = col.length ? `length="${col.length}"` : "";
        let nullAttribute = col.nullable ? `xsi:null="true"` : ""; // If nullable, add xsi:null="true"
        let identityAttribute = col.identity ? `identity="true"` : ""; // If identity, add identity="true"

        return `<column xsi:type="${type}" name="${col.name}" ${lengthAttribute} ${nullAttribute} ${identityAttribute}/>`;
    }).join("\n        ");

    // Ensure primary key constraint
    let primaryKeyConstraint = "";
    let primaryColumns = columns.filter(col => col.primary).map(col => `<column name="${col.name}"/>`).join("\n            ");
    if (primaryColumns) {
        primaryKeyConstraint = `
        <constraint xsi:type="primary" referenceId="PRIMARY">
            ${primaryColumns}
        </constraint>`;
    }

    // Generate final table structure
    let newTableDefinition = `
    <table name="${tableName}" resource="default" engine="innodb" comment="${vendor} ${module} Table">
        ${columnDefinitions}
        ${primaryKeyConstraint}
    </table>`;

    // Append table to schema
    schemaContent += newTableDefinition + "\n</schema>";

    fs.writeFileSync(schemaPath, schemaContent);
}


function createModelFiles(modelPath, resourceModelPath, modelFolderPath, vendor, module, tableName) {
    let className = capitalize(tableName); // Capitalizing Table Name

    let modelContent = `<?php
namespace ${vendor}\\${module}\\Model;

use Magento\\Framework\\Model\\AbstractModel;
use ${vendor}\\${module}\\Model\\ResourceModel\\${className} as ResourceModel;

class ${className} extends AbstractModel {
    protected function _construct() {
        $this->_init(ResourceModel::class);
    }
}`;
    fs.writeFileSync(path.join(modelPath, `${className}.php`), modelContent);

    // ResourceModel File
    let resourceContent = `<?php
namespace ${vendor}\\${module}\\Model\\ResourceModel;

use Magento\\Framework\\Model\\ResourceModel\\Db\\AbstractDb;
use Magento\\Framework\\Model\\ResourceModel\\Db\\Context;

class ${className} extends AbstractDb {
    public function __construct(Context $context) {
        parent::__construct($context);
    }

    protected function _construct() {
        $this->_init('${tableName}', 'id');
    }
}`;
    fs.writeFileSync(path.join(resourceModelPath, `${className}.php`), resourceContent);

    // Collection File
    let collectionContent = `<?php
namespace ${vendor}\\${module}\\Model\\ResourceModel\\${className};

use Magento\\Framework\\Model\\ResourceModel\\Db\\Collection\\AbstractCollection;
use ${vendor}\\${module}\\Model\\${className} as Model;
use ${vendor}\\${module}\\Model\\ResourceModel\\${className} as ResourceModel;

class Collection extends AbstractCollection {
    protected function _construct() {
        $this->_init(Model::class, ResourceModel::class);
    }
}`;
    fs.writeFileSync(path.join(modelFolderPath, 'Collection.php'), collectionContent);
}


function parseColumns(columnsInput) {
    return columnsInput.split(',').map(col => {
        const [name, type] = col.split(':');
        return { name: name.trim(), type: type.trim() };
    });
}

function createControllerFile(controllerDir, vendor, module, area, controller, action) {
    let controllerBase = area === 'adminhtml' ? 'Magento\\Backend\\App\\Action' : 'Magento\\Framework\\App\\Action\\Action';
    let controllerContent = `<?php
namespace ${vendor}\\${module}\\Controller\\${controller};

use ${controllerBase};
use Magento\\Framework\\App\\Action\\Context;
use Magento\\Framework\Controller\\ResultFactory;

class ${action} extends Action {
    public function __construct(Context $context) {
        parent::__construct($context);
    }

    public function execute() {
        $result = $this->resultFactory->create(ResultFactory::TYPE_PAGE);
        return $result;
    }
}`;
    fs.writeFileSync(path.join(controllerDir, `${action}.php`), controllerContent);
}

function createRoutesFile(etcPath, vendor, module, area, routeId, frontName) {
    if (!fs.existsSync(etcPath)) fs.mkdirSync(etcPath, { recursive: true });

    const routeFile = path.join(etcPath, 'routes.xml');
    let newRoute = `<router id="${routeId}">
    <route id="${frontName}" frontName="${frontName}">
        <module name="${vendor}_${module}"/>
    </route>
</router>`;

    let routeContent = `<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="urn:magento:framework:App/etc/routes.xsd">
    ${newRoute}
</config>`;

    if (fs.existsSync(routeFile)) {
        // Append only if route does not exist
        let existingContent = fs.readFileSync(routeFile, 'utf-8');
        if (!existingContent.includes(newRoute)) {
            existingContent = existingContent.replace('</config>', `    ${newRoute}\n</config>`);
            fs.writeFileSync(routeFile, existingContent);
        }
    } else {
        // Create new routes.xml
        fs.writeFileSync(routeFile, routeContent);
    }
}

function createRepositoryFiles(apiPath, repositoryPath, vendor, module, modelName) {
    let className = capitalize(modelName);

    let interfaceContent = `<?php
namespace ${vendor}\\${module}\\Api;

interface ${className}RepositoryInterface {
    public function getById($id);
    public function save(${className}Interface $model);
    public function delete(${className}Interface $model);
}`;
    fs.writeFileSync(path.join(apiPath, `${className}RepositoryInterface.php`), interfaceContent);

    let repositoryContent = `<?php
namespace ${vendor}\\${module}\\Model\\Repository;

use ${vendor}\\${module}\\Api\\${className}RepositoryInterface;
use ${vendor}\\${module}\\Model\\ResourceModel\\${className} as ResourceModel;
use ${vendor}\\${module}\\Model\\${className};

class ${className}Repository implements ${className}RepositoryInterface {
    protected $resource;
    protected $modelFactory;

    public function __construct(ResourceModel $resource, ${className}Factory $modelFactory) {
        $this->resource = $resource;
        $this->modelFactory = $modelFactory;
    }

    public function getById($id) {
        $model = $this->modelFactory->create();
        $this->resource->load($model, $id);
        return $model;
    }

    public function save(${className} $model) {
        $this->resource->save($model);
        return $model;
    }

    public function delete(${className} $model) {
        $this->resource->delete($model);
    }
}`;
    fs.writeFileSync(path.join(repositoryPath, `${className}Repository.php`), repositoryContent);
}


function createCronJobFiles(cronPath, etcPath, vendor, module, cronJob) {
    let cronContent = `<?php
namespace ${vendor}\\${module}\\Cron;

use Psr\\Log\\LoggerInterface;

class ${cronJob} {
    protected $logger;

    public function __construct(LoggerInterface $logger) {
        $this->logger = $logger;
    }

    public function execute() {
        $this->logger->info('${cronJob} executed!');
    }
}`;
    fs.writeFileSync(path.join(cronPath, `${cronJob}.php`), cronContent);

    let crontabContent = `<?xml version="1.0"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="urn:magento:framework:App/etc/crontab.xsd">
    <group id="default">
        <job name="${module.toLowerCase()}_${cronJob.toLowerCase()}" instance="${vendor}\\${module}\\Cron\\${cronJob}" method="execute">
            <schedule>* * * * *</schedule>
        </job>
    </group>
</config>`;
    fs.writeFileSync(path.join(etcPath, 'crontab.xml'), crontabContent);
}

function createHelperFile(helperPath, vendor, module, helperName) {
    let className = capitalize(helperName);

    let helperContent = `<?php
namespace ${vendor}\\${module}\\Helper;

use Magento\\Framework\\App\\Helper\\AbstractHelper;
use Magento\\Store\\Model\\ScopeInterface;

class ${className} extends AbstractHelper {
    const XML_PATH_MODULE = '${vendor.toLowerCase()}_${module.toLowerCase()}';

    public function getConfigValue($field, $storeId = null) {
        return $this->scopeConfig->getValue(
            self::XML_PATH_MODULE . '/' . $field,
            ScopeInterface::SCOPE_STORE,
            $storeId
        );
    }

    public function log($message) {
        $writer = new \Zend_Log_Writer_Stream(BP . '/var/log/${module.toLowerCase()}.log');
        $logger = new \Zend_Log();
        $logger->addWriter($writer);
        $logger->info($message);
    }
}`;
    fs.writeFileSync(path.join(helperPath, `${className}.php`), helperContent);
}

function appendOrCreateGraphQLSchema(graphqlPath, vendor, module, queryName) {
    const schemaPath = path.join(graphqlPath, 'schema.graphqls');
    let newQuery = `\ntype Query {\n    ${queryName}: String @resolver(class: "${vendor}\\${module}\\Model\\Resolver\\${queryName}")\n}`;

    if (fs.existsSync(schemaPath)) {
        let schemaContent = fs.readFileSync(schemaPath, 'utf-8');

        if (schemaContent.includes(`type Query {`)) {
            schemaContent = schemaContent.replace(/type Query {/, `type Query {\n    ${queryName}: String @resolver(class: "${vendor}\\${module}\\Model\\Resolver\\${queryName}")`);
        } else {
            schemaContent += newQuery;
        }

        fs.writeFileSync(schemaPath, schemaContent);
    } else {
        fs.writeFileSync(schemaPath, `schema {\n    query: Query\n}\n${newQuery}`);
    }
}

function createGraphQLResolver(resolverPath, vendor, module, queryName) {
    let resolverContent = `<?php
namespace ${vendor}\\${module}\\Model\\Resolver;

use Magento\\Framework\\GraphQl\\Config\\Element\\Field;
use Magento\\Framework\\GraphQl\\Query\\ResolverInterface;
use Magento\\Framework\\GraphQl\\Schema\\Type\\ResolveInfo;

class ${queryName} implements ResolverInterface {
    public function resolve(Field $field, $context, ResolveInfo $info, array $value = null, array $args = null) {
        return "Hello from ${queryName}!";
    }
}`;
    fs.writeFileSync(path.join(resolverPath, `${queryName}.php`), resolverContent);
}

function appendOrCreateWebapiXml(apiPath, vendor, module, apiName, apiMethod) {
    const webapiPath = path.join(apiPath, 'webapi.xml');
    let newRoute = `
    <route url="/V1/${apiName}" method="${apiMethod}">
        <service class="${vendor}\\${module}\\Api\\${apiName}Interface" method="execute"/>
        <resources>
            <resource ref="Magento_Customer::customer"/>
        </resources>
    </route>`;

    if (fs.existsSync(webapiPath)) {
        let webapiContent = fs.readFileSync(webapiPath, 'utf-8');
        if (!webapiContent.includes(newRoute)) {
            webapiContent = webapiContent.replace('</routes>', `    ${newRoute}\n</routes>`);
            fs.writeFileSync(webapiPath, webapiContent);
        }
    } else {
        let webapiContent = `<?xml version="1.0"?>
<routes xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="urn:magento:module:Magento_Webapi/etc/webapi.xsd">
    ${newRoute}
</routes>`;
        fs.writeFileSync(webapiPath, webapiContent);
    }
}

function createApiInterface(interfacePath, vendor, module, apiName) {
    let interfaceContent = `<?php
namespace ${vendor}\\${module}\\Api;

interface ${apiName}Interface {
    public function execute();
}`;
    fs.writeFileSync(path.join(interfacePath, `${apiName}Interface.php`), interfaceContent);
}

function createApiModel(modelPath, vendor, module, apiName) {
    let modelContent = `<?php
namespace ${vendor}\\${module}\\Model;

use ${vendor}\\${module}\\Api\\${apiName}Interface;

class ${apiName} implements ${apiName}Interface {
    public function execute() {
        return "Hello from ${apiName} API!";
    }
}`;
    fs.writeFileSync(path.join(modelPath, `${apiName}.php`), modelContent);
}

function createApiController(controllerPath, vendor, module, apiName, apiMethod) {
    let apiClassName = capitalize(apiName);
    let apiFileName = apiClassName + ".php";

    let controllerContent = `<?php
namespace ${vendor}\\${module}\\Controller\\Api;

use Magento\\Framework\\App\\Action\\Context;
use Magento\\Framework\\App\\Action\\Http${apiMethod};
use ${vendor}\\${module}\\Api\\${apiClassName}Interface;

class ${apiClassName} extends Http${apiMethod} {
    protected $apiService;

    public function __construct(Context $context, ${apiClassName}Interface $apiService) {
        parent::__construct($context);
        $this->apiService = $apiService;
    }

    public function execute() {
        return $this->apiService->execute();
    }
}`;
    fs.writeFileSync(path.join(controllerPath, apiFileName), controllerContent);
}

function searchOnPerplexity(codeSnippet) {
    const encodedQuery = encodeURIComponent(`Explain this Magento code:\n\n${codeSnippet}`);
    const url = `https://www.perplexity.ai/search?q=${encodedQuery}`;

    vscode.env.openExternal(vscode.Uri.parse(url));
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
