const anchor = require('@coral-xyz/anchor');

// Deploy script defined by the user.
const userScript = require('/Users/apple/Data/Code/aa-backend/client-2-example/migrations/deploy.js');

async function main() {
  const url = 'http://127.0.0.1:8899';
  const preflightCommitment = 'recent';
  const connection = new anchor.web3.Connection(url, preflightCommitment);
  const wallet = anchor.Wallet.local();

  const provider = new anchor.AnchorProvider(connection, wallet, {
    preflightCommitment,
    commitment: 'recent',
  });

  // Run the user's deploy script.
  userScript(provider);
}
main();
