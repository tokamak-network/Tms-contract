import { ethers } from 'hardhat'

const deployedMultiSender = '0x8161Bc94E430C246bF8CbE9a1d45Ad082df82065' // Deployed MultiSender contract address
const address1 = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' // Recipient 1
const address2 = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' // Recipient 2

async function main() {
  // read the deployed contract
  const multiSender = await ethers.getContractAt('MultiSender', deployedMultiSender)

  console.log('MultiSender contract address:', multiSender.address)

  // Replace with the actual recipients and amounts
  const recipients = [address1, address2]
  const amounts = [ethers.utils.parseEther('0.000001'), ethers.utils.parseEther('0.000002')]

  const tx = await multiSender.sendETH(recipients, amounts, {
    value: ethers.utils.parseEther('0.000003')
  })
  console.log('Transaction Hash:', tx)
  console.log('ETH sent to recipients')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
