import React, { useContext, useEffect, useRef, useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { auth, db, storage } from "../firebase";
import { AuthContext } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { BiPlus, BiPlusCircle } from "react-icons/bi";
import { BsEye, BsEyeSlash, BsPlusCircleDotted } from "react-icons/bs";

const SignUp = () => {
  const imageRef = useRef();

  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
    mobileNumber: "",
    address: "",
  });
  const [file, setFile] = useState("");
  const { dispatch } = useContext(AuthContext);
  const navigate = useNavigate();
  const [passwordType, setPasswordType] = useState("password");

  const handleTogglePasswordType = () => {
    if (passwordType === "password") {
      setPasswordType("text");
    } else {
      setPasswordType("password");
    }
  };
  const handleImageOnChange = (e) => {
    imageRef.current.click();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  useEffect(() => {
    const handleUploadFile = () => {
      const name = new Date().getTime() + "_" + file.name;
      const storageRef = ref(storage, name); // Create a reference with the desired file path
      const uploadTask = uploadBytesResumable(storageRef, file);

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
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            console.log("File available at", downloadURL);
            setData((prev) => ({ ...prev, img: downloadURL }));
          });
        }
      );
    };
    if (file) handleUploadFile();
  }, [file]);

  const onChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      await setDoc(doc(db, "users", response.user.uid), {
        ...data,
        timeStamp: serverTimestamp(),
      });
      setData({
        name: "",
        email: "",
        password: "",
        mobileNumber: "",
        address: "",
      });
      setFile("");
      dispatch({ type: "SIGNUP", payload: response.user });
      console.log(response.user, data);
      navigate("/userProfile");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <div className="flex items-center h-[100vh] w-full bg-gradient-to-br from-slate-800 to-slate-600 text-white">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col w-fit mx-auto justify-center h-[98vh] shadow-lg shadow-slate-900 rounded-md items-center"
        >
          <h2 className="my-4 text-4xl font-bold font-serif bg-gradient-to-r from-red-600 via-green-500 to-indigo-400 inline-block text-transparent bg-clip-text">
            vibeHub
          </h2>
          <p className="w-3/4 mb-8 text-sm text-center text-gray-200">
            Sign up to see photos and videos from your friends
          </p>
          <div className="flex flex-col items-center w-full space-y-4">
            <div className="flex justify-center w-3/4">
              {!file ? (
                <div
                  onClick={handleImageOnChange}
                  className="flex flex-col items-center justify-center space-y-1"
                >
                  <BsPlusCircleDotted size={45} />
                  <span className="font-thin">Choose a photo</span>
                </div>
              ) : (
                <div>
                  <img
                    className="h-16 w-16 rounded-full"
                    src={data.img}
                    alt=""
                  />
                </div>
              )}
              <input
                name="image"
                className="hidden"
                ref={imageRef}
                type="file"
                onChange={(e) => setFile(e.target.files[0])} // Corrected this line
              />
            </div>
            <input
              className="bg-transparent w-3/4 border-[1px] border-white rounded-md py-2 text-sm px-2 focus:placeholder:text-gray-300 focus:outline-none"
              type="text"
              name="name"
              id="name"
              placeholder="name"
              value={data.name}
              onChange={onChange}
            />
            <input
              className="bg-transparent w-3/4 border-[1px] border-white rounded-md py-2 text-sm px-2 focus:placeholder:text-gray-300 focus:outline-none"
              type="email"
              name="email"
              id="email"
              placeholder="email"
              value={data.email}
              onChange={onChange}
            />
            <div className="flex items-center justify-between w-3/4 border-[1px] border-white rounded-md text-sm">
              <input
                className="bg-transparent  focus:placeholder:text-gray-300 focus:outline-none p-2"
                type={passwordType}
                name="password"
                id="password"
                placeholder="password"
                value={data.password}
                onChange={onChange}
              />
              <span className="mx-2" onClick={handleTogglePasswordType}>
                {passwordType === "password" ? <BsEye /> : <BsEyeSlash />}
              </span>
            </div>
            <input
              className="bg-transparent w-3/4 border-[1px] border-white rounded-md py-2 text-sm px-2 focus:placeholder:text-gray-300 focus:outline-none"
              type="text"
              name="address"
              id="address"
              placeholder="address"
              value={data.address}
              onChange={onChange}
            />
            <input
              className="bg-transparent w-3/4 border-[1px] border-white rounded-md py-2 text-sm px-2 focus:placeholder:text-gray-300 focus:outline-none"
              type="phone"
              name="mobileNumber"
              id="mobileNumber"
              placeholder="mobile number"
              value={data.mobileNumber}
              onChange={onChange}
            />
          </div>
          <button
            className="mx-auto px-4 py-2 w-3/4 border-[1px] border-white rounded-md mt-5 bg-slate-500 hover:bg-slate-600 duration-200"
            type="submit"
          >
            Submit
          </button>
          <div className="mt-5">
            <div>
              <span>Already registered ?</span>{" "}
              <Link className="text-blue-400 font-medium" to="/login">
                Log In
              </Link>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default SignUp;
