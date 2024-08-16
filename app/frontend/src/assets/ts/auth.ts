import { LOCALSTORAGE_AUTH, LOCALSTORAGE_USERDATA } from "./constants";

export const getAuth = () => {
  const auth = localStorage.getItem(LOCALSTORAGE_AUTH);
  if (!auth) {
    return undefined;
  }
  const login = JSON.parse(auth);
  if (login) {
    // Check if the token is expired
    const expiry = login.expiry;
    const now = new Date();
    if (now.getTime() > expiry) {
      resetAuth();
      return undefined;
    }
    return login.token;
  }
};

export const setAuth = (auth: Object) => {
  localStorage.setItem(LOCALSTORAGE_AUTH, JSON.stringify(auth));
};

export const resetAuth = () => {
  localStorage.removeItem(LOCALSTORAGE_USERDATA);
  localStorage.removeItem(LOCALSTORAGE_AUTH);
};

export const checkAuthRouter = (to: any, from: any, next: any) => {
  const auth = getAuth();
  if (auth) {
    if (to.path.startsWith("/auth")) next("/");
    else next();
  } else {
    if (!to.path.startsWith("/auth")) next("/auth");
    else next();
  }
};
