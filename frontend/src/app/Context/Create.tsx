import { createContext } from "react";

// Define the context type
interface ContextProps {
  getDetail?: () => Promise<void>;
  detail?: any[]; // Adjust based on the structure of your detail object
  calltoast?: (message: string, typee: "success" | "error" | "info" | "warning") => void;
}

// Create the context with the defined type
const a = createContext<ContextProps | undefined>(undefined);

export default a;
