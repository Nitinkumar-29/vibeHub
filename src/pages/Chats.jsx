import React, { useContext, useEffect, useRef, useState } from "react";
import ChatContext from "../context/ChatContext/ChatContext";
import PostContext from "../context/PostContext/PostContext";
import { formatTime } from "../utils/FormatTime";
import { Link, useNavigate } from "react-router-dom";
import ThemeContext from "../context/Theme/ThemeContext";
import { db } from "../firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { HighLightLinks } from "../utils/HighlightLinks";
import {
  IoAlbumsOutline,
  IoCloseCircle,
  IoEllipsisVerticalSharp,
} from "react-icons/io5";
import { BiEdit, BiTrashAlt } from "react-icons/bi";
import { MdArchive, MdArrowBackIos, MdUnarchive } from "react-icons/md";
import { FaUser } from "react-icons/fa";
import { IoMdOptions } from "react-icons/io";

const Chats = () => {
  const {
    handleFetchAllChats,
    allChats,
    deleteChat,
    error,
    handleFetchChatMessages,
    archiveChat,
    handleRemoveArchiveChat,
  } = useContext(ChatContext);
  const { currentUser } = useContext(PostContext);
  const [currentUserData, setCurrentUserData] = useState();
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);
  const [query, setQuery] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const searchInputRef = useRef(null);
  const [allUsers, setAllUsers] = useState([]);
  const [isSearchUsers, setIsSearchUsers] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const [chatMenu, setChatMenu] = useState(false);
  const [chatMenuId, setChatMenuId] = useState(null);
  const chatMenuRef = useRef(null);
  const chatMenuButtonRef = useRef(null);

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

  const handleClickOutside = (event) => {
    const modal = document.getElementById("user_search");
    const editButton = document.getElementById("edit");
    if (
      modal &&
      !modal.contains(event.target) &&
      editButton &&
      !editButton.contains(event.target)
    ) {
      setIsSearchUsers(false);
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
    try {
      const docRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(docRef);
      const docSnapShot = docSnap.exists ? docSnap.data() : {};
      console.log(docSnapShot);
      setCurrentUserData(docSnapShot);
    } catch (error) {
      if (error.code === "resource-exhausted") {
        console.error("Quota exceeded. Please try again later.");
      }
    }
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
      if (error.code === "resource-exhausted") {
        console.error("Quota exceeded. Please try again later.");
      }
      return [];
    }
  };

  // active tab
  useEffect(() => {
    const chats = allChats.filter(
      (chat) => !chat.archiveBy || !chat.archiveBy.includes(currentUser.uid)
    );
    const archivedChats = allChats.filter(
      (chat) => chat.archiveBy && chat.archiveBy.includes(currentUser.uid)
    );
    if (chats.length === 0) {
      setActiveTab("archived");
    } else {
      if (activeTab === "archived" && archivedChats.length === 0) {
        setActiveTab("all");
      }
    }
    // eslint-disable-next-line
  }, [currentUser, allChats]);

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

  // chatmenu close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        chatMenuRef.current &&
        chatMenu === true &&
        !chatMenuRef.current.contains(event.target) &&
        !chatMenuButtonRef.current.contains(event.target)
      ) {
        setChatMenu(false);
        setChatMenuId(null);
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
    // eslint-disable-next-line
  }, [chatMenuRef]);

  return (
    <>
      {!error ? (
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
                  <span
                    className={`${theme === "dark" ? "text-gray-600" : ""}`}
                  >
                    @{currentUserData?.user_name}
                  </span>
                </div>
              </Link>
            </div>
            <span
              id="edit"
              onClick={() => {
                setIsSearchUsers(!isSearchUsers);
              }}
            >
              <BiEdit size={25} className="cursor-pointer"></BiEdit>
            </span>
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
                    (user?.accountType !== "private" || // Include public accounts
                      (user?.accountType === "private" &&
                        user.followers?.includes(currentUser.uid))) && // Include private accounts only if the current user is a follower
                    user.name
                      .toLowerCase()
                      .includes(userQuery.trim().toLowerCase()) // Filter by user query
                ).length > 0 ? (
                  <div className="flex flex-col my-4 space-y-3">
                    <span>Users</span>
                    {allUsers
                      ?.filter(
                        (user) =>
                          user?.id !== currentUser.uid &&
                          (user?.followers?.includes(currentUser.uid) ||
                            user?.accountType !== "private") &&
                          user?.name
                            .toLowerCase()
                            .includes(userQuery.trim("")?.toLowerCase())
                      )
                      ?.map((user) => {
                        return (
                          <Link
                            onClick={() => handleFetchChatMessages(user.id)}
                            key={user.id}
                            to={`/chat/${user.id}/messages`}
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
                    {userQuery.length <= 0
                      ? "no public account or the ones you follow found"
                      : `No user found with this search query ${userQuery}`}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col items-center space-y-4 w-full">
            <div
              // style={{boxShadow:"0px 0px 2px 2px #4b5563"}}
              className={`relative flex items-center mt-4 w-[95%] px-2 rounded-md ${
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

              {/* <div
                className={`text-sm absolute right-0 rounded-md shadow-lg z-10 px-2`}
              >
                <select
                  name="tabs"
                  value={activeTab}
                  onChange={(event) => {
                    setActiveTab(event.target.value);
                  }}
                  className="p-2 bg-inherit rounded-sm outline-none"
                >
                  <option
                    className="bg-primary-200 text-primary-800"
                    value="all"
                  >
                    All
                  </option>
                  <option
                    style={{ appearance: "menulist" }}
                    className="bg-primary-200 text-primary-800"
                    value="archived"
                  >
                    Archived
                  </option>
                </select>
              </div> */}
            </div>
            {allChats.length > 0 && (
              <div className="flex space-x-2 items-center w-[95%]">
                {allChats?.filter(
                  (chat) => !chat?.archiveBy?.includes(currentUser.uid)
                ).length > 0 && (
                  <button
                    onClick={() => {
                      setActiveTab("all");
                    }}
                    className={`bg-zinc-800 rounded-full px-4 py-1 ${
                      activeTab === "all"
                        ? "text-red-600"
                        : `${
                            theme === "dark" ? "text-zinc-400" : "text-zinc-900"
                          }`
                    }`}
                  >
                    All
                  </button>
                )}
                {allChats?.filter((chat) =>
                  chat?.archiveBy?.includes(currentUser.uid)
                ).length !== 0 && (
                  <button
                    onClick={() => {
                      setActiveTab("archived");
                    }}
                    className={`bg-zinc-800 rounded-full px-4 py-1 ${
                      activeTab === "archived"
                        ? "text-red-600"
                        : `${
                            theme === "dark" ? "text-zinc-400" : "text-zinc-900"
                          }`
                    }`}
                  >
                    Archived
                  </button>
                )}
                <button
                  onClick={() => {
                    setActiveTab("requests");
                  }}
                  className={`bg-zinc-800 rounded-full px-4 py-1 ${
                    activeTab === "requests"
                      ? "text-red-600"
                      : `${
                          theme === "dark" ? "text-zinc-400" : "text-zinc-900"
                        }`
                  }`}
                >
                  Requests
                </button>
              </div>
            )}
          </div>
          {!isSearchUsers && (
            <div className="flex flex-col space-y-2 w-full mt-2 border-t-[1px] border-zinc-900 px-2">
              {allChats && allChats.length > 0 ? (
                allChats
                  ?.filter((chat) =>
                    (chat?.participants.some(
                      (participant) =>
                        participant.id !== currentUser.uid &&
                        participant?.name
                          ?.toLowerCase()
                          .includes(query.trim().toLowerCase())
                    ) ||
                      chat?.lastMessage.message
                        .toLowerCase()
                        .includes(query.trim().toLowerCase())) &&
                    activeTab === "all"
                      ? !chat.archiveBy?.includes(currentUser.uid)
                      : chat.archiveBy?.includes(currentUser.uid)
                  )
                  ?.sort((a, b) => b.lastUpdated - a.lastUpdated)
                  ?.map((chat) => {
                    let otherParticipant = chat.participants.find(
                      (participant) => participant.id !== currentUser.uid
                    );
                    return (
                      <div
                        key={chat.id}
                        className={`relative group flex w-full items-center justify-between mt-2 p-2 rounded-md ${
                          theme === "dark"
                            ? "hover:bg-zinc-900"
                            : "hover:bg-zinc-100"
                        } duration-200`}
                      >
                        {otherParticipant?.img && (
                          <Link
                            to={`/chat/${otherParticipant.id}/messages`}
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

                                <div className="space-x-1">
                                  {chat?.lastMessage?.message &&
                                  chat?.lastMessage?.message.length > 50 ? (
                                    chat?.lastMessage?.message
                                      .slice(0, 48)
                                      .trim("") + `...`
                                  ) : chat?.lastMessage?.message ? (
                                    <div>
                                      {chat.lastMessageDeleted ? (
                                        <span className="text-red-700 font-semibold">
                                          message deleted!
                                        </span>
                                      ) : (
                                        <div>
                                          {chat?.messageReaction ? (
                                            <span className="text-sm">
                                              reacted {chat.reaction} to a
                                              message
                                            </span>
                                          ) : (
                                            <span
                                              className="font-sans"
                                              dangerouslySetInnerHTML={{
                                                __html: HighLightLinks(
                                                  chat?.lastMessage?.message
                                                ),
                                              }}
                                            />
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ) : chat?.lastMessage?.fileURLs &&
                                    chat?.lastMessage?.fileURLs.length > 0 ? (
                                    <div className="flex items-center space-x-1">
                                      <IoAlbumsOutline />
                                      <span>media</span>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </Link>
                        )}
                        <button
                          ref={chatMenuButtonRef}
                          className="opacity-0 group-hover:opacity-100 z-10"
                        >
                          <span>
                            {chatMenu === true && chatMenuId === chat.id ? (
                              <IoCloseCircle
                                onClick={() => {
                                  setChatMenu(false);
                                }}
                                size={25}
                              />
                            ) : (
                              <IoEllipsisVerticalSharp
                                onClick={() => {
                                  setChatMenuId(chat.id);
                                  setChatMenu(true);
                                }}
                                size={25}
                              />
                            )}
                          </span>
                        </button>
                        {chatMenu && chatMenuId === chat.id && (
                          <div
                            ref={chatMenuRef}
                            className="z-20 flex flex-col items-start space-y-1 bg-opacity-40 backdrop-blur-3xl bg-zinc-800 rounded-md p-4 absolute top-16 right-0"
                          >
                            {chat?.archiveBy?.includes(currentUser.uid) ? (
                              <button
                                onClick={async () => {
                                  await handleRemoveArchiveChat(chat.id);
                                  setChatMenu(false);
                                }}
                                className="flex space-x-1 items-center p-2"
                              >
                                <MdUnarchive />
                                <span>Remove</span>
                              </button>
                            ) : (
                              <button
                                onClick={async () => {
                                  await archiveChat(chat.id);
                                  setChatMenu(false);
                                }}
                                className="flex space-x-1 items-center p-2"
                              >
                                <MdArchive />
                                <span>Archive</span>
                              </button>
                            )}

                            <button
                              onClick={() => deleteChat(chat.id)}
                              className="flex space-x-1 items-center p-2"
                            >
                              <BiTrashAlt />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
              ) : (
                <div className="flex flex-col h-full w-full items-center justify-center border-r mt-20">
                  <span>No chat found</span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="h-full w-full flex items-center justify-center">
          <span className="font-semibold text-lg">{error}</span>
        </div>
      )}
    </>
  );
};

export default Chats;
