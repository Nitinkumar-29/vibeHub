import { createContext, useEffect, useState } from "react";
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import toast from "react-hot-toast";
import {
  getRedirectResult,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
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
    try {
      const result = await signInWithEmailAndPassword(
        auth,
        loginCredentials.email,
        loginCredentials.password
      );
      const user = result.user;

      // Update password in Firestore
      await updatePasswordStatus();

      // Set localStorage after successful login
      localStorage.setItem("currentUser", user.uid);

      // Ensure state is updated before navigation
      setIsLoading(false);
      setLoginCredentials({ email: "", password: "" });

      // Wait until everything is ready, then navigate
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
      setIsLoading(false);
      setLoading(false);
      setError("Invalid credentials");
    }
  };

  const generateUsername = (name) => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000); // Generates a random number between 1000 and 9999
    return `${name}${randomDigits}`;
  };

  // Sign in with Google
  const handleSignInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        await signInWithRedirect(auth, provider);
        await handleRedirectResult();
      } else {
        const result = await signInWithPopup(auth, provider);
        await handleUser(result.user);
      }
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  // Handle redirect result for mobile devices
  const handleRedirectResult = async () => {
    try {
      const result = await getRedirectResult(auth);
      if (result?.user) {
        console.log("Redirect result user:", result.user);
        await handleUser(result.user);
      }
    } catch (error) {
      console.error("Error handling redirect result:", error);
    }
  };

  // Process user data after sign-in
  const handleUser = async (user) => {
    if (!user) {
      throw new Error("User not found");
    }

    // Store user UID in local storage
    localStorage.setItem("currentUser", user.uid);

    // Reference to the user's document in Firestore
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      // If the user document doesn't exist, create it
      const username = user.displayName?.split(" ");
      const updatedName = username ? username[0] : "User";
      const generateUser_name = generateUsername(updatedName);

      await setDoc(userDocRef, {
        name: user.displayName,
        email: user.email,
        img: user.photoURL, // Correct property for photo URL
        timeStamp: serverTimestamp(),
        accountType: "private",
        user_name: generateUser_name,
      });
    } else {
      console.log("User document already exists:", user.uid);
    }

    // Navigate to home page after successful sign-in
    navigate("/");
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

      const chatsRef = collection(db, "chats");
      const chatQuery = query(
        chatsRef,
        where("participants", "array-contains", currentUser)
      );
      const chatSnapshot = await getDocs(chatQuery);
      const chatDocs = chatSnapshot.docs.filter((doc) => {
        const chatData = doc.data();
        return chatData.participants.includes(userId);
      });

      if (chatDocs.length > 0) {
        const chatDoc = chatDocs[0];
        const chatId = chatDoc.id;
        const chatRef = doc(db, "chats", chatId); 
        await updateDoc(chatRef, {
          messageRequest: false,
        });
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

  const handleFollow = async (userId) => {
    if (!userId) return;
    try {
      const targetUserRef = doc(db, "users", userId);
      const currentUserRef = doc(db, "users", currentUser);
      const targetUserSnap = await getDoc(targetUserRef);

      if (targetUserSnap.exists()) {
        const targetUserSnapShot = targetUserSnap.exists
          ? targetUserSnap.data()
          : {};
        if (targetUserSnapShot?.followers?.includes(currentUser)) {
          // Unfollow the user
          await Promise.all([
            updateDoc(targetUserRef, {
              followers: arrayRemove(currentUser),
            }),
            updateDoc(currentUserRef, {
              following: arrayRemove(userId),
            }),
          ]);
        } else {
          if (targetUserSnapShot?.accountType === "private") {
            if (!targetUserSnapShot?.followRequests?.includes(currentUser)) {
              await Promise.all([
                updateDoc(targetUserRef, {
                  followRequests: arrayUnion(currentUser),
                }),
              ]);
            } else {
              await Promise.all([
                updateDoc(targetUserRef, {
                  followRequests: arrayRemove(currentUser),
                }),
              ]);
            }
          } else {
            // Follow the user
            await Promise.all([
              updateDoc(targetUserRef, {
                followers: arrayUnion(currentUser),
              }),
              updateDoc(currentUserRef, {
                following: arrayUnion(userId),
              }),
            ]);
          }
        }
      }
    } catch (error) {
      console.error("Error updating followers:", error);
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
        setError,
        handleFollow,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const AuthContext = createContext();
