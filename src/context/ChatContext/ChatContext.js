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
import { createContext, useContext, useState, useEffect } from "react";
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
      console.log(chats);
      setAllChats(chats);
      console.log("all chats: ", allChats);

      console.log("Chats with participant data:", chats);
    } catch (error) {
      console.error("Error fetching chats:", error);
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

    if (!chatId) {
      console.log(
        `Creating new chat for users ${currentUser.uid} and ${userId}`
      );
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
      // Fetch the chat between the current user and the selected user
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

      // // Create a new chat if it does not exist
      // if (!chatId) {
      //   const newChatRef = await addDoc(chatsRef, {
      //     participants: [currentUser.uid, userId],
      //     lastMessage: {
      //       message: "",
      //       senderId: currentUser.uid,
      //       receiverId: userId,
      //     },
      //     timeStamp: serverTimestamp(),
      //   });
      //   chatId = newChatRef.id;
      // }

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

      setMessages(messages); // Update the state with fetched messages
      console.log(messages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
    }
  };

  // realtime messages update
  useEffect(() => {
    if (activeChatId) {
      const messagesRef = collection(db, "chat_messages");
      const q = query(messagesRef, where("chatId", "==", activeChatId));

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const newMessages = [];
        querySnapshot.forEach((doc) => {
          newMessages.push({ id: doc.id, ...doc.data() });
        });
        setMessages(newMessages.sort((a, b) => a.timeStamp - b.timeStamp));
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
        message: messageText,
        fileURLs: fileURLs,
        receiverId: userId,
        timeStamp: serverTimestamp(),
        chatId: chatId,
      };

      await addDoc(collection(db, "chat_messages"), messageData);

      // Update the chat with the last message and timestamp
      const chatRef = doc(db, "chats", chatId);
      await updateDoc(chatRef, {
        "lastMessage.message": messageText, // Update only the text field of lastMessage
        "lastMessage.fileURLS": fileURLs,
        "lastMessage.senderId": currentUser.uid, // Update senderId
        "lastMessage.receiverId": userId, // Update receiverId
        lastUpdated: serverTimestamp(),
      });
      setMessageSent(true);
      console.log("Message sent!");
      toast.success("Message sent!");
      setFiles([]);
      setMessageText(""); // Clear the message input after sending
    } catch (error) {
      console.error("Error sending message: ", error);
    }
  };

  // seen functionality
  const markMessagesAsSeen = async () => {
    let chatId = activeChatId;
    const q = query(
      collection(db, "messages"),
      where("chatId", "==", chatId),
      where("receiverId", "==", currentUser.uid),
      where("seen", "==", false)
    );

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(async (doc) => {
      await updateDoc(doc.ref, { seen: true });
    });
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
        markMessagesAsSeen,
        files,
        setFiles,
        removeFile,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext;
