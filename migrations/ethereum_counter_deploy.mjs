import pkg from 'hardhat'
import dotenv from 'dotenv'
import artifact from '../artifacts/contracts/ethereum_counter/contract.sol/PingCounter.json' assert { type: 'json' }
import { writeFileSync } from 'fs'
import { parseEther } from 'ethers'

const { ethers } = pkg
async function main() {
    const [deployer] = await ethers.getSigners()

    console.log('Deploying PingCounter with the account:', deployer.address)

    const PingCounter = await ethers.getContractFactory(
        artifact.abi,
        artifact.bytecode,
        deployer
    )
    const pingCounter = await PingCounter.deploy()

    console.log('PingCounter deployed to:', pingCounter.target)

    const envPath = `${process.cwd()}/.env`
    const env = dotenv.config({ path: envPath }).parsed
    env.NEXT_PUBLIC_ETHEREUM_CONTRACT_ADDRESS = pingCounter.target
    writeFileSync(
        envPath,
        `NEXT_PUBLIC_ETHEREUM_CONTRACT_ADDRESS=${pingCounter.target}`
    )

    // Send 1.0 ETH to some addresses
    await Promise.all(
        [
            '0xbeb874Ff06F0FD534E6e6f9A0DF2A00bbF4Ef2E5',
            '0x85610E310C3166762409C7E17f845333e231EC26',
        ].map((to) =>
            deployer
                .sendTransaction({ to, value: parseEther('1.0') })
                .then(() => console.log(`Sent 1.0 ETH to ${to}`))
        )
    )
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
