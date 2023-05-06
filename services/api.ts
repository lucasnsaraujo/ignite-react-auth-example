import axios, { Axios, AxiosError, } from "axios";
import { parseCookies, setCookie } from 'nookies'
import Router from 'next/router'
import { signOut } from "../contexts/AuthContext";
import { GetServerSidePropsContext } from "next";

let isRefreshing = false;
let failedRequestsQueue: FailedRequest[] = [];

type FailedRequest = {
  reject: (error: AxiosError) => void;
  resolve: (token: string) => void;
}

type ErrorResponse = {
  code: string;
  error: boolean;
  message: string;
}

export function setupAPIClient(ctx: GetServerSidePropsContext | undefined = undefined) {

  let cookies = parseCookies(ctx);

  const api = axios.create({
    baseURL: "http://localhost:3333",
    headers: {
      Authorization: `Bearer ${cookies['nextauth.token']}`
    }
  });
  
  api.interceptors.response.use(response => response, (error: AxiosError) => {
    if (error?.response?.status === 401) {
      const response = error.response.data as ErrorResponse;
      if (response.code === 'token.expired') {
        cookies = parseCookies(ctx);
  
        const { 'nextauth.refreshToken': refreshToken } = cookies;
  
        const originalConfig = error.config!;
  
        if (!isRefreshing) {
          isRefreshing = true;
          api.post('/refresh', {
            refreshToken
          }).then(response => {
            const { token } = response.data;
            setCookie(ctx, 'nextauth.token', token, {
              maxAge: 60 * 60 * 24 * 30,
              path: '/'
            })
  
            setCookie(ctx, 'nextauth.refreshToken', response.data.refreshToken, { // novo refresh token
              maxAge: 60 * 60 * 24 * 30,
              path: '/'
            })
  
            api.defaults.headers['Authorization'] = `Bearer ${token}`
  
            failedRequestsQueue.forEach(request => request.resolve(token))
            failedRequestsQueue = []
          }).catch(error => {
            failedRequestsQueue.forEach(request => request.reject(error))
            failedRequestsQueue = []
  
            if (process.browser) {
              signOut();
            }
          })
            .finally(() => {
              isRefreshing = false;
            })
        }
        return new Promise((resolve, reject) => {
          failedRequestsQueue.push({
            resolve: (token: string) => {
              originalConfig.headers['Authorization'] = `Bearer ${token}`
              resolve(api(originalConfig))
            },
            reject: (error: AxiosError) => {
              reject(error)
            }
          })
          console.log(failedRequestsQueue, typeof failedRequestsQueue)
        })
      } else {
        if (process.browser) {
          signOut();
        }
      }
    }
    return Promise.reject(error)
  }
  )
  return api;  
}