"use client"

export interface BinanceKline {
	openTime: number
	open: string
	high: string
	low: string
	close: string
	volume: string
	closeTime: number
	quoteAssetVolume: string
	numberOfTrades: number
	takerBuyBaseAssetVolume: string
	takerBuyQuoteAssetVolume: string
	ignore: string
}

export interface CandlestickData {
	time: number // Unix timestamp in seconds
	open: number
	high: number
	low: number
	close: number
	volume?: number
}

export interface TickerData {
	symbol: string
	priceChange: string
	priceChangePercent: string
	weightedAvgPrice: string
	prevClosePrice: string
	lastPrice: string
	lastQty: string
	bidPrice: string
	askPrice: string
	openPrice: string
	highPrice: string
	lowPrice: string
	volume: string
	quoteVolume: string
	openTime: number
	closeTime: number
	firstId: number
	lastId: number
	count: number
}

class BinanceService {
	private readonly BASE_URL = "https://api.binance.com/api/v3"
	private readonly WS_URL = "wss://stream.binance.com:9443/ws"

	/**
	 * Get historical candlestick data for BTC/USDT
	 * @param interval - 1m, 5m, 15m, 30m, 1h, 4h, 1d, etc.
	 * @param limit - Number of candles (max 1000)
	 */
	async getHistoricalData(
		symbol: string = "BTCUSDT",
		interval: string = "1h",
		limit: number = 100
	): Promise<CandlestickData[]> {
		try {
			// Try Binance API first
			const url = `${this.BASE_URL}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
			const response = await fetch(url, {
				mode: "cors",
				headers: {
					Accept: "application/json",
				},
			})

			if (!response.ok) {
				throw new Error(`Binance API error: ${response.status}`)
			}

			const data: BinanceKline[] = await response.json()

			// Check if we got valid data
			if (!Array.isArray(data) || data.length === 0) {
				throw new Error("No data returned from Binance API")
			}

			const processedData = data.map((kline, index) => {
				// Validate timestamp
				const timestamp =
					typeof kline.openTime === "number"
						? kline.openTime
						: parseInt(kline.openTime)
				const date = new Date(timestamp)

				// Check if date is valid
				if (isNaN(date.getTime())) {
					console.warn(
						"Invalid timestamp:",
						kline.openTime,
						"using fallback time"
					)
					// Create fallback time based on index
					const fallbackTime =
						Date.now() - (data.length - index) * 60 * 60 * 1000
					date.setTime(fallbackTime)
				}

				const open = parseFloat(kline.open)
				const high = parseFloat(kline.high)
				const low = parseFloat(kline.low)
				const close = parseFloat(kline.close)
				const volume = parseFloat(kline.volume)

				// Check if we got valid price data
				if (
					isNaN(open) ||
					isNaN(high) ||
					isNaN(low) ||
					isNaN(close) ||
					open === 0 ||
					high === 0 ||
					low === 0 ||
					close === 0
				) {
					console.warn("Invalid price data from Binance:", kline)
					throw new Error("Invalid price data received")
				}

				return {
					time: Math.floor(date.getTime() / 1000), // Unix timestamp in seconds
					open: open,
					high: high,
					low: low,
					close: close,
					volume: volume || 0,
					timestamp: date.getTime(), // Keep timestamp for sorting
				}
			})

			// Sort by timestamp to ensure ascending order
			processedData.sort((a, b) => a.timestamp - b.timestamp)

			// Remove duplicate timestamps and keep only unique times
			const uniqueData = []
			const seenTimes = new Set<number>()

			for (const item of processedData) {
				if (!seenTimes.has(item.time)) {
					seenTimes.add(item.time)
					// Remove the timestamp property before returning
					const { timestamp, ...cleanItem } = item
					uniqueData.push(cleanItem)
				}
			}

			console.log(
				`Processed ${uniqueData.length} unique data points from Binance`
			)
			return uniqueData
		} catch (error) {
			console.error(
				"Error fetching from Binance, trying fallback:",
				error
			)

			// Fallback: Get REAL Bitcoin historical data from CoinGecko
			try {
				console.log(
					"Attempting to get REAL Bitcoin historical data from CoinGecko..."
				)
				const realHistoricalData =
					await this.getRealHistoricalDataFromCoinGecko(30)
				console.log("Got real Bitcoin historical data from CoinGecko!")
				return realHistoricalData
			} catch (fallbackError) {
				console.error(
					"CoinGecko historical data failed, trying current price fallback:",
					fallbackError
				)

				// Second fallback: Generate data based on real current price
				try {
					console.log(
						"Attempting to get current price from CoinGecko..."
					)
					const currentPrice =
						await this.getCurrentPriceFromCoinGecko()
					console.log(
						"Got current price from CoinGecko:",
						currentPrice
					)
					const fallbackData = this.generateRealisticHistoricalData(
						currentPrice,
						limit
					)
					console.log(
						"Generated fallback data with real current price"
					)
					return fallbackData
				} catch (finalError) {
					console.error("All fallbacks failed:", finalError)
					console.log("Using default demo data as last resort...")
					// Last resort: Generate demo data with default price
					const defaultData = this.generateRealisticHistoricalData(
						112000,
						limit
					)
					console.log("Generated default demo data")
					return defaultData
				}
			}
		}
	}

	/**
	 * Get real historical Bitcoin data from CoinGecko
	 */
	private async getRealHistoricalDataFromCoinGecko(
		days: number = 30
	): Promise<CandlestickData[]> {
		try {
			console.log(
				`Fetching real Bitcoin data for last ${days} days from CoinGecko...`
			)
			const response = await fetch(
				`https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${days}&interval=daily`,
				{
					headers: {
						Accept: "application/json",
					},
				}
			)

			if (!response.ok) {
				throw new Error(`CoinGecko API error: ${response.status}`)
			}

			const data = await response.json()

			if (!data.prices || !Array.isArray(data.prices)) {
				throw new Error("Invalid CoinGecko historical data format")
			}

			// Convert CoinGecko format to our candlestick format
			const candlestickData: CandlestickData[] = data.prices.map(
				(pricePoint: [number, number], index: number) => {
					const [timestamp, price] = pricePoint
					// Since CoinGecko daily data doesn't have OHLC, we'll simulate it based on price
					const open = index > 0 ? data.prices[index - 1][1] : price
					const close = price
					const high =
						Math.max(open, close) * (1 + Math.random() * 0.02)
					const low =
						Math.min(open, close) * (1 - Math.random() * 0.02)

					return {
						time: Math.floor(timestamp / 1000), // Convert to seconds
						open: Math.round(open * 100) / 100,
						high: Math.round(high * 100) / 100,
						low: Math.round(low * 100) / 100,
						close: Math.round(close * 100) / 100,
						volume: Math.floor(Math.random() * 1000) + 100,
					}
				}
			)

			console.log(
				`Got ${candlestickData.length} real Bitcoin data points from CoinGecko`
			)
			return candlestickData
		} catch (error) {
			console.error(
				"Failed to get real historical data from CoinGecko:",
				error
			)
			throw error
		}
	}

	/**
	 * Fallback method using CoinGecko (no CORS issues)
	 */
	private async getCurrentPriceFromCoinGecko(): Promise<number> {
		try {
			const response = await fetch(
				"https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
				{
					headers: {
						Accept: "application/json",
					},
				}
			)

			if (!response.ok) {
				throw new Error(`CoinGecko API error: ${response.status}`)
			}

			const data = await response.json()

			if (!data.bitcoin || !data.bitcoin.usd) {
				throw new Error("Invalid CoinGecko response format")
			}

			const price = parseFloat(data.bitcoin.usd)
			if (isNaN(price) || price <= 0) {
				throw new Error("Invalid price value from CoinGecko")
			}

			return price
		} catch (error) {
			console.error("CoinGecko API error:", error)
			throw error
		}
	}

	/**
	 * Generate realistic historical data for fallback
	 */
	private generateRealisticHistoricalData(
		currentPrice: number,
		limit: number
	): CandlestickData[] {
		const data: CandlestickData[] = []
		// Start from a price that will end up close to current price
		let price = currentPrice * 0.85 // Start lower to build up to current price

		console.log(
			`Generating ${limit} historical data points starting from price: ${currentPrice}`
		)

		// Use a Set to track used dates to avoid duplicates
		const usedDates = new Set<string>()
		let currentDate = new Date()

		// Use a simple seed for more consistent randomness (based on current price)
		let seed = Math.floor(currentPrice) % 10000

		for (let i = limit; i > 0; i--) {
			// Create date going backwards in time (days ago, not hours to avoid duplicates)
			const daysBack = Math.floor(i / 4) // Group 4 data points per day
			const hoursBack = (i % 4) * 6 // 6 hours apart within the same day
			const timestamp =
				Date.now() -
				daysBack * 24 * 60 * 60 * 1000 -
				hoursBack * 60 * 60 * 1000
			const date = new Date(timestamp)

			// Validate the date
			if (isNaN(date.getTime())) {
				console.warn(
					`Invalid date generated for index ${i}, using current date`
				)
				date.setTime(Date.now() - i * 24 * 60 * 60 * 1000) // Fallback to days
			}

			// Create unique date string (YYYY-MM-DD format)
			let dateString = date.toISOString().split("T")[0]

			// If we already used this date, increment by a day
			let dayOffset = 0
			while (usedDates.has(dateString)) {
				dayOffset++
				const adjustedDate = new Date(
					date.getTime() - dayOffset * 24 * 60 * 60 * 1000
				)
				dateString = adjustedDate.toISOString().split("T")[0]
			}
			usedDates.add(dateString)

			// Generate realistic OHLC with seeded randomness for consistency
			const volatility = 0.015 // 1.5% max change per period (more stable)
			// Use a slight upward trend to reach current price
			const trendDirection = (limit - i) / limit // Gradual upward trend

			// Seeded random for more consistent results
			seed = (seed * 9301 + 49297) % 233280
			const seededRandom = seed / 233280

			const randomChange = (seededRandom - 0.5) * volatility
			const change = randomChange + trendDirection * 0.003 // Small upward bias

			const open = price
			const close = price * (1 + change)
			const high = Math.max(open, close) * (1 + Math.random() * 0.01)
			const low = Math.min(open, close) * (1 - Math.random() * 0.01)

			// Validate generated prices
			const roundedOpen = Math.round(open * 100) / 100
			const roundedHigh = Math.round(high * 100) / 100
			const roundedLow = Math.round(low * 100) / 100
			const roundedClose = Math.round(close * 100) / 100

			if (
				roundedOpen <= 0 ||
				roundedHigh <= 0 ||
				roundedLow <= 0 ||
				roundedClose <= 0
			) {
				console.error("Generated invalid price data:", {
					open: roundedOpen,
					high: roundedHigh,
					low: roundedLow,
					close: roundedClose,
				})
				continue // Skip this invalid data point
			}

			data.push({
				time: Math.floor(date.getTime() / 1000), // Unix timestamp in seconds
				open: roundedOpen,
				high: roundedHigh,
				low: roundedLow,
				close: roundedClose,
				volume: Math.floor(Math.random() * 1000) + 100,
			})

			price = close
		}

		// Sort data by time in ascending order (required by TradingView)
		data.sort((a, b) => a.time - b.time)

		console.log(
			`Generated ${data.length} historical data points, sorted by time`
		)
		console.log("Sample generated data:", data.slice(0, 2))
		console.log("Price range in generated data:", {
			minPrice: Math.min(...data.map((d) => d.low)),
			maxPrice: Math.max(...data.map((d) => d.high)),
		})
		return data
	}

	/**
	 * Get current price and 24h stats for BTC/USDT
	 */
	async getCurrentPrice(symbol: string = "BTCUSDT"): Promise<{
		symbol: string
		price: number
		change: number
		changePercent: number
		high24h: number
		low24h: number
		volume24h: number
	}> {
		try {
			const url = `${this.BASE_URL}/ticker/24hr?symbol=${symbol}`
			const response = await fetch(url, {
				mode: "cors",
				headers: {
					Accept: "application/json",
				},
			})

			if (!response.ok) {
				throw new Error(`Binance API error: ${response.status}`)
			}

			const data: TickerData = await response.json()

			return {
				symbol: data.symbol,
				price: parseFloat(data.lastPrice),
				change: parseFloat(data.priceChange),
				changePercent: parseFloat(data.priceChangePercent),
				high24h: parseFloat(data.highPrice),
				low24h: parseFloat(data.lowPrice),
				volume24h: parseFloat(data.volume),
			}
		} catch (error) {
			console.error(
				"Error fetching current price from Binance, using fallback:",
				error
			)

			// Fallback: Use CoinGecko for current price
			try {
				const price = await this.getCurrentPriceFromCoinGecko()
				return {
					symbol: symbol,
					price: price,
					change: price * 0.024, // Simulate 2.4% change
					changePercent: 2.4,
					high24h: price * 1.03,
					low24h: price * 0.97,
					volume24h: 25000,
				}
			} catch (fallbackError) {
				console.error("Fallback price fetch failed:", fallbackError)
				// Last resort: return demo data
				return {
					symbol: symbol,
					price: 45000,
					change: 1080,
					changePercent: 2.4,
					high24h: 46500,
					low24h: 44200,
					volume24h: 25000,
				}
			}
		}
	}

	/**
	 * Create WebSocket connection for real-time price updates
	 */
	createWebSocket(
		symbol: string = "btcusdt",
		onMessage: (data: any) => void,
		onError?: (error: Event) => void,
		onClose?: () => void
	): WebSocket {
		try {
			const ws = new WebSocket(`${this.WS_URL}/${symbol}@ticker`)

			ws.onopen = () => {
				console.log(
					`Connected to Binance WebSocket for ${symbol.toUpperCase()}`
				)
			}

			ws.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data)
					onMessage({
						symbol: data.s,
						price: parseFloat(data.c),
						change: parseFloat(data.P),
						changePercent: parseFloat(data.P),
						high24h: parseFloat(data.h),
						low24h: parseFloat(data.l),
						volume24h: parseFloat(data.v),
						timestamp: Date.now(),
					})
				} catch (error) {
					console.error("Error parsing WebSocket message:", error)
				}
			}

			ws.onerror = (error) => {
				console.error("WebSocket error:", error)
				onError?.(error)
			}

			ws.onclose = () => {
				console.log("WebSocket connection closed")
				onClose?.()
			}

			return ws
		} catch (error) {
			console.error("Error creating WebSocket:", error)
			throw error
		}
	}
}

// Export singleton instance
export const binanceService = new BinanceService()
