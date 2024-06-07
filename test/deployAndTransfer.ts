import { ethers } from 'hardhat'
import { expect } from 'chai'

describe('MultiSender', async function () {
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
    const initialBalance = await ethers.provider.getBalance(sender.address)
    console.log('Initial Balance:', ethers.utils.formatEther(initialBalance))

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

  it('Should send ERC20 token correctly', async function () {
    // Mint some tokens for the sender
    const Token = await ethers.getContractFactory('Token')
    const token = await Token.deploy(ethers.utils.parseEther('100'))
    await token.deployed()

    const totalSupply = await token.totalSupply()
    console.log('Total Supply:', ethers.utils.formatEther(totalSupply))

    const balance1 = await token.balanceOf(sender.address)
    console.log('Balance:', ethers.utils.formatEther(balance1))

    const balanceDeployer = await token.balanceOf(sender.address)
    console.log('Balance of DeployerAddress:', ethers.utils.formatEther(balanceDeployer))

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
  // TODO(Bayram): Add more tests to check failure conditions for ERC20
})
