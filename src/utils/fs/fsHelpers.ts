import fs from 'fs';
import path from 'path';
import { Logger } from '@utils/logger.ts';

/**
 * Safe wrappers around file system actions.
 * Ensures secure and consistent checks whenever performing actions such as
 * creating/deleting folders, reading/creating/deleting files and others.
 *
 * Ensures the actions are only allowed within the project workspace
 * and that resources exist
 */
export class FSHelpers {
    private static readonly WORKSPACE_ROOT = path.resolve(process.cwd());
    private static readonly WORKSPACE_REAL: string = fs.realpathSync(this.WORKSPACE_ROOT);

    /**
     * Compute a real path for targetPath.
     * If the target exists, return fs.realpathSync(targetPath).
     * If it does not exist, find the nearest existing ancestor, realpathSync that,
     * then append the remaining non-existing suffix (normalized). This avoids symlink escapes
     * for paths that don't exist yet.
     */
    private static canonicalizeTarget(targetPath: string): string {
        const abs = path.resolve(targetPath);

        // If the target exists, realpathSync yields canonical path with symlinks resolved.
        if (fs.existsSync(abs)) {
            return fs.realpathSync(abs);
        }

        // Find nearest existing ancestor
        let cur = abs;
        const parts: string[] = [];
        while (!fs.existsSync(cur)) {
            const parsed = path.parse(cur);
            if (parsed.dir === cur) {
                // reached filesystem root and didn't find existing ancestor
                break;
            }
            parts.unshift(parsed.base);
            cur = parsed.dir;
        }

        // cur is now the nearest existing ancestor (may be root)
        const realAncestor = fs.existsSync(cur) ? fs.realpathSync(cur) : path.resolve(cur);
        // recompose the intended path relative to realAncestor
        const joined = parts.length ? path.join(realAncestor, ...parts) : realAncestor;
        return path.resolve(joined);
    }

    /**
     * Returns true if resolvedTarget is inside the workspace, false otherwise.
     * Uses canonical (real) paths so symlinks are resolved.
     * @param targetPath path to check
     * @returns
     */
    public static isInsideWorkspace(targetPath: string): boolean {
        try {
            const canonical = this.canonicalizeTarget(targetPath);

            // Normalize for comparison (ensure trailing separator permutation doesn't matter)
            const normalizedWorkspace = path.normalize(this.WORKSPACE_REAL);
            const normalizedTarget = path.normalize(canonical);

            // If exactly equal -> inside
            if (normalizedTarget === normalizedWorkspace) return true;

            // Ensure target starts with workspace + path.sep (prevents /workspace2-from-same-prefix)
            const prefix = normalizedWorkspace.endsWith(path.sep)
                ? normalizedWorkspace
                : normalizedWorkspace + path.sep;

            return normalizedTarget.startsWith(prefix);
        } catch (e: any) {
            Logger.error(e.message);
            // conservative: if any error occurs resolving, treat as outside
            return false;
        }
    }

    /**
     * check if the path exists in the workspace
     * throws if the path is outside of the workspace
     * @param targetPath
     * @returns
     */
    public static pathExists(targetPath: string): boolean {
        if (!this.isInsideWorkspace(targetPath))
            throw new Error(`[Security] Trying to check if path exists outside of the workspace.`);

        return fs.existsSync(targetPath);
    }

    /**
     * Walk existing path components from the target up to (and including) the nearest existing ancestor,
     * checking for any symbolic links. If any component in the existing chain is a symlink, returns true.
     *
     * This prevents a path like "project/artifacts" being a symlink to "/etc".
     *
     * NOTE: we only inspect existing components. If the path is wholly non-existent we inspect its nearest existing ancestor.
     */
    private static hasSymlinkInExistingPath(targetPath: string): boolean {
        try {
            const abs = path.resolve(targetPath);

            // find nearest existing ancestor
            let cur = abs;
            while (!fs.existsSync(cur)) {
                const parent = path.dirname(cur);
                if (parent === cur) break; // reached root
                cur = parent;
            }

            // cur now exists (or is root). Walk from cur up to abs, checking each existing component's lstat.
            // We'll walk downward from the ancestor to the final existing nodes.
            const ancestor = cur;
            const normalizedAbs = path.normalize(abs);

            // Build list of path segments after ancestor
            const rel = path.relative(ancestor, normalizedAbs);
            const segments = rel ? rel.split(path.sep) : [];

            // Start at ancestor
            let check = ancestor;
            // First check the ancestor itself
            try {
                const stat = fs.lstatSync(check);
                if (stat.isSymbolicLink()) return true;
            } catch {
                // ignore stat errors and treat as no symlink at that node
            }

            // Then check each successive existing component (only if they exist)
            for (const seg of segments) {
                check = path.join(check, seg);
                if (!fs.existsSync(check)) break; // remainder doesn't exist; stop checking
                try {
                    const stat = fs.lstatSync(check);
                    if (stat.isSymbolicLink()) return true;
                } catch {
                    // ignore and continue
                }
            }

            return false;
        } catch {
            // Conservative: if anything goes wrong, assume there's a symlink
            return true;
        }
    }

