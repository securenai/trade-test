"use client"

import { useState, useEffect } from "react"
import TradingChart from "@/components/TradingChart"
import ConnectionStatus from "@/components/ConnectionStatus"

interface CandlestickData {
	time: number // Unix timestamp in seconds
	open: number
	high: number
	low: number
	close: number
	volume?: number
}

interface PriceData {
	price: number
	changePercent: number
}

interface RealtimeTradingDashboardProps {
	initialData: CandlestickData[]
}

export default function RealtimeTradingDashboard({
	initialData,
}: RealtimeTradingDashboardProps) {
	const [candlestickData, setCandlestickData] =
		useState<CandlestickData[]>(initialData)
	const [currentPrice, setCurrentPrice] = useState<PriceData>({
		price:
			initialData.length > 0
				? initialData[initialData.length - 1].close
				: 112000,
		changePercent: 0,
	})
	const [isConnected, setIsConnected] = useState(false)
	const [connectionStatus, setConnectionStatus] = useState("connecting")

	useEffect(() => {
		// Start with the last price from historical data
		let currentPriceValue =
			initialData.length > 0
				? initialData[initialData.length - 1].close
				: 112000
		let mounted = true

		// Set connected state
		setIsConnected(true)
		setConnectionStatus("live")

		const updatePrice = () => {
			if (!mounted) return

			// Generate realistic price movement
			const volatility = 0.001 // 0.1% volatility
			const trend = (Math.random() - 0.5) * 2 * volatility
			const noise = (Math.random() - 0.5) * 0.0005

			currentPriceValue = currentPriceValue * (1 + trend + noise)
			currentPriceValue = Math.max(currentPriceValue, 1000)

			const initialPrice =
				initialData.length > 0
					? initialData[initialData.length - 1].close
					: 112000
			const priceChange = currentPriceValue - initialPrice
			const priceChangePercent = (priceChange / initialPrice) * 100

			setCurrentPrice({
				price: Math.round(currentPriceValue * 100) / 100,
				changePercent: Math.round(priceChangePercent * 100) / 100,
			})

			// Note: We now update the last candle in real-time instead of adding new ones
			// The TradingChart component will handle updating the last candle with currentPrice
		}

		// Start price updates
		const intervalId = setInterval(updatePrice, 2000) // Update every 2 seconds

		return () => {
			mounted = false
			clearInterval(intervalId)
		}
	}, [])

	return (
		<div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
			<div className="flex justify-between items-center mb-6">
				<div>
					<h2 className="text-2xl font-semibold text-white">
						BTC/USD
					</h2>
					<p className="text-gray-400">Bitcoin to US Dollar</p>
					<ConnectionStatus
						isConnected={isConnected}
						status={connectionStatus}
					/>
				</div>
				<div className="text-right">
					<div
						className={`text-2xl font-bold ${
							currentPrice.changePercent >= 0
								? "text-green-400"
								: "text-red-400"
						}`}
					>
						${currentPrice.price.toLocaleString()}
					</div>
					<div
						className={`text-sm ${
							currentPrice.changePercent >= 0
								? "text-green-400"
								: "text-red-400"
						}`}
					>
						{currentPrice.changePercent > 0 ? "+" : ""}
						{currentPrice.changePercent.toFixed(2)}% (24h)
					</div>
				</div>
			</div>

			<TradingChart
				data={candlestickData}
				currentPrice={currentPrice.price}
				height={500}
			/>
		</div>
	)
}
