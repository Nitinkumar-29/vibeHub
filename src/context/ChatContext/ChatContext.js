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
import { db } from "../../firebase";
import { AuthContext } from "../AuthContext";
import toast from "react-hot-toast";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [allChats, setAllChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const { currentUser } = useContext(AuthContext);
  const [messageSent, setMessageSent] = useState(true);
  const [messageText, setMessageText] = useState("");

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

  const sendMessage = async (userId) => {
    setMessageSent(false);
    const chatId = await findOrCreateChat(userId);
    if (!chatId) return; // If no chatId, exit
    try {
      let messageData = {
        senderId: currentUser.uid,
        message: messageText,
        receiverId: userId,
        timeStamp: serverTimestamp(),
        chatId: chatId,
      };

      await addDoc(collection(db, "chat_messages"), messageData);

      // Update the chat with the last message and timestamp
      const chatRef = doc(db, "chats", chatId);
      await updateDoc(chatRef, {
        "lastMessage.message": messageText, // Update only the text field of lastMessage
        "lastMessage.senderId": currentUser.uid, // Update senderId
        "lastMessage.receiverId": userId, // Update receiverId
        lastUpdated: serverTimestamp(),
      });
      setMessageSent(true);
      console.log("Message sent!");
      toast.success("Message sent!")
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
    const chatRef = doc(db, "chats", chatId);
    chatRef && (await deleteDoc(chatRef));
    handleFetchAllChats();
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
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext;
