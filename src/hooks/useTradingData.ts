"use client"

import { useState, useEffect, useCallback } from "react"

interface CandlestickData {
	time: string
	open: number
	high: number
	low: number
	close: number
	volume?: number
}

interface PriceData {
	symbol: string
	price: number
	change: number
	changePercent: number
	timestamp: number
}

interface TradingDataState {
	candlestickData: CandlestickData[]
	currentPrice: PriceData | null
	isConnected: boolean
	connectionStatus: string
}

export const useTradingData = (initialData: CandlestickData[] = []) => {
	const [state, setState] = useState<TradingDataState>({
		candlestickData: initialData,
		currentPrice: null,
		isConnected: false,
		connectionStatus: "disconnected",
	})

	const startSimulation = useCallback(() => {
		let currentPrice = 56900
		let intervalId: number | null = null

		setState((prev) => ({
			...prev,
			isConnected: true,
			connectionStatus: "connected",
		}))

		const generateUpdate = () => {
			// Generate realistic price movement
			const volatility = 0.002 // 0.2% volatility
			const trend = (Math.random() - 0.5) * 2 * volatility
			const noise = (Math.random() - 0.5) * 0.001

			currentPrice = currentPrice * (1 + trend + noise)
			currentPrice = Math.max(currentPrice, 1000)

			const priceChange = currentPrice - 56900
			const priceChangePercent = (priceChange / 56900) * 100

			setState((prev) => ({
				...prev,
				currentPrice: {
					symbol: "BTCUSD",
					price: Math.round(currentPrice * 100) / 100,
					change: Math.round(priceChange * 100) / 100,
					changePercent: Math.round(priceChangePercent * 100) / 100,
					timestamp: Date.now(),
				},
			}))

			// Occasionally add new candles (every 10 seconds for demo)
			if (Math.random() < 0.1) {
				const newCandle: CandlestickData = {
					time: new Date().toISOString().split("T")[0],
					open: currentPrice * 0.999,
					high: currentPrice * 1.002,
					low: currentPrice * 0.998,
					close: currentPrice,
					volume: Math.floor(Math.random() * 1000000) + 500000,
				}

				setState((prev) => ({
					...prev,
					candlestickData: [
						...prev.candlestickData.slice(-50),
						newCandle,
					], // Keep last 50 candles
				}))
			}
		}

		intervalId = window.setInterval(generateUpdate, 2000) // Update every 2 seconds

		return () => {
			if (intervalId) {
				window.clearInterval(intervalId)
			}
		}
	}, [])

	const connect = useCallback(() => {
		const cleanup = startSimulation()
		return cleanup
	}, [startSimulation])

	const disconnect = useCallback(() => {
		setState((prev) => ({
			...prev,
			isConnected: false,
			connectionStatus: "disconnected",
		}))
	}, [])

	useEffect(() => {
		const cleanup = connect()

		return cleanup
	}, [connect])

	return {
		...state,
		connect,
		disconnect,
	}
}
