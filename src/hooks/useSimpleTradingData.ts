"use client"

import { useState, useEffect } from "react"

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

export const useSimpleTradingData = (initialData: CandlestickData[] = []) => {
	const [state, setState] = useState<TradingDataState>({
		candlestickData: initialData,
		currentPrice: null,
		isConnected: false,
		connectionStatus: "connecting",
	})

	useEffect(() => {
		let currentPrice = 56900
		let mounted = true

		// Set initial connected state
		setState((prev) => ({
			...prev,
			isConnected: true,
			connectionStatus: "connected",
		}))

		const updatePrice = () => {
			if (!mounted) return

			// Generate realistic price movement
			const volatility = 0.001 // 0.1% volatility
			const trend = (Math.random() - 0.5) * 2 * volatility
			const noise = (Math.random() - 0.5) * 0.0005

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

			// Randomly add new candles (5% chance each update)
			if (Math.random() < 0.05) {
				const now = new Date()
				const timeString = now.toISOString().split("T")[0]

				const newCandle: CandlestickData = {
					time: timeString,
					open: currentPrice * (0.999 + Math.random() * 0.002),
					high: currentPrice * (1.001 + Math.random() * 0.003),
					low: currentPrice * (0.997 + Math.random() * 0.002),
					close: currentPrice,
					volume: Math.floor(Math.random() * 1000000) + 500000,
				}

				setState((prev) => ({
					...prev,
					candlestickData: [
						...prev.candlestickData.slice(-49),
						newCandle,
					], // Keep last 50 candles
				}))
			}
		}

		// Start price updates
		const intervalId = setInterval(updatePrice, 3000) // Update every 3 seconds

		return () => {
			mounted = false
			clearInterval(intervalId)
		}
	}, [])

	const disconnect = () => {
		setState((prev) => ({
			...prev,
			isConnected: false,
			connectionStatus: "disconnected",
		}))
	}

	return {
		...state,
		disconnect,
	}
}
