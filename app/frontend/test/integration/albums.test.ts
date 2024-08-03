import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { OTHERUSER_TOKEN_REF, TESTUSER_TOKEN_REF } from "../setup";
import {
  deleteAlbum,
  getAlbum,
  getSharedAlbumFromCode,
  putAlbum,
  shareAlbum
} from "@ts/requests/album";
import { IAlbum, IUserAlbum } from "@ts/definitions";
import {
  ALBUM_NAME_MAX_LENGTH,
  DEFAULT_ALBUM,
  SharePermissionKinds
} from "@ts/constants";

describe("Albums subsystem", () => {
  const INCORRECT_TOKEN = "1234";

  describe("Album creation", () => {
    const CORRECT_ALBUMNAME = "album";
    const INCORRECT_ALBUMNAME = DEFAULT_ALBUM;

    // Valid test cases
    it("putAlbum01", async () => {
      let album: IAlbum = {
        name: "album"
      };

      album = (await putAlbum(TESTUSER_TOKEN_REF.value, album)) as IAlbum;
      expect(album).not.toBeNull();
      expect(album.id).toBeDefined();
    });

    it("putAlbum02", async () => {
      let album: IAlbum = {
        name: "album"
      };

      album = (await putAlbum(TESTUSER_TOKEN_REF.value, album)) as IAlbum;
      expect(album).not.toBeNull();
      expect(album.id).toBeDefined();
    });

    // Invalid test cases
    it("putAlbum03", async () => {
      let album: IAlbum = {
        name: INCORRECT_ALBUMNAME
      };

      album = (await putAlbum(INCORRECT_TOKEN, album)) as IAlbum;
      expect(album).toBeNull();
    });

    it("putAlbum04", async () => {
      let album = (await putAlbum(
        TESTUSER_TOKEN_REF.value,
        undefined as any
      )) as IAlbum;
      expect(album).toBeNull();
    });

    it("putAlbum05", async () => {
      let album: IAlbum = {
        name: CORRECT_ALBUMNAME
      };

      album = (await putAlbum(undefined as any, album)) as IAlbum;
      expect(album).toBeNull();
    });

    it("putAlbum06", async () => {
      let album: IAlbum = {
        name: ""
      };
      album = (await putAlbum(TESTUSER_TOKEN_REF.value, album)) as IAlbum;
      expect(album).toBeNull();
    });
  });

  describe("PR-05-02: Albums fetching", () => {
    // Valid test cases
    it("getAlbums01", async () => {
      const albums = await getAlbum(TESTUSER_TOKEN_REF.value);
      expect(albums).not.toBeNull();
      expect(albums!.length).toBeGreaterThan(0);
    });

    // Invalid test cases
    it("getAlbums02", async () => {
      const albums = await getAlbum(INCORRECT_TOKEN);
      expect(albums).toBeNull();
    });

    it("getAlbums03", async () => {
      const albums = await getAlbum(undefined as any);
      expect(albums).toBeNull();
    });
  });

  describe("PR-05-03: Album fetching", () => {
    let albumid: number;

    // Add an album to fetch in tests
    beforeAll(async () => {
      let album: IAlbum = {
        name: "album"
      };
      album = (await putAlbum(TESTUSER_TOKEN_REF.value, album)) as IAlbum;
      expect(album).not.toBeNull();
      expect(album.id).toBeDefined();
      albumid = album.id as number;
    });

    // Valid test cases
    it("getAlbum01", async () => {
      let album: IAlbum = {
        id: albumid
      };
      const albums = await getAlbum(TESTUSER_TOKEN_REF.value, album);
      expect(albums).not.toBeNull();
      expect(albums!.length).toBeGreaterThan(0);
    });

    // Invalid test cases
    it("getAlbum02", async () => {
      let album: IAlbum = {
        id: albumid
      };
      const albums = await getAlbum(INCORRECT_TOKEN, album);
      expect(albums).toBeNull();
    });

    it("getAlbum03", async () => {
      let album: IAlbum = {
        id: albumid
      };
      const albums = await getAlbum(undefined as any, album);
      expect(albums).toBeNull();
    });

    it("getAlbum04", async () => {
      let album: IAlbum = {
        id: -1
      };
      const albums = await getAlbum(TESTUSER_TOKEN_REF.value, album);
      expect(albums).toBeNull();
    });
  });

  describe("PR-05-04: Album name update", () => {
    const CORRECT_ALBUMNAME = "newalbumname";
    const INCORRECT_ALBUMNAME = "album";
    const INCORRECT_TOO_LONG_ALBUMNAME = "a".repeat(ALBUM_NAME_MAX_LENGTH + 1);
    const INCORRECT_DEFAULT_ALBUMNAME = DEFAULT_ALBUM;
    const INCORRECT_ALBUM_ID = -1;
    let albumid: number;

    // Add an album to fetch in tests
    beforeEach(async () => {
      let album: IAlbum = {
        name: INCORRECT_ALBUMNAME
      };
      album = (await putAlbum(TESTUSER_TOKEN_REF.value, album)) as IAlbum;
      expect(album).not.toBeNull();
      expect(album.id).toBeDefined();
      albumid = album.id as number;
    });

    // Valid test cases
    it("updateAlbumName01", async () => {
      let album: IAlbum = {
        id: albumid,
        name: CORRECT_ALBUMNAME
      };
      console.log("albumid", albumid);

      const updatedAlbum = await putAlbum(TESTUSER_TOKEN_REF.value, album);

      expect(updatedAlbum).not.toBeNull();
      expect(updatedAlbum!.name).toBe(CORRECT_ALBUMNAME);
      expect(updatedAlbum!.id).toBe(albumid);
    });

    // Invalid test cases
    it("updateAlbumName02", async () => {
      let album: IAlbum = {
        id: albumid,
        name: CORRECT_ALBUMNAME
      };
      const updatedAlbum = await putAlbum(INCORRECT_TOKEN, album);
      expect(updatedAlbum).toBeNull();
    });

    it("updateAlbumName03", async () => {
      let album: IAlbum = {
        id: albumid,
        name: CORRECT_ALBUMNAME
      };
      const updatedAlbum = await putAlbum(undefined as any, album);
      expect(updatedAlbum).toBeNull();
    });

    it("updateAlbumName04", async () => {
      let album: IAlbum = {
        id: albumid,
        name: INCORRECT_ALBUMNAME
      };
      const updatedAlbum = await putAlbum(TESTUSER_TOKEN_REF.value, album);
      expect(updatedAlbum).toBeNull();
    });

    it("updateAlbumName05", async () => {
      let album: IAlbum = {
        id: albumid,
        name: ""
      };
      const updatedAlbum = await putAlbum(TESTUSER_TOKEN_REF.value, album);
      expect(updatedAlbum).toBeNull();
    });

    it("updateAlbumName06", async () => {
      let album: IAlbum = {
        id: albumid,
        name: INCORRECT_DEFAULT_ALBUMNAME
      };
      const updatedAlbum = await putAlbum(TESTUSER_TOKEN_REF.value, album);
      expect(updatedAlbum).toBeNull();
    });

    it("updateAlbumName07", async () => {
      let album: IAlbum = {
        id: INCORRECT_ALBUM_ID,
        name: CORRECT_ALBUMNAME
      };
      const updatedAlbum = await putAlbum(TESTUSER_TOKEN_REF.value, album);
      expect(updatedAlbum).toBeNull();
    });

    it("updateAlbumName08", async () => {
      let album: IAlbum = {
        id: albumid,
        name: INCORRECT_TOO_LONG_ALBUMNAME
      };
      const updatedAlbum = await putAlbum(TESTUSER_TOKEN_REF.value, album);
      expect(updatedAlbum).toBeNull();
    });
  });

  describe("PR-05-05: Album deletion", () => {
    let albumid: number;
    const INCORRECT_ALBUM_ID = -1;

    // Add an album to fetch in tests
    beforeAll(async () => {
      let album: IAlbum = {
        name: "album"
      };
      album = (await putAlbum(TESTUSER_TOKEN_REF.value, album)) as IAlbum;
      expect(album).not.toBeNull();
      expect(album.id).toBeDefined();
      albumid = album.id as number;
    });

    // Valid test cases
    it("deleteAlbum01", async () => {
      let album: IAlbum = {
        id: albumid
      };
      const isDeleted = await deleteAlbum(TESTUSER_TOKEN_REF.value, album);
      expect(isDeleted).toBe(true);
    });

    // Invalid test cases
    it("deleteAlbum02", async () => {
      let album: IAlbum = {
        id: albumid
      };
      const isDeleted = await deleteAlbum(TESTUSER_TOKEN_REF.value, album);
      expect(isDeleted).toBe(false);
    });

    it("deleteAlbum03", async () => {
      let album: IAlbum = {
        id: albumid
      };
      const isDeleted = await deleteAlbum(TESTUSER_TOKEN_REF.value, album);
      expect(isDeleted).toBe(false);
    });

    it("deleteAlbum04", async () => {
      let album: IAlbum = {
        id: INCORRECT_ALBUM_ID
      };
      const isDeleted = await deleteAlbum(TESTUSER_TOKEN_REF.value, album);
      expect(isDeleted).toBe(false);
    });
  });

  describe("PR-05-06: Album sharing", () => {
    const INCORRECT_ALBUM_ID = -1;
    const INCORRECT_PERMISSIONS = "invalid";
    let albumid: number;
    let incorrect_album_default_id: number;
    let incorrect_album_other_id: number;

    beforeEach(async () => {
      // Create album
      let album: IUserAlbum = {
        name: "album"
      };
      album = (await putAlbum(TESTUSER_TOKEN_REF.value, album)) as IAlbum;
      expect(album).not.toBeNull();
      expect(album.id).toBeDefined();
      albumid = album.id as number;
      album.id = albumid;
      album.permissions = SharePermissionKinds.READ_ONLY;

      // Get default album id
      let defaultAlbum: IUserAlbum = {
        name: DEFAULT_ALBUM
      };
      defaultAlbum = (await getAlbum(
        TESTUSER_TOKEN_REF.value,
        defaultAlbum
      )) as IAlbum;
      expect(defaultAlbum).not.toBeNull();
      incorrect_album_default_id = defaultAlbum.id as number;

      // Other user album
      let otherUserAlbum: IUserAlbum = {
        name: "otheralbum"
      };
      otherUserAlbum = (await putAlbum(
        OTHERUSER_TOKEN_REF.value,
        otherUserAlbum
      )) as IAlbum;
      expect(otherUserAlbum).not.toBeNull();
      expect(otherUserAlbum.id).toBeDefined();
      incorrect_album_other_id = otherUserAlbum.id as number;
    });

    // Valid test cases
    it("shareAlbum01", async () => {
      let album: IUserAlbum = {
        id: albumid,
        permissions: SharePermissionKinds.READ_ONLY
      };

      const sharedAlbum = await shareAlbum(TESTUSER_TOKEN_REF.value, album);

      expect(sharedAlbum).not.toBeNull();
      expect(sharedAlbum!.permissions).toBe(SharePermissionKinds.READ_ONLY);
      expect(sharedAlbum!.code).toBeDefined();
    });

    it("shareAlbum02", async () => {
      let album: IUserAlbum = {
        id: albumid,
        permissions: SharePermissionKinds.READ_WRITE
      };
      const sharedAlbum = await shareAlbum(TESTUSER_TOKEN_REF.value, album);
      expect(sharedAlbum).not.toBeNull();
      expect(sharedAlbum!.permissions).toBe(SharePermissionKinds.READ_WRITE);
      expect(sharedAlbum!.code).toBeDefined();
    });

    it("shareAlbum03", async () => {
      let album: IUserAlbum = {
        id: albumid,
        permissions: SharePermissionKinds.FULL_ACCESS
      };
      const sharedAlbum = await shareAlbum(TESTUSER_TOKEN_REF.value, album);
      expect(sharedAlbum).not.toBeNull();
      expect(sharedAlbum!.permissions).toBe(SharePermissionKinds.FULL_ACCESS);
      expect(sharedAlbum!.code).toBeDefined();
    });

    // Invalid test cases
    it("shareAlbum04", async () => {
      let album: IUserAlbum = {
        id: albumid,
        permissions: SharePermissionKinds.READ_ONLY
      };
      const sharedAlbum = await shareAlbum(INCORRECT_TOKEN, album);
      expect(sharedAlbum).toBeNull();
    });

    it("shareAlbum05", async () => {
      let album: IUserAlbum = {
        id: albumid,
        permissions: SharePermissionKinds.READ_ONLY
      };
      const sharedAlbum = await shareAlbum(undefined as any, album);
      expect(sharedAlbum).toBeNull();
    });

    it("shareAlbum06", async () => {
      let album: IUserAlbum = {
        id: incorrect_album_default_id,
        permissions: SharePermissionKinds.READ_ONLY
      };
      const sharedAlbum = await shareAlbum(TESTUSER_TOKEN_REF.value, album);
      expect(sharedAlbum).toBeNull();
    });

    it("shareAlbum07", async () => {
      let album: IUserAlbum = {
        id: incorrect_album_other_id,
        permissions: SharePermissionKinds.READ_ONLY
      };
      const sharedAlbum = await shareAlbum(TESTUSER_TOKEN_REF.value, album);
      expect(sharedAlbum).toBeNull();
    });

    it("shareAlbum08", async () => {
      let album: IUserAlbum = {
        id: INCORRECT_ALBUM_ID,
        permissions: SharePermissionKinds.READ_ONLY
      };
      const sharedAlbum = await shareAlbum(TESTUSER_TOKEN_REF.value, album);
      expect(sharedAlbum).toBeNull();
    });

    it("shareAlbum09", async () => {
      let album: IUserAlbum = {
        id: albumid
      };
      const sharedAlbum = await shareAlbum(TESTUSER_TOKEN_REF.value, album);
      expect(sharedAlbum).toBeNull();
    });

    it("shareAlbum10", async () => {
      let album: IUserAlbum = {
        id: albumid,
        permissions: INCORRECT_PERMISSIONS
      };
      const sharedAlbum = await shareAlbum(TESTUSER_TOKEN_REF.value, album);
      expect(sharedAlbum).toBeNull();
    });

    it("shareAlbum11", async () => {
      let album: IUserAlbum = {
        id: albumid,
        permissions: SharePermissionKinds.READ_ONLY
      };
      const sharedAlbum = await shareAlbum(TESTUSER_TOKEN_REF.value, album);
      expect(sharedAlbum).not.toBeNull();
      expect(sharedAlbum!.permissions).toBe(SharePermissionKinds.READ_ONLY);
      expect(sharedAlbum!.code).toBeDefined();

      album.permissions = SharePermissionKinds.READ_ONLY;
      const updatedAlbum = await shareAlbum(TESTUSER_TOKEN_REF.value, album);
      expect(updatedAlbum).toBeNull();
    });
  });

  describe("PR-05-07: Accept album share by code", () => {
    const INCORRECT_CODE = "invalid";
    const CORRECT_ALBUM_NAME = "album";
    let albumid: number;
    let code: string;

    beforeEach(async () => {
      // Create album
      let album: IUserAlbum = {
        name: CORRECT_ALBUM_NAME
      };
      album = (await putAlbum(TESTUSER_TOKEN_REF.value, album)) as IAlbum;
      expect(album).not.toBeNull();
      expect(album.id).toBeDefined();
      albumid = album.id as number;
      album.id = albumid;
      album.permissions = SharePermissionKinds.READ_ONLY;

      // Share album
      const sharedAlbum = await shareAlbum(TESTUSER_TOKEN_REF.value, album);
      expect(sharedAlbum).not.toBeNull();
      expect(sharedAlbum!.permissions).toBe(SharePermissionKinds.READ_ONLY);
      code = sharedAlbum!.code as string;
    });

    // Valid test cases
    it("acceptAlbumShare01", async () => {
      let album: IUserAlbum = {
        id: albumid,
        code: code
      };
      const sharedAlbum = await getSharedAlbumFromCode(
        OTHERUSER_TOKEN_REF.value,
        album
      );
      expect(sharedAlbum).not.toBeNull();

      expect(sharedAlbum!.id).toBe(albumid);
      expect(sharedAlbum!.name).toBe(CORRECT_ALBUM_NAME);
    });

    // Invalid test cases
    it("acceptAlbumShare02", async () => {
      let album: IUserAlbum = {
        id: albumid,
        code: code
      };
      const sharedAlbum = await getSharedAlbumFromCode(INCORRECT_TOKEN, album);
      expect(sharedAlbum).toBeNull();
    });

    it("acceptAlbumShare03", async () => {
      let album: IUserAlbum = {
        id: albumid,
        code: code
      };
      const sharedAlbum = await getSharedAlbumFromCode(undefined as any, album);
      expect(sharedAlbum).toBeNull();
    });

    it("acceptAlbumShare04", async () => {
      let album: IUserAlbum = {
        code: INCORRECT_CODE
      };
      const sharedAlbum = await getSharedAlbumFromCode(
        OTHERUSER_TOKEN_REF.value,
        album
      );
      expect(sharedAlbum).toBeNull();
    });

    it("acceptAlbumShare05", async () => {
      let album: IUserAlbum = {};
      const sharedAlbum = await getSharedAlbumFromCode(
        OTHERUSER_TOKEN_REF.value,
        album
      );
      expect(sharedAlbum).toBeNull();
    });
  });
});
