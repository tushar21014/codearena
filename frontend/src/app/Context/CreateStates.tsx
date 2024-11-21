import React, { useState, createContext, ReactNode, FC } from "react";
import { toast } from "react-toastify";

// Define the context type
interface Detail {
  email?: string;
  name?: string;
  phone?: string;
  [key: string]: any; // Add if the structure is dynamic
}

interface ContextProps {
  getDetail: () => Promise<void>;
  detail: Detail[];
  calltoast: (message: string, typee: "success" | "error" | "info" | "warning") => void;
}

// Create context with default values
const CreateContext = createContext<ContextProps | undefined>(undefined);

export const CreateState: FC<{ children: ReactNode }> = ({ children }) => {
  const [detail, setDetail] = useState<Detail[]>([]);

  // Toast function
  const calltoast = (message: string, typee: "success" | "error" | "info" | "warning") => {
    toast[typee](message, {
      position: "bottom-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: false,
      progress: undefined,
      theme: "colored",
    });
  };

  // Fetch user details
  const getDetail = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/auth/getuser`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth-token": localStorage.getItem("auth-Token") || "",
        },
      });
      const json = await response.json();
      setDetail(json);
      console.log(detail);
    } catch (error) {
      console.error("Error fetching details:", error);
    }
  };

  return (
    <CreateContext.Provider value={{ getDetail, detail, calltoast }}>
      {children}
    </CreateContext.Provider>
  );
};

export default CreateContext;
