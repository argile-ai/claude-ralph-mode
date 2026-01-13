import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "path";
import os from "os";
import {
  loadConfig,
  configExists,
  getDefaultConfig,
  ConfigNotFoundError,
  ConfigValidationError,
} from "../../src/core/config.js";

describe("config", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "ralph-test-"));
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe("loadConfig", () => {
    it("should load a valid config file", async () => {
      const config = {
        project: "TestProject",
        repositories: {
          main: {
            path: ".",
            checks: ["npm test"],
          },
        },
      };

      await fs.writeJSON(path.join(tempDir, "ralph.config.json"), config);

      const loaded = await loadConfig(tempDir);

      expect(loaded.project).toBe("TestProject");
      expect(loaded.repositories.main.path).toBe(".");
      expect(loaded.repositories.main.checks).toEqual(["npm test"]);
    });

    it("should apply defaults for optional fields", async () => {
      const config = {
        project: "TestProject",
        repositories: {
          main: {
            path: ".",
          },
        },
      };

      await fs.writeJSON(path.join(tempDir, "ralph.config.json"), config);

      const loaded = await loadConfig(tempDir);

      expect(loaded.repositories.main.defaultBranch).toBe("main");
      expect(loaded.repositories.main.checks).toEqual([]);
      expect(loaded.agent?.maxIterations).toBe(50);
      expect(loaded.agent?.timeout).toBe(600);
    });

    it("should throw ConfigNotFoundError when no config exists", async () => {
      await expect(loadConfig(tempDir)).rejects.toThrow(ConfigNotFoundError);
    });

    it("should throw ConfigValidationError for invalid config", async () => {
      const invalidConfig = {
        // Missing required 'project' field
        repositories: {},
      };

      await fs.writeJSON(path.join(tempDir, "ralph.config.json"), invalidConfig);

      await expect(loadConfig(tempDir)).rejects.toThrow(ConfigValidationError);
    });

    it("should load config from .ralphrc.json", async () => {
      const config = {
        project: "RcProject",
        repositories: {
          main: { path: "." },
        },
      };

      await fs.writeJSON(path.join(tempDir, ".ralphrc.json"), config);

      const loaded = await loadConfig(tempDir);
      expect(loaded.project).toBe("RcProject");
    });
  });

  describe("configExists", () => {
    it("should return true when config exists", async () => {
      const config = {
        project: "Test",
        repositories: { main: { path: "." } },
      };

      await fs.writeJSON(path.join(tempDir, "ralph.config.json"), config);

      expect(await configExists(tempDir)).toBe(true);
    });

    it("should return false when no config exists", async () => {
      expect(await configExists(tempDir)).toBe(false);
    });
  });

  describe("getDefaultConfig", () => {
    it("should return a valid default config", () => {
      const config = getDefaultConfig("MyProject");

      expect(config.project).toBe("MyProject");
      expect(config.version).toBe("1.0");
      expect(config.repositories.main).toBeDefined();
      expect(config.repositories.main.path).toBe(".");
      expect(config.agent?.maxIterations).toBe(50);
    });
  });
});
