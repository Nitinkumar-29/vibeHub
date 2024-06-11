import React, { useContext, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { dispatch } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    await signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        console.log(user);
        navigate("/");
        dispatch({ type: "LOGIN", payload: user });
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error(errorCode, errorMessage);
      });
  };
  return (
    <div>
      <form
        onSubmit={handleLogin}
        className="flex flex-col text-2xl justify-center w-fit mx-auto "
        // style={{
        //   display: "flex",
        //   flexDirection: "column",
        //   justifyContent: "center",
        //   width: "fit-content",
        //   margin: "0px auto",
        // }}
      >
        <h1 style={{ margin: "2px auto" }}>Log in</h1>
        <input
          name="email"
          onChange={(e) => setEmail(e.target.value)}
          style={{ margin: "2px 0px" }}
          type="email"
          placeholder="Enter email"
        />
        <input
          name="password"
          onChange={(e) => setPassword(e.target.value)}
          style={{ margin: "2px 0px" }}
          type="password"
          placeholder="Enter password"
        />
        <button style={{ margin: "2px 0px" }} type="submit">
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
