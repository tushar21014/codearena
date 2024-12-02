import React, { createContext, ReactNode, FC, useContext } from "react";
import { toast, ToastContent } from "react-toastify";


interface ContextProps {
  calltoast: (message: string | ToastContent, typee: "success" | "error" | "info" | "warning") => void;
}

// Create context with default values
const DetailsContext = createContext<ContextProps | undefined>(undefined);

export const ToastProvider: FC<{ children: ReactNode }> = ({ children }) => {

  // Toast function
  const calltoast = (message: string | ToastContent, typee: "success" | "error" | "info" | "warning") => {
    toast[typee](message, {
      position: "bottom-right",
      autoClose: 10000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: false,
      progress: undefined,
      theme: "colored",
    });
  };

  return (
    <DetailsContext.Provider value={{ calltoast }}>
      {children}
    </DetailsContext.Provider>
  );
};

export const useToastContext = () => {
  const context = useContext(DetailsContext);
  if (context === undefined) {
    throw new Error("useToastContext must be used within a ToastProvider");
  }
  return context;
};

export default DetailsContext;
