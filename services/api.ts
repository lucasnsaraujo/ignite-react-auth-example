import axios, { Axios, AxiosError, } from "axios";
import { parseCookies, setCookie, destroyCookie } from 'nookies'
import Router from 'next/router'

let cookies = parseCookies();
let isRefreshing = false;
let failedRequestsQueue = [];

export const api = axios.create({
  baseURL: "http://localhost:3333",
  headers: {
    Authorization: `Bearer ${cookies['nextauth.token']}`
  }
});

export function signOut() {
  destroyCookie(undefined, 'nextauth.token')
  destroyCookie(undefined, 'nextauth.refreshToken')
  Router.push('/')
}

api.interceptors.response.use(response => response, (error: AxiosError) => {
  if (error?.response?.status === 401) {
    if (error.response?.data?.code === 'token.expired') {
      cookies = parseCookies();

      const { 'nextauth.refreshToken': refreshToken } = cookies;

      const originalConfig = error.config!;

      if (!isRefreshing) {
        isRefreshing = true;
        api.post('/refresh', {
          refreshToken
        }).then(response => {
          const { token } = response.data;
          setCookie(undefined, 'nextauth.token', token, {
            maxAge: 60 * 60 * 24 * 30,
            path: '/'
          })

          setCookie(undefined, 'nextauth.refreshToken', response.data.refreshToken, { // novo refresh token
            maxAge: 60 * 60 * 24 * 30,
            path: '/'
          })

          api.defaults.headers['Authorization'] = `Bearer ${token}`

          failedRequestsQueue.forEach(request => request.resolve(token))
          failedRequestsQueue = []
        }).catch(error => {
          failedRequestsQueue.forEach(request => request.reject(error))
          failedRequestsQueue = []
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
      })
    } else {
      signOut();
    }
  }
  return Promise.reject(error)
}
)