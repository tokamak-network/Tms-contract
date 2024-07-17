import { ethers, deployments } from 'hardhat'

const { deploy } = deployments

async function main() {
  const signers = await ethers.getSigners()
  const deployer = signers[0]
  const tx = await deploy('MultiSender', {
    from: deployer.address,
    args: [],
    log: true
  })

  console.log('MultiSender contract deployed to:', tx.address)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
