import { useState, useEffect, useRef, useCallback } from "react";
import { getMessagesOfChatRoom, sendMessage } from "../../services/ChatService";
import Message from "./Message";
import Contact from "./Contact";
import ChatForm from "./ChatForm";

export default function ChatRoom({ currentChat, currentUser, socket }) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const scrollRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentChat?._id) return;

      try {
        setIsLoading(true);
        setError(null);
        const res = await getMessagesOfChatRoom(currentChat._id);
        setMessages(res || []);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
        setError("Failed to load messages. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [currentChat?._id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Setup socket listener for incoming messages
  useEffect(() => {
    if (!socket?.current) return;

    const handleIncomingMessage = (data) => {
      if (data.senderId === currentUser.uid) return;

      // Only add message if it's from the current chat
      const isFromCurrentChat = currentChat?.members?.includes(data.senderId);
      
      if (isFromCurrentChat) {
        setMessages((prev) => [
          ...prev,
          {
            senderId: data.senderId,
            message: data.message,
            timestamp: data.timestamp || Date.now(),
          },
        ]);
      }
    };

    socket.current.on("getMessage", handleIncomingMessage);

    // Cleanup listener on unmount or socket change
    return () => {
      socket.current?.off("getMessage", handleIncomingMessage);
    };
  }, [socket, currentChat?.members]);

  // Handle message submission with optimistic updates
  const handleFormSubmit = useCallback(
    async (messageText) => {
      if (!messageText.trim() || isSending || !currentChat?._id) return;

      const receiverId = currentChat.members.find(
        (member) => member !== currentUser.uid
      );

      if (!receiverId) {
        console.error("Receiver not found");
        return;
      }

      // Create optimistic message
      const optimisticMessage = {
        _id: `temp-${Date.now()}`,
        senderId: currentUser.uid,
        message: messageText,
        timestamp: Date.now(),
        status: "sending",
      };

      // Optimistically add message to UI
      setMessages((prev) => [...prev, optimisticMessage]);
      setIsSending(true);

      try {
        // Emit socket event
        socket.current?.emit("sendMessage", {
          senderId: currentUser.uid,
          receiverId: receiverId,
          message: messageText,
          timestamp: optimisticMessage.timestamp,
        });

        // Send to API
        const messageBody = {
          chatRoomId: currentChat._id,
          sender: currentUser.uid,
          message: messageText,
        };

        const res = await sendMessage(messageBody);

        // Replace optimistic message with real one from server
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === optimisticMessage._id
              ? { ...res, status: "sent" }
              : msg
          )
        );
      } catch (error) {
        console.error("Failed to send message:", error);
        
        // Mark message as failed
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === optimisticMessage._id
              ? { ...msg, status: "failed" }
              : msg
          )
        );

        // Optionally show error to user
        setError("Failed to send message. Please try again.");
        
        // Clear error after 3 seconds
        setTimeout(() => setError(null), 3000);
      } finally {
        setIsSending(false);
      }
    },
    [currentChat, currentUser, socket, isSending]
  );

  // Retry failed message
  const retryMessage = useCallback((failedMessage) => {
    // Remove failed message and resend
    setMessages((prev) => prev.filter((msg) => msg._id !== failedMessage._id));
    handleFormSubmit(failedMessage.message);
  }, [handleFormSubmit]);

  if (!currentChat) {
    return (
      <div className="lg:col-span-2 flex items-center justify-center h-full bg-white dark:bg-gray-900">
        <p className="text-gray-500 dark:text-gray-400">
          Select a chat to start messaging
        </p>
      </div>
    );
  }

  return (
    <div className="lg:col-span-2 lg:block">
      <div className="w-full">
        {/* Header */}
        <div className="p-3 bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700">
          <Contact chatRoom={currentChat} currentUser={currentUser} />
        </div>

        {/* Messages Area */}
        <div className="relative w-full p-6 overflow-y-auto h-[30rem] bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700">
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg text-sm">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500 dark:text-gray-400">
                Loading messages...
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500 dark:text-gray-400">
                No messages yet. Start the conversation!
              </div>
            </div>
          ) : (
            <ul className="space-y-2">
              {messages.map((message, index) => (
                <div key={message._id || index} ref={scrollRef}>
                  <Message
                    message={message}
                    self={currentUser.uid}
                    onRetry={
                      message.status === "failed"
                        ? () => retryMessage(message)
                        : undefined
                    }
                  />
                </div>
              ))}
              <div ref={messagesEndRef} />
            </ul>
          )}
        </div>

        {/* Input Form */}
        <ChatForm 
          handleFormSubmit={handleFormSubmit} 
          disabled={isSending || isLoading}
        />
      </div>
    </div>
  );
}