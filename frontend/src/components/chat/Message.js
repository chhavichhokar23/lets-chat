import { format } from "timeago.js";
import { 
  CheckIcon, 
  ClockIcon, 
  ExclamationCircleIcon,
  RefreshIcon 
} from "@heroicons/react/outline";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Message({ message, self, onRetry }) {
  const isSelf = self === message.sender || self === message.senderId;
  const status = message.status || "sent";
  
  // Status icon component
  const StatusIcon = () => {
    if (!isSelf) return null;

    switch (status) {
      case "sending":
        return (
          <ClockIcon 
            className="w-3 h-3 text-gray-400 animate-pulse" 
            aria-label="Sending"
          />
        );
      case "sent":
        return (
          <CheckIcon 
            className="w-3 h-3 text-gray-400" 
            aria-label="Sent"
          />
        );
      case "failed":
        return (
          <ExclamationCircleIcon 
            className="w-3 h-3 text-red-500" 
            aria-label="Failed to send"
          />
        );
      default:
        return null;
    }
  };

  return (
    <li
      className={classNames(
        isSelf ? "justify-end" : "justify-start",
        "flex"
      )}
    >
      <div className={classNames(
        isSelf ? "items-end" : "items-start",
        "flex flex-col max-w-xl"
      )}>
        {/* Message Bubble */}
        <div
          className={classNames(
            isSelf
              ? "bg-blue-600 dark:bg-blue-500 text-white"
              : "text-gray-700 dark:text-gray-400 bg-white border border-gray-200 shadow-md dark:bg-gray-900 dark:border-gray-700",
            status === "failed" ? "opacity-60" : "",
            "relative px-4 py-2 rounded-lg shadow break-words"
          )}
        >
          <span className="block font-normal whitespace-pre-wrap">
            {message.message}
          </span>
        </div>

        {/* Timestamp and Status */}
        <div className={classNames(
          isSelf ? "flex-row-reverse" : "flex-row",
          "flex items-center gap-1 mt-1 px-1"
        )}>
          <span className="text-xs text-gray-500 dark:text-gray-500">
            {message.createdAt 
              ? format(message.createdAt) 
              : message.timestamp 
              ? format(message.timestamp)
              : "Just now"
            }
          </span>
          
          <StatusIcon />
          
          {/* Retry Button for Failed Messages */}
          {status === "failed" && onRetry && (
            <button
              onClick={onRetry}
              className="ml-2 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-1"
              aria-label="Retry sending message"
            >
              <RefreshIcon className="w-3 h-3" />
              Retry
            </button>
          )}
        </div>
      </div>
    </li>
  );
}