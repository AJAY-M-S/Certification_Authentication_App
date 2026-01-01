import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import hre from 'hardhat'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  const [deployer] = await hre.ethers.getSigners()
  console.log('Deployer:', deployer.address)

  const Factory = await hre.ethers.getContractFactory('SkillCredential')
  const contract = await Factory.deploy(deployer.address)
  await contract.waitForDeployment()

  const address = await contract.getAddress()
  console.log('SkillCredential deployed to:', address)

  // Write into backend/shared for the FastAPI app
  const repoRoot = path.resolve(__dirname, '..', '..')
  const outAddr = path.join(repoRoot, 'backend', 'shared', 'addresses', 'contract.json')
  fs.writeFileSync(outAddr, JSON.stringify({ address }, null, 2))

  const artifact = await hre.artifacts.readArtifact('SkillCredential')
  const outAbi = path.join(repoRoot, 'backend', 'shared', 'abis', 'SkillCredential.json')
  fs.writeFileSync(outAbi, JSON.stringify({ abi: artifact.abi }, null, 2))

  console.log('Wrote:')
  console.log('-', outAddr)
  console.log('-', outAbi)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
