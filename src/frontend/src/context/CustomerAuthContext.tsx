import type { Customer } from "@/backend";
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

export interface CustomerUser {
  id: string;
  name: string;
  phone: string;
}

interface CustomerAuthContextType {
  customer: CustomerUser | null;
  isLoggedIn: boolean;
  token: string | null;
  login: (customer: Customer, token: string) => void;
  logout: () => void;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | null>(null);

const STORAGE_KEY = "cherishables_customer";
const TOKEN_KEY = "cherishables_customer_token";

function loadCustomer(): CustomerUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CustomerUser;
  } catch {
    return null;
  }
}

function loadToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function saveCustomer(customer: CustomerUser | null) {
  if (customer) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customer));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function saveToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<CustomerUser | null>(loadCustomer);
  const [token, setToken] = useState<string | null>(loadToken);

  const login = useCallback((backendCustomer: Customer, authToken: string) => {
    const user: CustomerUser = {
      id: String(backendCustomer.id),
      name: backendCustomer.name,
      phone: backendCustomer.phone,
    };
    setCustomer(user);
    setToken(authToken);
    saveCustomer(user);
    saveToken(authToken);
  }, []);

  const logout = useCallback(() => {
    setCustomer(null);
    setToken(null);
    saveCustomer(null);
    saveToken(null);
  }, []);

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        isLoggedIn: !!customer,
        token,
        login,
        logout,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx)
    throw new Error("useCustomerAuth must be used within CustomerAuthProvider");
  return ctx;
}
