import { useState, useEffect } from "react";

import { createChatRoom } from "../../services/ChatService";
import Contact from "./Contact";
import UserLayout from "../layouts/UserLayout";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function AllUsers({
  users = [],
  chatRooms = [],
  setChatRooms,
  onlineUsersId,
  currentUser,
  changeChat,
}) {
  const [selectedChat, setSelectedChat] = useState(null);

  const safeUsers = Array.isArray(users) ? users : [];
  const safeChatRooms = Array.isArray(chatRooms) ? chatRooms : [];

  const contactIds = safeChatRooms
    .map((chatRoom) =>
      chatRoom?.members?.find((m) => m !== currentUser?.uid)
    )
    .filter(Boolean);

  const nonContacts = safeUsers.filter(
    (u) => u?.uid && u.uid !== currentUser?.uid && !contactIds.includes(u.uid)
  );

  const changeCurrentChat = (index, chat) => {
    setSelectedChat(index);
    changeChat(chat);
  };

  const handleNewChatRoom = async (user) => {
    if (!user?.uid || !currentUser?.uid) return;

    try {
      const members = {
        senderId: currentUser.uid,
        receiverId: user.uid,
      };

      const res = await createChatRoom(members);

      setChatRooms((prev = []) => [...prev, res]);
      changeChat(res);
    } catch (err) {
      console.error("Create chat failed:", err);
    }
  };
  return (
    <>
      <ul className="overflow-auto h-[30rem]">
        <h2 className="my-2 mb-2 ml-2 text-gray-900 dark:text-white">Chats</h2>
        <li>
          {safeChatRooms.length > 0 ? (
            safeChatRooms.map((chatRoom, index) => (
              <div
                key={chatRoom?._id || index}
                className={classNames(
                  index === selectedChat
                    ? "bg-gray-100 dark:bg-gray-700"
                    : "transition duration-150 ease-in-out cursor-pointer bg-white border-b border-gray-200 hover:bg-gray-100 dark:bg-gray-900 dark:border-gray-700 dark:hover:bg-gray-700",
                  "flex items-center px-3 py-2 text-sm "
                )}
                onClick={() => changeCurrentChat(index, chatRoom)}
              >
                <Contact
                  chatRoom={chatRoom}
                  onlineUsersId={onlineUsersId}
                  currentUser={currentUser}
                />
              </div>
            ))
          ) : (
            <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
              No chats yet
            </div>
          )}
        </li>
        
        <h2 className="my-2 mb-2 ml-2 text-gray-900 dark:text-white">
          Other Users
        </h2>
        <li>
          {nonContacts.length > 0 ? (
            nonContacts.map((nonContact, index) => (
              <div
                key={nonContact?.uid || index}
                className="flex items-center px-3 py-2 text-sm bg-white border-b border-gray-200 hover:bg-gray-100 dark:bg-gray-900 dark:border-gray-700 dark:hover:bg-gray-700 cursor-pointer"
                onClick={() => handleNewChatRoom(nonContact)}
              >
                <UserLayout user={nonContact} onlineUsersId={onlineUsersId} />
              </div>
            ))
          ) : (
            <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
              {safeUsers.length === 0 ? "Loading users..." : "No other users available"}
            </div>
          )}
        </li>
      </ul>
    </>
  );
}