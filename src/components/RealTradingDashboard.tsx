"use client"

import TradingChart from "@/components/TradingChart"
import ConnectionStatus from "@/components/ConnectionStatus"
import { useRealTradingData } from "@/hooks/useRealTradingData"

interface RealTradingDashboardProps {
	symbol?: string
}

export default function RealTradingDashboard({
	symbol = "BTCUSDT",
}: RealTradingDashboardProps) {
	const {
		candlestickData,
		currentPrice,
		isConnected,
		connectionStatus,
		isLoading,
		error,
		reconnect,
	} = useRealTradingData(symbol)

	// Loading state
	if (isLoading) {
		return (
			<div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
				<div className="flex justify-center items-center h-64">
					<div className="text-center">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
						<p className="text-gray-400">Loading Bitcoin data...</p>
					</div>
				</div>
			</div>
		)
	}

	// Error state
	if (error) {
		return (
			<div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
				<div className="flex justify-center items-center h-64">
					<div className="text-center">
						<div className="text-red-500 text-xl mb-4">⚠️</div>
						<p className="text-red-400 mb-4">{error}</p>
						<button
							onClick={reconnect}
							className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
						>
							Retry Connection
						</button>
					</div>
				</div>
			</div>
		)
	}

	// Format symbol for display (BTCUSDT -> BTC/USDT)
	const displaySymbol = symbol.replace(/USDT$/, "/USDT").replace(/BTC/, "BTC")

	return (
		<div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
			<div className="flex justify-between items-center mb-6">
				<div>
					<h2 className="text-2xl font-semibold text-white">
						{displaySymbol}
					</h2>
					<p className="text-gray-400">
						Bitcoin to US Dollar Tether • Live Market Data
					</p>
					<div className="mt-2 flex items-center space-x-4">
						<ConnectionStatus
							isConnected={isConnected}
							status={connectionStatus}
						/>
						{currentPrice && (
							<div className="text-sm text-gray-500">
								Last updated:{" "}
								{new Date(
									currentPrice.timestamp
								).toLocaleTimeString()}
							</div>
						)}
					</div>
				</div>
				<div className="text-right">
					<div
						className={`text-2xl font-bold ${
							currentPrice?.changePercent &&
							currentPrice.changePercent >= 0
								? "text-green-400"
								: "text-red-400"
						}`}
					>
						$
						{currentPrice?.price?.toLocaleString(undefined, {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2,
						}) || "Loading..."}
					</div>
					<div
						className={`text-sm ${
							currentPrice?.changePercent &&
							currentPrice.changePercent >= 0
								? "text-green-400"
								: "text-red-400"
						}`}
					>
						{currentPrice?.changePercent
							? `${
									currentPrice.changePercent > 0 ? "+" : ""
							  }${currentPrice.changePercent.toFixed(2)}% (24h)`
							: "Loading..."}
					</div>
					{currentPrice && (
						<div className="text-xs text-gray-500 mt-1">
							${currentPrice.change > 0 ? "+" : ""}
							{currentPrice.change.toFixed(2)} USD
						</div>
					)}
				</div>
			</div>

			<TradingChart
				data={candlestickData}
				currentPrice={currentPrice?.price}
				candleInterval={5} // Create new candles every 5 minutes
				height={500}
			/>

			{/* Market Stats */}
			{currentPrice && (
				<div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-800">
					<div className="text-center">
						<p className="text-gray-400 text-sm">24h High</p>
						<p className="text-green-400 font-semibold">
							$
							{currentPrice.high24h?.toLocaleString(undefined, {
								minimumFractionDigits: 2,
								maximumFractionDigits: 2,
							})}
						</p>
					</div>
					<div className="text-center">
						<p className="text-gray-400 text-sm">24h Low</p>
						<p className="text-red-400 font-semibold">
							$
							{currentPrice.low24h?.toLocaleString(undefined, {
								minimumFractionDigits: 2,
								maximumFractionDigits: 2,
							})}
						</p>
					</div>
					<div className="text-center">
						<p className="text-gray-400 text-sm">24h Volume</p>
						<p className="text-blue-400 font-semibold">
							{currentPrice.volume24h?.toLocaleString(undefined, {
								minimumFractionDigits: 0,
								maximumFractionDigits: 0,
							})}{" "}
							BTC
						</p>
					</div>
				</div>
			)}
		</div>
	)
}
