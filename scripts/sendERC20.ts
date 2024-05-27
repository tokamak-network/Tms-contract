import { ethers } from 'hardhat';

const deployedMultiSender = '0x8161Bc94E430C246bF8CbE9a1d45Ad082df82065'

async function main() {
  const multiSender = await ethers.getContractAt("MultiSender", deployedMultiSender);
  const [deployer] = await ethers.getSigners();
  
  // Replace with the actual token address, recipients and amounts
  const tokenAddress = "0xFF3Ef745D9878AfE5934Ff0b130868AFDDbc58e8"; // USDC Testnet
  const token = await ethers.getContractAt("ERC20", tokenAddress);
  // Replace with the actual recipients and amounts
  const address1 = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
  const address2 = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
  const recipients = [address1, address2];
  const amounts = [ethers.utils.parseUnits("1", 5), ethers.utils.parseUnits("2", 5)];

  const totalAmount = ethers.utils.parseUnits("1", 6); // 1 USDC
  await token.connect(deployer).approve(deployedMultiSender, totalAmount);

  let tx = await multiSender.sendERC20(tokenAddress, recipients, amounts, { value: ethers.utils.parseEther("0.000003") });

  console.log('Transaction Hash:', tx.hash);
  console.log("ERC20 tokens sent to recipients");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
  console.error(error);
  process.exit(1);
  });
