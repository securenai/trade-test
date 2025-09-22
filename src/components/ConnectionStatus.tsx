"use client"

interface ConnectionStatusProps {
	isConnected: boolean
	status: string
}

export default function ConnectionStatus({
	isConnected,
	status,
}: ConnectionStatusProps) {
	const getStatusInfo = () => {
		switch (status) {
			case "live":
				return {
					color: "text-green-400",
					dot: "bg-green-500 animate-pulse",
					label: "Live",
				}
			case "simulation":
				return {
					color: "text-yellow-400",
					dot: "bg-yellow-500 animate-pulse",
					label: "Demo",
				}
			case "connecting":
				return {
					color: "text-blue-400",
					dot: "bg-blue-500 animate-ping",
					label: "Connecting",
				}
			case "error":
				return {
					color: "text-red-400",
					dot: "bg-red-500",
					label: "Error",
				}
			default:
				return {
					color: "text-gray-400",
					dot: "bg-gray-500",
					label: "Disconnected",
				}
		}
	}

	const statusInfo = getStatusInfo()

	return (
		<div className="flex items-center space-x-2 text-sm">
			<div className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
			<span className={statusInfo.color}>{statusInfo.label}</span>
			<span className="text-gray-500">•</span>
			<span className="text-gray-400 capitalize">
				{status === "live"
					? "Real-time data"
					: status === "simulation"
					? "Simulated prices"
					: status === "connecting"
					? "Establishing connection"
					: status}
			</span>
		</div>
	)
}
