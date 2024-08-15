import React, { useContext, useEffect, useRef, useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { auth, db, storage } from "../firebase";
import { Link, useNavigate } from "react-router-dom";
import { BsEye, BsEyeSlash } from "react-icons/bs";
import { FaUserPlus } from "react-icons/fa";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import ThemeContext from "../context/Theme/ThemeContext";
import { EmailVerification } from "./NeverBounceEmailVerification";

const SignUp = () => {
  const imageRef = useRef();
  const { theme } = useContext(ThemeContext);

  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [file, setFile] = useState("");
  const navigate = useNavigate();
  const [passwordType, setPasswordType] = useState("password");
  const [loading, setLoading] = useState(null);

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
        (snapshot) => (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
        (error) => {
          console.log(error);
          // setError(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
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

  const generateUsername = (name) => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `${name}${randomDigits}`;
  };
  const username = data.name.split(" ");
  const updatedName = username[0];
  const generateUser_name = generateUsername(updatedName);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!data.email) {
      setError("No email address provided");
      return;
    }
    try {
      setLoading(true); 
      // Perform email verification
      const result = await EmailVerification(data.email);

      if (result.status === "invalid") {
        setError("Invalid email");
        return
      }
      // Create user with email and password
      const response = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      // Set user data in Firestore
      await setDoc(doc(db, "users", response.user.uid), {
        ...data,
        followers: data.followers || [],
        following: data.following || [],
        user_name: generateUser_name,
        timeStamp: serverTimestamp(),
        accountType: "private",
      });
      setData({
        name: "",
        email: "",
        password: "",
      });
      setFile("");
      localStorage.setItem("currentUser", response.user.uid);
      navigate("/userProfile");
      console.log(response.user, data);
      await sendEmailVerification(response.user);
    } catch (error) {
      console.error(error);
      setError("Email already in use");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className={`flex flex-col items-center justify-center min-h-screen w-screen max-w-[430px] ${
          theme === "dark" ? "bg-zinc-950 text-zinc-200" : "bg-white text-black"
        } bg-inherit space-y-3`}
      >
        <h1 className="text-2xl font-medium my-6">Sign Up Now</h1>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col justify-center space-y-4"
        >
          <div className="flex justify-center w-72">
            {!file ? (
              <div>
                <FaUserPlus onClick={handleImageOnChange} size={45} />
                <input
                  name="image"
                  className="hidden"
                  ref={imageRef}
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])} // Corrected this line
                />
              </div>
            ) : (
              <img className="h-16 w-16 rounded-full" src={data.img} alt="" />
            )}
          </div>
          <input
            className="border-[1px] border-zinc-600 rounded-md w-72 p-2 bg-inherit focus:outline-none"
            type="text"
            name="name"
            id="name"
            required
            placeholder="Name"
            value={data.name}
            onChange={onChange}
          />
          <input
            className="border-[1px] border-zinc-600 rounded-md w-72 p-2 bg-inherit focus:outline-none"
            type="email"
            name="email"
            id="email"
            required
            placeholder="Email"
            value={data.email}
            onChange={onChange}
          />
          <div className="flex justify-between items-center border-[1px] border-zinc-600 rounded-md w-72 p-2 bg-inherit">
            <input
              className="bg-inherit focus:placeholder:text-gray-300 focus:outline-none"
              type={passwordType}
              name="password"
              id="password"
              required
              placeholder="Password"
              value={data.password}
              onChange={onChange}
            />
            <span
              className="mx-2 cursor-pointer"
              onClick={handleTogglePasswordType}
            >
              {passwordType === "password" ? <BsEye /> : <BsEyeSlash />}
            </span>
          </div>
          {loading === false && (
            <span className="text-red-600 text-sm my-1">{error}</span>
          )}
          <button
            disabled={
              data.password.length === 0 ||
              data.email.length === 0 ||
              data.name.length === 0
            }
            className={` ${
              data.password.length === 0 ||
              data.email.length === 0 ||
              data.name.length === 0
                ? "cursor-not-allowed text-zinc-400"
                : "cursor-pointer text-white"
            } border-[1px] border-zinc-600 flex justify-center rounded-md w-72 p-2`}
            type="submit"
          >
            {loading ? (
              <AiOutlineLoading3Quarters className="animate-spin my-1" />
            ) : (
              "Submit"
            )}
          </button>
          <span>
            Already Registered? &nbsp;
            <Link className="text-blue-500 font-medium" to="/login">
              Log In
            </Link>
          </span>
        </form>
      </div>
    </>
  );
};

export default SignUp;
