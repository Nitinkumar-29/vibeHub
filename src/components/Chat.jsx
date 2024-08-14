import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { db } from "../firebase";
import ThemeContext from "../context/Theme/ThemeContext";
import { chat_formatTime } from "../utils/Chat_formatTime";
import ChatContext from "../context/ChatContext/ChatContext";
import { BiInfoCircle, BiLoader } from "react-icons/bi";
import "../styles/overflow_scroll.css";
import { IoSend } from "react-icons/io5";
import EmojiPicker from "emoji-picker-react";
import { TiAttachmentOutline } from "react-icons/ti";
import {
  MdArrowBackIos,
  MdEmojiEmotions,
  MdOutlineAddReaction,
} from "react-icons/md";
import { AiOutlineClose, AiOutlineDownload } from "react-icons/ai";
import { HighLightLinks } from "../utils/HighlightLinks";
import { FiTrash } from "react-icons/fi";
import { CgSpinner } from "react-icons/cg";
import toast from "react-hot-toast";

const Chat = () => {
  const { userId } = useParams();
  const [chatUserData, setChatUserData] = useState(null);
  const { theme } = useContext(ThemeContext);
  const messageContainerRef = useRef(null);
  const navigate = useNavigate();
  const [scrollInterval, setScrollInterval] = useState(null);
  const fileRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);
  const currentUser = localStorage.getItem("currentUser");

  const [messageEmojiPicker, setMessageEmojiPicker] = useState(false);
  const {
    sendMessage,
    messageText,
    setMessageText,
    handleFetchChatMessages,
    messages,
    messageSent,
    files,
    setFiles,
    removeFile,
    loadingMessages,
    deleteMessage,
    addReaction,
    removeReaction,
    activeChatId,
  } = useContext(ChatContext);
  const messageInputRef = useRef(null);
  const [selectedMedia, setselectedMedia] = useState(null);
  const [showReactionMenu, setShowReactionMenu] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState(null);

  //  message reaction picker
  const handleReaction = (id) => {
    setSelectedMessageId(id);
    setShowReactionMenu((prev) => !prev);
  };

  const handleCloseReactionPicker = (event) => {
    const position = document.getElementById("reaction-picker");
    if (position && !position.contains(event.target)) {
      setShowReactionMenu(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
  };

  const handleClickOutside = (event) => {
    const modalImage = document.getElementById("modal-media");
    const download = document.getElementById("modal-background");
    if (
      modalImage &&
      !modalImage.contains(event.target) &&
      event.target === download
    ) {
      handleCloseModal();
    }
  };

  const handleEscapeKey = (event) => {
    if (event.key === "Escape") {
      handleCloseModal();
    }
  };

  const handleCloseModal = () => {
    setselectedMedia(null);
  };

  const handleDownload = async (event) => {
    event.stopPropagation();
    try {
      if (!selectedMedia) {
        throw new Error("Selected image URL is not valid.");
      }
      const response = await fetch(selectedMedia, {
        mode: "cors", // Ensure CORS mode is enabled
      });
      if (!response.ok) {
        throw new Error("Failed to fetch image.");
      }
      toast.loading("downloading...");
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      // Determine the type of the media for setting the download attribute
      const mediaType = blob.type.split("/")[0]; // Extract "image" or "video"
      
      link.download = `download_media.${mediaType === "image" ? "jpg" : "mp4"}`; // Set appropriate extension
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      handleCloseModal();
      toast.dismiss();
      toast.success("Media downloaded");
    } catch (error) {
      console.error("Error downloading the image:", error.message);
      if (error.code === "resource-exhausted") {
        console.error("Quota exceeded. Please try again later.");
      }
    }
  };

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
      if (error.code === "resource-exhausted") {
        console.error("Quota exceeded. Please try again later.");
      }
    }
  };

  const handleSendMessage = () => {
    sendMessage(userId);
  };

  const handleFetchUserData = async () => {
    if (currentUser && currentUser.email) {
      try {
        const q = query(
          collection(db, "users"),
          where("email", "==", currentUser.email)
        );
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {});
      } catch (error) {
        if (error.code === "resource-exhausted") {
          console.error("Quota exceeded. Please try again later.");
        }
      }
    }
  };

  const startScrolling = (direction) => {
    const scrollStep = 200; // Adjust the scroll step as needed
    const intervalTime = 50; // Adjust the interval time as needed

    setScrollInterval(
      setInterval(() => {
        if (!messageContainerRef.current) return;

        const container = messageContainerRef.current;
        let newScroll;

        if (direction === "down") {
          newScroll = container.scrollTop + scrollStep;
          container.scrollTop = newScroll;
          // setCurrentScroll(newScroll);
        } else if (direction === "up") {
          newScroll = container.scrollTop - scrollStep;
          container.scrollTop = newScroll;
          // setCurrentScroll(newScroll);
        }
      }, intervalTime)
    );
  };

  const stopScrolling = () => {
    clearInterval(scrollInterval);
    setScrollInterval(null);
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      if (!scrollInterval) {
        startScrolling("down");
      }
    } else if (event.key === "ArrowUp") {
      if (!scrollInterval) {
        startScrolling("up");
      }
    }
  };

  const handleKeyUp = (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      stopScrolling();
    }
  };

  const handlePlayPause = (index) => {
    videoRef.current.click(index);
    if (isPlaying === false) {
      videoRef.current.play(index);
      console.log(isPlaying);
      setIsPlaying(true);
    } else {
      videoRef.current.pause(index);
      console.log(isPlaying);
      setIsPlaying(false);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
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
    currentUser && handleFetchUserData();
    // eslint-disable-next-line
  }, [currentUser]);

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop =
        messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    handleFetchChatMessages(userId);
    // eslint-disable-next-line
  }, [userId, location.pathname]);

  useEffect(() => {
    handleFetchChatUserData();
    // eslint-disable-next-line
  }, [userId]);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
    // eslint-disable-next-line
  }, [scrollInterval]);

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex justify-between w-full items-center p-4">
        <div
          className={`flex items-center space-x-2 ${
            theme === "dark" ? "bg-black" : "bg-zinc-200"
          } backdrop-blur-3xl bg-opacity-30 `}
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
              className="h-7 w-7 rounded-full object-cover "
              alt=""
            />
            <span>{chatUserData?.user_name}</span>
          </Link>
        </div>
        <Link to={`/chat/${activeChatId}/settings`}>
          <BiInfoCircle size={25} className="cursor-pointer" />
        </Link>
      </div>
      {!loadingMessages ? (
        <div
          ref={messageContainerRef}
          className={`relative flex flex-col space-y-2 w-full overflow-y-auto hideScrollbar h-fit max-h-[85vh] scroll-smooth pb-8 pt-4`}
        >
          {messages
            ?.sort((a, b) => a?.timeStamp - b?.timeStamp)
            ?.map((message) => {
              return (
                <div
                  className={`group flex items-center space-y-1 w-fit max-w-[80%] h-fit mx-2 mt-2 ${
                    message.senderId === currentUser ? "self-end" : "self-start"
                  }`}
                  key={message.id}
                >
                  <div
                    className={`flex flex-col space-y-1 justify-center ${
                      currentUser === message.senderId
                        ? "items-end"
                        : "items-start"
                    }`}
                  >
                    <div className="group flex items-center relative space-y-1">
                      <div className="">
                        {currentUser === message.senderId && (
                          <button
                            onClick={() => {
                              deleteMessage(message.id);
                              console.log(message.id);
                            }}
                            className={`absolute -left-8 px-2 hidden group-hover:inline-block duration-300 transition-transform`}
                          >
                            <FiTrash />
                          </button>
                        )}
                      </div>
                      <div className="relative flex items-center space-x-1">
                        <div
                          className={`flex flex-col space-y-1 ${
                            message.senderId === currentUser
                              ? "items-end"
                              : "items-start"
                          }`}
                        >
                          {" "}
                          {message.reactions && (
                            <div
                              className={`absolute  z-10 ${
                                message.fileURLs.length > 0
                                  ? "-top-2"
                                  : "-top-1"
                              } rounded-full ${
                                currentUser === message.senderId
                                  ? "-left-2"
                                  : "-right-2"
                              }  `}
                            >
                              {Object.entries(message.reactions).map(
                                ([userId, reaction]) => (
                                  <span
                                    className="text-lg cursor-pointer"
                                    onClick={() => {
                                      removeReaction(message.id);
                                      console.log(reaction, message.id);
                                    }}
                                    key={userId}
                                  >
                                    {reaction}
                                  </span>
                                )
                              )}
                            </div>
                          )}
                          {message.fileURLs && (
                            <div
                              className={`flex flex-wrap w-fit ${
                                message.senderId === currentUser
                                  ? "justify-end"
                                  : "justify-start"
                              }`}
                            >
                              {message.fileURLs &&
                                message.fileURLs.map((fileURL, index) => (
                                  <div key={index} className="m-1">
                                    {fileURL?.includes(".mp4") ? (
                                      <div>
                                        {fileURL?.length > 0 ? (
                                          <video
                                            onClick={() => {
                                              setselectedMedia(fileURL);
                                            }}
                                            onEnded={handleEnded}
                                            ref={videoRef}
                                            autoFocus={true}
                                            className="max-h-60 max-w-60 self-end w-full object-contain rounded-md "
                                          >
                                            <source
                                              src={fileURL}
                                              type="video/mp4"
                                            />
                                          </video>
                                        ) : (
                                          "loading"
                                        )}
                                      </div>
                                    ) : (
                                      <img
                                        src={fileURL}
                                        alt={`file-${index}`}
                                        onClick={() => {
                                          setselectedMedia(fileURL);
                                        }}
                                        className="cursor-pointer max-w-60 self-end max-h-60 rounded-md object-cover"
                                      />
                                    )}
                                  </div>
                                ))}
                            </div>
                          )}
                          <div
                            className={`flex relative justify-end mb-1 w-fit`}
                          >
                            {message.message && (
                              <span
                                className={`${
                                  currentUser === message.senderId
                                    ? "self-end"
                                    : "self-start"
                                } break-words whitespace-pre-wrap text-sm ${
                                  theme === "dark"
                                    ? message.senderId === currentUser
                                      ? "bg-gradient-to-tr from-violet-800 via-blue-800 to-indigo-800"
                                      : "bg-gray-800"
                                    : message.senderId === currentUser
                                    ? "bg-gradient-to-tr from-violet-200 via-blue-200 to-indigo-200"
                                    : "bg-gray-200"
                                } rounded-md px-3 py-2`}
                                style={{
                                  wordBreak: "break-word",
                                  overflowWrap: "break-word",
                                }}
                                dangerouslySetInnerHTML={{
                                  __html: HighLightLinks(message?.message),
                                }}
                              ></span>
                            )}
                          </div>
                        </div>
                        {currentUser === message.receiverId && (
                          <span
                            onClick={() => {
                              handleReaction(message.id);
                            }}
                            className={`absolute -right-6 mt-2 cursor-pointer px-1 ${
                              currentUser === message.receiverId && "m-auto"
                            } hidden group-hover:inline-flex`}
                          >
                            <MdOutlineAddReaction />
                          </span>
                        )}
                      </div>

                      {showReactionMenu === true &&
                        currentUser === message.receiverId &&
                        selectedMessageId === message.id && (
                          <div
                            onClick={handleCloseReactionPicker}
                            id="reaction-picker"
                            className={`${
                              message.id === selectedMessageId
                                ? "flex"
                                : "hidden"
                            } z-10 absolute ${
                              message.senderId === currentUser
                                ? "top-1 right-0"
                                : "-top-[53px] left-0"
                            }`}
                          >
                            <EmojiPicker
                              reactionsDefaultOpen
                              allowExpandReactions={false}
                              searchDisabled
                              onEmojiClick={(event) => {
                                setShowReactionMenu(false);
                                addReaction(message.id, event.emoji);
                              }}
                            />
                          </div>
                        )}
                    </div>

                    <div
                      className={`flex flex-col space-y-1 ${
                        currentUser === message.senderId
                          ? "self-end"
                          : "self-start"
                      }`}
                    >
                      <span
                        className={` ${
                          currentUser === message.senderId
                            ? "self-end"
                            : "self-start"
                        } text-xs ${
                          theme === "dark" ? "text-gray-400" : "text-gray-400"
                        }`}
                      >
                        {chat_formatTime(message?.timeStamp)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

          {/* Modal */}
          {selectedMedia && (
            <div
              onClick={handleClickOutside}
              id="modal-background"
              className={`z-20 fixed inset-0 bg-opacity-40 flex items-center justify-center self-center w-full mx-auto h-[90%] backdrop-blur-md rounded-md p-4`}
            >
              <div className="relative ">
                <div className="flex self-start relative w-fit">
                  {selectedMedia.includes(".mp4") ? (
                    <video
                      onClick={() => {
                        handlePlayPause();
                      }}
                      id="modal-media"
                      onEnded={handleEnded}
                      ref={videoRef}
                      autoFocus={true}
                      className="h-[500px] w-full object-contain rounded-md "
                    >
                      <source src={selectedMedia} type="video/mp4" />
                    </video>
                  ) : (
                    <img
                      src={selectedMedia}
                      alt="preview"
                      id="modal-media"
                      className="w-full h-fit max-h-[30rem] object-cover rounded-md"
                    />
                  )}
                </div>
                {selectedMedia.length > 0 && (
                  <button
                    id="download"
                    onClick={handleDownload}
                    className={`absolute bottom-1 right-1 ${
                      theme === "dark" ? "bg-gray-800" : "bg-gray-200"
                    }  p-2 rounded`}
                  >
                    <AiOutlineDownload size={25} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="h-full w-full flex items-center justify-center">
          <CgSpinner className="animate-spin " size={40} />
        </div>
      )}
      <div
        className={`z-20 absolute flex items-center bottom-0 py-3 ${
          theme === "dark" ? "bg-black text-white" : "bg-white text-black"
        } w-full px-2`}
      >
        <div
          className={`relative flex items-center ${
            theme === "dark"
              ? "bg-zinc-900 text-white"
              : "bg-gray-200 text-black"
          } rounded-3xl space-x-2 w-full justify-center h-12`}
        >
          {files.length > 0 && (
            <div
              className={`grid ${
                files.length === 1 ? "grid-cols-1" : "grid-cols-2"
              } gap-2 absolute left-0 bottom-20 p-4 rounded-md w-fit max-h-[60vh] overflow-y-auto hideScrollbar ${
                theme === "dark"
                  ? "bg-gray-800 backdrop-blur-3xl bg-opacity-40"
                  : "bg-gray-200"
              }`}
            >
              {files?.map((file, index) => (
                <div key={index} className={` w-fit`}>
                  {file.type.startsWith("image/") && (
                    <div className="flex self-start relative w-fit">
                      <img
                        src={URL.createObjectURL(file)}
                        alt="preview"
                        className="w-40 h-40 object-cover rounded-md"
                      />
                      <span
                        onClick={() => removeFile(index)}
                        className="cursor-pointer absolute -top-1 -right-1 p-2 bg-gray-800 text-white rounded-full"
                      >
                        <AiOutlineClose size={16} />
                      </span>
                    </div>
                  )}
                  {file.type.startsWith("video/") && (
                    <div className="relative w-[11.8rem] h-[9.1rem]">
                      <video
                        controls
                        className="w-full h-full object-contain rounded-md"
                      >
                        <source
                          src={URL.createObjectURL(file)}
                          type={file.type}
                        />
                      </video>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute -top-2 right-2 p-1 bg-gray-800 text-white rounded-full"
                      >
                        <AiOutlineClose size={20} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div
            className={`${
              messageEmojiPicker === false ? "hidden" : "flex"
            } self-center absolute bottom-14 mx-auto w-5/6`}
          >
            <EmojiPicker
              reactionsDefaultOpen={messageEmojiPicker}
              emojiStyle="google"
              onEmojiClick={(event) => {
                setMessageEmojiPicker(false);
                setMessageText(messageText + event.emoji);
              }}
            />
          </div>
          <textarea
            ref={messageInputRef}
            type="text"
            placeholder="Message... ctrl + /"
            value={messageText}
            rows={1}
            onChange={(e) => setMessageText(e.target.value)}
            className={`w-[90%] h-full place-content-center resize-none hideScrollbar appearance-none bg-inherit rounded-3xl px-3 focus:outline-none`}
          />
          <MdEmojiEmotions
            className="cursor-pointer"
            onClick={() => {
              setMessageEmojiPicker(!messageEmojiPicker);
            }}
            size={25}
          />
          <input
            ref={fileRef}
            hidden
            type="file"
            multiple
            accept="image/*, video/*"
            onChange={handleFileChange}
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
            disabled={messageText.trim("")?.length === 0 && files?.length === 0}
            className={`flex items-center py-2 rounded-md ${
              theme === "dark"
                ? "border-gray-400 text-white"
                : "border-gray-900 text-black"
            } ${
              messageText.trim("")?.length === 0 && files?.length === 0
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
