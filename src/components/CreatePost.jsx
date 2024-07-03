import React, { useContext, useEffect, useRef, useState } from "react";
import { AiOutlineClose } from "react-icons/ai";
import { TfiArrowCircleLeft } from "react-icons/tfi";
import { AuthContext } from "../context/AuthContext";
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db, storage } from "../firebase";
import { BiLoader, BiZoomIn } from "react-icons/bi";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { TiAttachmentOutline } from "react-icons/ti";
import { VscMention } from "react-icons/vsc";
import PostContext from "../context/PostContext/PostContext";

const CreatePost = () => {
  const inputRef = useRef();
  const navigate = useNavigate();
  const [isPublished, setIsPublished] = useState(null);
  const { currentUser } = useContext(AuthContext);
  const { files, setFiles } = useContext(PostContext);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [newPostData, setNewPostData] = useState({
    name: "",
    email: "",
    postCaption: "",
  });
  const [userProfileImage, setUserProfileImage] = useState("");

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
  };

  const removeFile = (indexToRemove) => {
    setFiles((prevFiles) =>
      prevFiles.filter((_, index) => index !== indexToRemove)
    );
  };

  const onChange = (e) => {
    setNewPostData({ ...newPostData, [e.target.name]: e.target.value });
  };

  const handleFetchUserData = async () => {
    if (currentUser && currentUser.email) {
      const q = query(
        collection(db, "users"),
        where("email", "==", currentUser.email)
      );
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        console.log(userData);
        setCurrentUserData(userData);
        setUserProfileImage(userData.img); // Set existing image URL
      });
    }
  };

  useEffect(() => {
    if (currentUser) {
      handleFetchUserData();
    }
    // eslint-disable-next-line
  }, [currentUser]);

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
            console.log("Upload is " + progress + "% done");

            switch (snapshot.state) {
              case "paused":
                console.log("Upload is paused");
                break;
              case "running":
                console.log("Upload is running");
                break;
              default:
                break;
            }
          },
          (error) => {
            console.log(error);
            reject(error);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log("File available at", downloadURL);
            resolve(downloadURL);
          }
        );
      });
    });

    return Promise.all(uploadPromises);
  };

  const handleUploadUserProfileImage = async () => {
    if (!userProfileImage || typeof userProfileImage === "string")
      return userProfileImage; // Return existing URL if not a new file

    const name = new Date().getTime() + "_" + userProfileImage.name;
    const storageRef = ref(storage, name);
    const uploadTask = uploadBytesResumable(storageRef, userProfileImage);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log("Upload is " + progress + "% done");

          switch (snapshot.state) {
            case "paused":
              console.log("Upload is paused");
              break;
            case "running":
              console.log("Upload is running");
              break;
            default:
              break;
          }
        },
        (error) => {
          console.log(error);
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log("File available at", downloadURL);
          resolve(downloadURL);
        }
      );
    });
  };

  const handleSavePost = async () => {
    setIsPublished(false);
    const fileURLs = await handleUploadFiles();
    const userProfileImageURL = await handleUploadUserProfileImage();
    const { postCaption } = newPostData;
    const name = currentUserData?.name;
    const email = currentUserData?.email;

    try {
      setIsPublished(false);
      const postPublished = await addDoc(collection(db, "posts"), {
        name: name,
        email: email,
        postCaption: postCaption,
        fileURLs: fileURLs,
        userId: currentUser.uid,
        userProfileImage: userProfileImageURL,
        timeStamp: serverTimestamp(),
      });
      console.log("Post created and published", postPublished.id);
      console.log(postPublished);
      setIsPublished(true);

      toast.success("Post published");
      navigate("/");
      setNewPostData({
        name: "",
        email: "",
        postCaption: "",
      });
      setFiles([]);
    } catch (error) {
      setIsPublished(false);
      console.error(error);
    }
  };

  return (
    <div className="text-white flex justify-center w-screen max-w-[430px] bg-zinc-950 h-screen">
      <div className="relative flex flex-col items-center justify-center space-y-1 w-full min-h-[90%] max-h-screen">
        <div className="z-10 top-2 absolute  bg-zinc-900 w-[95%]">
          <div className="flex justify-between items-center w-full rounded-md h-12 p-2 border-[1px] border-blue-800">
            <span
              onClick={() => {
                navigate(-1);
              }}
              className="p-1 rounded-md duration-200 cursor-pointer"
            >
              <TfiArrowCircleLeft size={25} />
            </span>
            <span>Create Post</span>
            <button
              className="p-1 rounded-md duration-200 cursor-pointer"
              onClick={handleSavePost}
            >
              {isPublished === null && "Publish"}
              {isPublished === false && (
                <BiLoader size={25} className="animate-spin" />
              )}
            </button>
          </div>
        </div>
        <div className="h-[80%] w-[95%] bg-zinc-900 rounded-md py-2">
          <form className="relative w-full h-full overflow-y-auto">
            <div className="h-fit flex space-x-4 w-full justify-start p-3">
              {currentUserData?.img && (
                <img
                  src={currentUserData.img}
                  className="h-12 w-12 duration-200 rounded-full border-[1px] border-blue-800"
                  alt=""
                  value={currentUserData.userProfileImage}
                />
              )}
              <div className="flex flex-col space-y-1">
                <span className="font-medium">{currentUserData?.name}</span>
                <span>{currentUserData?.email}</span>
              </div>
            </div>
            <div className="w-full h-fit p-2 border-t-[1px] border-blue-900">
              <textarea
                type="text"
                className="w-full focus:outline-none p-2 my-1 bg-zinc-950 rounded-md placeholder:text-zinc-400"
                placeholder={`What's on your mind, ${currentUserData?.name} ?`}
                rows={4}
                name="postCaption"
                onChange={onChange}
                required
                value={newPostData.postCaption}
              />
              <input
                ref={inputRef}
                hidden
                type="file"
                multiple
                accept="image/*, video/*"
                onChange={handleFileChange}
              />
              <div className="flex items-center justify-between mb-2 p-2 rounded-md bg-zinc-950 w-full">
                <span>Add media</span>
                <div className="flex items-center space-x-2">
                  <TiAttachmentOutline
                    onClick={() => {
                      inputRef.current.click();
                    }}
                    size={23}
                    className="cursor-pointer"
                  />
                  <VscMention size={25} className="cursor-pointer" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 h-fit py-2 w-full overflow-y-auto mx-auto">
                {files.map((file, index) => (
                  <div key={index} className="relative">
                    {file.type.startsWith("image/") && (
                      <div className="w-fit relative">
                        <img
                          onMouseDown={BiZoomIn}
                          src={URL.createObjectURL(file)}
                          alt="preview"
                          className="w-[10rem] h-[10rem] object-cover rounded-md"
                        />
                        <span
                          onClick={() => removeFile(index)}
                          className="absolute -top-1 -right-1 p-2 bg-gray-800 text-white rounded-full"
                        >
                          <AiOutlineClose size={16} />
                        </span>
                      </div>
                    )}
                    {file.type.startsWith("video/") && (
                      <div className="relative w-full m-1">
                        <video
                          controls
                          className="h-[10rem] border-2 w-[10rem] object-cover rounded-md"
                        >
                          <source
                            src={URL.createObjectURL(file)}
                            type={file.type}
                          />
                        </video>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute -top-2 right-2 p-1 bg-gray-800 text-white rounded-full"
                        >
                          <AiOutlineClose size={20} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
