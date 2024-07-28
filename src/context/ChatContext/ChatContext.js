import {
  addDoc,
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
import { createContext, useContext, useState, useEffect, useRef } from "react";
import { db, storage } from "../../firebase";
import { AuthContext } from "../AuthContext";
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
  const { currentUser } = useContext(AuthContext);
  const [messageSent, setMessageSent] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [files, setFiles] = useState([]);
  const [particularChatMetaData, setParticularChatMetaData] = useState(null);
  const [error, setError] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);

  const handleFetchAllChats = async () => {
    try {
      const chatsRef = query(
        collection(db, "chats/"),
        where("participants", "array-contains", currentUser.uid)
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

  const findOrCreateChat = async (userId) => {
    const chatsRef = collection(db, "chats");
    const chatQuery = query(
      chatsRef,
      where("participants", "array-contains", currentUser.uid)
    );
    const chatSnapShot = await getDocs(chatQuery);

    let chatId = null;
    chatSnapShot.forEach((doc) => {
      const data = doc.data();
      if (data.participants.includes(userId)) {
        chatId = doc.id;
      }
    });
    handleFetchChatMessages();
    if (!chatId) {
      const newChatRef = await addDoc(chatsRef, {
        participants: [currentUser.uid, userId],
        lastMessage: {
          message: "",
          senderId: currentUser.uid,
          receiverId: userId,
        },
        timeStamp: serverTimestamp(),
      });
      chatId = newChatRef.id;
    } else {
      console.log(
        `Chat already exists for users ${currentUser.uid} and ${userId}`
      );
    }
    return chatId;
  };

  const handleFetchChatMessages = async (userId) => {
    try {
      const chatsRef = collection(db, "chats");
      const chatQuery = query(
        chatsRef,
        where("participants", "array-contains", currentUser.uid)
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
        where("participants", "array-contains", currentUser.uid)
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
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          },
          (error) => {
            console.log(error);
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
        senderId: currentUser.uid,
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
        "lastMessage.senderId": currentUser.uid, // Update senderId
        "lastMessage.receiverId": userId, // Update receiverId
        lastMessageDeleted: false,
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

        // Update reactions with the new reaction
        currentReactions[currentUser.uid] = reaction;

        // Update the document with the new reactions
        await updateDoc(messageRef, {
          reactions: currentReactions,
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  // remove a reaction
  const removeReaction = async (messageId,) => {
    const messageRef = doc(db, "chat_messages", messageId);

    try {
      // Fetch the current reactions
      const messageSnapshot = await getDoc(messageRef);
      if (messageSnapshot.exists()) {
        const messageData = messageSnapshot.data();
        const currentReactions = messageData.reactions || {};

        // Remove the reaction for the specified user
        delete currentReactions[currentUser.uid];

        // Update the document with the modified reactions
        await updateDoc(messageRef, {
          reactions: currentReactions,
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  //   delete a chat
  const deleteChat = async (chatId) => {
    try {
      const chatRef = doc(db, "chats", chatId);

      // Fetch all chat messages for the given chat ID
      const messagesQuery = query(
        collection(db, "chat_messages"),
        where("chatId", "==", chatId)
      );
      const messagesSnapshot = await getDocs(messagesQuery);

      // Collect all file URLs from messages
      const fileUrls = [];
      messagesSnapshot.forEach((doc) => {
        const messageData = doc.data();
        if (messageData.fileURLs) {
          fileUrls.push(...messageData.fileURLs);
        }
      });

      // Delete each storage media file
      for (const url of fileUrls) {
        const fileRef = ref(storage, url);
        await deleteObject(fileRef);
      }

      // Delete all chat messages
      const deleteMessagesPromises = messagesSnapshot.docs.map((messageDoc) =>
        deleteDoc(messageDoc.ref)
      );
      await Promise.all(deleteMessagesPromises);

      // Delete the chat document
      if (chatRef) {
        await deleteDoc(chatRef);
      }

      // Fetch all chats again (assuming you have a function for this)
      handleFetchAllChats();
    } catch (error) {
      console.error("Error deleting chat:", error);
      if (error.code === "resource-exhausted") {
        console.error("Quota exceeded. Please try again later.");
        setError("Server down, Please try again later");
      }
    }
  };

  // delete message
  const deleteMessage = async (messageId) => {
    try {
      const messageRef = doc(db, "chat_messages", messageId);
      const messageSnap = await getDoc(messageRef);
      const messageData = messageSnap.exists() ? messageSnap.data() : {};
      console.log(messageData);

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

      // Find the new last message
      let newLastMessage = {};
      if (remainingMessages.length > 0) {
        const sortedMessages = remainingMessages.sort(
          (a, b) => b.timeStamp - a.timeStamp
        );
        newLastMessage = {
          message: sortedMessages[0].message,
          fileURLs: sortedMessages[0].fileURLs || [],
          senderId: sortedMessages[0].senderId,
          receiverId: sortedMessages[0].receiverId,
          timeStamp: sortedMessages[0].timeStamp,
        };
      }

      // Update the chat with the last message and timestamp
      const chatRef = doc(db, "chats", activeChatId);
      await updateDoc(chatRef, {
        // "lastMessage.message": newLastMessage.message || "",
        // "lastMessage.fileURLs": newLastMessage.fileURLs || [],
        // "lastMessage.senderId": newLastMessage.senderId || "",
        // "lastMessage.receiverId": newLastMessage.receiverId || "",
        // lastUpdated: newLastMessage.timeStamp,
        lastUpdated: serverTimestamp(),
        lastMessageDeleted: true,
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
        removeReaction
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext;
