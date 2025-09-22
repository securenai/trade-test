import RealTradingDashboard from "@/components/RealTradingDashboard"

export default function Home() {
	return (
		<div className="min-h-screen bg-gray-950 text-white p-4 sm:p-8">
			<div className="max-w-7xl mx-auto">
				<header className="text-center mb-8">
					<h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
						Live Trading Dashboard
					</h1>
					<p className="text-gray-400 text-lg">
						Real-time Bitcoin prices from Binance • Live market data
						updates via WebSocket
					</p>
				</header>

				<main className="space-y-8">
					{/* Real Bitcoin Chart */}
					<RealTradingDashboard symbol="BTCUSDT" />
				</main>

				<footer className="mt-12 text-center text-gray-500">
					<p>
						Live Bitcoin data from Binance • Built with Next.js and
						TradingView Lightweight Charts
					</p>
				</footer>
			</div>
		</div>
	)
}
