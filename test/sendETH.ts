import { ethers } from 'hardhat'
import { expect } from 'chai'
import { MultiSender } from '../typechain-types'

describe('MultiSender SendETH', function () {
  let multiSender: MultiSender
  let sender: any, recipient1: any, recipient2: any, recipient3: any

  beforeEach(async function () {
    // Deploy the contract
    const MultiSender = await ethers.getContractFactory('MultiSender')
    multiSender = await MultiSender.deploy()
    await multiSender.waitForDeployment()
    ;[sender, recipient1, recipient2, recipient3] = await ethers.getSigners()
  })

  it('Should send ETH correctly', async function () {
    const beforeBalance1 = await ethers.provider.getBalance(recipient1.address)
    const beforeBalance2 = await ethers.provider.getBalance(recipient2.address)
    const beforeBalance3 = await ethers.provider.getBalance(recipient3.address)

    await multiSender.sendETH(
      [recipient1.address, recipient2.address, recipient3.address],
      [ethers.parseEther('1'), ethers.parseEther('2'), ethers.parseEther('3')],
      { value: ethers.parseEther('6') }
    )

    expect(await ethers.provider.getBalance(recipient1.address)).to.equal(
      beforeBalance1 + ethers.parseEther('1')
    )
    expect(await ethers.provider.getBalance(recipient2.address)).to.equal(
      beforeBalance2 + ethers.parseEther('2')
    )
    expect(await ethers.provider.getBalance(recipient3.address)).to.equal(
      beforeBalance3 + ethers.parseEther('3')
    )
  })

  it('Should fail when the total amount is not equal to the sent amount', async function () {
    // Test when total amount is less than the sent amount
    await expect(
      multiSender.sendETH(
        [recipient1.address, recipient2.address, recipient3.address],
        [ethers.parseEther('1'), ethers.parseEther('2'), ethers.parseEther('3')],
        { value: ethers.parseEther('5') } //
      )
    ).to.be.revertedWith('Unequal transfer amount')

    // Test when total amount is more than the sent amount
    await expect(
      multiSender.sendETH(
        [recipient1.address, recipient2.address, recipient3.address],
        [ethers.parseEther('1'), ethers.parseEther('2'), ethers.parseEther('3')],
        { value: ethers.parseEther('7') }
      )
    ).to.be.revertedWith('Unequal transfer amount')
  })

  it('Should handle address(0) and refund correctly', async function () {
    const initialBalanceSender = await ethers.provider.getBalance(sender.address)
    const beforeBalance1 = await ethers.provider.getBalance(recipient1.address)
    const beforeBalance2 = await ethers.provider.getBalance(recipient2.address)
    const beforeBalance3 = await ethers.provider.getBalance(recipient3.address)

    // Send ETH with one of the recipients as address(0)
    const tx = await multiSender.sendETH(
      [recipient1.address, ethers.ZeroAddress, recipient3.address],
      [ethers.parseEther('1'), ethers.parseEther('2'), ethers.parseEther('3')],
      { value: ethers.parseEther('6') }
    )

    const finalBalanceSender = await ethers.provider.getBalance(sender.address)

    expect(await ethers.provider.getBalance(recipient1.address)).to.equal(
      beforeBalance1 + ethers.parseEther('1')
    )
    expect(await ethers.provider.getBalance(recipient2.address)).to.equal(beforeBalance2)
    expect(await ethers.provider.getBalance(recipient3.address)).to.equal(
      beforeBalance3 + ethers.parseEther('3')
    )

    const expectedSpending = ethers.parseEther('4')
    const receipt = await ethers.provider.getTransactionReceipt(tx.hash)
    const gasUsed = receipt.gasUsed
    const gasPrice = tx.gasPrice
    const gasCost = gasUsed * gasPrice

    // Check if the refund is correct
    expect(finalBalanceSender).to.be.closeTo(
      initialBalanceSender - expectedSpending - gasCost,
      ethers.parseEther('0.0001') // Allows for small variations in gas cost
    )
  })

  // TODO: Add more tests to check failure conditions for ERC20
})
