import React, { useContext, useEffect, useState } from "react";
import { db } from "../firebase";
import {
  arrayRemove,
  arrayUnion,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import toast from "react-hot-toast";
import { Link, useParams } from "react-router-dom";
import PostContext from "../context/PostContext/PostContext";

const FollowingList = () => {
  const { currentUser } = useContext(PostContext);
  const [followingList, setFollowingList] = useState([]);
  const { userId } = useParams();

  const handleFetchFollowingList = async () => {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    const docSnapShot = docSnap.exists ? docSnap.data() : [];

    // follower list
    const followings = docSnapShot.following;
    const followingData = await Promise.all(
      followings.map(async (following) => {
        const followerDoc = await getDoc(doc(db, "users", following));
        const followerData = followerDoc.exists ? followerDoc.data() : [];

        return {
          id: followerDoc.id,
          data: followerData,
        };
      })
    );
    console.log({ followingData });
    setFollowingList(followingData);
    console.log("followers", followingList);
  };

  // Handle follow/unfollow
  const handleManageFollow = async (id) => {
    try {
      const toastId = toast.loading("Processing your request");
      const targetUserRef = doc(db, "users", id);
      const currentUserRef = doc(db, "users", currentUser.uid);
      const targetUserSnap = await getDoc(targetUserRef);
      const currentUserSnap = await getDoc(currentUserRef);

      if (targetUserSnap.exists()) {
        const targetUserSnapShot = targetUserSnap.data();
        const currentUserSnapShot = currentUserSnap.data();
        let updatedList;
        if (targetUserSnapShot.followers.includes(currentUser.uid)) {
          // Unfollow the user
          //   updatedList = followingList.map((user)=>{

          //   })
          await Promise.all([
            updateDoc(targetUserRef, {
              followers: arrayRemove(currentUser.uid),
            }),
            updateDoc(currentUserRef, {
              following: arrayRemove(id),
            }),
          ]);
          toast.dismiss(toastId);
          toast.success("Unfollowed");
          handleFetchFollowingList();
        } else {
          // Follow the user
          await Promise.all([
            updateDoc(targetUserRef, {
              followers: arrayUnion(currentUser.uid),
            }),
            updateDoc(currentUserRef, {
              following: arrayUnion(id),
            }),
          ]);
          toast.dismiss(toastId);
          const docSnapData = targetUserSnapShot;
          toast.success(`You are now following ${docSnapData.name}`);
          handleFetchFollowingList();
        }
        // Fetch and update the user data after updating the followers
        // handleFetchUserData();
        // fetchHomePagePosts();
      } else {
        console.log("User document does not exist");
        toast.dismiss(toastId);
        toast.error("User not found");
      }
    } catch (error) {
      toast.dismiss();
      toast.error("Error updating followers");
      console.error("Error updating followers:", error);
    }
  };

  useEffect(() => {
    handleFetchFollowingList();
    // eslint-disable-next-line
  }, []);
  return (
    <div className="h-full w-full flex flex-col space-y-4 items-center px-4 mt-4">
      {followingList
        .sort((a, b) => {
          if (a.id === currentUser.uid) {
            return -1;
          } else if (b.id === currentUser.uid) {
            return 1;
          }
          return a.user_name;
        })
        .map((following, index) => {
          return (
            <div className="flex justify-between space-x-2 w-full" key={index}>
              <div>
                <img
                  src={following?.data?.img}
                  className="h-10 w-10 object-cover rounded-full"
                  alt=""
                />
              </div>
              <Link
                to={
                  following.id === currentUser.uid
                    ? `/userProfile/yourPosts`
                    : `/users/${following.id}/profile`
                }
                className="flex flex-col"
              >
                <span>{following?.data?.name}</span>
                <span className="text-sm text-gray-400">
                  {following?.data?.user_name}
                </span>
              </Link>
              <div>
                {following?.data?.followers?.includes(currentUser.uid) ? (
                  <button
                    // eslint-disable-next-line no-undef
                    onClick={() => handleManageFollow(following.id)}
                    className="px-4 py-2 border-[1px] border-gray-700 rounded-md"
                  >
                    Unfollow
                  </button>
                ) : (
                  <div className="flex items-center">
                    {following.id === currentUser.uid ? (
                      <button
                        // eslint-disable-next-line no-undef
                        className="cursor-auto px-8  py-2"
                      >
                        You
                      </button>
                    ) : (
                      <button
                        // eslint-disable-next-line no-undef
                        onClick={() => handleManageFollow(following.id)}
                        className="px-4 py-2 border-[1px] border-gray-700 rounded-md"
                      >
                        Follow
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
    </div>
  );
};

export default FollowingList;
