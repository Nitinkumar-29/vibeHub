import React, { useContext, useEffect, useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { auth, db, storage } from "../firebase";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const SignUp = () => {
  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
    mobileNumber: "",
    address: "",
  });
  const [file, setFile] = useState("");
  const { dispatch } = useContext(AuthContext);
  const navigate= useNavigate()

  useEffect(() => {
    const handleUploadFile = () => {
      const name = new Date().getTime() + '_' + file.name;
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
      setFile("")
      dispatch({ type: "SIGNUP", payload: response.user});
      console.log(response.user, data);
      navigate("/userProfile")
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <div>
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            width: "fit-content",
            margin: "0px auto",
          }}
        >
          <h2>Create Account</h2>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              width: "fit-content",
              margin: "0px auto",
            }}
          >
            <input
              style={{
                margin: "4px auto",
                width: "fit-content",
                border: "2px solid black",
              }}
              type="file"
              onChange={(e) => setFile(e.target.files[0])} // Corrected this line
            />
            <input
              style={{ margin: "4px auto" }}
              type="text"
              name="name"
              id="name"
              placeholder="name"
              value={data.name}
              onChange={onChange}
            />
            <input
              style={{ margin: "4px auto" }}
              type="email"
              name="email"
              id="email"
              placeholder="email"
              value={data.email}
              onChange={onChange}
            />
            <input
              style={{ margin: "4px auto" }}
              type="password"
              name="password"
              id="password"
              placeholder="password"
              value={data.password}
              onChange={onChange}
            />
            <input
              style={{ margin: "4px auto" }}
              type="text"
              name="address"
              id="address"
              placeholder="address"
              value={data.address}
              onChange={onChange}
            />
            <input
              style={{ margin: "4px auto" }}
              type="phone"
              name="mobileNumber"
              id="mobileNumber"
              placeholder="mobile number"
              value={data.mobileNumber}
              onChange={onChange}
            />
          </div>
          <button style={{ margin: "10px auto" }} type="submit">
            Submit
          </button>
        </form>
      </div>
    </>
  );
};

export default SignUp;
