export const getToken = () => {
  if (typeof window === "undefined") {
    return null
  }
  const token = window.localStorage.getItem("-__-")
  return token && token.trim().length > 0 && token
}

export const setToken = (token: string) => {
  if (typeof window === "undefined") return
  window.localStorage.setItem("-__-", token)
}

export const clearToken = () => {
  if (typeof window === "undefined") return
  window.localStorage.removeItem("-__-")
}
