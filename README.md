<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/header-dark.svg">
  <img alt="hosein, onchain since 2021. Building payment rails for stablecoins, architecting private onchain finance, explaining infra to humans." src="assets/header-light.svg" width="100%">
</picture>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/whoami-dark.svg">
  <img alt="Terminal output of whoami: name Hosein, role web3 builder and systems architect, shipping Optima DEX and Plinth, confidential state on Zama FHEVM." src="assets/whoami-light.svg" width="100%">
</picture>

## Stack

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/stack-dark.svg">
  <img alt="Stack: Solidity, Foundry, Hardhat, Zama FHEVM, TypeScript, Next.js, viem and wagmi, Fastify and Prisma, Arbitrum Nitro, Uniswap V3, MCP, x402, Circle and Arc." src="assets/stack-light.svg" width="100%">
</picture>

## About & Philosophy

I am a **Web3 systems builder and smart contract developer**, active on-chain since 2021. My work is focused on the architecture of **non-custodial financial rails**, **confidential state execution** via Fully Homomorphic Encryption (FHEVM), and **high-throughput L2 exchange infrastructure**.

Rather than relying on centralized intermediaries or custodial escrows, I design decentralized protocols where liquidity moves directly from payer to merchant, where smart contracts compute over fully encrypted balances without revealing private data to the mempool, and where autonomous AI agents can safely simulate transactions before committing capital on-chain.

---

## What I Work On

- **Non-Custodial Stablecoin Rails.** Peer-to-merchant payment rails where every transaction gets a deterministic, single-use address and settles straight to the recipient's wallet with zero custodial risk. Multi-token settlement (USDC and EURC) on fast-finality networks like Circle Arc.
- **Private Onchain Finance (FHEVM).** Application-level cryptographic privacy on Ethereum using Zama's Fully Homomorphic Encryption Virtual Machine and the ERC-7984 confidential token standard. Smart contracts compute over encrypted ciphertexts (`euint64`) without leaking balances or trade amounts.
- **High-Throughput L2 DEX Infrastructure.** Production-grade decentralized trading platforms built on the Arbitrum Nitro L2 stack (such as Optima DEX on Robinhood Chain Mainnet), integrating concentrated liquidity (Uniswap V3) and RFQ quote settlement for equity tokens.
- **Autonomous Agent Safety & x402 Micropayments.** Pre-execution simulation engines that calculate risk scores (0–100) before autonomous AI agents sign transactions, paired with HTTP 402 / x402 pay-per-call micropayments for agent-to-agent (A2A) commerce.

---

## Featured Deployments

<a href="https://github.com/hosein-ul/plinth"><picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/card-plinth-dark.svg">
  <img alt="plinth: a non-custodial stablecoin payment gateway. Every payment gets its own address and settles straight to the merchant's wallet. Solidity and TypeScript, USDC and EURC on Arc." src="assets/card-plinth-light.svg" width="408">
</picture></a>
<a href="https://github.com/hosein-ul/pharos-tx-guardrail"><picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/card-pharos-tx-guardrail-dark.svg">
  <img alt="pharos-tx-guardrail: a pre-execution check for AI agents that simulates a transaction and returns a 0 to 100 risk score before anything is signed." src="assets/card-pharos-tx-guardrail-light.svg" width="408">
</picture></a>

| Project | Overview & Architecture | Stack |
|:---|:---|:---:|
| **[Optima DEX](https://github.com/hosein-ul/optima-pon)** | High-throughput L2 DEX on Robinhood Chain Mainnet. Built on Arbitrum Nitro stack with Uniswap V3 concentrated liquidity, Rialto RFQ settlement for stock tokens, and the Pons launchpad. | `Arbitrum L2` `Viem` `Next.js 16` |
| **[Plinth](https://github.com/hosein-ul/plinth)** | Non-custodial stablecoin gateway with dedicated invoice addresses. Automatically settles USDC and EURC straight to merchant wallets on Circle Arc with zero escrow fees. | `Circle Arc` `Solidity` `USDC` |
| **[ShadowLine](https://github.com/hosein-ul/ShadowLine)** | Confidential asset shielding framework powered by Zama FHEVM. Implements ERC-7984 confidential wrapping, encrypted transfers, and zero-leakage unshielding. | `Zama FHEVM` `ERC-7984` `Solidity` |
| **[Pharos Tx Guardrail](https://github.com/hosein-ul/pharos-tx-guardrail)** | Pre-execution safety oracle and transaction simulation engine for autonomous AI agents. Inspects calldata and outputs risk metrics before any private key signs. | `Agent Safety` `TypeScript` `Simulations` |
| **[Truth-Market](https://github.com/hosein-ul/Truth-Market)** | Confidential on-chain prediction market on FHEVM. Enables participants to place wagers while keeping prediction bets and volume private until market resolution. | `FHEVM` `Privacy DeFi` `Solidity` |
| **[AgentOS](https://github.com/hosein-ul/AgentOS)** | Multi-tenant agent execution layer for marketplace integrations. Supports autonomous agent-to-agent (A2A) tasks and x402 pay-per-call REST APIs. | `x402` `A2A Protocols` `TypeScript` |

---

## Writing & Infra Analysis

I write deep-dive threads and breakdowns on blockchain architecture, rollups, stablecoin settlement mechanisms, and cryptographic privacy—breaking down complex specifications into clear, intuitive mental models. Threads and long posts on [X (@andy1eth)](https://x.com/andy1eth).

---

## Activity

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/stats-dark.svg">
  <img alt="GitHub stats: commits this year, pull requests, public repositories, longest contribution streak and a language breakdown." src="assets/stats-light.svg" width="100%">
</picture>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/calendar-dark.svg">
  <img alt="Isometric 3D contribution calendar for the last 52 weeks." src="assets/calendar-light.svg" width="100%">
</picture>

---

## Connect

[X @andy1eth](https://x.com/andy1eth) · [Telegram @hoseinf3](https://t.me/hoseinf3) · [GitHub @hosein-ul](https://github.com/hosein-ul) · [Email](mailto:samroise22@gmail.com)
