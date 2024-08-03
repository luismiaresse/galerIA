import { AUTH_TOKEN_PREFIX, LOCALSTORAGE_AUTH } from "@ts/constants";
import { IUser } from "@ts/definitions";
import { login, register } from "@ts/requests/auth";
import { deleteAccount } from "@ts/requests/user";
import { afterAll, beforeAll, expect } from "vitest";
import { Ref, ref } from "vue";

export const TESTUSER_USERNAME = "testuser";
export const TESTUSER_EMAIL = "testemail@mail.com";
export const TESTUSER_PASSWORD = "password";
export const OTHERUSER_USERNAME = "otheruser";
export const OTHERUSER_EMAIL = "other@mail.com";
export const OTHERUSER_PASSWORD = "otherpassword";

export const TESTUSER_TOKEN_REF: Ref<string> = ref("");
export const OTHERUSER_TOKEN_REF: Ref<string> = ref("");

export const DEVEL_SERVER = "http://localhost:8000/";

beforeAll(async () => {
  // Register testuser
  expect(register).toBeDefined();

  // Add a user to the database
  const user: IUser = {
    username: TESTUSER_USERNAME,
    email: TESTUSER_EMAIL,
    password: TESTUSER_PASSWORD
  };

  const response = await register(user);

  expect(response).toBeDefined();
  expect(response).toHaveProperty("status");
  expect(response.status).toBe(201);
  expect(response).toHaveProperty("data");
  TESTUSER_TOKEN_REF.value = await loginTest(user);

  // Register another user
  const otherUser: IUser = {
    username: OTHERUSER_USERNAME,
    email: OTHERUSER_EMAIL,
    password: OTHERUSER_PASSWORD
  };

  const otherResponse = await register(otherUser);

  expect(otherResponse).toBeDefined();
  expect(otherResponse).toHaveProperty("status");
  expect(otherResponse.status).toBe(201);
  expect(otherResponse).toHaveProperty("data");
  OTHERUSER_TOKEN_REF.value = await loginTest(otherUser);
});

afterAll(async () => {
  expect(deleteAccount).toBeDefined();

  // Delete testuser and otheruser from the database
  const isDeleted = await deleteAccount(TESTUSER_TOKEN_REF.value);
  expect(isDeleted).toBe(true);
  const otherIsDeleted = await deleteAccount(OTHERUSER_TOKEN_REF.value);
  expect(otherIsDeleted).toBe(true);
});

export const loginTest = async (user: IUser) => {
  expect(login).toBeDefined();
  expect(user).toBeDefined();
  expect(user).toHaveProperty("username");
  expect(user).toHaveProperty("password");
  const response = await login(user);
  expect(response).not.toBeNull();
  expect(response!.token).toBeDefined();
  expect(response).toHaveProperty("token");
  const authFromLocalStorage = localStorage.getItem(LOCALSTORAGE_AUTH);
  expect(authFromLocalStorage).toBeDefined();
  expect(authFromLocalStorage).not.toBeNull();
  const authJSON = JSON.parse(authFromLocalStorage!);
  expect(authJSON).toHaveProperty("token");
  expect(authJSON).toHaveProperty("expiry");
  expect(authJSON.token).toBe(response!.token);
  expect(authJSON.expiry).toBe(response!.expiry);
  return (AUTH_TOKEN_PREFIX + authJSON.token) as string;
};
