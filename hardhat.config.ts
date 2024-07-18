import { HardhatUserConfig, task } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import '@nomiclabs/hardhat-web3'
import '@nomiclabs/hardhat-ethers'
import 'hardhat-deploy'
import dotenv from 'dotenv'

dotenv.config()

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: {
        enabled: true,
        runs: 100000000
      },
      viaIR: true // Enable viaIR if possible to save gas
    }
  },
  defaultNetwork: 'hardhat',
  namedAccounts: {
    deployer: {
      default: 0 // here this will by default take the first account as deployer
    }
  },
  networks: {
    hardhat: {
      gas: 1_400_000
    },
    sepoliaTitan: {
      url: 'https://rpc.titan-sepolia.tokamak.network',
      chainId: 55007,
      accounts: [process.env.PRIVATE_KEY || '']
    },
    mainnetTitan: {
      url: 'https://rpc.titan.tokamak.network',
      chainId: 55004,
      accounts: [process.env.PRIVATE_KEY || '']
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY || '']
    },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.INFURA_API_KEY}`,
      chainId: 11155111,
      accounts: [process.env.PRIVATE_KEY || '']
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY || '']
    }
  }
}

task('accounts', 'Prints the list of accounts', async (_, hre) => {
  const accounts = await hre.ethers.getSigners()
  for (const account of accounts) {
    console.log(account.address)
  }
})

task('address', 'Convert mnemonic to address')
  .addParam('mnemonic', "The account's mnemonic")
  .setAction(async (taskArgs: any, hre: any) => {
    const wallet = hre.ethers.Wallet.fromMnemonic(taskArgs.mnemonic)
    console.log('Wallet Address:', wallet.address)
    console.log('Wallet Private Key:', wallet.privateKey)
  })

task('addressFromPrivateKey', 'Convert private key to address')
  .addParam('privatekey', "The account's private key")
  .setAction(async (taskArgs: any, hre: any) => {
    const wallet = new hre.ethers.Wallet(taskArgs.privatekey)
    console.log('Wallet Address:', wallet.address)
  })

task('balance', "Prints an account's balance")
  .addParam('address', "The account's address")
  .setAction(async (taskArgs: any, hre: any) => {
    const account = hre.web3.utils.toChecksumAddress(taskArgs.address)
    const balance = await hre.web3.eth.getBalance(account)
    console.log(hre.web3.utils.fromWei(balance, 'ether'), 'ETH')
  })
const abi = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function'
  }
]
task('erc20:balance', "Prints an account's ERC20 balance")
  .addParam('token', "The token's address")
  .addParam('address', "The account's address")
  .setAction(async (taskArgs: any, hre: any) => {
    const account = hre.web3.utils.toChecksumAddress(taskArgs.address)
    const token = new hre.web3.eth.Contract(abi, taskArgs.token)
    let balance = await token.methods.balanceOf(account).call()
    console.log(balance)
  })

task('send', 'Send ETH to an address')
  .addParam('to', "The recipient's address")
  .addParam('amount', 'The amount to send')
  .setAction(async (taskArgs: any, hre: any) => {
    const from = (await hre.ethers.getSigners())[0]
    const tx = await from.sendTransaction({
      to: taskArgs.to,
      value: hre.ethers.utils.parseEther(taskArgs.amount)
    })
    console.log('Transaction Hash:', tx.hash)
  })

task('erc20:transfer', 'Transfer ERC20 tokens')
  .addParam('token', "The token's address")
  .addParam('to', "The recipient's address")
  .addParam('amount', 'The amount to send')
  .setAction(async (taskArgs: any, hre: any) => {
    const from = (await hre.ethers.getSigners())[0]
    const abi = ['function transfer(address, uint)']
    const token = new hre.ethers.Contract(taskArgs.token, abi, from)
    const tx = await token.transfer(taskArgs.to, taskArgs.amount)
    console.log('Transaction Hash:', tx.hash)
  })

export default config
