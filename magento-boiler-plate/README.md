# 🚀 Magento Boilerplate - VS Code Extension

**Magento Boilerplate** is a **powerful VS Code extension** designed to streamline **Magento 2 development** by automating the creation of essential Magento components. It simplifies module generation, controller creation, API setup, and more, boosting developer productivity.

## 📌 Features

### 🛠 Module & Component Generation
- Instantly generate a **complete Magento 2 module** structure with `registration.php`, `module.xml`, and `di.xml`.
- Create **tables and database models** with `db_schema.xml` integration.
- Generate **custom repositories**, **resource models**, and **factories**.

### 🌐 API & GraphQL Support
- **REST API Generator** – Quickly create Magento 2 API endpoints (`webapi.xml`).
- **GraphQL Schema & Resolver Generator** – Integrate Magento with modern frontend frameworks.

### 🔄 Controller & CLI Command Automation
- Automate **controller creation** (Adminhtml & Frontend).
- Generate **CLI commands** for Magento's console interface.

### 🛒 Admin & UI Enhancements
- **Admin Menu Generator** – Easily create `menu.xml` entries.
- Generate **custom UI components** such as grids and forms.

### 🔔 Event & Cron Job Scheduling
- **Observer & Event Generator** – Bind custom logic to Magento events.
- **Cron Job Generator** – Automate background tasks (`crontab.xml`).

### 🚀 AI-Powered Magento Copilot
- **AI Code Generator** – Get AI-suggested Magento 2 code snippets.
- **AI Debugging Assistant** – Debug Magento errors with AI-powered insights.
- **AI Unit Test Generator** – Automatically generate test cases.

### 📦 Payment & Shipping Method Generator
- Create **custom shipping methods** (`Carrier.php`).
- Develop **payment gateway modules** (`Gateway.php`).

## 🔑 Hugging Face API Integration
- Fetch AI responses using Hugging Face models.
- Securely store API keys using VS Code settings.

## 📌 How to Use

### 1️⃣ Setup
- Install the extension in VS Code.
- Open the **Command Palette** (`Ctrl + Shift + P`).
- Select **Magento Boilerplate: Set Hugging Face API Key** and enter your key.

### 2️⃣ Generate a Magento 2 Module
- Run `Magento Boilerplate: Create Module`.
- Enter **Vendor Name** (e.g., `Ashish`).
- Enter **Module Name** (e.g., `CustomModule`).
- A complete module structure is created instantly.

### 3️⃣ Create a REST API Endpoint
- Run `Magento Boilerplate: Create API`.
- Enter **API Name** and **HTTP Method** (GET, POST, PUT, DELETE).
- A **fully structured API** is generated in `webapi.xml`.

### 4️⃣ AI Debugging Assistance
- Run `Magento Boilerplate: AI Debugging Assistant` (`Ctrl + Alt + D`).
- Get **Magento-specific AI suggestions** for error resolution.

## 🎯 Keybindings
| Keybinding        | Command                                  |
|------------------|--------------------------------------|
| `Ctrl + Shift + M` | Open Magento Command Palette         |
| `Ctrl + Alt + D`   | AI Debugging Assistant              |

## 🔄 Supported Commands
| Command                                    | Description                                    |
|--------------------------------------------|------------------------------------------------|
| Magento Boilerplate: Create Module        | Generate a new Magento 2 module.              |
| Magento Boilerplate: Create Table         | Create database tables with `db_schema.xml`. |
| Magento Boilerplate: Create Observer      | Bind logic to Magento events.                 |
| Magento Boilerplate: Create CLI Command   | Create CLI commands for Magento.              |
| Magento Boilerplate: Create Controller    | Generate controllers for Adminhtml/Frontend.  |
| Magento Boilerplate: Create GraphQL       | Create GraphQL schema and resolvers.          |
| Magento Boilerplate: Create API           | Generate REST API endpoints.                  |
| Magento Boilerplate: Create Repository    | Generate repository and resource model.       |
| Magento Boilerplate: Create Admin Menu    | Add menu entries in `menu.xml`.               |
| Magento Boilerplate: Create Payment Method | Build a custom Magento payment method.       |
| Magento Boilerplate: Create Shipping Method | Generate a shipping method module.           |
| Magento Boilerplate: AI Code Generator    | Get AI-generated Magento code.                |
| Magento Boilerplate: AI Debugging Assistant | Get AI-powered Magento debugging.            |
| Magento Boilerplate: Generate Unit Test   | Create unit tests for Magento models.        |

## 📌 Configuration Settings
To configure the **Hugging Face API key**:
1. Open VS Code.
2. Go to **Settings** (`Ctrl + ,`).
3. Search for `magentoBoilerplate.huggingFaceApiKey`.
4. Enter your API key.

Alternatively, you can set the API key via:
- Command Palette (`Ctrl + Shift + P`) → **Magento Boilerplate: Set Hugging Face API Key**.

## 💡 Troubleshooting
| Issue                        | Solution                                      |
|------------------------------|-----------------------------------------------|
| API Key not found            | Set it via Command Palette (`Set Hugging Face API Key`). |
| API not responding           | Check Hugging Face API status.               |
| AI Debugging not working     | Ensure API key is set and active.            |

## 🤝 Contributing
We welcome contributions! Open a pull request on GitHub.

## 📜 License
MIT License © 2025 Ashish Kumar

🚀 **Happy Magento Development!** 🎉
