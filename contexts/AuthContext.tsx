import { ReactNode, createContext, useEffect, useState } from "react";
import { api } from "../services/apiClient";
import Router from 'next/router'
import { setCookie, parseCookies, destroyCookie } from 'nookies'

type SignInCredentials = {
  email: string;
  password: string;
};

type AuthContextData = {
  signIn(credentials: SignInCredentials): Promise<void>;
  signOut: () => void;
  isAuthenticated: boolean;
  user?: User;
};

type AuthProviderProps = {
  children: ReactNode;
};

type User = {
  email: string;
  permissions: string[];
  roles: string[]
}

export function signOut(broadcast = true) {
  destroyCookie(undefined, 'nextauth.token')
  destroyCookie(undefined, 'nextauth.refreshToken')

  if (broadcast) {
    authChannel.postMessage('sign-out')
  }

  Router.push('/')
}

export const AuthContext = createContext({} as AuthContextData);

let authChannel: BroadcastChannel

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>();
  const isAuthenticated = !!user;

  useEffect(() => {
    authChannel = new BroadcastChannel('sign-out')
    authChannel.onmessage = (message) => {
      switch (message.data) {
        case 'sign-out':
          signOut(false)
          break;
        default:
          break;
      }
    }
  })

  useEffect(() => {
    const cookies = parseCookies();
    const { 'nextauth.token': token } = cookies;
    if (token) {
      api.get('/me').then(response => {
        const { email, permissions, roles } = response?.data
        setUser({ email, permissions, roles })
      })
        .catch(error => {
          signOut();

        })
    }
  }, [])

  async function signIn({ email, password }: SignInCredentials) {
    try {
      const response = await api.post("/sessions", { email, password });
      const { token, refreshToken, permissions, roles } = response?.data

      setUser({
        email,
        permissions,
        roles
      })

      setCookie(undefined, 'nextauth.token', token, {
        maxAge: 60 * 60 * 24 * 30, // 1 mês
        path: '/' // Pages que tem acesso ao cookie (/ quer dizer todas as páginas da aplicação)
      })

      setCookie(undefined, 'nextauth.refreshToken', refreshToken, {
        maxAge: 60 * 60 * 24 * 30, // 1 mês
        path: '/' // Pages que tem acesso ao cookie (/ quer dizer todas as páginas da aplicação)
      })

      api.defaults.headers['Authorization'] = `Bearer ${token}`

      Router.push('/dashboard')

    } catch (error) {
      console.log(error)
    }
  }
  return (
    <AuthContext.Provider
      value={{
        signIn,
        isAuthenticated,
        user,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
