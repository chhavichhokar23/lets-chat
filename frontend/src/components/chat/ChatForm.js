import { useState, useEffect, useRef, useCallback } from "react";
import { PaperAirplaneIcon } from "@heroicons/react/solid";
import { EmojiHappyIcon } from "@heroicons/react/outline";
import Picker from "emoji-picker-react";

export default function ChatForm({ handleFormSubmit, disabled = false }) {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  // Auto-scroll when emoji picker toggles
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [showEmojiPicker]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEmojiPicker && !event.target.closest(".emoji-picker-container")) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  const handleEmojiClick = useCallback((event, emojiObject) => {
    setMessage((prev) => prev + emojiObject.emoji);
    inputRef.current?.focus();
  }, []);

  const toggleEmojiPicker = useCallback((e) => {
    e.preventDefault();
    setShowEmojiPicker((prev) => !prev);
  }, []);

  const onSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!message.trim() || disabled) return;

    try {
      await handleFormSubmit(message.trim());
      setMessage("");
      setShowEmojiPicker(false);
      inputRef.current?.focus();
    } catch (error) {
      console.error("Failed to send message:", error);
      // You can add user-facing error notification here
    }
  }, [message, handleFormSubmit, disabled]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    // Submit on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
    // Close emoji picker on Escape
    if (e.key === "Escape" && showEmojiPicker) {
      setShowEmojiPicker(false);
    }
  }, [onSubmit, showEmojiPicker]);

  return (
    <div ref={scrollRef}>
      {showEmojiPicker && (
        <div className="emoji-picker-container">
          <Picker 
            className="dark:bg-gray-900" 
            onEmojiClick={handleEmojiClick}
            pickerStyle={{ width: "100%" }}
          />
        </div>
      )}
      
      <form onSubmit={onSubmit}>
        <div className="flex items-center justify-between w-full p-3 bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700">
          <button
            type="button"
            onClick={toggleEmojiPicker}
            disabled={disabled}
            aria-label={showEmojiPicker ? "Close emoji picker" : "Open emoji picker"}
            className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded disabled:opacity-50"
          >
            <EmojiHappyIcon
              className="h-7 w-7 text-blue-600 dark:text-blue-500"
              aria-hidden="true"
            />
          </button>

          <input
            ref={inputRef}
            type="text"
            placeholder="Write a message (Enter to send)"
            className="block w-full py-2 pl-4 mx-3 outline-none bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            aria-label="Message input"
            autoComplete="off"
          />
          
          <button 
            type="submit"
            disabled={!message.trim() || disabled}
            aria-label="Send message"
            className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded disabled:opacity-50"
          >
            <PaperAirplaneIcon
              className="h-6 w-6 text-blue-600 dark:text-blue-500 rotate-[90deg]"
              aria-hidden="true"
            />
          </button>
        </div>
      </form>
    </div>
  );
}