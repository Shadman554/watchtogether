import { FolderSync, Wifi, WifiOff } from "lucide-react";

interface SyncStatusProps {
  syncStatus: {
    isSync: boolean;
    latency: number;
    remoteTime: number;
    remoteIsPlaying: boolean;
  };
}

export default function SyncStatus({ syncStatus }: SyncStatusProps) {
  const { isSync, latency } = syncStatus;

  const getStatusColor = () => {
    if (!isSync) return "text-red-500";
    if (latency > 100) return "text-warning-orange";
    return "text-sync-green";
  };

  const getStatusText = () => {
    if (!isSync) return "Disconnected";
    if (latency > 100) return "High Latency";
    return "Synced";
  };

  const getStatusIcon = () => {
    if (!isSync) return <WifiOff className="w-4 h-4" />;
    return <FolderSync className={`w-4 h-4 ${latency > 50 ? 'animate-spin' : ''}`} />;
  };

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2 bg-cinema-dark/80 backdrop-blur-sm rounded-full px-4 py-2">
        <span className={getStatusColor()}>
          {getStatusIcon()}
        </span>
        <span className="text-sm font-medium text-white">
          {getStatusText()}
        </span>
        <span className="text-xs text-gray-400">
          ±{latency}ms
        </span>
      </div>
    </div>
  );
}
