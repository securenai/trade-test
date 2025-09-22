"use client"

interface CandlestickData {
	time: string
	open: number
	high: number
	low: number
	close: number
	volume?: number
}

class MockWebSocketServer {
	private clients: Set<(data: any) => void> = new Set()
	private intervalId: number | null = null
	private currentPrice = 56900
	private lastCandle: CandlestickData | null = null
	private candleStartTime = Date.now()
	private readonly CANDLE_INTERVAL = 5000 // 5 seconds per candle for demo

	start() {
		if (this.intervalId) return

		this.intervalId = window.setInterval(() => {
			this.generatePriceUpdate()
		}, 1000) // Send updates every second

		console.log("Mock WebSocket server started")
	}

	stop() {
		if (this.intervalId) {
			window.clearInterval(this.intervalId)
			this.intervalId = null
		}
		console.log("Mock WebSocket server stopped")
	}

	addClient(callback: (data: any) => void) {
		this.clients.add(callback)

		// Send initial connection message
		callback({
			type: "connection",
			status: "connected",
			message: "Connected to trading data feed",
		})

		// Send current price immediately
		this.sendCurrentPrice()
	}

	removeClient(callback: (data: any) => void) {
		this.clients.delete(callback)
	}

	private generatePriceUpdate() {
		// Generate realistic price movement
		const volatility = 0.002 // 0.2% volatility
		const trend = (Math.random() - 0.5) * 2 * volatility
		const noise = (Math.random() - 0.5) * 0.001 // Small random noise

		this.currentPrice = this.currentPrice * (1 + trend + noise)
		this.currentPrice = Math.max(this.currentPrice, 1000) // Prevent negative prices

		const now = Date.now()
		const shouldCreateNewCandle =
			now - this.candleStartTime >= this.CANDLE_INTERVAL

		if (shouldCreateNewCandle || !this.lastCandle) {
			// Create new candle
			this.candleStartTime = now
			this.lastCandle = {
				time: new Date(now).toISOString().split("T")[0], // YYYY-MM-DD format
				open: this.currentPrice,
				high: this.currentPrice,
				low: this.currentPrice,
				close: this.currentPrice,
				volume: Math.floor(Math.random() * 1000000) + 500000,
			}

			this.broadcast({
				type: "newCandle",
				data: this.lastCandle,
			})
		} else if (this.lastCandle) {
			// Update existing candle
			this.lastCandle.high = Math.max(
				this.lastCandle.high,
				this.currentPrice
			)
			this.lastCandle.low = Math.min(
				this.lastCandle.low,
				this.currentPrice
			)
			this.lastCandle.close = this.currentPrice
			this.lastCandle.time = new Date(this.candleStartTime)
				.toISOString()
				.split("T")[0]

			this.broadcast({
				type: "candleUpdate",
				data: this.lastCandle,
			})
		}

		// Also send real-time price updates
		this.sendCurrentPrice()
	}

	private sendCurrentPrice() {
		const priceChange = this.currentPrice - 56900 // Compare to initial price
		const priceChangePercent = (priceChange / 56900) * 100

		this.broadcast({
			type: "priceUpdate",
			data: {
				symbol: "BTCUSD",
				price: Math.round(this.currentPrice * 100) / 100,
				change: Math.round(priceChange * 100) / 100,
				changePercent: Math.round(priceChangePercent * 100) / 100,
				timestamp: Date.now(),
			},
		})
	}

	private broadcast(message: any) {
		this.clients.forEach((client) => {
			try {
				client(message)
			} catch (error) {
				console.error("Error broadcasting to client:", error)
			}
		})
	}
}

// Singleton instance
export const mockWebSocketServer = new MockWebSocketServer()
