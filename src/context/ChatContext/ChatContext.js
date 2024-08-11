import {
  addDoc,
  arrayRemove,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { createContext, useState, useEffect } from "react";
import { db, storage } from "../../firebase";
import toast from "react-hot-toast";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [allChats, setAllChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageSent, setMessageSent] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [files, setFiles] = useState([]);
  const [particularChatMetaData, setParticularChatMetaData] = useState(null);
  const [error, setError] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageRequestChats, setMessageRequestChats] = useState([]);
  const currentUser = localStorage.getItem("currentUser");

  const handleFetchAllChats = async () => {
    try {
      const chatsRef = query(
        collection(db, "chats/"),
        where("participants", "array-contains", currentUser),
        where("messageRequest", "==", false)
      ); // Reference to the chats collection
      const chatsSnap = await getDocs(chatsRef); // Fetch all documents in the chats collection
      const chats = [];
      for (const chatDoc of chatsSnap.docs) {
        const chatData = chatDoc.data();
        const participantsData = [];

        for (const participantId of chatData.participants) {
          const userRef = doc(db, "users", participantId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            participantsData.push({ id: participantId, ...userSnap.data() });
          }
        }

        chats.push({
          id: chatDoc.id,
          ...chatData,
          participants: participantsData,
        });
      }
      setAllChats(chats);
    } catch (error) {
      console.error("Error fetching chats:", error);
      if (error.code === "resource-exhausted") {
        console.error("Quota exceeded. Please try again later.");
        setError("Server down, Please try again later");
      }
    }
  };

  // fetch message Request Chats
  const fetchMessageRequestChats = async () => {
    try {
      // Reference to the chats collection
      const chatsRef = collection(db, "chats");
      const chatQuery = query(
        chatsRef,
        where("participants", "array-contains", currentUser),
        where("messageRequest", "==", true) // Check if messageRequest is true
      );

      // Fetch all documents in the chats collection
      const chatsSnap = await getDocs(chatQuery);
      const chats = [];

      for (const chatDoc of chatsSnap.docs) {
        const chatData = chatDoc.data();
        const participantsData = [];

        // Fetch participant data for each chat
        for (const participantId of chatData.participants) {
          const userRef = doc(db, "users", participantId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            participantsData.push({ id: participantId, ...userSnap.data() });
          }
        }

        chats.push({
          id: chatDoc.id,
          ...chatData,
          participants: participantsData,
        });
      }

      setMessageRequestChats(chats); // Assume setMessageRequestChats is a state setter function to update the UI
    } catch (error) {
      console.error("Error fetching message request chats:", error);
      if (error.code === "resource-exhausted") {
        console.error("Quota exceeded. Please try again later.");
        setError("Server down, Please try again later");
      }
    }
  };

  // accept message request
  const acceptMessageRequest = async (chatId) => {
    if (!chatId) return "invalid chat id";
    try {
      const chatRef = doc(db, "chats", chatId);
      await updateDoc(chatRef, {
        messageRequest: false,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const findOrCreateChat = async (userId) => {
    const chatsRef = collection(db, "chats");
    const chatQuery = query(
      chatsRef,
      where("participants", "array-contains", currentUser)
    );
    const chatSnapShot = await getDocs(chatQuery);

    let chatId = null;
    chatSnapShot.forEach((doc) => {
      const data = doc.data();
      if (data.participants.includes(userId)) {
        chatId = doc.id;
      }
    });
    // target user data
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    const userSnapShot = userSnap.exists() ? userSnap.data() : {};
    let messageRequest = false;
    if (!userSnapShot?.followers?.includes(currentUser)) {
      messageRequest = true;
    }
    if (!chatId) {
      const newChatRef = await addDoc(chatsRef, {
        participants: [currentUser, userId],
        lastMessage: {
          message: "",
          senderId: currentUser,
          receiverId: userId,
        },
        timeStamp: serverTimestamp(),
        messageRequest: messageRequest,
      });
      chatId = newChatRef.id;
    }
    handleFetchChatMessages();
    return chatId;
  };

  const handleFetchChatMessages = async (userId) => {
    try {
      const chatsRef = collection(db, "chats");
      const chatQuery = query(
        chatsRef,
        where("participants", "array-contains", currentUser)
      );
      const chatSnapShot = await getDocs(chatQuery);

      let chatId = null;
      chatSnapShot.forEach((doc) => {
        const data = doc.data();
        if (data.participants.includes(userId)) {
          chatId = doc.id;
        }
      });

      if (chatId) {
        // Set the active chat ID
        setActiveChatId(chatId);

        // Fetch messages for the active chat
        const messagesRef = collection(db, "chat_messages");
        const q = query(messagesRef, where("chatId", "==", chatId));
        const querySnapshot = await getDocs(q);

        const messages = [];
        querySnapshot.forEach((doc) => {
          messages.push({ id: doc.id, ...doc.data() });
        });

        const chatRef = doc(db, "chats", chatId);
        const chatSnap = await getDoc(chatRef);
        const chatData = chatSnap.exists() ? chatSnap.data() : {};
        setParticularChatMetaData(chatData);
        setMessages(messages); // Update the state with fetched messages
      }
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      if (error.code === "resource-exhausted") {
        console.error("Quota exceeded. Please try again later.");
        setError("Server down, Please try again later");
      }
    } finally {
      setLoadingMessages(false);
    }
  };

  // realtime messages update
  useEffect(() => {
    if (activeChatId) {
      setLoadingMessages(true);
      const messagesRef = collection(db, "chat_messages");
      const q = query(messagesRef, where("chatId", "==", activeChatId));

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const newMessages = [];
        querySnapshot.forEach((doc) => {
          newMessages.push({ id: doc.id, ...doc.data() });
        });
        setMessages(newMessages.sort((a, b) => a.timeStamp - b.timeStamp));
        setLoadingMessages(false);
      });

      return () => unsubscribe();
    }
  }, [activeChatId]);

  // realtime chats updates
  useEffect(() => {
    if (currentUser) {
      const chatsRef = query(
        collection(db, "chats"),
        where("participants", "array-contains", currentUser)
      );

      const unsubscribeChats = onSnapshot(chatsRef, async (querySnapshot) => {
        const chats = [];
        for (const chatDoc of querySnapshot.docs) {
          const chatData = chatDoc.data();
          const participantsData = await Promise.all(
            chatData.participants.map(async (participantId) => {
              const userRef = doc(db, "users", participantId);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                return { id: participantId, ...userSnap.data() };
              } else {
                return null;
              }
            })
          );

          chats.push({
            id: chatDoc.id,
            ...chatData,
            participants: participantsData.filter((p) => p !== null),
          });
        }
        setAllChats(chats);
      });

      return () => unsubscribeChats();
    }
  }, [currentUser]);

  const removeFile = (indexToRemove) => {
    setFiles((prevFiles) =>
      prevFiles.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleUploadFiles = async () => {
    if (files.length === 0) return [];
    const uploadPromises = files.map((file) => {
      const name = new Date().getTime() + "_" + file.name;
      const storageRef = ref(storage, name);
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
          (error) => {
            reject(error);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          }
        );
      });
    });

    return Promise.all(uploadPromises);
  };

  const sendMessage = async (userId) => {
    setMessageSent(false);
    const chatId = await findOrCreateChat(userId);
    if (!chatId) return; // If no chatId, exit

    try {
      const fileURLs = files && (await handleUploadFiles());
      let messageData = {
        senderId: currentUser,
        fileURLs: fileURLs,
        message: messageText,
        receiverId: userId,
        timeStamp: serverTimestamp(),
        chatId: chatId,
      };

      await addDoc(collection(db, "chat_messages"), messageData);

      // Fetch the chat document to get the lastSeen timestamp of the receiver
      const chatRef = doc(db, "chats", chatId);

      await updateDoc(chatRef, {
        "lastMessage.message": messageText, // Update only the text field of lastMessage
        "lastMessage.fileURLs": fileURLs, // Update fileURLs
        "lastMessage.senderId": currentUser, // Update senderId
        "lastMessage.receiverId": userId, // Update receiverId
        lastMessageDeleted: false,
        messageReaction: false,
        lastUpdated: serverTimestamp(),
      });

      setMessageSent(true);
      toast.success("Message sent!", {
        position: "top-right",
      });
      setFiles([]);
      // Clear the message input after sending
      setMessageText("");
    } catch (error) {
      console.error("Error sending message: ", error);
      if (error.code === "resource-exhausted") {
        console.error("Quota exceeded. Please try again later.");
        setError("Server down, Please try again later");
      }
    }
  };

  // add reaction to a message
  const addReaction = async (messageId, reaction) => {
    const messageRef = doc(db, "chat_messages", messageId);

    try {
      // Fetch the current reactions
      const messageSnapshot = await getDoc(messageRef);
      if (messageSnapshot.exists()) {
        const messageData = messageSnapshot.data();
        const currentReactions = messageData.reactions || {};

        if (messageData.senderId !== currentUser) {
          currentReactions[currentUser] = reaction;

          await updateDoc(messageRef, {
            reactions: currentReactions,
          });

          const chatRef = doc(db, "chats", activeChatId);
          await updateDoc(chatRef, {
            messageReaction: true,
            reaction: reaction,
          });
        }
      }
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  };

  // remove a reaction
  const removeReaction = async (messageId) => {
    const messageRef = doc(db, "chat_messages", messageId);

    try {
      const messageSnapshot = await getDoc(messageRef);
      if (messageSnapshot.exists()) {
        const messageData = messageSnapshot.data();

        if (messageData.senderId === currentUser) {
          return; // Exit early if user is the sender
        }

        const currentReactions = messageData.reactions || {};

        if (currentReactions.hasOwnProperty(currentUser)) {
          delete currentReactions[currentUser];

          await updateDoc(messageRef, {
            reactions: currentReactions,
          });

          const chatRef = doc(db, "chats", activeChatId);
          await updateDoc(chatRef, {
            messageReaction: false,
            reactions: currentReactions,
          });
        }
      }
    } catch (error) {
      console.error("Error removing reaction:", error);
    }
  };

  //   delete a chat
  const deleteChat = async (chatId) => {
    try {
      const chatRef = doc(db, "chats", chatId);

      const messagesQuery = query(
        collection(db, "chat_messages"),
        where("chatId", "==", chatId)
      );
      const messagesSnapshot = await getDocs(messagesQuery);
      const fileUrls = [];
      messagesSnapshot.forEach((doc) => {
        const messageData = doc.data();
        if (messageData.fileURLs) {
          fileUrls.push(...messageData.fileURLs);
        }
      });

      for (const url of fileUrls) {
        const fileRef = ref(storage, url);
        await deleteObject(fileRef);
      }
      const deleteMessagesPromises = messagesSnapshot.docs.map((messageDoc) =>
        deleteDoc(messageDoc.ref)
      );
      await Promise.all(deleteMessagesPromises);

      if (chatRef) {
        await deleteDoc(chatRef);
      }

      handleFetchAllChats();
    } catch (error) {
      console.error("Error deleting chat:", error);
      if (error.code === "resource-exhausted") {
        console.error("Quota exceeded. Please try again later.");
        setError("Server down, Please try again later");
      }
    }
  };

  // archive a chat
  const archiveChat = async (chatId) => {
    if (!chatId) return "no valid chatid";

    try {
      const chatRef = doc(db, "chats", chatId);
      const chatSnap = await getDoc(chatRef);

      if (chatSnap.exists()) {
        const chatData = chatSnap.data();
        let archiveBy = chatData.archiveBy || [];
        archiveBy = [currentUser, ...archiveBy];

        await updateDoc(chatRef, {
          archiveBy,
        });
      }
    } catch (error) {
      console.error("Error archiving chat:", error);
    }
  };

  // remove a chat from archives
  const handleRemoveArchiveChat = async (chatId) => {
    if (!chatId) return "no valid chatid";
    try {
      const chatRef = doc(db, "chats", chatId);
      await updateDoc(chatRef, {
        archiveBy: arrayRemove(currentUser),
      });
    } catch (error) {
      console.error(error);
    }
  };

  // delete message
  const deleteMessage = async (messageId) => {
    try {
      const messageRef = doc(db, "chat_messages", messageId);
      const messageSnap = await getDoc(messageRef);
      const messageData = messageSnap.exists() ? messageSnap.data() : {};

      let fileUrls = [];
      if (messageData.fileURLs) {
        fileUrls.push(...messageData.fileURLs);
      }

      // Delete each storage media file
      for (const url of fileUrls) {
        const fileRef = ref(storage, url);
        await deleteObject(fileRef);
      }

      if (messageRef) {
        await deleteDoc(messageRef);
      }

      // Retrieve remaining messages for the chat
      const messagesRef = collection(db, "chat_messages");
      const q = query(messagesRef, where("chatId", "==", activeChatId));
      const querySnapshot = await getDocs(q);

      const remainingMessages = [];
      querySnapshot.forEach((doc) => {
        remainingMessages.push({ id: doc.id, ...doc.data() });
      });

      // Update the chat with the last message and timestamp
      const chatRef = doc(db, "chats", activeChatId);
      await updateDoc(chatRef, {
        lastUpdated: serverTimestamp(),
        lastMessageDeleted: true,
        messageReaction: false,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        handleFetchAllChats,
        allChats,
        sendMessage,
        messageText,
        setMessageText,
        messages,
        messageSent,
        handleFetchChatMessages,
        deleteChat,
        files,
        setFiles,
        removeFile,
        findOrCreateChat,
        particularChatMetaData,
        deleteMessage,
        error,
        loadingMessages,
        addReaction,
        removeReaction,
        archiveChat,
        handleRemoveArchiveChat,
        fetchMessageRequestChats,
        messageRequestChats,
        acceptMessageRequest,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext;
