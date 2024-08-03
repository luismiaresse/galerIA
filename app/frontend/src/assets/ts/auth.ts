import {
  AUTH_TOKEN_PREFIX,
  LOCALSTORAGE_AUTH,
  LOCALSTORAGE_USERDATA
} from "./constants";

function getAuth() {
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
    return AUTH_TOKEN_PREFIX + login.token;
  }
}

function setAuth(auth: Object) {
  localStorage.setItem(LOCALSTORAGE_AUTH, JSON.stringify(auth));
}

function resetAuth() {
  localStorage.removeItem(LOCALSTORAGE_USERDATA);
  localStorage.removeItem(LOCALSTORAGE_AUTH);
}

export { resetAuth, getAuth, setAuth };