    /**
     * Perform final safety checks to ensure we can safely operate on targetPath:
     * - canonical (real) target path must be inside workspace (prevents traversal)
     * - none of the existing path components are symlinks (prevents symlink escape)
     *
     * Throws an Error if unsafe.
     */
    private static assertSafePath(targetPath: string) {
        const canonical = this.canonicalizeTarget(targetPath);

        if (!this.isInsideWorkspace(canonical)) {
            throw new Error(
                `[SECURITY] Refusing operation: path is outside workspace: ${canonical}`
            );
        }

        // If any existing component in the original path is a symlink, refuse.
        if (this.hasSymlinkInExistingPath(targetPath)) {
            throw new Error(
                `[SECURITY] Refusing operation: path contains a symlink (possible escape): ${targetPath}`
            );
        }
    }

    /**
     * Create a folder recursively if it doesn't exist.
     * Performs a security check on the path to ensure it is inside the workspace
     * before performing the action
     * @param targetPath
     */
    public static createPathSafe(targetPath: string) {
        // normalize input
        const abs = path.resolve(targetPath);

        // ensure the path we're creating is inside the workspace and safe
        this.assertSafePath(abs);

        // attempt to create the folder
        try {
            if (!fs.existsSync(abs)) fs.mkdirSync(abs, { recursive: true });
        } catch (e) {
            Logger.error(`Failed to create path ${abs}`);
            throw e;
        }
    }

    /**
     * return the contents of the directory
     * throws if path is not in the workspace
     * @param targetPath
     * @returns
     */
    public static readDirSafe(targetPath: string): string[] {
        // normalize input
        const abs = path.resolve(targetPath);

        // ensure the path we're creating is inside the workspace and safe
        this.assertSafePath(abs);

        // attempt to create the folder
        try {
            return fs.readdirSync(targetPath);
        } catch (e) {
            Logger.error(`Failed to read path ${abs}`);
            throw e;
        }
    }

    /**
     * Clean up defined directories after the test is complete
     * Each path is canonicalized, verified to be inside the workspace, and checked for symlink ancestry.
     */
    public static cleanUpFolders(pathsToDelete: string[]) {
        Logger.info('Cleaning up folders...');
        for (const target of pathsToDelete) {
            try {
                const abs = path.resolve(target);

                // ---- SAFETY CHECK ----
                try {
                    this.assertSafePath(abs);
                } catch (err) {
                    Logger.error(
                        `⚠️ Skipped deleting "${abs}" — unsafe: ${(err as Error).message}`
                    );
                    continue;
                }

                if (fs.existsSync(abs)) {
                    Logger.info(`Deleting: ${abs}`);
                    fs.rmSync(abs, { recursive: true, force: true });
                }
            } catch (e) {
                // If we can't safely determine or delete, log and continue
                Logger.error(`Failed to delete "${target}": ${(e as Error).message}`);
            }
        }
    }

    /**
     * Read a UTF-8 file safely.
     * Security:
     *  - Path must resolve inside workspace
     *  - No symlink components allowed
     *  - Canonical real path is used
     * @param targetPath filepath
     * @param encoding default = utf-8
     * @returns
     */
    public static readFileSafe(targetPath: string, encoding: BufferEncoding = 'utf-8'): string {
        const abs = path.resolve(targetPath);

        // Apply full symlink + traversal protection
        this.assertSafePath(abs);

        try {
            return fs.readFileSync(abs, encoding);
        } catch (err) {
            Logger.error(`Failed to read file "${abs}": ${(err as Error).message}`);
            throw err;
        }
    }

    /**
     * Safely delete a file if it exists
     * @param targetPath absolute or relative path to file
     */
    public static deleteFileSafe(targetPath: string) {
        const absPath = path.resolve(targetPath);
        try {
            this.assertSafePath(absPath);

            if (fs.existsSync(absPath)) {
                fs.unlinkSync(absPath);
                Logger.info(`Deleted file: ${absPath}`);
            }
        } catch (err) {
            Logger.error(`Failed to delete file "${absPath}": ${(err as Error).message}`);
            throw err;
        }
    }

    /**
     * Safely write a JSON file to disk.
     * Ensures the directory exists, path is safe, and writes JSON with formatting
     * @param filePath absolute or relative path to the file
     * @param data object to write as JSON
     */
    public static writeTextFileSafe(filePath: string, data: any, type: 'text' | 'json') {
        const absPath = path.resolve(filePath);
        try {
            // ensure parent directory exists
            // folder creation already ensures it's safe
            this.createPathSafe(path.dirname(absPath));

            // convert to json if needed
            const content: string = type === 'json' ? JSON.stringify(data, null, 2) : data;

            // attempt to write the file
            fs.writeFileSync(absPath, content, { encoding: 'utf-8' });
        } catch (err) {
            Logger.error(`Failed to write to "${absPath}": ${(err as Error).message}`);
            throw err;
        }
    }
}
