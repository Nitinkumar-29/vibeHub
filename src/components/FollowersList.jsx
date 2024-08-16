import {
  arrayRemove,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import React, { useContext, useEffect, useState } from "react";
import { db } from "../firebase";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";

const FollwersList = () => {
  const [followersList, setFollowersList] = useState([]);
  const { userId } = useParams();
  const currentUser = localStorage.getItem("currentUser");
  const { currentUserData, handleFollow } = useContext(AuthContext);
  let isOwner = userId === currentUser;
  const [followerId, setFollowerId] = useState("");

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
    setFollowersList(followersData);
  };

  useEffect(() => {
    if (!followerId) return;
    const docRef = doc(db, "users", followerId);
    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
      try {
        handleFetchFollowersList();
        setFollowerId("");
        return () => unsubscribe();
      } catch (error) {}
    });
    // eslint-disable-next-line
  }, [followerId]);

  // handleRemoveFollower
  const handleRemoveFollower = async (id) => {
    try {
      toast.loading("Removing....");
      const docRef = doc(db, "users", currentUser);
      const docSnap = await getDoc(docRef);
      const targetRef = doc(db, "users", id);
      const docSnapShot = docSnap.exists ? docSnap.data() : [];
      const currentUserFollowersList = docSnapShot.followers;

      let updatedList;

      // check whether the currentuserid is your id
      if (currentUserFollowersList.includes(id)) {
        await Promise.all([
          updateDoc(docRef, { followers: arrayRemove(id) }),
          updateDoc(targetRef, {
            following: arrayRemove(currentUser),
          }),
        ]);
        updatedList = followersList.filter((follower) => follower.id !== id);
        setFollowersList(updatedList);
        toast.dismiss();
        toast.success("Removed");
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
              if (a.id === currentUser) {
                return -1;
              } else if (b.id === currentUser) {
                return 1;
              }
              return a.user_name;
            })
            .map((follower, index) => {
              return (
                <div
                  className="flex justify-start items-center space-x-4 w-full"
                  key={index}
                >
                  <div className="">
                    <img
                      src={follower?.data?.img}
                      className="h-12 w-12 object-cover rounded-full"
                      alt=""
                    />
                  </div>
                  <Link
                    to={
                      follower.id === currentUser
                        ? `/userProfile/yourPosts`
                        : `/users/${follower.id}/profile`
                    }
                    className="flex flex-col flex-1"
                  >
                    <span>
                      {follower?.data?.name && follower?.data?.name?.length > 13
                        ? `${follower?.data?.name.slice(0, 13)}...`
                        : follower?.data?.name}
                    </span>
                    <span className="text-sm text-gray-400">
                      {follower?.data?.user_name}
                    </span>
                  </Link>

                  {!isOwner && (
                    <div className="ml-auto">
                      {follower?.data?.followers?.includes(currentUser) ? (
                        <button
                          onClick={() => {
                            handleFollow(follower.id);
                            setFollowerId(follower.id);
                          }}
                          className="text-center px-2 py-1 border-[1px] border-gray-700 text-yellow-600 rounded-md w-28"
                        >
                          Following
                        </button>
                      ) : (
                        <div className="flex items-center">
                          {follower.id === currentUser ? (
                            <span className="text-center px-2 py-1 text-green-600 rounded-md w-28">
                              You
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                handleFollow(follower.id);
                                setFollowerId(follower.id);
                              }}
                              className="text-center px-2 py-1 border-[1px] border-gray-700 rounded-md w-28"
                            >
                              {!follower?.data?.followers.includes(
                                currentUser
                              ) &&
                              follower?.data?.followRequests?.includes(
                                currentUser
                              ) ? (
                                <span className="text-orange-600">
                                  Requested
                                </span>
                              ) : (
                                <span className="text-blue-600">Follow</span>
                              )}
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
                        }}
                        className="text-center px-3 py-2 border-[1px] border-gray-700 text-red-600 rounded-md w-28"
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
          <span className="text-zinc-400">0 followers</span>
        </div>
      )}
    </div>
  );
};

export default FollwersList;
