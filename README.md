<div align="center">
    <a href="https://aptos.aave.com/">
      <img src="./assets/logo.png" alt="Logo" style="transform: scale(0.7);">
    </a>
    <h1 align="center">Aave's V3 Protocol on Aptos</h1>
    <p align="center">
        This is the official Aptos version of the Aave V3 Protocol.
    </p>
    <p align="center">
        <a href="https://github.com/aave/aptos-aave-v3/actions/workflows/unit_tests.yml" style="text-decoration: none; ">
            <img src="https://github.com/aave/aptos-aave-v3/actions/workflows/unit_tests.yml/badge.svg?branch=feat/evgeni/cl-coverage" alt="CI">
        </a>
        <a href="https://codecov.io/gh/aave/aptos-aave-v3" style="text-decoration: none;">
          <img src="https://codecov.io/gh/aave/aptos-aave-v3/branch/feat%2Fevgeni%2Fcl-coverage/graph/badge.svg?token=GzsXGvIv0r" alt="Coverage"/>
        </a>
        <a href="https://github.com/aave/aptos-aave-v3/blob/feat/evgeni/cl-coverage/LICENSE" style="text-decoration: none;">
          <img src="https://img.shields.io/badge/license-MIT-007EC7.svg" alt="License"/>
        </a>
    </p>
    <p align="center">
        <a href="https://aave.com/docs">📚 Documentation</a>
        <span>&nbsp;</span>
        <a href="https://github.com/aave/aptos-aave-v3/issues/new?labels=bug&template=bug-report---.md">🐛 Report Bug</a>
        <span>&nbsp;</span>
        <a href="https://github.com/aave/aptos-aave-v3/issues/new?labels=enhancement&template=feature-request---.md">✨ Request Feature</a>
    </p>
</div>

---

```bash=
├── aave-acl                // Access control list Package
├── aave-config             // Configurator Package
├── aave-data               // Data Configurations
├── aave-large-packages     // Large Packages Package
├── aave-math               // Math library Package
├── aave-mock-underlyings   // Mock Underlyings Package
├── aave-oracle             // Oracle Package
├── aave-scripts            // Deployment Scripts
├── aave-core               // Core Package
```

---

## 📊 Inter-package Dependency Graph

```mermaid
flowchart TD

  %% Level 1
  aave-config
  chainlink-data-feeds
  aave-large-packages

  %% Level 2
  aave-acl --> aave-config
  aave-math --> aave-config

  %% Level 3
  aave-oracle --> aave-config
  aave-oracle --> aave-acl
  aave-oracle --> chainlink-data-feeds

  %% Level 4
  aave-pool --> aave-acl
  aave-pool --> aave-config
  aave-pool --> aave-math
  aave-pool --> aave-oracle

  %% Level 5
  aave-data --> aave-config
  aave-data --> aave-pool

  %% Level 6
  aave-scripts --> aave-acl
  aave-scripts --> aave-config
  aave-scripts --> aave-oracle
  aave-scripts --> aave-data
  aave-scripts --> aave-pool
```

---

## 🚀 Getting Started

### 1. 🧩 Clone the Repository

```bash
git clone https://github.com/aave/aptos-aave-v3.git && cd aptos-aave-v3
```

---

### 2. 🛠️ Prerequisites

Make sure the following tools are installed:

- [Aptos CLI](https://aptos.dev/tools/aptos-cli/)
- [yq](https://github.com/mikefarah/yq)
- [Node.js + pnpm](https://pnpm.io/installation)
- [codespell](https://pypi.org/project/codespell/)
- [pre-commit](https://pre-commit.com/#install)
- [Python 3](https://www.python.org/downloads/)
- [GNU Make](https://www.gnu.org/software/make/)

---

## 🧪 Running a Local Testnet

### 🧰 Option 1: Using Makefile

Start by copying `.env.template` to `.env` and editing any relevant values.

#### ✅ Start the testnet

```bash
make local-testnet
```

#### ✅ With indexer (e.g. for Petra Wallet support)

```bash
make local-testnet-with-indexer
```

#### 🔧 Configure workspace

```bash
make set-workspace-config \
  && make init-workspace-config \
  && make init-profiles \
  && make init-test-profiles \
  && make fund-profiles \
  && make fund-test-profiles
```

This will initialize, configure, and fund local accounts with APT.

#### 🛠️ Compile & Deploy

```bash
make compile-all
make publish-all
```

#### 🌐 View your local testnet

[https://explorer.aptoslabs.com/?network=local](https://explorer.aptoslabs.com/?network=local)

---

### 🐳 Option 2: Using `aave-test-kit` (Docker)

[`aave-test-kit`](aave-test-kit/README.md) is a local simulation environment for Aave on Aptos, inspired by Tenderly.

➡️ See the linked README for Docker-based setup and usage.

---

## 🧪 Testing

### ✅ Run Unit Tests (Move)

These do **not require a local testnet**.

```bash
make test-all
```

---

### 🔬 Run TypeScript Integration Tests

These must be run **after successful contract deployment**:

```bash
make ts-test
```

---

## 📝 Generate Aptos Move Docs

Generate full module documentation across all packages:

```bash
make doc-all
```

Docs will be generated under each package's `doc/` directory.

---

## 🔐 Security Audits

All audit reports related to Aave's Move implementation on Aptos are stored in the `/audits` directory at the root of this repository.

### 📁 Audit Directory Structure

```bash
/audits
├── Aave Aptos Core V3.0.2 Report.pdf
├── Aave Aptos Core V3.1-V3.3 Report.pdf
└── Aave Aptos Periphery Report.pdf
```

📂 [Browse Audit Reports](/audits)
