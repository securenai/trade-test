"use client"

import { useEffect, useRef } from "react"
import {
	createChart,
	IChartApi,
	ISeriesApi,
	CandlestickSeries,
} from "lightweight-charts"

interface CandlestickData {
	time: number // Unix timestamp in seconds
	open: number
	high: number
	low: number
	close: number
	volume?: number
}

interface TradingChartProps {
	data: CandlestickData[]
	currentPrice?: number // Real-time price to update last candle
	width?: number
	height?: number
}

export default function TradingChart({
	data,
	currentPrice,
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
				background: { type: "solid", color: "#1a1a1a" },
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

			seriesRef.current.setData(data)

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

			// Create updated candle with new close price
			const updatedCandle = {
				...lastCandle,
				close: currentPrice,
				high: Math.max(lastCandle.high, currentPrice),
				low: Math.min(lastCandle.low, currentPrice),
			}

			console.log("Updating last candle with real-time price:", {
				oldClose: lastCandle.close,
				newClose: currentPrice,
				updatedCandle,
			})

			// Update only the last candle
			seriesRef.current.update(updatedCandle)
		}
	}, [currentPrice, data])

	return (
		<div className="w-full">
			{/* Zoom Controls */}
			<div className="flex justify-end mb-2 space-x-2">
				<button
					onClick={() => {
						if (chartRef.current) {
							const priceScale =
								chartRef.current.priceScale("right")
							const visibleRange = priceScale.getVisibleRange()
							if (visibleRange) {
								const center =
									(visibleRange.from + visibleRange.to) / 2
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
							const visibleRange = priceScale.getVisibleRange()
							if (visibleRange) {
								const center =
									(visibleRange.from + visibleRange.to) / 2
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
							chartRef.current.priceScale("right").applyOptions({
								autoScale: true,
							})
						}
					}}
					className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
				>
					Auto Scale
				</button>
			</div>

			<div
				ref={chartContainerRef}
				className="w-full rounded-lg border border-gray-700 bg-gray-900"
				style={{ height: `${height}px` }}
			/>
		</div>
	)
}
