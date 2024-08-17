import React, { useContext, useEffect, useRef, useState } from "react";
import ChatContext from "../context/ChatContext/ChatContext";
import { formatTime } from "../utils/FormatTime";
import { Link, useNavigate } from "react-router-dom";
import ThemeContext from "../context/Theme/ThemeContext";
import { auth, db } from "../firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { HighLightLinks } from "../utils/HighlightLinks";
import {
  IoAlbumsOutline,
  IoCloseCircle,
  IoCloseCircleOutline,
  IoEllipsisVerticalSharp,
} from "react-icons/io5";
import { BiBlock, BiEdit, BiTrashAlt } from "react-icons/bi";
import { MdArchive, MdArrowBackIos, MdUnarchive } from "react-icons/md";
import { FaUser } from "react-icons/fa";
import { GoIssueClosed } from "react-icons/go";
import { CgClose, CgSpinner } from "react-icons/cg";
import { AuthContext } from "../context/AuthContext";

const Chats = () => {
  const {
    handleFetchAllChats,
    allChats,
    deleteChat,
    error,
    handleFetchChatMessages,
    archiveChat,
    handleRemoveArchiveChat,
    messageRequestChats,
    fetchMessageRequestChats,
    acceptMessageRequest,
  } = useContext(ChatContext);
  const [currentUserData, setCurrentUserData] = useState();
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);
  const [query, setQuery] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const searchInputRef = useRef(null);
  const [allUsers, setAllUsers] = useState([]);
  const [isSearchUsers, setIsSearchUsers] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const currentUser = localStorage.getItem("currentUser");
  const { handleBlock } = useContext(AuthContext);

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
      const docRef = doc(db, "users", currentUser);
      const docSnap = await getDoc(docRef);
      const docSnapShot = docSnap.exists ? docSnap.data() : {};
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
      (chat) => !chat.archiveBy || !chat.archiveBy.includes(currentUser)
    );
    const archivedChats = allChats.filter(
      (chat) => chat.archiveBy && chat.archiveBy.includes(currentUser)
    );
    if (chats.length === 0) {
      setActiveTab("archived");
    } else {
      if (activeTab === "archived" && archivedChats.length === 0) {
        setActiveTab("all");
      }
    }
    // eslint-disable-next-line
  }, [auth.currentUser, allChats]);

  useEffect(() => {
    currentUser && handleFetchUserData();
    // eslint-disable-next-line
  }, [auth.currentUser]);

  useEffect(() => {
    handleFetchAllChats();
    // eslint-disable-next-line
  }, [auth.currentUser]);

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

  // fetch message requests chats
  useEffect(() => {
    fetchMessageRequestChats();
    // eslint-disable-next-line
  }, [auth.currentUser]);
  return (
    <>
      {!error ? (
        <div className="h-full flex flex-col items-center justify-start w-full">
          <div
            className={`relative flex space-x-1 items-center justify-between w-full px-2 py-2`}
          >
            <div className={`flex items-center space-x-2 px-2 py-2`}>
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
                {new Set(
                  allChats.flatMap((chat) =>
                    chat.participants.filter(
                      (participantId) =>
                        participantId ===
                        `${allUsers.filter((user) => {
                          return user.id;
                        })}`
                    )
                  )
                ) &&
                allUsers?.filter(
                  (user) =>
                    user.id !== currentUser && // Exclude current user
                    (user?.accountType !== "private" || // Include public accounts
                      (user?.accountType === "private" &&
                        user.followers?.includes(currentUser))) && // Include private accounts only if the current user is a follower
                    user.name
                      .toLowerCase()
                      .includes(userQuery.trim().toLowerCase())
                ).length > 0 ? (
                  <div className="flex flex-col my-4 space-y-3">
                    <span>Users</span>
                    {allUsers
                      ?.filter(
                        (user) =>
                          user?.id !== currentUser &&
                          (user?.followers?.includes(currentUser) ||
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
            {!isSearchUsers && allChats.length > 0 && (
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

                {query.length > 0 && (
                  <CgClose
                    className="cursor-pointer"
                    onClick={() => {
                      setQuery("");
                    }}
                  />
                )}
              </div>
            )}
            {!isSearchUsers && allChats.length > 0 && (
              <div className="relative flex space-x-4 items-center w-[95%] overflow-x-auto scrollbarH pb-2">
                {allChats?.filter(
                  (chat) =>
                    !chat?.archiveBy?.includes(currentUser) &&
                    chat.messageRequest === false
                ).length > 0 && (
                  <button
                    onClick={() => {
                      setActiveTab("all");
                    }}
                    className={`${
                      theme === "dark" ? "bg-zinc-800" : "bg-zinc-200"
                    } rounded-full px-4 py-1 space-x-2 ${
                      activeTab === "all"
                        ? "text-red-600"
                        : `${
                            theme === "dark" ? "text-zinc-400" : "text-zinc-900"
                          }`
                    }`}
                  >
                    <span>All</span>
                    <span>
                      {
                        allChats.filter(
                          (chat) =>
                            !chat?.archiveBy?.includes(currentUser) &&
                            !currentUserData?.blockedChats?.includes(chat.id)
                        )?.length
                      }
                    </span>
                  </button>
                )}
                {allChats?.filter((chat) =>
                  chat?.archiveBy?.includes(currentUser)
                ).length !== 0 && (
                  <button
                    onClick={() => {
                      setActiveTab("archived");
                    }}
                    className={`${
                      theme === "dark" ? "bg-zinc-800" : "bg-zinc-200"
                    } rounded-full px-4 py-1 space-x-2 ${
                      activeTab === "archived"
                        ? "text-red-600"
                        : `${
                            theme === "dark" ? "text-zinc-400" : "text-zinc-900"
                          }`
                    }`}
                  >
                    <span>Archived</span>
                    <span>
                      {
                        allChats.filter((chat) =>
                          chat?.archiveBy?.includes(currentUser)
                        )?.length
                      }
                    </span>
                  </button>
                )}

                {currentUserData?.blockedChats?.length > 0 && (
                  <button
                    onClick={() => {
                      setActiveTab("blocked");
                    }}
                    className={`${
                      theme === "dark" ? "bg-zinc-800" : "bg-zinc-200"
                    } rounded-full px-4 py-1 space-x-2 ${
                      activeTab === "blocked"
                        ? "text-red-600"
                        : `${
                            theme === "dark" ? "text-zinc-400" : "text-zinc-900"
                          }`
                    }`}
                  >
                    <span className="">Blocked</span>
                    <span>
                      {
                        allChats?.filter((chat) =>
                          currentUserData?.blockedChats?.includes(chat?.id)
                        )?.length
                      }
                    </span>
                  </button>
                )}

                {messageRequestChats.length > 0 && (
                  <button
                    onClick={() => {
                      setActiveTab("requests");
                    }}
                    className={`${
                      theme === "dark" ? "bg-zinc-800" : "bg-zinc-200"
                    } rounded-full px-4 py-1 space-x-2 ${
                      activeTab === "requests"
                        ? "text-red-600"
                        : `${
                            theme === "dark" ? "text-zinc-400" : "text-zinc-900"
                          }`
                    }`}
                  >
                    <span>Requests</span>
                    <span>{messageRequestChats?.length}</span>
                  </button>
                )}
              </div>
            )}
          </div>
          {!isSearchUsers && (
            <>
              <div className="w-full">
                {activeTab === "requests" ? (
                  <div className="flex flex-col space-y-2 w-full mt-2 border-t-[1px] border-zinc-900 px-2">
                    {messageRequestChats && messageRequestChats.length > 0 ? (
                      messageRequestChats
                        ?.sort((a, b) => b.lastUpdated - a.lastUpdated)
                        ?.map((chat) => {
                          let otherParticipant = chat.participants.find(
                            (participant) => participant.id !== currentUser
                          );
                          return (
                            <div
                              key={chat.id}
                              className={` relative group flex w-full items-center justify-between mt-2 p-2 duration-200`}
                            >
                              {otherParticipant && (
                                <div className="flex flex-col space-y-0 w-full max-w-[90%]">
                                  <div className="flex items-center space-x-3">
                                    {otherParticipant?.img ? (
                                      <img
                                        src={otherParticipant?.img}
                                        className="h-12 w-12 object-cover rounded-full"
                                        alt=""
                                      />
                                    ) : (
                                      <FaUser
                                        size={48}
                                        className="rounded-full"
                                      />
                                    )}
                                    <div className="flex flex-col justify-center -space-y-1">
                                      <div className="flex space-x-3">
                                        <span className="font-semibold">
                                          {otherParticipant?.name &&
                                            (window.innerWidth < 412 &&
                                            otherParticipant.name.length > 10
                                              ? `${
                                                  otherParticipant.name[0].toUpperCase() +
                                                  otherParticipant.name.slice(
                                                    1,
                                                    10
                                                  )
                                                }...`
                                              : otherParticipant.name[0] +
                                                otherParticipant.name.slice(1))}
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
                                              {currentUser ===
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
                                        chat?.lastMessage?.message.length >
                                          50 ? (
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
                                                        chat?.lastMessage
                                                          ?.message
                                                      ),
                                                    }}
                                                  />
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        ) : chat?.lastMessage?.fileURLs &&
                                          chat?.lastMessage?.fileURLs.length >
                                            0 ? (
                                          <div className="flex items-center space-x-1">
                                            <IoAlbumsOutline />
                                            <span>media</span>
                                          </div>
                                        ) : null}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                              <div className="flex items-start space-x-2">
                                {
                                  <IoCloseCircleOutline
                                    color="red"
                                    className="cursor-pointer"
                                    onClick={() => deleteChat(chat.id)}
                                    size={25}
                                  />
                                }
                                {chat.lastMessage.receiverId ===
                                  currentUser && (
                                  <GoIssueClosed
                                    size={23}
                                    color="green"
                                    className="cursor-pointer"
                                    onClick={() =>
                                      acceptMessageRequest(chat.id)
                                    }
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })
                    ) : (
                      <div className="flex flex-col h-full w-full items-center justify-center border-r mt-20">
                        <span>No chat found</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col space-y-2 w-full mt-2 border-t-[1px] border-zinc-900 px-2">
                    {allChats && allChats.length > 0 ? (
                      allChats
                        ?.filter(
                          (chat) =>
                            (chat?.participants.some(
                              (participant) =>
                                participant.id !== currentUser &&
                                participant?.name
                                  ?.toLowerCase()
                                  .includes(query.trim().toLowerCase())
                            ) ||
                              chat?.lastMessage.message
                                .toLowerCase()
                                .includes(query.trim().toLowerCase())) &&
                            (activeTab === "all"
                              ? !chat.archiveBy?.includes(currentUser)
                              : chat.archiveBy?.includes(currentUser)) &&
                            !chat.messageRequest === true &&
                            !currentUserData?.blockedChats?.includes(chat.id)
                        )
                        ?.sort((a, b) => b.lastUpdated - a.lastUpdated)
                        ?.map((chat) => {
                          let otherParticipant = chat.participants.find(
                            (participant) => participant.id !== currentUser
                          );
                          return (
                            <div
                              key={chat.id}
                              className={` relative group flex w-full items-center justify-between mt-2 p-2 ${
                                theme === "dark"
                                  ? "hover:bg-zinc-900"
                                  : "hover:bg-zinc-100"
                              } border-b-[1px] ${
                                theme === "dark"
                                  ? "border-zinc-900"
                                  : "border-zinc-200"
                              } last:border-none rounded-t-md duration-200`}
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
                                          {otherParticipant?.name &&
                                            (window.innerWidth < 412 &&
                                            otherParticipant.name.length > 15
                                              ? `${
                                                  otherParticipant.name[0].toUpperCase() +
                                                  otherParticipant.name.slice(
                                                    1,
                                                    15
                                                  )
                                                }...`
                                              : otherParticipant.name[0] +
                                                otherParticipant.name.slice(1))}
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
                                              {currentUser ===
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
                                        chat?.lastMessage?.message.length >
                                          50 ? (
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
                                                        chat?.lastMessage
                                                          ?.message
                                                      ),
                                                    }}
                                                  />
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        ) : chat?.lastMessage?.fileURLs &&
                                          chat?.lastMessage?.fileURLs.length >
                                            0 ? (
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
                                  {chatMenu === true &&
                                  chatMenuId === chat.id ? (
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
                                  {chat?.archiveBy?.includes(currentUser) ? (
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
                                    onClick={() => {
                                      deleteChat(chat.id);
                                      setChatMenu(false);
                                    }}
                                    className="flex space-x-1 items-center p-2"
                                  >
                                    <BiTrashAlt />
                                    <span>Delete</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleBlock(otherParticipant.id, chat.id);
                                      setChatMenu(false);
                                    }}
                                    className="flex space-x-1 items-center p-2 text-red-700"
                                  >
                                    <BiBlock />
                                    <span>
                                      {currentUserData?.blockedUsers?.includes(
                                        otherParticipant.id
                                      )
                                        ? "UnBlock"
                                        : "Block"}
                                    </span>
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })
                    ) : (
                      <div className="flex flex-col h-full w-full items-center justify-center mt-20">
                        <CgSpinner size={45} className="animate-spin" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
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
