import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { db } from "../firebase";
import ThemeContext from "../context/Theme/ThemeContext";
import ChatContext from "../context/ChatContext/ChatContext";
import { AuthContext } from "../context/AuthContext";
import { formatTime } from "../utils/FormatTime";
import { BiLoader } from "react-icons/bi";
import "../styles/overflow_scroll.css";
import {
  IoArrowBackCircle,
  IoArrowBackCircleSharp,
  IoSend,
} from "react-icons/io5";
import EmojiPicker from "emoji-picker-react";
import { TiAttachmentOutline } from "react-icons/ti";
import { MdArrowBackIos } from "react-icons/md";

const Chat = () => {
  const { userId } = useParams();
  const [chatUserData, setChatUserData] = useState(null);
  const { theme } = useContext(ThemeContext);
  const messageContainerRef = useRef(null);
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const holdTimeout = useRef(null);
  const fileRef = useRef(null);
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
  const messageInputRef = useRef(null);

  const handleFetchChatUserData = async () => {
    try {
      const docRef = doc(db, "users", userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = {
          ...docSnap.data(),
          id: userId,
        };
        setChatUserData(userData);
      } else {
        console.log("No such document!");
      }
    } catch (error) {
      console.error(error);
    }
  };

  // // seen functionality
  // const markMessagesAsSeen = async (chatId, userId) => {
  //   const q = query(
  //     collection(db, "messages"),
  //     where("chatId", "==", chatId),
  //     where("receiverId", "==", userId),
  //     where("seen", "==", false)
  //   );

  //   const querySnapshot = await getDocs(q);
  //   querySnapshot.forEach(async (doc) => {
  //     await updateDoc(doc.ref, { seen: true });
  //   });
  // };

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
    }
  };

  // const handleTouchStart = (e) => {
  //   const touch = e.touches[0];
  //   setMenuPosition({ top: touch.clientY, left: touch.clientX });

  //   holdTimeout.current = setTimeout(() => {
  //     setShowMenu(true);
  //   }, 500); // Adjust the hold time as needed (500ms in this case)
  // };

  // const handleTouchEnd = () => {
  //   clearTimeout(holdTimeout.current);
  // };

  // const handleTouchMove = () => {
  //   clearTimeout(holdTimeout.current);
  // };

  // const handleCloseMenu = () => {
  //   setShowMenu(false);
  // };

  const highlightLinks = (text) => {
    // Regex to match URLs including those that start with "www." or include domains like "vercel.app"
    const urlPattern =
      /(?:\b(?:https?:\/\/|ftp:\/\/|file:\/\/|www\.)\S+|\b\S+\.\S+)(?=\b|$)/gi;

    return text.replace(urlPattern, (url) => {
      // Ensure URLs are prefixed with 'http://' if they don't already include 'http', 'https', or 'ftp'
      const formattedUrl =
        !/^https?:\/\//i.test(url) &&
        !/^ftp:\/\//i.test(url) &&
        !/^file:\/\//i.test(url) &&
        !/^www\./i.test(url)
          ? `http://${url}`
          : url;

      return `<a href="${formattedUrl}" target="_blank" class="text-blue-500 underline underline-offset-2">${url}</a>`;
    });
  };

  const focusMessageInput = () => {
    messageInputRef.current.focus();
  };
  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
    // eslint-disable-next-line
  }, []);

  // Event listener to trigger focus on "/" key press
  const handleKeyPress = (e) => {
    if (e.key === "ctrl" || (e.ctrlKey && e.key === "/")) {
      e.preventDefault();
      focusMessageInput();
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
    <div className="h-screen flex flex-col">
      <div
        className={`flex items-center space-x-2 p-4 shadow-lg ${
          theme === "dark" ? "shadow-gray-800" : "shadow-gray-200"
        }`}
      >
        <MdArrowBackIos
          onClick={() => {
            navigate(-1);
          }}
          className="cursor-pointer"
          size={25}
        />
        <Link
          to={`/users/${userId && userId}/profile`}
          className="flex items-center space-x-2"
        >
          <img
            src={chatUserData?.img}
            className="h-7 w-7 rounded-full "
            alt=""
          />
          <span>{chatUserData?.user_name}</span>
        </Link>
      </div>
      <div
        ref={messageContainerRef}
        className={`flex flex-col space-y-2 w-full overflow-y-auto hideScrollbar h-fit max-h-[90vh] scroll-smooth pb-20 pt-4 ${
          showMenu ? "blur-sm" : ""
        }`}
        // onClick={handleCloseMenu}
      >
        {messages
          ?.sort((a, b) => a?.timeStamp - b?.timeStamp)
          ?.map((message) => {
            return (
              <div
                // onTouchStart={handleTouchStart}
                // onTouchEnd={handleTouchEnd}
                // onTouchMove={handleTouchMove}
                className={`flex space-y-1 w-fit max-w-[80%] h-fit mx-2 mt-2 ${
                  message.senderId === currentUser.uid
                    ? "self-end"
                    : "self-start"
                }`}
                key={message.id}
              >
                <div className="flex flex-col space-y-1 justify-center items-start">
                  <p
                    className={`${
                      currentUser.uid === message.senderId
                        ? "self-end"
                        : "self-start"
                    } break-words whitespace-pre-wrap text-sm ${
                      theme === "dark"
                        ? message.senderId === currentUser.uid
                          ? "bg-gradient-to-tr from-violet-800 via-blue-800 to-indigo-800"
                          : "bg-gray-800"
                        : message.senderId === currentUser.uid
                        ? "bg-gradient-to-tr from-violet-200 via-blue-200 to-indigo-200"
                        : "bg-gray-200"
                    } rounded-xl px-3 py-2`}
                    style={{
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                    }}
                    dangerouslySetInnerHTML={{
                      __html: highlightLinks(message.message),
                    }}
                  ></p>

                  <span
                    className={` ${
                      currentUser.uid === message.senderId
                        ? "self-end"
                        : "self-start"
                    } text-xs ${
                      theme === "dark" ? "text-gray-400" : "text-gray-400"
                    } mt-1`}
                  >
                    {formatTime(message?.timeStamp)}
                  </span>
                </div>
              </div>
            );
          })}
      </div>
      {/* {showMenu && (
        <div
          className="absolute p-2 bg-white shadow-lg rounded-lg z-10"
          style={{ top: menuPosition.top, left: menuPosition.left }}
        >
          <ul>
            <li className="p-2 hover:bg-gray-100">Delete</li>
            <li className="p-2 hover:bg-gray-100">Copy</li>
            <li className="p-2 hover:bg-gray-100">Edit</li>
          </ul>
        </div>
      )} */}
      {/* input */}
      <div
        className={`absolute bottom-0 py-3 ${
          theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-black"
        } w-full px-2`}
      >
        <div
          className={`flex items-center ${
            theme === "dark"
              ? "bg-gray-800 text-white"
              : "bg-gray-200 text-black"
          } rounded-3xl space-x-2 w-full justify-center h-12`}
        >
          <textarea
            ref={messageInputRef}
            type="text"
            placeholder="Message... ctrl + /"
            value={messageText}
            rows={1}
            onChange={(e) => setMessageText(e.target.value)}
            className={`w-[90%] h-full place-content-center resize-none hideScrollbar appearance-none bg-inherit rounded-3xl px-3 focus:outline-none`}
          />
          <input
            type="file"
            hidden
            ref={fileRef}
            onChange={() => {
              // setMessageContent
            }}
          />
          <TiAttachmentOutline
            onClick={() => {
              fileRef.current.click();
            }}
            className="cursor-pointer"
            size={25}
          />
          <button
            onClick={handleSendMessage}
            disabled={messageText.trim("")?.length === 0}
            className={`flex items-center py-2 rounded-md ${
              theme === "dark"
                ? "border-gray-400 text-white"
                : "border-gray-900 text-black"
            } ${
              messageText.trim("")?.length === 0
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
