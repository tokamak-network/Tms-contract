import { ethers, run } from 'hardhat';

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log(
    "Deploying contracts with the account:",
    deployer.address
  );

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const MultiSender = await ethers.getContractFactory("MultiSender");
  const multiSender = await MultiSender.deploy();

  await multiSender.deployed();

  console.log("MultiSender contract deployed to:", multiSender.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
