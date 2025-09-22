"use client"

import { useState, useEffect, useRef, useCallback } from "react"

interface WebSocketHookProps {
	url: string
	onMessage?: (data: any) => void
	onOpen?: () => void
	onClose?: () => void
	onError?: (error: Event) => void
	reconnectInterval?: number
	maxReconnectAttempts?: number
}

interface WebSocketState {
	socket: WebSocket | null
	lastMessage: any
	readyState: number
	isConnected: boolean
	reconnectAttempts: number
}

export const useWebSocket = ({
	url,
	onMessage,
	onOpen,
	onClose,
	onError,
	reconnectInterval = 3000,
	maxReconnectAttempts = 5,
}: WebSocketHookProps) => {
	const [socketState, setSocketState] = useState<WebSocketState>({
		socket: null,
		lastMessage: null,
		readyState: WebSocket.CONNECTING,
		isConnected: false,
		reconnectAttempts: 0,
	})

	const reconnectTimeoutId = useRef<number | null>(null)
	const socketRef = useRef<WebSocket | null>(null)

	const connect = useCallback(() => {
		try {
			const socket = new WebSocket(url)
			socketRef.current = socket

			socket.onopen = (event) => {
				console.log("WebSocket connected")
				setSocketState((prev) => ({
					...prev,
					socket,
					readyState: socket.readyState,
					isConnected: true,
					reconnectAttempts: 0,
				}))
				onOpen?.()
			}

			socket.onmessage = (event) => {
				const data = JSON.parse(event.data)
				setSocketState((prev) => ({
					...prev,
					lastMessage: data,
				}))
				onMessage?.(data)
			}

			socket.onclose = (event) => {
				console.log("WebSocket disconnected")
				setSocketState((prev) => ({
					...prev,
					socket: null,
					readyState: WebSocket.CLOSED,
					isConnected: false,
				}))
				onClose?.()

				// Attempt to reconnect
				if (socketState.reconnectAttempts < maxReconnectAttempts) {
					reconnectTimeoutId.current = window.setTimeout(() => {
						setSocketState((prev) => ({
							...prev,
							reconnectAttempts: prev.reconnectAttempts + 1,
						}))
						connect()
					}, reconnectInterval)
				}
			}

			socket.onerror = (error) => {
				console.error("WebSocket error:", error)
				onError?.(error)
			}
		} catch (error) {
			console.error("Failed to create WebSocket connection:", error)
		}
	}, [
		url,
		onMessage,
		onOpen,
		onClose,
		onError,
		reconnectInterval,
		maxReconnectAttempts,
		socketState.reconnectAttempts,
	])

	const disconnect = useCallback(() => {
		if (reconnectTimeoutId.current) {
			window.clearTimeout(reconnectTimeoutId.current)
		}
		if (socketRef.current) {
			socketRef.current.close()
		}
	}, [])

	const sendMessage = useCallback((message: any) => {
		if (
			socketRef.current &&
			socketRef.current.readyState === WebSocket.OPEN
		) {
			socketRef.current.send(JSON.stringify(message))
		}
	}, [])

	useEffect(() => {
		connect()

		return () => {
			disconnect()
		}
	}, [connect, disconnect])

	return {
		...socketState,
		sendMessage,
		disconnect,
		reconnect: connect,
	}
}
