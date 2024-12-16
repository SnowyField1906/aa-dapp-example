import { useState, useCallback, useRef } from 'react'
import {
    Network,
    TransactionReceipt,
    TransactionRequest,
    TransactionResponse,
    Result,
    MessageType,
    MessageRequest,
    Payload,
    ResponseCode,
    MessageResponse,
} from '../types'
import { PROVIDER } from '@utils/constants'
import { getRevertReason } from '@utils/offchain/transaction'
import { Address } from '@utils/types'

const TARGET_WALLET = process.env.NEXT_PUBLIC_TARGET_WALLET as string
const TARGET_WALLET_ORIGIN = new URL(TARGET_WALLET).origin

const useWallet = (network: Network) => {
    const [address, setAddress] = useState<Address>()
    const [isProcessing, setIsProcessing] = useState(false)
    const txQueue = useRef<
        {
            tx: () => Promise<Result<TransactionResponse>>
            resolve: (value: Result<TransactionResponse>) => void
        }[]
    >([])

    const _popup = (): Window => {
        const popupName = `popup-${Date.now()}`
        const popup = window.open(TARGET_WALLET, popupName)
        if (!popup) {
            throw new Error('Failed to open popup window')
        }
        return popup
    }

    const _buildRequest = <T extends MessageType>(
        type: T,
        payload?: Payload<Network, T>['Request']
    ): MessageRequest<Network, T> => {
        return { type, network, payload }
    }

    const _processQueue = useCallback(async () => {
        if (isProcessing || txQueue.current.length === 0) return

        setIsProcessing(true)
        try {
            while (txQueue.current.length > 0) {
                const current = txQueue.current[0]
                if (!current) break

                const result: Result<TransactionResponse> = await current.tx()
                current.resolve(result)
                txQueue.current.shift()
            }
        } finally {
            setIsProcessing(false)
        }
    }, [isProcessing])

    const _queueTransaction = useCallback(
        (tx: () => Promise<Result<TransactionResponse>>): Promise<Result<TransactionResponse>> => {
            return new Promise((resolve) => {
                txQueue.current.push({ tx, resolve })
                _processQueue()
            })
        },
        [_processQueue]
    )

    const _handleSendTransaction = useCallback(
        async (payload: TransactionRequest): Promise<Result<TransactionResponse>> => {
            if (!address) {
                return { code: ResponseCode.ERROR, message: 'User wallet not found' }
            }

            return new Promise((resolve) => {
                const walletWindow: Window = _popup()

                const handleMessage = ({ data, origin }: MessageEvent<MessageResponse>) => {
                    if (data.type === ('READY' as any) && origin === TARGET_WALLET_ORIGIN) {
                        const request = _buildRequest('SIGN_TRANSACTION', payload)
                        walletWindow.postMessage(request, TARGET_WALLET)
                    }
                    if (data.type === 'SIGN_TRANSACTION' && origin === TARGET_WALLET_ORIGIN) {
                        cleanup()
                        walletWindow.close()
                        resolve(data.payload as Result<TransactionResponse>)
                    }
                }

                const handleClose = () => {
                    cleanup()
                    resolve({ code: ResponseCode.ERROR, message: 'User unexpectedly closed the wallet' })
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
        [address]
    )

    const login = useCallback(() => {
        const walletWindow = _popup()

        const handleMessage = ({ data: { type, payload }, origin }: MessageEvent) => {
            if (type === 'READY' && origin === TARGET_WALLET_ORIGIN) {
                const request = _buildRequest('CONNECT_WALLET')
                walletWindow.postMessage(request, TARGET_WALLET)
            }
            if (type === 'CONNECT_WALLET' && origin === TARGET_WALLET_ORIGIN) {
                setAddress(payload.result)
                walletWindow.close()
            }
        }

        window.addEventListener('message', handleMessage)
        return () => window.removeEventListener('message', handleMessage)
    }, [])

    const logout = () => {
        setAddress(undefined)
    }

    const sendTransaction = useCallback(
        async (payload: TransactionRequest): Promise<Result<TransactionResponse>> =>
            _queueTransaction(() => _handleSendTransaction(payload)),
        [_queueTransaction, _handleSendTransaction]
    )

    const waitTransaction = useCallback(
        async (payload: string): Promise<Result<TransactionReceipt>> =>
            new Promise(async (resolve) => {
                const result: TransactionReceipt = (await PROVIDER.waitForTransaction(payload))!
                if (result.status === 0) {
                    const message = await getRevertReason(result.hash)
                    resolve({ code: ResponseCode.ERROR, message })
                } else {
                    resolve({ code: ResponseCode.SUCCESS, message: 'Transaction confirmed', result })
                }
            }),
        []
    )

    return { address, login, logout, sendTransaction, waitTransaction }
}

export default useWallet
