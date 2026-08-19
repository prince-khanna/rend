import { beforeEach, describe, expect, it, vi } from "vitest";

const storage = vi.hoisted(() => ({
  uploadFile: vi.fn(),
  deleteFiles: vi.fn(),
}));
const pages = vi.hoisted(() => ({
  insertPage: vi.fn(),
}));
const folders = vi.hoisted(() => ({
  getFolderById: vi.fn(),
}));

vi.mock("./storage", () => storage);
vi.mock("./pages", () => pages);
vi.mock("./folders", () => folders);

import { uploadPage } from "./page-upload";

const page = {
  id: "page-id",
  user_id: "user-id",
  name: "config",
  storage_key: "user-id/page-id/rendered.html",
  is_public: false,
  created_at: "2025-01-01T00:00:00.000Z",
  source_type: "data" as const,
  source_key: "user-id/page-id/source.json",
  source_family: "data" as const,
  source_format: "json" as const,
  original_filename: "config.json",
  byte_size: 13,
  source_digest: "a".repeat(64),
  rendered_key: "user-id/page-id/rendered.html",
  project_asset_keys: [],
  folder_id: null,
};

describe("uploadPage lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pages.insertPage.mockResolvedValue(page);
    storage.uploadFile.mockResolvedValue(undefined);
    storage.deleteFiles.mockResolvedValue(undefined);
    folders.getFolderById.mockResolvedValue({
      id: "folder-id",
      user_id: "user-id",
      parent_id: null,
      name: "Reports",
      created_at: "2025-01-01T00:00:00.000Z",
    });
  });

  it("stores exact data source and an escaped derived preview with durable metadata", async () => {
    const source = '{"html":"</script>"}';
    const result = await uploadPage({
      file: new File([source], "config.json"),
      userId: "user-id",
      isPublic: false,
      serviceRoleInsert: true,
    });

    expect(result.page).toEqual(page);
    expect(storage.uploadFile).toHaveBeenCalledTimes(2);
    expect(storage.uploadFile.mock.calls[1][0]).toMatch(/^user-id\/[0-9a-f-]+\/source\.json$/);
    expect(pages.insertPage).toHaveBeenCalledWith(expect.objectContaining({
      source_family: "data",
      source_format: "json",
      original_filename: "config.json",
      is_public: false,
      source_digest: expect.stringMatching(/^[0-9a-f]{64}$/),
    }), { serviceRole: true });
  });

  it("assigns a Page to an owned folder", async () => {
    await uploadPage({
      file: new File(["<h1>hello</h1>"], "hello.html"),
      userId: "user-id",
      folderId: "folder-id",
    });

    expect(folders.getFolderById).toHaveBeenCalledWith("folder-id", { serviceRole: false });
    expect(pages.insertPage).toHaveBeenCalledWith(expect.objectContaining({ folder_id: "folder-id" }), { serviceRole: false });
  });

  it("rejects a folder owned by another user before creating storage objects", async () => {
    folders.getFolderById.mockResolvedValueOnce({
      id: "folder-id",
      user_id: "another-user",
      parent_id: null,
      name: "Private",
      created_at: "2025-01-01T00:00:00.000Z",
    });

    await expect(uploadPage({
      file: new File(["<h1>hello</h1>"], "hello.html"),
      userId: "user-id",
      folderId: "folder-id",
    })).rejects.toThrow("Folder not found");
    expect(storage.uploadFile).not.toHaveBeenCalled();
  });

  it("compensates for objects when the Page row cannot be committed", async () => {
    pages.insertPage.mockRejectedValue(new Error("database unavailable"));

    await expect(uploadPage({
      file: new File(["print('hello')"], "hello.py"),
      userId: "user-id",
    })).rejects.toThrow("database unavailable");

    const [keys] = storage.deleteFiles.mock.calls[0];
    expect(keys).toHaveLength(2);
    expect(keys[0]).toMatch(/^user-id\/[0-9a-f-]+\/rendered\.html$/);
    expect(keys[1]).toMatch(/^user-id\/[0-9a-f-]+\/source\.py$/);
  });

  it("rejects malformed data before creating storage objects", async () => {
    await expect(uploadPage({
      file: new File(["{oops"], "broken.json"),
      userId: "user-id",
    })).rejects.toThrow("Invalid JSON source");

    expect(storage.uploadFile).not.toHaveBeenCalled();
    expect(pages.insertPage).not.toHaveBeenCalled();
  });
});
