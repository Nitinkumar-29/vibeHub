import { createContext, useEffect, useReducer, useState } from "react";
import AuthReducer from "./AuthReducer";
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import toast from "react-hot-toast";

const INITIAL_STATE = {
  currentUser: JSON.parse(localStorage.getItem("user")) || null,
};

export const AuthContext = createContext(INITIAL_STATE);

export const AuthContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(AuthReducer, INITIAL_STATE);
  const [followRequestsData, setFollowRequestsData] = useState([]);

  const fetchFollowRequests = async () => {
    if (!state.currentUser || !state.currentUser.uid) {
      console.log("Invalid user ID");
      return [];
    }

    try {
      const userRef = doc(db, "users", state.currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        console.log("User does not exist");
        return [];
      }

      const userData = userSnap.data();
      const requests = userData?.followRequests || [];

      console.log("Follow Requests:", requests);

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

      console.log("Users Data:", usersData);

      return usersData;
    } catch (error) {
      console.error("Error fetching follow requests:", error);
      return [];
    }
  };
  // accpet follow reuests
  const acceptFollowRequest = async (id) => {
    toast.loading("processing....");
    if (!state.currentUser.uid) return "not valid id";

    try {
      const userRef = doc(db, "users", state.currentUser.uid);
      const targetRef = doc(db, "users", id);
      await Promise.all([
        updateDoc(userRef, {
          followers: arrayUnion(id),
          followRequests: arrayRemove(id),
        }),
        updateDoc(targetRef, {
          following: arrayUnion(state.currentUser.uid),
        }),
      ]);
      // Fetch and update the follow requests after acceptance
      const updatedFollowRequests = await fetchFollowRequests();
      setFollowRequestsData(updatedFollowRequests);
      toast.dismiss();
      toast.success("accepted!");
    } catch (error) {
      toast.dismiss();
      toast.error("Error accepting follow request");
      console.error(error);
    }
    fetchFollowRequests();
  };

  useEffect(() => {
    localStorage.setItem("user", JSON.stringify(state.currentUser));
  }, [state.currentUser]);

  return (
    <AuthContext.Provider
      value={{
        currentUser: state.currentUser,
        dispatch,
        fetchFollowRequests,
        acceptFollowRequest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
