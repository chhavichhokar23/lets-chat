import { useEffect, useRef, useState, useCallback } from "react";

import {
  getAllUsers,
  getChatRooms,
  initiateSocketConnection,
} from "../../services/ChatService";
import { useAuth } from "../../contexts/AuthContext";

import ChatRoom from "../chat/ChatRoom";
import Welcome from "../chat/Welcome";
import AllUsers from "../chat/AllUsers";
import SearchUsers from "../chat/SearchUsers";

export default function ChatLayout() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [chatRooms, setChatRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [onlineUsersId, setOnlineUsersId] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const socket = useRef(null);
  const { currentUser } = useAuth();

  // Initialize socket connection
  useEffect(() => {
    if (!currentUser?.uid) return;

    const initSocket = async () => {
      try {
        const socketInstance = await initiateSocketConnection();
        socket.current = socketInstance;
        
        socket.current.emit("addUser", currentUser.uid);
        
        socket.current.on("getUsers", (users) => {
          const userIds = users.map((u) => u[0]);
          setOnlineUsersId(userIds);
        });
      } catch (err) {
        console.error("Failed to initialize socket:", err);
        setError("Failed to connect to chat server");
      }
    };

    initSocket();

    // Cleanup socket on unmount
    return () => {
      if (socket.current) {
        socket.current.off("getUsers");
        socket.current.disconnect();
      }
    };
  }, [currentUser?.uid]);

  // Fetch chat rooms
  useEffect(() => {
    if (!currentUser?.uid) return;

    const fetchChatRooms = async () => {
      try {
        const res = await getChatRooms(currentUser.uid);
        setChatRooms(res || []);
      } catch (err) {
        console.error("Failed to fetch chat rooms:", err);
        setChatRooms([]);
      }
    };

    fetchChatRooms();
  }, [currentUser?.uid]);

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const res = await getAllUsers();
        setUsers(res || []);
      } catch (err) {
        console.error("Failed to fetch users:", err);
        setError("Failed to load users");
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Initialize filtered lists
  useEffect(() => {
    setFilteredUsers(users);
    setFilteredRooms(chatRooms);
  }, [users, chatRooms]);

  const handleChatChange = useCallback((chat) => {
    setCurrentChat(chat);
  }, []);

  const handleSearch = useCallback((newSearchQuery) => {
    setSearchQuery(newSearchQuery);

    // Handle empty search
    if (!newSearchQuery.trim()) {
      setFilteredUsers(users);
      setFilteredRooms(chatRooms);
      return;
    }

    // Defensive check for users array
    if (!users || !Array.isArray(users)) {
      setFilteredUsers([]);
      setFilteredRooms([]);
      return;
    }

    const searchTerm = newSearchQuery.toLowerCase();

    // Filter users by display name
    const searchedUsers = users.filter((user) => {
      return user?.displayName?.toLowerCase().includes(searchTerm);
    });

    const searchedUsersId = searchedUsers.map((u) => u.uid);

    // Defensive check for chatRooms array
    if (!chatRooms || !Array.isArray(chatRooms) || chatRooms.length === 0) {
      setFilteredUsers(searchedUsers);
      setFilteredRooms([]);
      return;
    }

    // Check if searched users are in existing chat rooms
    const matchingRooms = chatRooms.filter((chatRoom) => {
      if (!chatRoom?.members || !Array.isArray(chatRoom.members)) {
        return false;
      }

      return chatRoom.members.some(
        (memberId) => 
          memberId !== currentUser.uid && 
          searchedUsersId.includes(memberId)
      );
    });

    // Users that are already contacts (in chat rooms)
    const contactUserIds = matchingRooms.flatMap(room => 
      room.members.filter(id => id !== currentUser.uid)
    );

    // Users that are NOT contacts yet
    const nonContactUsers = searchedUsers.filter(
      user => !contactUserIds.includes(user.uid)
    );

    setFilteredRooms(matchingRooms);
    setFilteredUsers(nonContactUsers);
  }, [users, chatRooms, currentUser?.uid]);

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="min-w-full bg-white border-x border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700 rounded lg:grid lg:grid-cols-3">
        <div className="bg-white border-r border-gray-200 dark:bg-gray-900 dark:border-gray-700 lg:col-span-1">
          <SearchUsers handleSearch={handleSearch} />

          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-gray-500 dark:text-gray-400">
                Loading...
              </div>
            </div>
          ) : (
            <AllUsers
              users={searchQuery !== "" ? filteredUsers : users}
              chatRooms={searchQuery !== "" ? filteredRooms : chatRooms}
              setChatRooms={setChatRooms}
              onlineUsersId={onlineUsersId}
              currentUser={currentUser}
              changeChat={handleChatChange}
            />
          )}
        </div>

        {currentChat ? (
          <ChatRoom
            currentChat={currentChat}
            currentUser={currentUser}
            socket={socket}
          />
        ) : (
          <Welcome />
        )}
      </div>
    </div>
  );
}