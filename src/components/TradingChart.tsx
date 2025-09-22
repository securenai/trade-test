"use client"

import { useEffect, useRef } from "react"
import {
	createChart,
	IChartApi,
	ISeriesApi,
	CandlestickSeries,
} from "lightweight-charts"

interface CandlestickData {
	time: number
	open: number
	high: number
	low: number
	close: number
	volume?: number
}

interface TradingChartProps {
	data: CandlestickData[]
	currentPrice?: number // Real-time price to update last candle
	candleInterval?: number // Minutes between new candles (1, 5, 15, 60, etc.)
	width?: number
	height?: number
}

export default function TradingChart({
	data,
	currentPrice,
	candleInterval = 60, // Default: 60 minutes (1 hour candles)
	width = 800,
	height = 400,
}: TradingChartProps) {
	const chartContainerRef = useRef<HTMLDivElement>(null)
	const chartRef = useRef<IChartApi | null>(null)
	const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)

	// Initialize chart
	useEffect(() => {
		if (!chartContainerRef.current) return

		// Create the chart with zoom enabled
		const chart = createChart(chartContainerRef.current, {
			width,
			height,
			layout: {
				background: { color: "#1a1a1a" },
				textColor: "#d1d4dc",
			},
			grid: {
				vertLines: { color: "#2B2B43" },
				horzLines: { color: "#2B2B43" },
			},
			crosshair: {
				mode: 1,
			},
			rightPriceScale: {
				borderColor: "#485c7b",
				scaleMargins: {
					top: 0.1,
					bottom: 0.1,
				},
			},
			timeScale: {
				borderColor: "#485c7b",
				timeVisible: true,
				secondsVisible: false,
			},
			handleScroll: {
				mouseWheel: true,
				pressedMouseMove: true,
				horzTouchDrag: true,
				vertTouchDrag: true,
			},
			handleScale: {
				axisPressedMouseMove: true,
				mouseWheel: true,
				pinch: true,
			},
		})

		chartRef.current = chart

		// Add candlestick series
		const candlestickSeries = chart.addSeries(CandlestickSeries, {
			upColor: "#26a69a",
			downColor: "#ef5350",
			borderVisible: false,
			wickUpColor: "#26a69a",
			wickDownColor: "#ef5350",
		})

		seriesRef.current = candlestickSeries

		// Handle resize
		const handleResize = () => {
			if (chartContainerRef.current && chartRef.current) {
				chartRef.current.applyOptions({
					width: chartContainerRef.current.clientWidth,
				})
			}
		}

		window.addEventListener("resize", handleResize)

		// Cleanup
		return () => {
			window.removeEventListener("resize", handleResize)
			if (chartRef.current) {
				chartRef.current.remove()
				chartRef.current = null
				seriesRef.current = null
			}
		}
	}, [width, height])

	// Update data when it changes
	useEffect(() => {
		if (seriesRef.current && data.length > 0) {
			console.log("Setting chart data:", data.slice(0, 3)) // Log first 3 items for debugging
			console.log("Total data points:", data.length)
			console.log("Price range:", {
				minPrice: Math.min(...data.map((d) => d.low)),
				maxPrice: Math.max(...data.map((d) => d.high)),
			})

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			seriesRef.current.setData(data as any)

			// Fit content to show all data properly
			if (chartRef.current) {
				chartRef.current.timeScale().fitContent()
			}
		}
	}, [data])

	// Update last candle in real-time when current price changes
	useEffect(() => {
		if (seriesRef.current && currentPrice && data.length > 0) {
			const lastCandle = data[data.length - 1]
			const now = Date.now()
			const currentCandleTime = lastCandle.time * 1000 // Convert to milliseconds
			const intervalMs = candleInterval * 60 * 1000 // Convert minutes to milliseconds

			// Check if we should create a new candle
			const shouldCreateNewCandle = now - currentCandleTime >= intervalMs

			if (shouldCreateNewCandle) {
				// Create new candle starting at the next interval
				const nextCandleTime = Math.floor(now / intervalMs) * intervalMs
				const newCandle = {
					time: Math.floor(nextCandleTime / 1000), // Convert back to seconds
					open: currentPrice,
					high: currentPrice,
					low: currentPrice,
					close: currentPrice,
					volume: Math.floor(Math.random() * 1000) + 100,
				}

				console.log("Creating new candle:", {
					interval: `${candleInterval} minutes`,
					newCandleTime: new Date(
						nextCandleTime
					).toLocaleTimeString(),
					newCandle,
				})

				// Add new candle to the chart
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				seriesRef.current.update(newCandle as any)
			} else {
				// Update existing last candle
				const updatedCandle = {
					...lastCandle,
					close: currentPrice,
					high: Math.max(lastCandle.high, currentPrice),
					low: Math.min(lastCandle.low, currentPrice),
				}

				console.log("Updating last candle with real-time price:", {
					oldClose: lastCandle.close,
					newClose: currentPrice,
					timeUntilNewCandle:
						Math.round(
							(intervalMs - (now - currentCandleTime)) / 1000
						) + "s",
				})

				// Update only the last candle
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				seriesRef.current.update(updatedCandle as any)
			}
		}
	}, [currentPrice, data, candleInterval])

	return (
		<div className="w-full">
			{/* Chart Controls */}
			<div className="flex justify-between items-center mb-2">
				<div className="text-sm text-gray-400">
					📊 {candleInterval}min candles
				</div>
				<div className="flex space-x-2">
					<button
						onClick={() => {
							if (chartRef.current) {
								const priceScale =
									chartRef.current.priceScale("right")
								const visibleRange =
									priceScale.getVisibleRange()
								if (visibleRange) {
									const center =
										(visibleRange.from + visibleRange.to) /
										2
									const range =
										visibleRange.to - visibleRange.from
									const newRange = range * 0.7 // Zoom in by 30%
									priceScale.setVisibleRange({
										from: center - newRange / 2,
										to: center + newRange / 2,
									})
								}
							}
						}}
						className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
					>
						Zoom In
					</button>
					<button
						onClick={() => {
							if (chartRef.current) {
								const priceScale =
									chartRef.current.priceScale("right")
								const visibleRange =
									priceScale.getVisibleRange()
								if (visibleRange) {
									const center =
										(visibleRange.from + visibleRange.to) /
										2
									const range =
										visibleRange.to - visibleRange.from
									const newRange = range * 1.4 // Zoom out by 40%
									priceScale.setVisibleRange({
										from: center - newRange / 2,
										to: center + newRange / 2,
									})
								}
							}
						}}
						className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
					>
						Zoom Out
					</button>
					<button
						onClick={() => {
							if (chartRef.current) {
								chartRef.current
									.priceScale("right")
									.applyOptions({
										autoScale: true,
									})
							}
						}}
						className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
					>
						Auto Scale
					</button>
				</div>
			</div>

			<div
				ref={chartContainerRef}
				className="w-full rounded-lg border border-gray-700 bg-gray-900"
				style={{ height: `${height}px` }}
			/>
		</div>
	)
}
