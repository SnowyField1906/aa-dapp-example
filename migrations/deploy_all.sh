cd contracts/solana_counter
anchor build && anchor deploy && node ../../migrations/solana_counter_deploy.mjs

cd ../../
npx hardhat run migrations/ethereum_counter_deploy.mjs --network localhost