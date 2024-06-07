import { ethers } from 'hardhat'
import { expect } from 'chai'

describe('MultiSender', async function () {
  let multiSender, token
  let sender, recipient1, recipient2, recipient3

  beforeEach(async function () {
    // Deploy the contract
    const MultiSender = await ethers.getContractFactory('MultiSender')
    multiSender = await MultiSender.deploy()
    await multiSender.deployed()
    ;[sender, recipient1, recipient2, recipient3] = await ethers.getSigners()

    // Mint some tokens for the sender
    const Token = await ethers.getContractFactory('Token')
    token = await Token.deploy(ethers.utils.parseEther('100'))
    await token.deployed()
  })

  it('Should send ERC20 token correctly', async function () {
    // Mint some tokens for the sender

    await token.transfer(sender.address, ethers.utils.parseEther('100'))

    const balance = await token.balanceOf(sender.address)
    console.log('Balance:', ethers.utils.formatEther(balance))

    // Approve the MultiSender contract to spend tokens
    await token.connect(sender).approve(multiSender.address, ethers.utils.parseEther('60'))

    // Check the sender's balance before the transaction
    const initialBalance = await token.balanceOf(sender.address)

    // Call the multiSend function
    await multiSender
      .connect(sender)
      .sendERC20(
        token.address,
        [recipient1.address, recipient2.address, recipient3.address],
        [
          ethers.utils.parseEther('10'),
          ethers.utils.parseEther('20'),
          ethers.utils.parseEther('30')
        ]
      )

    // Check the sender's balance after the transaction
    const finalBalance = await token.balanceOf(sender.address)
    expect(finalBalance).to.equal(initialBalance.sub(ethers.utils.parseEther('60')))

    // Check the recipients' balances
    expect(await token.balanceOf(recipient1.address)).to.equal(ethers.utils.parseEther('10'))
    expect(await token.balanceOf(recipient2.address)).to.equal(ethers.utils.parseEther('20'))
    expect(await token.balanceOf(recipient3.address)).to.equal(ethers.utils.parseEther('30'))
  })

  it('Should handle address(0) and refund correctly', async function () {
    // Get initial balances
    const initialBalance = await token.balanceOf(sender.address)

    // Approve the contract to spend tokens on behalf of the sender
    await token.approve(multiSender.address, ethers.utils.parseEther('60'))

    // Call the multiSend sendERC20 function
    await multiSender
      .connect(sender)
      .sendERC20(
        token.address,
        [recipient1.address, ethers.constants.AddressZero, recipient3.address],
        [
          ethers.utils.parseEther('10'),
          ethers.utils.parseEther('20'),
          ethers.utils.parseEther('30')
        ]
      )

    // Check the sender's balance after the transaction
    const finalBalance = await token.balanceOf(sender.address)
    expect(finalBalance).to.equal(initialBalance.sub(ethers.utils.parseEther('40')))

    // Check the recipients' balances
    expect(await token.balanceOf(recipient1.address)).to.equal(ethers.utils.parseEther('10'))
    expect(await token.balanceOf(recipient2.address)).to.equal(ethers.utils.parseEther('0')) // zero address used
    expect(await token.balanceOf(recipient3.address)).to.equal(ethers.utils.parseEther('30'))
  })

  // TODO(Bayram): Add more tests to check failure conditions for ERC20
})
