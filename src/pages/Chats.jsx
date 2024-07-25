import React, { useContext, useEffect, useRef, useState } from "react";
import ChatContext from "../context/ChatContext/ChatContext";
import PostContext from "../context/PostContext/PostContext";
import { formatTime } from "../utils/FormatTime";
import { BiArrowBack, BiDotsVertical, BiSearch } from "react-icons/bi";
import { Link, useNavigate } from "react-router-dom";
import ThemeContext from "../context/Theme/ThemeContext";
import { IoEllipsisVerticalSharp } from "react-icons/io5";
import toast from "react-hot-toast";
import { MdArrowBackIos } from "react-icons/md";
import { collection, doc, getDoc, getDocs, where } from "firebase/firestore";
import { db } from "../firebase";

const Chats = () => {
  const { handleFetchAllChats, allChats, deleteChat } = useContext(ChatContext);
  const { currentUser } = useContext(PostContext);
  const [currentUserData, setCurrentUserData] = useState();
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);
  const [query, setQuery] = useState("");
  const searchInputRef = useRef(null);

  const focusSearchInput = () => {
    searchInputRef.current.focus();
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
    if (e.key === "/" || (e.ctrlKey && e.key === "k")) {
      e.preventDefault();
      focusSearchInput();
    }
  };

  const handleFetchUserData = async () => {
    const docRef = doc(db, "users", currentUser.uid);
    const docSnap = await getDoc(docRef);
    const docSnapShot = docSnap.exists ? docSnap.data() : {};
    console.log(docSnapShot);
    setCurrentUserData(docSnapShot);
  };
  useEffect(() => {
    currentUser.uid && handleFetchUserData();
    // eslint-disable-next-line
  }, [currentUser.uid]);

  useEffect(() => {
    handleFetchAllChats();
    // eslint-disable-next-line
  }, [currentUser.uid]);
  return (
    <div className="min-h-screen flex flex-col items-center justify-start w-full">
      <div
        className={`flex items-center space-x-2 p-4 shadow-lg w-full ${
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
          to={`/userProfile/yourPosts`}
          className="flex items-center space-x-2"
        >
          <img
            src={currentUserData?.img}
            className="h-7 w-7 rounded-full "
            alt=""
          />
          <span>{currentUserData?.user_name}</span>
        </Link>
      </div>
      <div
      // style={{boxShadow:"0px 0px 2px 2px #4b5563"}}
        className={`flex items-center mt-4 border-b-[0px] w-[95%] px-2 rounded-md ${
          theme === "dark" ? "bg-gray-800" : "bg-gray-200"
        } ${theme === "dark" ? "border-white" : "border-black"}`}
      >
        <input
          type="text"
          placeholder="Search"
          value={query}
          ref={searchInputRef}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          className={`p-2 bg-transparent  w-full focus:outline-none focus:placeholder:text-gray-300`}
        />
      </div>
      <div className="flex flex-col space-y-4 w-full mt-10 px-2">
        {allChats && allChats.length > 0 ? (
          allChats
            ?.filter(
              (chat) =>
                chat?.participants.some(
                  (participant) =>
                    participant.id !== currentUser.uid &&
                    participant?.name
                      ?.toLowerCase()
                      .includes(query.trim().toLowerCase())
                ) ||
                chat?.lastMessage.message
                  .toLowerCase()
                  .includes(query.trim().toLowerCase())
            )
            ?.map((chat) => {
              let otherParticipant = chat.participants.find(
                (participant) => participant.id !== currentUser.uid
              );
              return (
                <div
                  key={chat.id}
                  className={`group flex w-full items-center justify-between p-2 rounded-md ${
                    theme === "dark" ? "hover:bg-gray-800" : "hover:bg-gray-200"
                  } duration-300`}
                >
                  {otherParticipant && (
                    <Link
                      to={`/userChats/${otherParticipant.id}/messages`}
                      className="flex space-x-4"
                    >
                      <div>
                        <img
                          src={otherParticipant?.img}
                          className="h-12 w-12 rounded-full"
                          alt=""
                        />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-semibold">
                            {otherParticipant?.name}
                          </span>
                          {chat.timeStamp && (
                            <div
                              className={`${
                                theme === "dark"
                                  ? "text-gray-400"
                                  : "text-gray-400"
                              } text-sm mt-1`}
                            >
                              <span>
                                {currentUser.uid === chat.lastMessage.senderId
                                  ? "sent"
                                  : "received"}
                                &nbsp;
                              </span>
                              <span className={``}>
                                {formatTime(chat?.lastUpdated)}
                              </span>
                            </div>
                          )}
                        </div>
                        <span className="font-sans text-sm">
                          {chat?.lastMessage?.message &&
                          chat?.lastMessage?.message.length > 50
                            ? chat?.lastMessage?.message.slice(0, 48).trim("") +
                              `...`
                            : chat?.lastMessage?.message}
                        </span>
                      </div>
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      deleteChat(chat.id);
                      console.log(chat.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 z-10"
                  >
                    <IoEllipsisVerticalSharp size={25} />
                  </button>
                </div>
              );
            })
        ) : (
          <div className="flex flex-col">
            <span>No chat found</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chats;
