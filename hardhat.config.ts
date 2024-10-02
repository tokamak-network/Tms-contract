import { HardhatUserConfig } from 'hardhat/config'
import { NetworkUserConfig } from 'hardhat/types'
import * as dotenv from 'dotenv'
import '@nomicfoundation/hardhat-ethers'
import 'hardhat-deploy'
import 'hardhat-deploy-ethers'
import '@nomicfoundation/hardhat-verify'
import 'hardhat-contract-sizer'
import '@nomicfoundation/hardhat-verify'
import 'hardhat-gas-reporter'
import '@openzeppelin/hardhat-upgrades'
import '@nomicfoundation/hardhat-chai-matchers'

dotenv.config()

task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners()
  for (const account of accounts) {
    console.log(account.address)
  }
})

const accounts = {
  mnemonic: process.env.MNEMONIC || 'test test test test test test test test test test test junk'
  // accountsBalance: "990000000000000000000",
}

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  gasReporter: {
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    currency: 'USD',
    enabled: true
  },
  namedAccounts: {
    deployer: {
      default: 0
    },
    dev: {
      default: 1
    },
    proxyAdminOwner: {
      default: 0
    }
  },
  networks: {
    hardhat: {
      hardfork: 'london',
      saveDeployments: true,
      allowUnlimitedContractSize: true,
      evmVersion: 'byzantium',
      forking: {
        url: `https://rpc.titan-sepolia.tokamak.network`,
        enabled: true,
        saveDeployments: true,
        blockNumber: 850
      },
      gasPrice: 'auto',
      accounts
    } as NetworkUserConfig,
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts,
      chainId: 1,
      live: false,
      saveDeployments: true
    } as NetworkUserConfig,
    'sepolia-titan': {
      url: `https://rpc.titan-sepolia.tokamak.network`,
      chainId: 55007,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
      live: true,
      saveDeployments: true
    } as NetworkUserConfig,
    'titan': {
      url: `https://rpc.titan.tokamak.network`,
      chainId: 55004 ,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
      live: true,
      saveDeployments: true
    } as NetworkUserConfig
  },
  etherscan: {
    apiKey: process.env.API_KEY,
    customChains: [
      {
        network: 'sepolia-titan',
        chainId: 55007,
        urls: {
          apiURL: ' https://explorer.titan-sepolia.tokamak.network/api',
          browserURL: 'https://explorer.titan-sepolia.tokamak.network/'
        }
      },
      {
        network: 'titan',
        chainId: 55004,
        urls: {
          apiURL: ' https://explorer.titan.tokamak.network/api',
          browserURL: 'https://explorer.titan.tokamak.network'
        }
      }
    ]
  },
  paths: {
    deploy: 'deploy',
    deployments: 'deployments',
    sources: 'contracts',
    tests: 'test'
  },
  mocha: {
    timeout: 300000
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: true,
    runOnCompile: true
  },
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
}

export default config
