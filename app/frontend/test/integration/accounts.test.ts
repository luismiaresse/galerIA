import {
  changePassword,
  deleteAccount,
  getAccountData
} from "@ts/requests/user";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it
} from "vitest";
import {
  TESTUSER_EMAIL,
  TESTUSER_USERNAME,
  TESTUSER_TOKEN_REF
} from "../setup";
import { IUser, IUserData } from "@ts/definitions";
import { AUTH_TOKEN_PREFIX, LOCALSTORAGE_USERDATA } from "@ts/constants";
import { login, register } from "@ts/requests/auth";

const testUserData = (accountData: IUserData | null) => {
  expect(accountData).not.toBeNull();
  expect(accountData).toHaveProperty("username");
  expect(accountData!.username).toBe(TESTUSER_USERNAME);
  expect(accountData).toHaveProperty("email");
  expect(accountData!.email).toBe(TESTUSER_EMAIL);
  expect(accountData).toHaveProperty("photo");
  expect(accountData!.photo).toBeNull();
  expect(accountData).toHaveProperty("expiry");
};

describe("Accounts subsystem", () => {
  const INCORRECT_TOKEN = "1234";

  describe("INT-04-01: Account data", () => {
    it("getAccountData01", async () => {
      expect(getAccountData).toBeDefined();
      // Force the token to be removed from the local storage
      // It should be retrieved from the server
      localStorage.clear();
      const accountData = await getAccountData(TESTUSER_TOKEN_REF.value);
      testUserData(accountData);

      // Check if the data is stored in the local storage
      const accountDataFromLocalStorage = localStorage.getItem(
        LOCALSTORAGE_USERDATA
      );
      testUserData(JSON.parse(accountDataFromLocalStorage!));
    });

    it("getAccountData02", async () => {
      localStorage.clear();
      const accountData = await getAccountData(INCORRECT_TOKEN);
      expect(accountData).toBeNull();
    });

    it("getAccountData03", async () => {
      localStorage.clear();
      const accountData = await getAccountData(undefined as any);
      expect(accountData).toBeNull();
    });
  });

  describe("INT-04-03: Password change", () => {
    const CORRECT_OLDPASSWORD = "password";
    const INCORRECT_OLDPASSWORD = "wrongpassword";
    const CORRECT_NEWPASSWORD = "newpassword";
    const INCORRECT_NEWPASSWORD = CORRECT_OLDPASSWORD;
    let token: string;

    beforeAll(async () => {
      // Register a new user
      expect(register).toBeDefined();
      const user: IUser = {
        username: "username",
        email: "email@mail.com",
        password: CORRECT_OLDPASSWORD
      };
      const response = await register(user);
      expect(response).toBeDefined();
      expect(response).toHaveProperty("status");
      expect(response.status).toBe(201);
      token = AUTH_TOKEN_PREFIX + (await login(user)!)!.token;
    });

    // Valid test cases
    it("changePassword01", async () => {
      expect(changePassword).toBeDefined();
      const response = await changePassword(
        token,
        CORRECT_OLDPASSWORD,
        CORRECT_NEWPASSWORD
      );
      expect(response).not.toBeNull();
      expect(response).toBe(200);
    });

    // Invalid test cases
    it("changePassword02", async () => {
      expect(changePassword).toBeDefined();
      const response = await changePassword(
        token,
        INCORRECT_OLDPASSWORD,
        CORRECT_NEWPASSWORD
      );
      expect(response).toBe(406);
    });

    it("changePassword03", async () => {
      expect(changePassword).toBeDefined();
      const response = await changePassword(token, CORRECT_OLDPASSWORD, "");
      expect(response).toBe(400);
    });

    it("changePassword04", async () => {
      expect(changePassword).toBeDefined();
      const response = await changePassword(
        token,
        CORRECT_OLDPASSWORD,
        INCORRECT_NEWPASSWORD
      );
      expect(response).toBe(400);
    });

    it("changePassword05", async () => {
      expect(changePassword).toBeDefined();
      const response = await changePassword(
        INCORRECT_TOKEN,
        CORRECT_OLDPASSWORD,
        CORRECT_NEWPASSWORD
      );
      expect(response).toBe(401);
    });

    it("changePassword06", async () => {
      expect(changePassword).toBeDefined();
      const response = await changePassword(
        undefined as any,
        CORRECT_OLDPASSWORD,
        CORRECT_NEWPASSWORD
      );
      expect(response).toBe(401);
    });

    afterAll(async () => {
      // Delete the account from the database
      // Get data to check if the account is deleted
      const accountData = await getAccountData(token);
      if (accountData) {
        const isDeleted = await deleteAccount(token);
        expect(isDeleted).toBe(true);
      }
    });
  });

  describe("INT-04-04: Profile photo change", () => {
    // TODO: There is a problem with requests with files
    // Cannot test this until the problem is fixed
    // it("putProfilePhoto01", async () => {
    //   expect(putMedia).toBeDefined();
    //   // Upload a photo
    //   const file = new File(["aaa"], "test.jpg", { type: "image/jpeg" });
    //   const media: IMedia = {
    //     file: file,
    //     kind: MediaKinds.PROFILE
    //   };
    //   const mediaresp = await putMedia(TESTUSER_TOKEN_REF.value, media);
    //   expect(mediaresp).not.toBeNull();
    //   expect(mediaresp!.id).toBeDefined();
    // });
  });

  describe("INT-04-05: Account deletion", () => {
    let userdeletion_token: string;

    beforeEach(async () => {
      // Create a new account
      expect(register).toBeDefined();
      const user: IUser = {
        username: "userdelete",
        email: "userdelete@mail.com",
        password: "password"
      };
      const response = await register(user);
      expect(response).toBeDefined();
      expect(response).toHaveProperty("status");
      expect(response.status).toBe(201);
      expect(response).toHaveProperty("data");
      const auth = await login(user);
      expect(auth).not.toBeNull();
      userdeletion_token = AUTH_TOKEN_PREFIX + auth!.token;
    });

    it("deleteAccount01", async () => {
      expect(deleteAccount).toBeDefined();

      const isDeleted = await deleteAccount(userdeletion_token);
      expect(isDeleted).toBe(true);
    });

    it("deleteAccount02", async () => {
      expect(deleteAccount).toBeDefined();
      const isDeleted = await deleteAccount(INCORRECT_TOKEN);
      expect(isDeleted).toBe(false);
    });

    it("deleteAccount03", async () => {
      expect(deleteAccount).toBeDefined();
      const isDeleted = await deleteAccount(undefined as any);
      expect(isDeleted).toBe(false);
    });

    afterEach(async () => {
      // Delete the account from the database
      // Get data to check if the account is deleted
      const accountData = await getAccountData(userdeletion_token);
      if (accountData) {
        const isDeleted = await deleteAccount(userdeletion_token);
        expect(isDeleted).toBe(true);
      }
    });
  });

  afterAll(async () => {
    localStorage.clear();
  });
});
