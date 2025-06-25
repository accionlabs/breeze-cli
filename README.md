# 🌬️ Breeze CLI

**Breeze CLI** is a lightweight, developer-friendly command-line tool built to streamline access to personas, tasks, and scenarios from your project’s API. With simple setup and intuitive commands, Breeze helps you interact with your project data efficiently.

---

## ✨ Features

- Easy initial setup with API Key and Project Key
- Fetch and manage:
  - 🧑 Personas
  - ✅ Tasks
  - 🎯 Scenarios
- Clean CLI output with helpful messaging

---

## 🛠️ Installation

```
npm install -g @breeze-cli
```

---

## 🚀 Getting Started

### 1. Initialize Breeze

Before using Breeze Cli, you need to configure your API key and project key.

```
breeze init
```

You'll be prompted to enter:
- 🔑 **API Key** 
- 🗂️ **Project Key**

This configuration is saved locally for future use.

---

## 📦 Available Commands

### 🔧 Setup

```bash
breeze init
```
Configure the CLI with your API and Project Key.

---
### 🔧 Fetch Existing Configuration

```bash
breeze config get
```
Fetch the configuration details.

---
### 👤 Get Personas

```bash
breeze list personas
```
Fetch a list of personas from your configured project.

---

### ✅ Get Tasks

```bash
breeze list tasks --persona "persona_string"
```
Fetch a list of tasks for the project. 

---

### 🎯 Get Scenarios

```bash
breeze list scenarios --task "task_string"
```

Retrieve project-specific scenarios.

---

## ⚙️ Configuration

Breeze stores your credentials locally (usually in a `.breeze/.config` or similar file). To update your keys:

```bash
breeze config update --set-api-key "your_api_key"
breeze config update --set-project-key "your_project_key"
```

---

## 📄 Example

```bash
$ breeze init
✔ Enter your API Key: ******
✔ Enter your Project Key: ******

$ breeze list personas
👤 Alice 
👤 Bob 

$ breeze list tasks --persona "persona_string"
📌  User Login Flow
📌  Payment Gateway Integration

$ breeze scenarios --task "task_string"
🔹 New User Onboarding
    ➤ Login to system
        • Enter Mobile Number
```

---

## 🧪 Development

To contribute or run locally:

```bash
git clone https://github.com/your-username/breeze-cli.git
cd breeze-cli
npm install
npm link
```

You can now use the `breeze` command locally.

---

## 📃 License

MIT © 2025 Your Name