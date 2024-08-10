import { createContext, useEffect, useRef, useState } from "react";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import toast from "react-hot-toast";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";

export const AuthContextProvider = ({ children }) => {
  let [followRequestsData, setFollowRequestsData] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loginCredentials, setLoginCredentials] = useState({
    email: "",
    password: "",
  });
  const [currentUserData, setCurrentUserData] = useState({});
  const currentUser = localStorage.getItem("currentUser");
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updatePasswordStatus = async () => {
    // To update a doc with uid
    const user = doc(db, "users", auth.currentUser.uid);
    const token = localStorage.getItem("token");
    token &&
      (await updateDoc(user, {
        password: loginCredentials.password,
      }));
  };

  // login user
  const login = async () => {
    setIsLoading(true);
    await signInWithEmailAndPassword(
      auth,
      loginCredentials.email,
      loginCredentials.password
    )
      .then((userCredential) => {
        const user = userCredential.user;
        updatePasswordStatus();
        localStorage.setItem("currentUser", user.uid);
        setIsLoading(false);
        navigate("/");
        setLoginCredentials({ email: "", password: "" });
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error(errorCode, errorMessage);
        setIsLoading(false);
        setLoading(false);
        setError("Invalid credentials");
        setLoginCredentials({ email: "", password: "" });
      });
  };
  const generateUsername = (name) => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000); // Generates a random number between 1000 and 9999
    return `${name}${randomDigits}`;
  };
  // sign in with google
  const handleSignInWithGoogle = async () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    try {
      const result = signInWithPopup(auth, provider);
      const user = result?.user;
      localStorage.setItem(user?.uid);
      console.log(user);
      const username = user?.displayName.split(" ");
      const updatedName = username[0];
      const generateUser_name = generateUsername(updatedName);
      const userRef = await addDoc(collection(db, "users"), {
        uid: user?.uid,
        name: user?.displayName,
        email: user?.email,
        img: user?.photoUrl,
        timeStamp: serverTimestamp(),
        accountType: "private",
        user_name: generateUser_name,
      });
      console.log(userRef?.uid);
      navigate("/");
    } catch (error) {
      console.error(error);
    }
  };

  // fetch current user data
  const handleFetchCurrentUserData = async () => {
    if (!currentUser) return;
    try {
      const docRef = doc(db, "users", currentUser);
      const docSnap = await getDoc(docRef);
      const docSnapShot = docSnap.exists() ? docSnap.data() : {};
      setCurrentUserData(docSnapShot);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    const docRef = doc(db, "users", currentUser);
    const unsubscribe = onSnapshot(docRef, (querySnapShot) => {
      const newData = querySnapShot.data();
      setCurrentUserData(newData);
    });
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    handleFetchCurrentUserData();
    // eslint-disable-next-line
  }, [currentUser]);

  // fetching all users data
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
      return [];
    }
  };

  const fetchFollowRequests = async () => {
    if (!currentUser) {
      console.log("Invalid user ID");
      return [];
    }

    try {
      const userRef = doc(db, "users", currentUser);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        console.log("User does not exist");
        return [];
      }

      const userData = userSnap.data();
      const requests = userData?.followRequests || [];

      if (requests.length === 0) {
        console.log("No follow requests to fetch.");
        return [];
      }

      // Batch the requests into chunks of 10
      const batchedRequests = [];
      while (requests.length > 0) {
        batchedRequests.push(requests.splice(0, 10));
      }

      const userPromises = batchedRequests.map((batch) => {
        const q = query(
          collection(db, "users"),
          where("__name__", "in", batch)
        );
        return getDocs(q);
      });

      const querySnapshots = await Promise.all(userPromises);
      const usersData = querySnapshots.flatMap((snapshot) =>
        snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }))
      );

      return usersData;
    } catch (error) {
      console.error("Error fetching follow requests:", error);
      return [];
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = onSnapshot(
      doc(db, "users", currentUser),
      async (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          const requests = userData?.followRequests || [];

          if (requests.length === 0) {
            setFollowRequestsData([]);
          } else {
            const updatedFollowRequests = await fetchFollowRequests();
            setFollowRequestsData(updatedFollowRequests);
          }
        }
      }
    );

    return () => unsubscribe();
    // eslint-disable-next-line
  }, [currentUser]);

  const acceptFollowRequest = async (userId) => {
    toast.loading("Processing...");

    if (!currentUser) {
      toast.error("Invalid user ID");
      return;
    }

    try {
      const userRef = doc(db, "users", currentUser);
      const targetRef = doc(db, "users", userId);

      await Promise.all([
        updateDoc(userRef, {
          followers: arrayUnion(userId),
          followRequests: arrayRemove(userId),
        }),
        updateDoc(targetRef, {
          following: arrayUnion(currentUser),
        }),
      ]);
      toast.dismiss();
      toast.success("Follow request accepted!");
      const chatsRef = collection(db, "chats");

      // Query to find chats containing both users
      const chatQuery = query(
        chatsRef,
        where("participants", "array-contains", currentUser)
      );

      // Fetch documents that match the query
      const chatSnapshot = await getDocs(chatQuery);

      // Filter the results to find the chat that also includes the other user
      const chatDocs = chatSnapshot.docs.filter((doc) => {
        const chatData = doc.data();
        return chatData.participants.includes(userId);
      });

      if (chatDocs.length > 0) {
        const chatDoc = chatDocs[0]; // Assuming only one chat exists
        const chatId = chatDoc.id;
        const chatRef = doc(db, "chats", chatId); // Reference to the chat document

        // Update the 'messageRequest' field
        await updateDoc(chatRef, {
          messageRequest: false,
        });
      } else {
        console.log("No chat found between these users.");
      }
    } catch (error) {
      toast.dismiss();
      toast.error("Error accepting follow request");
      console.error(error);
    }
  };

  // block a user
  const handleBlock = async (userId, chatId) => {
    if (!currentUser) return;
    try {
      toast.loading("processing...");
      const currentUserRef = doc(db, "users", currentUser);
      if (currentUserData?.blockedUsers?.includes(userId)) {
        await Promise.all([
          updateDoc(currentUserRef, {
            blockedUsers: arrayRemove(userId),
            blockedChats: arrayRemove(chatId),
          }),
        ]);
        toast.dismiss();
        toast.success("Unblocked");
      } else {
        await Promise.all([
          updateDoc(currentUserRef, {
            blockedUsers: arrayUnion(userId),
            blockedChats: arrayUnion(chatId),
          }),
        ]);
        toast.dismiss();
        toast.success("Blocked");
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        followRequestsData,
        setFollowRequestsData,
        fetchFollowRequests,
        acceptFollowRequest,
        currentUserData,
        handleFetchCurrentUserData,
        login,
        loginCredentials,
        setLoginCredentials,
        allUsers,
        handleFetchUsersData,
        updatePasswordStatus,
        handleSignInWithGoogle,
        handleBlock,
        isLoading,
        loading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const AuthContext = createContext();
