import 'dotenv/config'
import '@nomicfoundation/hardhat-toolbox'

const RPC_URL = process.env.RPC_URL || ''
const PRIVATE_KEY = process.env.PRIVATE_KEY || ''

// Public RPCs sometimes return absurd fee estimates. Force a sane cap for hackathon usage.
// 30 gwei gasPrice with 3,000,000 gas limit keeps deployment well under 1 native token.
const GAS_PRICE_WEI = 30_000_000_000
const GAS_LIMIT = 3_000_000

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: '0.8.24',
  networks: {
    // Polygon Amoy testnet
    amoy: {
      url: RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      gas: GAS_LIMIT,
      gasPrice: GAS_PRICE_WEI,
    },
    // Polygon Mumbai (legacy)
    mumbai: {
      url: RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      gas: GAS_LIMIT,
      gasPrice: GAS_PRICE_WEI,
    },
  },
}
