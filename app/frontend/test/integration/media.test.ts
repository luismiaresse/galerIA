import { putAlbum } from "@ts/requests/album";
import { beforeAll, describe, expect, it } from "vitest";
import { OTHERUSER_TOKEN_REF, TESTUSER_TOKEN_REF } from "../setup";
import { IMedia } from "@ts/definitions";
import { MediaKinds } from "@ts/constants";
import { putMedia } from "@ts/requests/media";

describe("Media subsystem", () => {
  let EXAMPLE_IMAGE: File;
  let EXAMPLE_VIDEO: File;
  let TESTUSER_ALBUM_ID: number;
  let OTHERUSER_ALBUM_ID: number;
  beforeAll(async () => {
    // Need to create an album for the media to be put into
    // and another user album
    let album = await putAlbum(TESTUSER_TOKEN_REF.value, { name: "album" });
    expect(album).not.toBeNull();
    TESTUSER_ALBUM_ID = Number(album!.id);
    album = await putAlbum(OTHERUSER_TOKEN_REF.value, { name: "otheralbum" });
    expect(album).not.toBeNull();
    OTHERUSER_ALBUM_ID = Number(album!.id);

    const image = await fetch(
      "http://localhost:5173/static/src/assets/img/test/image.jpg"
    );
    const blob = await image.blob();
    EXAMPLE_IMAGE = new File([blob], "image.jpg", { type: "image/jpeg" });

    const video = await fetch(
      "http://localhost:5173/static/src/assets/img/test/video.mp4"
    );
    const videoBlob = await video.blob();
    EXAMPLE_VIDEO = new File([videoBlob], "video.mp4", { type: "video/mp4" });
  });

  describe("INT-06-01: Put media", () => {
    // TODO: There is a problem with requests with files
    // Cannot test this until the problem is fixed

    // Valid test cases
    it("putMedia01", async () => {
      const media: IMedia = {
        kind: MediaKinds.IMAGE,
        file: EXAMPLE_IMAGE
      };

      const res = await putMedia(
        TESTUSER_TOKEN_REF.value,
        media,
        TESTUSER_ALBUM_ID
      );
      expect(res).not.toBeNull();
      expect(res!.id).toBeDefined();
      expect(res!.kind).toBe(MediaKinds.IMAGE);
    });
    it("putMedia02", async () => {
      const media: IMedia = {
        kind: MediaKinds.VIDEO,
        file: EXAMPLE_VIDEO
      };

      const res = await putMedia(
        TESTUSER_TOKEN_REF.value,
        media,
        TESTUSER_ALBUM_ID
      );
      expect(res).not.toBeNull();
      expect(res!.id).toBeDefined();
      expect(res!.kind).toBe(MediaKinds.VIDEO);
    });
    it("putMedia03", async () => {
      const media: IMedia = {
        file: EXAMPLE_IMAGE
      };

      const res = await putMedia(
        OTHERUSER_TOKEN_REF.value,
        media,
        OTHERUSER_ALBUM_ID
      );
      expect(res).not.toBeNull();
      expect(res!.id).toBeDefined();
      expect(res!.kind).toBe(MediaKinds.IMAGE);
    });

    // Invalid test cases
  });

  describe("INT-06-03: Get media", () => {
    // Cannot get media if we cannot put media
  });

  describe("INT-06-07: Delete media", () => {
    // Cannot delete media if we cannot put media
  });
});
