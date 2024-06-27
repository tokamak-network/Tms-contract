import { ethers } from 'hardhat'

// Replace with the actual contract address
const deployedMultiSender = '0x8161Bc94E430C246bF8CbE9a1d45Ad082df82065' // MultiSender contract address
// Replace with the actual token address, recipients and amounts
const tokenAddress = '0x79E0d92670106c85E9067b56B8F674340dCa0Bbd' // USDT Testnet Contract address
const address1 = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' // Recipient 1
const address2 = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' // Recipient 2

async function main() {
  // Get the first signer
  const [deployer] = await ethers.getSigners()

  // read the deployed contract
  const multiSender = await ethers.getContractAt('MultiSender', deployedMultiSender)

  // get the contract factory for the ERC20 token
  const token = await ethers.getContractAt('ERC20', tokenAddress)

  const recipients = [address1, address2]
  const amounts = [ethers.utils.parseUnits('1', 5), ethers.utils.parseUnits('2', 5)]

  const totalAmount = ethers.utils.parseUnits('1', 6) // 1 USDC
  await token.connect(deployer).approve(deployedMultiSender, totalAmount)

  let tx = await multiSender.sendERC20(tokenAddress, recipients, amounts)

  console.log('Transaction Hash:', tx.hash)
  console.log('ERC20 tokens sent to recipients')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
