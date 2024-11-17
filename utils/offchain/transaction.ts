import { CHAIN_ID } from '../constants'
export const getRevertReason = async (txHash: string): Promise<string> => {
    const response = await fetch(
        `https://api.tenderly.co/api/v1/public-contract/${CHAIN_ID}/tx/${txHash}`
    )
    const data = await response.json()
    return data.error_message
}
