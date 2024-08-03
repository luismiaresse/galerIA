import { setAuth } from "@ts/auth";
import { LOGIN_API, LOGOUT_API, REGISTER_API, USER_API } from "@ts/constants";
import { IUser } from "@ts/definitions";

export const login = async (user: IUser) => {
  try {
    const response = await fetch(LOGIN_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(user)
    });

    const auth: { token: string; expiry: string } = await response.json();
    if (response.status === 200) {
      console.log("Login successful");
      setAuth(auth);
      return auth;
    }
    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const register = async (user: IUser) => {
  try {
    const response = await fetch(REGISTER_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: user.username,
        email: user.email,
        password: user.password
      })
    });
    const status = response.status;
    if (status == 201) {
      const data: IUser = await response.json();
      return { data, status };
    }
    return { data: null, status };
  } catch (error) {
    console.error(error);
    return { data: null, status: 500 };
  }
};

export const logout = async (auth: string) => {
  if (!auth) {
    console.error("No login token");
    return false;
  }
  try {
    const response = await fetch(LOGOUT_API, {
      method: "POST",
      headers: {
        Authorization: auth
      }
    });
    if (response.status === 204) {
      console.log("Logout successful");
      return true;
    }
    return false;
  } catch (error) {
    console.error(error);
    return false;
  }
};

// Health check for the auth token
export const checkAuthTokenHealth = async (auth: string | undefined | null) => {
  if (!auth) {
    console.error("No login token");
    return;
  }

  const response = await fetch(USER_API + "?check=true", {
    headers: {
      Authorization: auth
    }
  });
  if (response.status === 200) {
    console.log("Auth is valid");
    return true;
  }

  console.error("Auth is invalid");
  return false;
};
