import { ethers } from 'hardhat'
import { expect } from 'chai'

describe('MultiSender SendERC20', async function () {
  let multiSender
  let sender, recipient1, recipient2, recipient3

  beforeEach(async function () {
    // Deploy the contract
    const MultiSender = await ethers.getContractFactory('MultiSender')
    multiSender = await MultiSender.deploy()
    await multiSender.deployed()
    ;[sender, recipient1, recipient2, recipient3] = await ethers.getSigners()
  })

  it('Should sendETH correctly', async function () {
    const beforeBalance1 = await ethers.provider.getBalance(recipient1.address)
    const beforeBalance2 = await ethers.provider.getBalance(recipient2.address)
    const beforeBalance3 = await ethers.provider.getBalance(recipient3.address)

    await multiSender.sendETH(
      [recipient1.address, recipient2.address, recipient3.address],
      [ethers.utils.parseEther('1'), ethers.utils.parseEther('2'), ethers.utils.parseEther('3')],
      { value: ethers.utils.parseEther('6') }
    )

    expect((await ethers.provider.getBalance(recipient1.address)).toString()).to.equal(
      beforeBalance1.add(ethers.utils.parseEther('1')).toString()
    )
    expect((await ethers.provider.getBalance(recipient2.address)).toString()).to.equal(
      beforeBalance2.add(ethers.utils.parseEther('2')).toString()
    )
    expect((await ethers.provider.getBalance(recipient3.address)).toString()).to.equal(
      beforeBalance3.add(ethers.utils.parseEther('3')).toString()
    )
  })

  it('Should sendETH fail when the total amount is not equal to the sent amount', async function () {
    // Test when total amount is less than the sent amount
    await expect(
      multiSender.sendETH(
        [recipient1.address, recipient2.address, recipient3.address],
        [ethers.utils.parseEther('1'), ethers.utils.parseEther('2'), ethers.utils.parseEther('3')],
        { value: ethers.utils.parseEther('5') } //
      )
    ).to.be.rejectedWith('Unequal transfer amount')

    // Test when total amount is more than the sent amount
    await expect(
      multiSender.sendETH(
        [recipient1.address, recipient2.address, recipient3.address],
        [ethers.utils.parseEther('1'), ethers.utils.parseEther('2'), ethers.utils.parseEther('3')],
        { value: ethers.utils.parseEther('7') }
      )
    ).to.be.rejectedWith('Unequal transfer amount')
  })

  it('Should handle address(0) and refund correctly', async function () {
    // Test when one of the recipients is address(0)
    const initialBalanceSender = await ethers.provider.getBalance(sender.address)
    const beforeBalance1 = await ethers.provider.getBalance(recipient1.address)
    const beforeBalance2 = await ethers.provider.getBalance(recipient2.address)
    const beforeBalance3 = await ethers.provider.getBalance(recipient3.address)

    // Send ETH to as on of the address as address(0)
    const tx = await multiSender.sendETH(
      [recipient1.address, ethers.constants.AddressZero, recipient3.address],
      [ethers.utils.parseEther('1'), ethers.utils.parseEther('2'), ethers.utils.parseEther('3')],
      { value: ethers.utils.parseEther('6') }
    )

    const finalBalanceSender = await ethers.provider.getBalance(sender.address)

    expect((await ethers.provider.getBalance(recipient1.address)).toString()).to.equal(
      beforeBalance1.add(ethers.utils.parseEther('1')).toString()
    )
    expect((await ethers.provider.getBalance(recipient2.address)).toString()).to.equal(
      beforeBalance2.toString()
    )
    expect((await ethers.provider.getBalance(recipient3.address)).toString()).to.equal(
      beforeBalance3.add(ethers.utils.parseEther('3')).toString()
    )

    const expectedSpending = ethers.utils.parseEther('4')
    const gasUsed = (await ethers.provider.getTransactionReceipt(tx.hash)).gasUsed
    const gasPrice = await ethers.provider.getGasPrice()
    const gasCost = gasUsed.mul(gasPrice)

    // Check if the refund is correct
    expect(finalBalanceSender).closeTo(
      initialBalanceSender.sub(expectedSpending).sub(gasCost),
      ethers.utils.parseEther('0.0001')
    )
  })

  // TODO(Bayram): Add more tests to check failure conditions for ERC20
})
