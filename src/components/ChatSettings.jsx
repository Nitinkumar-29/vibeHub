import React, { useContext, useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import ChatContext from "../context/ChatContext/ChatContext";
import { doc } from "firebase/firestore";
import { db } from "../firebase";

const Chat_settings = () => {
  const { chatId } = useParams();
  const { allChats } = useContext(ChatContext);
  const currentUser = localStorage.getItem("currentUser");
  const [chatData, setChatData] = useState([]);
  const [otherUserData, setOtherUserData] = useState([]);

  useEffect(() => {
    // Ensure allChats and chatId are available before filtering
    if (allChats.length > 0 && chatId) {
      const chat = allChats.filter((chat) => chat?.id === chatId);
      console.log(chat);
      setChatData(chat);
      console.log(chatData);
    }
    try {
      if (!chatData) return "no data";
      const otherUserId = chatData[0]?.participants?.find(
        (user) => user.id !== currentUser
      );
      setOtherUserData(otherUserId);
      console.log(otherUserData);
    } catch (error) {
      console.error(error);
    }

    // eslint-disable-next-line
  }, [allChats, chatId]); // Add dependencies to re-run when allChats or chatId changes

  return (
    <>
      <div className="flex flex-col space-y-4 w-full h-screen">
        <div>
          <span>{otherUserData?.name}</span>
        </div>
        <div></div>
      </div>
    </>
  );
};

export default Chat_settings;
