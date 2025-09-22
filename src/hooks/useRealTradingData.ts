"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { binanceService, CandlestickData } from "@/services/binanceApi"

interface PriceData {
	symbol: string
	price: number
	change: number
	changePercent: number
	high24h: number
	low24h: number
	volume24h: number
	timestamp: number
}

interface TradingDataState {
	candlestickData: CandlestickData[]
	currentPrice: PriceData | null
	isConnected: boolean
	connectionStatus: string
	isLoading: boolean
	error: string | null
}

export const useRealTradingData = (symbol: string = "BTCUSDT") => {
	const [state, setState] = useState<TradingDataState>({
		candlestickData: [],
		currentPrice: null,
		isConnected: false,
		connectionStatus: "connecting",
		isLoading: true,
		error: null,
	})

	const wsRef = useRef<WebSocket | null>(null)
	const mountedRef = useRef(true)

	// Load historical data on mount
	useEffect(() => {
		const loadHistoricalData = async () => {
			try {
				setState((prev) => ({ ...prev, isLoading: true, error: null }))

				// Get historical candlestick data (last 100 hours)
				const historicalData = await binanceService.getHistoricalData(
					symbol,
					"1h",
					100
				)

				// Get current price info
				const currentPrice = await binanceService.getCurrentPrice(
					symbol
				)

				if (mountedRef.current) {
					setState((prev) => ({
						...prev,
						candlestickData: historicalData,
						currentPrice: {
							...currentPrice,
							timestamp: Date.now(),
						},
						isLoading: false,
					}))
				}
			} catch (error) {
				console.error("Error loading historical data:", error)
				if (mountedRef.current) {
					setState((prev) => ({
						...prev,
						error: "Failed to load historical data",
						isLoading: false,
					}))
				}
			}
		}

		loadHistoricalData()
	}, [symbol])

	// WebSocket connection for real-time updates
	const connectWebSocket = useCallback(() => {
		if (wsRef.current?.readyState === WebSocket.OPEN) {
			return // Already connected
		}

		try {
			setState((prev) => ({ ...prev, connectionStatus: "connecting" }))

			const ws = binanceService.createWebSocket(
				symbol.toLowerCase(),
				(data: PriceData) => {
					if (mountedRef.current) {
						setState((prev) => ({
							...prev,
							currentPrice: data,
							isConnected: true,
							connectionStatus: "live",
						}))
					}
				},
				(error) => {
					console.error("WebSocket error:", error)
					if (mountedRef.current) {
						// Fallback to simulation mode
						startSimulationMode()
					}
				},
				() => {
					if (mountedRef.current) {
						setState((prev) => ({
							...prev,
							isConnected: false,
							connectionStatus: "disconnected",
						}))

						// Try simulation mode as fallback
						setTimeout(() => {
							if (mountedRef.current) {
								startSimulationMode()
							}
						}, 3000)
					}
				}
			)

			wsRef.current = ws
		} catch (error) {
			console.error("Error creating WebSocket:", error)
			// Fallback to simulation mode
			startSimulationMode()
		}
	}, [symbol])

	// Fallback simulation mode if WebSocket fails
	const startSimulationMode = useCallback(() => {
		if (!state.currentPrice) return

		setState((prev) => ({
			...prev,
			isConnected: true,
			connectionStatus: "simulation",
		}))

		let currentPriceValue = state.currentPrice?.price || 45000

		const simulatePrice = () => {
			if (!mountedRef.current) return

			// Generate more visible price movement for testing
			const volatility = 0.003 // 0.3% volatility (more visible)
			const trend = (Math.random() - 0.5) * 2 * volatility
			const noise = (Math.random() - 0.5) * 0.001

			currentPriceValue = currentPriceValue * (1 + trend + noise)
			currentPriceValue = Math.max(currentPriceValue, 1000)

			const priceChange =
				currentPriceValue - (state.currentPrice?.price || 45000)
			const priceChangePercent =
				(priceChange / (state.currentPrice?.price || 45000)) * 100

			const newPrice = Math.round(currentPriceValue * 100) / 100
			console.log("🔄 Price update:", {
				oldPrice: state.currentPrice?.price,
				newPrice: newPrice,
				change: Math.round(priceChange * 100) / 100,
				changePercent: Math.round(priceChangePercent * 100) / 100,
			})

			setState((prev) => ({
				...prev,
				currentPrice: {
					symbol: symbol,
					price: newPrice,
					change: Math.round(priceChange * 100) / 100,
					changePercent: Math.round(priceChangePercent * 100) / 100,
					high24h: currentPriceValue * 1.03,
					low24h: currentPriceValue * 0.97,
					volume24h: 25000,
					timestamp: Date.now(),
				},
			}))
		}

		// Start simulation updates
		const intervalId = setInterval(simulatePrice, 1000) // Every 1 second for more visible updates

		// Store interval ID for cleanup
		return () => clearInterval(intervalId)
	}, [state.currentPrice, symbol])

	// Connect WebSocket after historical data is loaded
	useEffect(() => {
		if (!state.isLoading && state.candlestickData.length > 0) {
			connectWebSocket()
		}
	}, [state.isLoading, state.candlestickData.length, connectWebSocket])

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			mountedRef.current = false
			if (wsRef.current) {
				wsRef.current.close()
				wsRef.current = null
			}
		}
	}, [])

	const disconnect = useCallback(() => {
		if (wsRef.current) {
			wsRef.current.close()
			wsRef.current = null
		}
		setState((prev) => ({
			...prev,
			isConnected: false,
			connectionStatus: "disconnected",
		}))
	}, [])

	const reconnect = useCallback(() => {
		disconnect()
		setTimeout(() => {
			connectWebSocket()
		}, 1000)
	}, [disconnect, connectWebSocket])

	return {
		...state,
		disconnect,
		reconnect,
	}
}
