import React, { useContext, useEffect, useRef, useState } from "react";
import ChatContext from "../context/ChatContext/ChatContext";
import PostContext from "../context/PostContext/PostContext";
import { formatTime } from "../utils/FormatTime";
import {
  BiArrowBack,
  BiDotsVertical,
  BiEdit,
  BiImage,
  BiSearch,
} from "react-icons/bi";
import { Link, useNavigate } from "react-router-dom";
import ThemeContext from "../context/Theme/ThemeContext";
import {
  IoAlarmSharp,
  IoAlbums,
  IoAlbumsOutline,
  IoEllipsisVerticalSharp,
} from "react-icons/io5";
import toast from "react-hot-toast";
import { MdArrowBackIos } from "react-icons/md";
import { collection, doc, getDoc, getDocs, where } from "firebase/firestore";
import { db } from "../firebase";
import { FaUser } from "react-icons/fa";
import { HighLightLinks } from "../utils/HighlightLinks";

const Chats = () => {
  const { handleFetchAllChats, allChats, deleteChat, sendMessage } =
    useContext(ChatContext);
  const { currentUser } = useContext(PostContext);
  const [currentUserData, setCurrentUserData] = useState();
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);
  const [query, setQuery] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const searchInputRef = useRef(null);
  const searchModelRef = useRef(null);
  const [allUsers, setAllUsers] = useState([]);
  const [isSearchUsers, setIsSearchUsers] = useState(false);

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

  // close modal
  const handleClickOutside = (event) => {
    const modal = document.getElementById("user_search");
    if (modal && !modal.contains(event.target)) {
      setIsSearchUsers((prev) => !prev);
    }
  };

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

  const handleFetchUsersData = async () => {
    try {
      const queryUsersData = await getDocs(collection(db, "users"));
      const allUsersData = [];

      queryUsersData.forEach((dataDoc) => {
        const userData = dataDoc.data();
        const userId = dataDoc.id;
        allUsersData.push({ id: userId, ...userData });
      });

      console.log(allUsersData);
      setAllUsers(allUsersData);
      return allUsersData;
    } catch (error) {
      console.error("Error fetching users data: ", error);
      return [];
    }
  };

  useEffect(() => {
    currentUser.uid && handleFetchUserData();
    // eslint-disable-next-line
  }, [currentUser.uid]);

  useEffect(() => {
    handleFetchAllChats();
    // eslint-disable-next-line
  }, [currentUser.uid]);

  useEffect(() => {
    handleFetchUsersData();
  }, []);

  // to close the search model
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
    // eslint-disable-next-line
  }, []);

  return (
    <div className="h-full flex flex-col items-center justify-start w-full">
      <div
        className={`relative flex space-x-1 items-center justify-between w-full px-4 py-2`}
      >
        <div className={`flex items-center space-x-2 shadow-lg`}>
          <MdArrowBackIos
            onClick={() => {
              navigate(-1);
            }}
            className="cursor-pointer"
            size={20}
          />
          <Link
            to={`/userProfile/yourPosts`}
            className="flex items-center space-x-2"
          >
            <img
              src={currentUserData?.img}
              className="h-6 w-6 object-cover rounded-full "
              alt=""
            />
            <div className="flex items-end space-x-1">
              <span className="text-xl font-semibold">
                {currentUserData?.name}
              </span>
              <span className={`${theme === "dark" ? "text-gray-600" : ""}`}>
                @{currentUserData?.user_name}
              </span>
            </div>
          </Link>
        </div>
        <div className="">
          <span
            onClick={() => {
              setIsSearchUsers(!isSearchUsers);
            }}
          >
            <BiEdit size={25} className="cursor-pointer"></BiEdit>
          </span>
        </div>
        {isSearchUsers && (
          <div
            onClick={handleClickOutside}
            id="user_search"
            className={`absolute left-1 right-2 top-14 border-[1px] ${
              theme === "dark" ? "border-zinc-800" : "border-zinc-200"
            } rounded-md self-center min-h-40 p-3 backdrop-blur-3xl bg-opacity-30`}
          >
            <input
              type="text"
              placeholder="Search user..."
              value={userQuery}
              onChange={(e) => {
                setUserQuery(e.target.value);
              }}
              className={`w-full p-2 rounded-md ${
                theme === "dark" ? "bg-zinc-900" : "bg-gray-100"
              }`}
            />
            {allUsers?.filter(
              (user) =>
                user.id !== currentUser.uid && // Exclude current user
                (user.accountType !== "private" || // Include public accounts
                  (user.accountType === "private" &&
                    user.followers.includes(currentUser.uid))) && // Include private accounts only if the current user is a follower
                user.name.toLowerCase().includes(userQuery.trim().toLowerCase()) // Filter by user query
            ).length > 0 ? (
              <div className="flex flex-col my-4 space-y-3">
                <span>Users</span>
                {allUsers
                  ?.filter(
                    (user) =>
                      user?.id !== currentUser.uid &&
                      (user?.followers.includes(currentUser.uid) ||
                        user?.accountType !== "private") &&
                      user?.name
                        .toLowerCase()
                        .includes(userQuery.trim("").toLowerCase())
                  )
                  ?.map((user) => {
                    return (
                      <Link
                        key={user.id}
                        to={`/userChats/${user.id}/messages`}
                        className="flex items-center space-x-2"
                      >
                        {user?.img ? (
                          <img
                            src={user?.img}
                            className="h-6 w-6 rounded-full object-cover"
                            alt=""
                          />
                        ) : (
                          <FaUser
                            className={`h-6 w-6 rounded-full border-[1px] ${
                              theme === "dark"
                                ? "border-gry-200"
                                : "border-gray-900"
                            }`}
                          />
                        )}
                        <div className="flex space-x-1 items-center">
                          <span className="text-lg">{user?.name}</span>
                          <span className={`text-gray-600`}>
                            @{user?.user_name}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
              </div>
            ) : (
              <div className="my-2">
                No user found with this search query "{userQuery}"
              </div>
            )}
          </div>
        )}
      </div>
      <div
        // style={{boxShadow:"0px 0px 2px 2px #4b5563"}}
        className={`flex items-center mt-4 w-[95%] px-2 rounded-md ${
          theme === "dark" ? "bg-zinc-900" : "bg-gray-100"
        }`}
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
      {!isSearchUsers && (
        <div className="flex flex-col space-y-2 w-full mt-4 border-t-[1px] border-zinc-900 px-2">
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
              ?.sort((a, b) => b.lastUpdated - a.lastUpdated)
              ?.map((chat) => {
                let otherParticipant = chat.participants.find(
                  (participant) => participant.id !== currentUser.uid
                );
                return (
                  <div
                    key={chat.id}
                    className={`group flex w-full items-center justify-between mt-2 p-2 rounded-md ${
                      theme === "dark"
                        ? "hover:bg-zinc-900"
                        : "hover:bg-zinc-100"
                    } duration-200`}
                  >
                    {otherParticipant?.img && (
                      <Link
                        to={`/userChats/${otherParticipant.id}/messages`}
                        className="flex flex-col space-y-0 w-full max-w-[90%]"
                      >
                        <div className="flex items-center space-x-3">
                          <img
                            src={otherParticipant?.img}
                            className="h-12 w-12 object-cover rounded-full"
                            alt=""
                          />
                          <div className="flex flex-col justify-center -space-y-1">
                            <div className="flex space-x-3">
                              <span className="font-semibold">
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
                                    {currentUser.uid ===
                                    chat.lastMessage.senderId
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

                            {chat?.lastMessage?.message &&
                            chat?.lastMessage?.message.length > 50 ? (
                              chat?.lastMessage?.message.slice(0, 48).trim("") +
                              `...`
                            ) : chat?.lastMessage?.message ? (
                              <span
                                className="font-sans text-zinc-400"
                                dangerouslySetInnerHTML={{
                                  __html: HighLightLinks(
                                    chat?.lastMessage.message
                                  ),
                                }}
                              />
                            ) : (
                              <div className="flex  items-center space-x-1">
                                <IoAlbumsOutline /> <span>media</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {/* <div className="flex flex-col -space-y-1"></div> */}
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
      )}
    </div>
  );
};

export default Chats;
