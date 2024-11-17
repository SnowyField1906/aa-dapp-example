// Migrations are an early feature. Currently, they're nothing more than this
// single deploy script that's invoked from the CLI, injecting a provider
// configured from the workspace's Anchor.toml.

import {
    AnchorProvider,
    getProvider,
    Program,
    setProvider,
    Wallet,
    web3,
} from '@coral-xyz/anchor'
import { Connection } from '@solana/web3.js'

async function main() {
    const connection = new Connection('http://localhost:8899', 'confirmed')
    const keypair = web3.Keypair.generate()
    const wallet = new Wallet(keypair)
    const provider = new AnchorProvider(connection, wallet, {
        preflightCommitment: 'confirmed',
    })

    await connection.requestAirdrop(keypair.publicKey, 2e9)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    await Promise.all(
        [
            'EbWEhfZcHoQyXSKiS2T7WGkALGvhsE6rNx9eY4T62JBD',
            'EbWEhfZcHoQyXSKiS2T7WGkALGvhsE6rNx9eY4T62JBD',
        ].map((to) =>
            provider
                .sendAndConfirm(
                    new web3.Transaction().add(
                        web3.SystemProgram.transfer({
                            fromPubkey: keypair.publicKey,
                            toPubkey: new web3.PublicKey(to),
                            lamports: 1e9,
                        })
                    )
                )
                .then(() => console.log('Transferred 1 SOL to', to))
        )
    )
}

main()
