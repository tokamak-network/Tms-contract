import { ethers, upgrades } from 'hardhat'
import { expect } from 'chai'
import { MultiSender, Token, MultiSenderV2 } from '../typechain-types'

describe('MultiSender', function () {
  let MultiSender: any, Token: any, MultiSenderV2: any
  let multiSender: MultiSender, token: Token, upgradedMultiSender: MultiSenderV2
  let sender: any, recipient1: any, recipient2: any, recipient3: any, upgrader: any

  beforeEach(async function () {
    ;[sender, recipient1, recipient2, recipient3, upgrader] = await ethers.getSigners()

    // Deploy the upgradeable MultiSender contract
    MultiSender = await ethers.getContractFactory('MultiSender')
    multiSender = await MultiSender.deploy()
    await multiSender.waitForDeployment()

    // Deploy the ERC20 token
    Token = await ethers.getContractFactory('Token')
    token = await Token.deploy(ethers.parseEther('1000'))
    await token.waitForDeployment()

    // Deploy the upgradeable MultiSenderV2 contract
    MultiSenderV2 = await ethers.getContractFactory('MultiSenderV2')

    // Transfer some tokens to the sender
    await token.transfer(sender.address, ethers.parseEther('100'))
  })

  describe('ERC20 token transfers', function () {
    it('Should send ERC20 tokens correctly', async function () {
      await token.connect(sender).approve(multiSender.target, ethers.parseEther('60'))

      const initialBalance = await token.balanceOf(sender.address)

      await multiSender
        .connect(sender)
        .sendERC20(
          token.target,
          [recipient1.address, recipient2.address, recipient3.address],
          [ethers.parseEther('10'), ethers.parseEther('20'), ethers.parseEther('30')]
        )

      const finalBalance = await token.balanceOf(sender.address)
      expect(finalBalance).to.equal(initialBalance - ethers.parseEther('60'))

      expect(await token.balanceOf(recipient1.address)).to.equal(ethers.parseEther('10'))
      expect(await token.balanceOf(recipient2.address)).to.equal(ethers.parseEther('20'))
      expect(await token.balanceOf(recipient3.address)).to.equal(ethers.parseEther('30'))
    })

    it('Should handle address(0) and refund correctly', async function () {
      const initialBalance = await token.balanceOf(sender.address)
      await token.connect(sender).approve(multiSender.target, ethers.parseEther('60'))

      await expect(
        multiSender
          .connect(sender)
          .sendERC20(
            token.target,
            [recipient1.address, ethers.ZeroAddress, recipient3.address],
            [ethers.parseEther('10'), ethers.parseEther('20'), ethers.parseEther('30')]
          )
      ).to.be.revertedWithCustomError(multiSender, 'ZeroAddress')
    })

    it('Should revert when recipients and amounts arrays have different lengths', async function () {
      await expect(
        multiSender
          .connect(sender)
          .sendERC20(
            token.target,
            [recipient1.address, recipient2.address],
            [ethers.parseEther('10')]
          )
      ).to.be.revertedWithCustomError(multiSender, 'InvalidLength')
    })

    it('Should revert when total transfer amount is zero', async function () {
      await expect(
        multiSender
          .connect(sender)
          .sendERC20(token.target, [recipient1.address], [ethers.parseEther('0')])
      ).to.be.revertedWithCustomError(multiSender, 'InsufficientBalance')
    })

    it('Should revert when sender has insufficient balance', async function () {
      await token.connect(sender).approve(multiSender.target, ethers.parseEther('1000000'))
      await expect(
        multiSender
          .connect(sender)
          .sendERC20(token.target, [recipient1.address], [ethers.parseEther('1000000')])
      ).to.be.revertedWithCustomError(multiSender, 'InsufficientBalance')
    })

    it('Should revert transfer which returns false', async function () {
      // Mock an address to fail transfers
      const failedRecipient = ethers.Wallet.createRandom().address

      // Deploy the FailingERC20 contract
      const FailingERC20 = await ethers.getContractFactory('FailingERC20')
      const failingToken = await FailingERC20.deploy()

      // Set the FailingERC20 contract as the token to be used
      token = failingToken
      const initialSenderBalance = await token.balanceOf(sender.address)
      const initialRecipient1Balance = await token.balanceOf(recipient1.address)
      const initialRecipient3Balance = await token.balanceOf(recipient3.address)

      // Send tokens, with one recipient expected to fail
      await expect(
        multiSender
          .connect(sender)
          .sendERC20(
            token.target,
            [recipient1.address, failedRecipient, recipient3.address],
            [ethers.parseEther('10'), ethers.parseEther('20'), ethers.parseEther('30')]
          )
      ).to.be.revertedWith('SafeERC20: ERC20 operation did not succeed')

      // Check that the balances have not changed
      expect(await token.balanceOf(sender.address)).to.equal(initialSenderBalance)
      expect(await token.balanceOf(recipient1.address)).to.equal(initialRecipient1Balance)
      expect(await token.balanceOf(recipient3.address)).to.equal(initialRecipient3Balance)
    })

    it('Should revert transfer which reverts', async function () {
      // Mock an address to fail transfers
      const failedRecipient = ethers.Wallet.createRandom().address

      // Deploy the FailingERC20 contract
      const FailingERC20 = await ethers.getContractFactory('RevertERC20')
      const failingToken = await FailingERC20.deploy()

      // Set the FailingERC20 contract as the token to be used
      token = failingToken
      const initialSenderBalance = await token.balanceOf(sender.address)
      const initialRecipient1Balance = await token.balanceOf(recipient1.address)
      const initialRecipient3Balance = await token.balanceOf(recipient3.address)

      // Send tokens, with one recipient expected to fail
      await expect(
        multiSender
          .connect(sender)
          .sendERC20(
            token.target,
            [recipient1.address, failedRecipient, recipient3.address],
            [ethers.parseEther('10'), ethers.parseEther('20'), ethers.parseEther('30')]
          )
      ).to.be.revertedWith('SafeERC20: low-level call failed')

      // Check that the balances have not changed
      expect(await token.balanceOf(sender.address)).to.equal(initialSenderBalance)
      expect(await token.balanceOf(recipient1.address)).to.equal(initialRecipient1Balance)
      expect(await token.balanceOf(recipient3.address)).to.equal(initialRecipient3Balance)
    })

    it('should rescue ERC20 tokens and emit event', async () => {
      // Send some ERC20 tokens to the contract
      await token.transfer(multiSender.target, ethers.parseEther('100.0'))

      // Call rescueERC20 as the owner
      await expect(multiSender.connect(sender).rescueERC20(token.target, sender.address))
        .to.emit(multiSender, 'RescueERC20')
        .withArgs(token.target, sender.address, ethers.parseEther('100.0'))

      // Verify the contract balance is 0
      expect(await token.balanceOf(multiSender.target)).to.equal(0)
    })

    it('should revert if called by non-owner', async () => {
      await expect(
        multiSender.connect(recipient1).rescueERC20(token.target, recipient1.address)
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })
  })
})
