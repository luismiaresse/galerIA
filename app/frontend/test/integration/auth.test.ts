import { IUser } from "@ts/definitions";
import { login, logout, register } from "@ts/requests/auth";
import { expect, describe, it, afterAll, beforeAll } from "vitest";
import { TESTUSER_EMAIL, TESTUSER_USERNAME } from "../setup";
import { AUTH_TOKEN_PREFIX } from "@ts/constants";
import { deleteAccount, getAccountData } from "@ts/requests/user";

describe("Authentication subsystem", () => {
  const CORRECT_USERNAME = "user";
  const CORRECT_EMAIL = "user@mail.com";
  const CORRECT_PASSWORD = "password";

  const INCORRECT_USERNAME = "us";
  const INCORRECT_EMAIL = "user@mail";
  const INCORRECT_PASSWORD = "pass";

  describe("INT-01-01: Register", () => {
    it("register01", async () => {
      expect(register).toBeDefined();

      const user: IUser = {
        username: CORRECT_USERNAME,
        email: CORRECT_EMAIL,
        password: CORRECT_PASSWORD
      };
      const response = await register(user);

      expect(response).toBeDefined();
      expect(response).toHaveProperty("status");
      expect(response.status).toBe(201);
      expect(response).toHaveProperty("data");
    });

    it("register02", async () => {
      expect(register).toBeDefined();

      const user: IUser = {
        username: INCORRECT_USERNAME,
        email: CORRECT_EMAIL,
        password: CORRECT_PASSWORD
      };
      const response = await register(user);

      expect(response).toBeDefined();
      expect(response).toHaveProperty("status");
      expect(response.status).toBe(406);
      expect(response.data).toBeNull();
    });

    it("register03", async () => {
      expect(register).toBeDefined();

      const user: IUser = {
        username: CORRECT_USERNAME,
        email: INCORRECT_EMAIL,
        password: CORRECT_PASSWORD
      };
      const response = await register(user);

      expect(response).toBeDefined();
      expect(response).toHaveProperty("status");
      expect(response.status).toBe(406);
      expect(response.data).toBeNull();
    });

    it("register04", async () => {
      expect(register).toBeDefined();

      const user: IUser = {
        username: CORRECT_USERNAME,
        email: CORRECT_EMAIL,
        password: INCORRECT_PASSWORD
      };
      const response = await register(user);

      expect(response).toBeDefined();
      expect(response).toHaveProperty("status");
      expect(response.status).toBe(406);
      expect(response.data).toBeNull();
    });

    it("register05", async () => {
      expect(register).toBeDefined();

      const user: IUser = {
        username: TESTUSER_USERNAME,
        email: CORRECT_EMAIL,
        password: CORRECT_PASSWORD
      };
      const response = await register(user);

      expect(response).toBeDefined();
      expect(response).toHaveProperty("status");
      expect(response.status).toBe(409);
      expect(response.data).toBeNull();
    });

    it("register06", async () => {
      expect(register).toBeDefined();

      const user: IUser = {
        username: CORRECT_USERNAME,
        email: TESTUSER_EMAIL,
        password: CORRECT_PASSWORD
      };
      const response = await register(user);

      expect(response).toBeDefined();
      expect(response).toHaveProperty("status");
      expect(response.status).toBe(409);
      expect(response.data).toBeNull();
    });

    afterAll(async () => {
      // Delete the correct user
      const user: IUser = {
        username: CORRECT_USERNAME,
        password: CORRECT_PASSWORD
      };
      const responseLogin = await login(user);
      expect(responseLogin).not.toBeNull();
      expect(responseLogin).toHaveProperty("token");
      expect(responseLogin).toHaveProperty("expiry");
      const correct_token = AUTH_TOKEN_PREFIX + responseLogin!.token;

      expect(deleteAccount).toBeDefined();

      const isDeleted = await deleteAccount(correct_token);
      expect(isDeleted).toBe(true);

      // Try to delete the incorrect user
      const incorrectUser: IUser = {
        username: INCORRECT_USERNAME,
        password: INCORRECT_PASSWORD
      };
      const responseIncorrect = await login(incorrectUser);
      if (!responseIncorrect || !responseIncorrect.token) {
        return;
      }
      const incorrect_token = responseIncorrect.token;
      await deleteAccount(AUTH_TOKEN_PREFIX + incorrect_token);
    });
  });

  describe("INT-01-04: Login", () => {
    const CORRECT_USERNAME = "user";
    const CORRECT_EMAIL = "user@mail.com";
    const CORRECT_PASSWORD = "password";

    const INCORRECT_USERNAME = "usernonexistent";
    const INCORRECT_EMAIL = "usernonexistent@mail.com";
    const INCORRECT_PASSWORD = "passwordincorrect";

    beforeAll(async () => {
      // Register the user
      expect(register).toBeDefined();

      const user: IUser = {
        username: CORRECT_USERNAME,
        email: CORRECT_EMAIL,
        password: CORRECT_PASSWORD
      };
      const response = await register(user);

      expect(response).toBeDefined();
      expect(response).toHaveProperty("status");
      expect(response.status).toBe(201);
      expect(response).toHaveProperty("data");
    });

    // Valid test cases
    it("login01", async () => {
      expect(login).toBeDefined();

      const user: IUser = {
        username: CORRECT_USERNAME,
        password: CORRECT_PASSWORD
      };
      const response = await login(user);

      expect(response).not.toBeNull();
      expect(response!.token).toBeDefined();
      expect(response!.expiry).toBeDefined();
    });

    it("login02", async () => {
      expect(login).toBeDefined();

      const user: IUser = {
        email: CORRECT_EMAIL,
        password: CORRECT_PASSWORD
      };
      const response = await login(user);

      expect(response).not.toBeNull();
      expect(response!.token).toBeDefined();
      expect(response!.expiry).toBeDefined();
    });

    // Invalid test cases
    it("login03", async () => {
      expect(login).toBeDefined();

      const user: IUser = {
        username: INCORRECT_USERNAME,
        password: CORRECT_PASSWORD
      };
      const response = await login(user);

      expect(response).toBeNull();
    });

    it("login04", async () => {
      expect(login).toBeDefined();

      const user: IUser = {
        email: INCORRECT_EMAIL,
        password: CORRECT_PASSWORD
      };
      const response = await login(user);

      expect(response).toBeNull();
    });

    it("login05", async () => {
      expect(login).toBeDefined();

      const user: IUser = {
        username: CORRECT_USERNAME,
        password: INCORRECT_PASSWORD
      };
      const response = await login(user);

      expect(response).toBeNull();
    });

    it("login06", async () => {
      expect(login).toBeDefined();

      const user: IUser = {
        email: CORRECT_EMAIL,
        password: INCORRECT_PASSWORD
      };
      const response = await login(user);

      expect(response).toBeNull();
    });

    afterAll(async () => {
      // Delete the user
      expect(deleteAccount).toBeDefined();

      const user: IUser = {
        username: CORRECT_USERNAME,
        password: CORRECT_PASSWORD
      };
      const response = await login(user);
      expect(response).toBeDefined();
      expect(response).toHaveProperty("token");
      const token = response!.token;

      const isDeleted = await deleteAccount(AUTH_TOKEN_PREFIX + token);
      expect(isDeleted).toBe(true);
    });
  });

  describe("INT-01-06: Logout", () => {
    let token: string;
    const INCORRECT_TOKEN = "1234";

    beforeAll(async () => {
      // Create and login the user
      expect(register).toBeDefined();
      expect(login).toBeDefined();

      const user: IUser = {
        username: CORRECT_USERNAME,
        email: CORRECT_EMAIL,
        password: CORRECT_PASSWORD
      };

      const response = await register(user);
      expect(response).toBeDefined();
      expect(response).toHaveProperty("status");
      expect(response.status).toBe(201);

      const loginResponse = await login(user);
      expect(loginResponse).not.toBeNull();
      expect(loginResponse!.token).toBeDefined();
      token = AUTH_TOKEN_PREFIX + loginResponse!.token;
    });

    // Valid test cases
    it("logout01", async () => {
      expect(login).toBeDefined();

      const user: IUser = {
        username: CORRECT_USERNAME,
        email: CORRECT_EMAIL,
        password: CORRECT_PASSWORD
      };
      const response = await login(user);
      expect(response).not.toBeNull();
      expect(response!.token).toBeDefined();
      const token = AUTH_TOKEN_PREFIX + response!.token;

      expect(logout).toBeDefined();
      const isLoggedOut = await logout(token);
      expect(isLoggedOut).toBe(true);

      // Try to get the user data with the token
      const data = await getAccountData(token);
      expect(data).toBeNull();
    });

    // Invalid test cases
    it("logout02", async () => {
      expect(logout).toBeDefined();
      const isLoggedOut = await logout(INCORRECT_TOKEN);
      expect(isLoggedOut).toBe(false);

      // Try to get the user data with the token
      const data = await getAccountData(token);
      expect(data).not.toBeNull();
    });

    it("logout03", async () => {
      expect(logout).toBeDefined();
      const isLoggedOut = await logout(undefined as any);
      expect(isLoggedOut).toBe(false);

      // Try to get the user data with the token
      const data = await getAccountData(token);
      expect(data).not.toBeNull();
    });

    afterAll(async () => {
      // Delete the user
      expect(deleteAccount).toBeDefined();

      const isDeleted = await deleteAccount(token);
      expect(isDeleted).toBe(true);
    });
  });
});
