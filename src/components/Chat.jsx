import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import React, { useContext, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import ThemeContext from "../context/Theme/ThemeContext";
import ChatContext from "../context/ChatContext/ChatContext";
import { AuthContext } from "../context/AuthContext";
import { formatTime } from "../utils/FormatTime";
import { BiLoader } from "react-icons/bi";
import "../styles/overflow_scroll.css";
import { IoSend } from "react-icons/io5";

const Chat = () => {
  const { userId } = useParams();
  const [chatUserData, setChatUserData] = useState(null);
  const { theme } = useContext(ThemeContext);
  const messageContainerRef = useRef(null);
  const [currentUserData, setCurrentUserData] = useState([]);
  const {
    sendMessage,
    messageText,
    setMessageText,
    handleFetchChatMessages,
    messages,
    messageSent,
  } = useContext(ChatContext);
  const { currentUser } = useContext(AuthContext);

  const handleFetchChatUserData = async () => {
    try {
      const docRef = doc(db, "users", userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = {
          ...docSnap.data(),
          id: userId,
        };
        console.log(userData);
        setChatUserData(userData);
      } else {
        console.log("No such document!");
      }
    } catch (error) {
      console.error(error);
    }
  };
  const handleSendMessage = () => {
    sendMessage(userId);
  };

  const handleFetchUserData = async () => {
    if (currentUser && currentUser.email) {
      const q = query(
        collection(db, "users"),
        where("email", "==", currentUser.email)
      );
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        setCurrentUserData(userData, currentUser.uid);
      });
      console.log(currentUserData);
    }
  };

  useEffect(() => {
    currentUser.uid && handleFetchUserData();
    // eslint-disable-next-line
  }, [currentUser.uid]);

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop =
        messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    handleFetchChatMessages(userId);
    // eslint-disable-next-line
  }, [userId]);

  useEffect(() => {
    handleFetchChatUserData();
    // eslint-disable-next-line
  }, [userId]);
  return (
    <div className="relative min-h-[100vh] flex flex-col">
      <div
        ref={messageContainerRef}
        className="flex flex-col space-y-2 w-full overflow-y-auto hideScrollbar h-fit scroll-smooth"
      >
        {messages
          ?.sort((a, b) => a?.timeStamp - b?.timeStamp)
          ?.map((message) => {
            return (
              <div
                className={`flex space-y-1 w-fit max-w-[80%] h-fit mx-2 mt-2   ${
                  message.senderId === currentUser.uid
                    ? "self-end"
                    : "self-start"
                }`}
                key={message.id}
              >
                <div
                  className={`flex flex-col items-start space-y-1 w-fit ${
                    theme === "dark" ? "bg-gray-800" : "bg-gray-100"
                  } rounded-md p-3`}
                >
                  <div className="flex space-x-2 justify-center items-center">
                    <div className="flex space-x-1">
                      {message.senderId === currentUser.uid ? (
                        <>
                          <img
                            src={currentUserData?.img}
                            className="h-6 w-6 rounded-full object-cover"
                            alt=""
                          />
                          <span>{currentUserData?.name}</span>
                        </>
                      ) : (
                        <>
                          <img
                            src={chatUserData?.img}
                            className="h-6 w-6 rounded-full object-cover"
                            alt=""
                          />
                          <span>{chatUserData?.name}</span>
                        </>
                      )}
                    </div>
                    <span
                      className={`text-sm ${
                        theme === "dark" ? "text-gray-400" : "text-gray-400"
                      } mt-1`}
                    >
                      {formatTime(message?.timeStamp)}
                    </span>
                  </div>
                  <span className={`whitespace-pre-wrap text-sm`}>
                    {message.message}
                  </span>
                </div>
                <div>{}</div>
              </div>
            );
          })}
      </div>
      {/* input */}
      <div className="absolute bottom-0 mt-2 bg-gray-900 w-full p-2">
        <div
          className={`flex ${
            theme === "dark"
              ? "bg-gray-800 text-white"
              : "bg-gray-200 text-black"
          } rounded-md space-x-2 w-full justify-center`}
        >
          <input
            type="text"
            placeholder="Message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className={`bg-inherit rounded-md w-[90%]  px-2 focus:outline-none`}
          />
          <button
            onClick={handleSendMessage}
            disabled={messageText?.length === 0}
            className={`flex items-center py-2 rounded-md ${
              theme === "dark"
                ? "border-gray-400 text-white"
                : "border-gray-900 text-black"
            } ${
              messageText?.length === 0
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer opacity-100"
            }`}
          >
            {messageSent ? (
              <IoSend className="mx-3" size={23} />
            ) : (
              <BiLoader className="animate-spin mx-3" size={23} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
