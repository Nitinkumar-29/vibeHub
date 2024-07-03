import { createContext, useState } from "react";

const PostContext = createContext();
export const PostProvider = ({ children }) => {
    const [files, setFiles] = useState([]);

  return <PostContext.Provider value={{files,setFiles}}>{children}</PostContext.Provider>;
};
export default PostContext;
