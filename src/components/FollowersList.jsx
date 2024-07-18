import {
  arrayRemove,
  arrayUnion,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import React, { useContext, useEffect, useState } from "react";
import { db } from "../firebase";
import PostContext from "../context/PostContext/PostContext";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { CgSpinner } from "react-icons/cg";

const FollwersList = () => {
  const { currentUser } = useContext(PostContext);
  const [followersList, setFollowersList] = useState([]);
  const { userId } = useParams();
  let isOwner = userId === currentUser.uid;
  // Handle follow/unfollow
  const handleManageFollow = async (id) => {
    try {
      toast.loading("Processing your request");
      const targetUserRef = doc(db, "users", id);
      const currentUserRef = doc(db, "users", currentUser.uid);
      const targetUserSnap = await getDoc(targetUserRef);
      const currentUserSnap = await getDoc(currentUserRef);

      if (targetUserSnap.exists() && currentUserSnap.exists()) {
        const targetUserSnapShot = targetUserSnap.data();
        const currentUserSnapShot = currentUserSnap.data();

        // Ensure followers and following fields are arrays
        const targetUserFollowers = targetUserSnapShot.followers || [];
        const currentUserFollowing = currentUserSnapShot.following || [];
        let updatedList;
        if (targetUserFollowers.includes(currentUser.uid)) {
          // Unfollow the user
          await Promise.all([
            updateDoc(targetUserRef, {
              followers: arrayRemove(currentUser.uid),
            }),
            updateDoc(currentUserRef, {
              following: arrayRemove(id),
            }),
          ]);
          toast.dismiss();
          toast.success("Unfollowed");
          handleFetchFollowersList();
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
          toast.dismiss();
          const docSnapData = targetUserSnapShot;
          toast.success(`You are now following ${docSnapData.name}`);
          handleFetchFollowersList();
        }
      } else {
        console.log("User document does not exist");
        toast.dismiss();
        toast.error("User not found");
      }
    } catch (error) {
      toast.dismiss();
      toast.error("Error updating followers");
      console.error("Error updating followers:", error);
    }
  };

  const handleFetchFollowersList = async () => {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    const docSnapShot = docSnap.exists ? docSnap.data() : [];

    // follower list
    const followers = docSnapShot.followers;
    const followersData = await Promise.all(
      followers.map(async (follower) => {
        const followerDoc = await getDoc(doc(db, "users", follower));
        const followerData = followerDoc.exists ? followerDoc.data() : [];

        return {
          id: followerDoc.id,
          data: followerData,
        };
      })
    );
    console.log({ followersData });
    setFollowersList(followersData);
    console.log("followers", followersList);
  };

  // handleRemoveFollower
  const handleRemoveFollower = async (id) => {
    try {
      toast.loading("Removing....");
      const docRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(docRef);
      const targetRef = doc(db, "users", id);
      const targetSnap = await getDoc(targetRef);
      const docSnapShot = docSnap.exists ? docSnap.data() : [];
      const targetSnapShot = targetSnap.exists ? targetSnap.data : [];
      const currentUserFollowersList = docSnapShot.followers;
      const targetUserFollowingList = targetSnapShot.following;

      let updatedList;

      // check whether the currentuserid is your id
      if (currentUserFollowersList.includes(id)) {
        await Promise.all([
          updateDoc(docRef, { followers: arrayRemove(id) }),
          updateDoc(targetRef, {
            following: arrayRemove(currentUser.uid),
          }),
        ]);
        updatedList = followersList.filter((follower) => follower.id !== id);
        setFollowersList(updatedList);
        toast.dismiss();
        toast.success("Removed");
      } else {
        console.log("not found");
      }
    } catch (error) {}
  };

  useEffect(() => {
    handleFetchFollowersList();
    // eslint-disable-next-line
  }, []);

  return (
    <div>
      {followersList.length > 0 ? (
        <div className="h-full w-full flex flex-col items-center space-y-4 px-4 mt-4">
          {followersList
            ?.sort((a, b) => {
              if (a.id === currentUser.uid) {
                return -1;
              } else if (b.id === currentUser.uid) {
                return 1;
              }
              return a.user_name;
            })
            .map((follower, index) => {
              return (
                <div className="flex justify-between w-full" key={index}>
                  <div>
                    <img
                      src={follower?.data?.img}
                      className="h-10 w-10 object-cover rounded-full"
                      alt=""
                    />
                  </div>
                  <Link
                    to={
                      follower.id === currentUser.uid
                        ? `/userProfile/yourPosts`
                        : `/users/${follower.id}/profile`
                    }
                    className="flex flex-col "
                  >
                    <span>{follower?.data?.name}</span>
                    <span className="text-sm text-gray-400">
                      {follower?.data?.user_name}
                    </span>
                  </Link>

                  {!isOwner && (
                    <div>
                      {follower?.data?.followers?.includes(currentUser.uid) ? (
                        <button
                          // eslint-disable-next-line no-undef
                          onClick={() => handleManageFollow(follower.id)}
                          className="px-4 py-2 border-[1px] border-gray-700 rounded-md"
                        >
                          Unfollow &nbsp;
                        </button>
                      ) : (
                        <div className="flex items-center">
                          {follower.id === currentUser.uid ? (
                            <button className="cursor-auto px-8 py-2 ">
                              You
                            </button>
                          ) : (
                            <button
                              // eslint-disable-next-line no-undef
                              onClick={() => handleManageFollow(follower.id)}
                              className="px-4 py-2 border-[1px] border-gray-700 rounded-md"
                            >
                              Follow Back
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {isOwner && (
                    <div>
                      <button
                        onClick={() => {
                          handleRemoveFollower(follower.id);
                          console.log(follower.id, userId, currentUser.uid);
                        }}
                        className="px-4 py-2 border-[1px] border-gray-700 rounded-md"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      ) : (
        <div className="h-20 w-full flex items-center justify-center">
          <CgSpinner className="animate-spin" size={40} />
        </div>
      )}
    </div>
  );
};

export default FollwersList;
