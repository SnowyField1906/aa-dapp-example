import { useState, useCallback, useRef } from 'react'
import {
    EChain,
    PublicUserWallet,
    TransactionReceipt,
    TransactionRequest,
    TransactionResponse,
} from '../types'
import { PROVIDER, RPC_URL } from '@utils/constants'
import { getRevertReason } from '@utils/offchain/transaction'

const TARGET_WALLET = 'http://localhost:3000/transaction_signing'

const useWallet = (chain: EChain) => {
    type Chain = typeof chain
    type UserWallet = PublicUserWallet<Chain>
    type TxResponse = TransactionResponse<Chain>
    type TxReceipt = TransactionReceipt<Chain>
    type TxRequest = TransactionRequest<Chain>

    const [userWallet, setUserWallet] = useState<UserWallet>()
    const [isProcessing, setIsProcessing] = useState(false)
    const transactionQueue = useRef<
        { transaction: () => Promise<TxResponse>; resolve: (value: TxResponse) => void }[]
    >([])

    const _popup = (): Window => {
        const popupName = `popup-${Date.now()}`
        const popup = window.open(TARGET_WALLET, popupName)
        if (!popup) {
            throw new Error('Failed to open popup window')
        }
        return popup
    }

    const _processQueue = useCallback(async () => {
        if (isProcessing || transactionQueue.current.length === 0) return

        setIsProcessing(true)
        try {
            while (transactionQueue.current.length > 0) {
                const current = transactionQueue.current[0]
                if (!current) break

                const result = await current.transaction()
                current.resolve(result)
                transactionQueue.current.shift()
            }
        } finally {
            setIsProcessing(false)
        }
    }, [isProcessing])

    const _queueTransaction = useCallback(
        (transaction: () => Promise<TxResponse>): Promise<TxResponse> => {
            return new Promise((resolve) => {
                transactionQueue.current.push({ transaction, resolve })
                _processQueue()
            })
        },
        [_processQueue]
    )

    const _handleSendTransaction = useCallback(
        async (payload: TxRequest): Promise<TxResponse> => {
            if (!userWallet) {
                return { success: false, error: new Error('User wallet not found') }
            }

            return new Promise((resolve) => {
                const walletWindow: Window = _popup()

                const handleMessage = ({ data: { type, ...res } }: MessageEvent) => {
                    if (type === 'READY') {
                        walletWindow.postMessage(
                            { type: 'SIGN_TRANSACTION_REQUEST', payload, userWallet },
                            '*'
                        )
                    }
                    if (type === 'SIGN_TRANSACTION_RESPONSE') {
                        cleanup()
                        walletWindow.close()
                        resolve(res)
                    }
                }

                const handleClose = () => {
                    cleanup()
                    resolve({ success: false, error: new Error('User closed window') })
                }

                const cleanup = () => {
                    clearInterval(windowChecker)
                    window.removeEventListener('message', handleMessage)
                }

                const windowChecker = setInterval(() => {
                    if (walletWindow.closed) handleClose()
                }, 500)

                window.addEventListener('message', handleMessage)
            })
        },
        [userWallet]
    )

    const login = useCallback(() => {
        const walletWindow = _popup()

        const handleMessage = ({ data: { type, ...res } }: MessageEvent) => {
            if (type === 'READY') {
                walletWindow.postMessage({ type: 'DERIVE_ADDRESS_REQUEST' }, '*')
            }
            if (type === 'DERIVE_ADDRESS_RESPONSE') {
                setUserWallet(res)
                walletWindow.close()
            }
        }

        window.addEventListener('message', handleMessage)
        return () => window.removeEventListener('message', handleMessage)
    }, [])

    const logout = () => {
        setUserWallet(undefined)
    }

    const sendTransaction = useCallback(
        async (payload: TxRequest): Promise<TxResponse> =>
            _queueTransaction(() => _handleSendTransaction(payload)),
        [_queueTransaction, _handleSendTransaction]
    )

    const waitTransaction = useCallback(
        async (payload: string): Promise<TxReceipt> =>
            new Promise(async (resolve) => {
                const receipt = (await PROVIDER.waitForTransaction(payload))!
                if (receipt.status === 0) {
                    const reason = await getRevertReason(receipt.hash)
                    resolve({ success: false, error: new Error(reason) })
                } else {
                    resolve({ success: true, receipt })
                }
            }),
        []
    )

    return {
        userWallet,
        login,
        logout,
        sendTransaction,
        waitTransaction,
    }
}

export default useWallet
