# Tokamak Milti Send 

Tokamak Multi Send is a project that allows you to send `ETH` or `ERC20` tokens to multiple recipients in a single transaction. 
It's built on the `Titan` & `Titan Sepolia` network, providing a cost-effective and efficient way to distribute tokens.

## Deployed Contract

### Titan Sepolia
The contract is deployed on the Titan Sepolia network at [0x8161Bc94E430C246bF8CbE9a1d45Ad082df82065](https://explorer.titan-sepolia.tokamak.network/address/0x8161Bc94E430C246bF8CbE9a1d45Ad082df82065)

## Getting Started with Project

### Prerequisites

- Node.js and npm installed on your machine
- An `.env` file created from `.env.example`:


```shell
    cp .env.example .env
```

Fill in the environment variables in the .env file.

### Installation
Install the project dependencies:

```shell
    npm install
```

## Usage

### Run `locally`

Start a local Hardhat node:
```shell
    npx hardhat node --hostname 127.0.0.1
```

Compile the contracts and run the tests:
```shell
    npx hardhat compile
    npx hardhat test
```

### Test on `Titan Sepolia`

Before testing, ensure you have added your private key to the `.env` file:
```
PRIVATE_KEY=
```

Test `senETH` script test

We provide a default script to send tokens to predefined accounts. You can modify this script according to your needs. The script is located at `./scripts/sendETH.ts`.

```shell
npx hardhat run --network sepoliaTitan  scripts/sendETH.ts
```

Test `sendERC20` script

Similarly, we provide a default script for sending `ERC20` tokens. You can modify this script as needed. The script is located at `./scripts/sendERC20.ts`.

```shell
npx hardhat run --network sepoliaTitan  scripts/sendERC20.ts
```
