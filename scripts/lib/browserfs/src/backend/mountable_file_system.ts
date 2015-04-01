import file_system = require('../core/file_system');
import in_memory = require('./in_memory');
import api_error = require('../core/api_error');
import node_fs = require('../core/node_fs');
import browserfs = require('../core/browserfs');

var ApiError = api_error.ApiError;
var ErrorCode = api_error.ErrorCode;
var fs = node_fs.fs;
/**
 * The MountableFileSystem allows you to mount multiple backend types or
 * multiple instantiations of the same backend into a single file system tree.
 * The file systems do not need to know about each other; all interactions are
 * automatically facilitated through this interface.
 *
 * For example, if a file system is mounted at /mnt/blah, and a request came in
 * for /mnt/blah/foo.txt, the file system would see a request for /foo.txt.
 */
export class MountableFileSystem extends file_system.BaseFileSystem implements file_system.FileSystem {
  private mntMap: {[path: string]: file_system.FileSystem};
  private rootFs: file_system.FileSystem;
  constructor() {
    super();
    this.mntMap = {};
    // The InMemory file system serves purely to provide directory listings for
    // mounted file systems.
    this.rootFs = new in_memory.InMemoryFileSystem();
  }

  /**
   * Mounts the file system at the given mount point.
   */
  public mount(mnt_pt: string, fs: file_system.FileSystem): void {
    if (this.mntMap[mnt_pt]) {
      throw new ApiError(ErrorCode.EINVAL, "Mount point " + mnt_pt + " is already taken.");
    }
    // @todo Ensure new mount path is not subsumed by active mount paths.
    this.rootFs.mkdirSync(mnt_pt, 0x1ff);
    this.mntMap[mnt_pt] = fs;
  }

  public umount(mnt_pt: string): void {
    if (!this.mntMap[mnt_pt]) {
      throw new ApiError(ErrorCode.EINVAL, "Mount point " + mnt_pt + " is already unmounted.");
    }
    delete this.mntMap[mnt_pt];
    this.rootFs.rmdirSync(mnt_pt);
  }

  /**
   * Returns the file system that the path points to.
   */
  public _get_fs(path: string): {fs: file_system.FileSystem; path: string} {
    for (var mnt_pt in this.mntMap) {
      var fs = this.mntMap[mnt_pt];
      if (path.indexOf(mnt_pt) === 0) {
        path = path.substr(mnt_pt.length > 1 ? mnt_pt.length : 0);
        if (path === '') {
          path = '/';
        }
        return {fs: fs, path: path};
      }
    }
    // Query our root file system.
    return {fs: this.rootFs, path: path};
  }

  // Global information methods

  public getName(): string {
    return 'MountableFileSystem';
  }

  public static isAvailable(): boolean {
    return true;
  }

  public diskSpace(path: string, cb: (total: number, free: number) => void): void {
    cb(0, 0);
  }

  public isReadOnly(): boolean {
    return false;
  }

  public supportsLinks(): boolean {
    // I'm not ready for cross-FS links yet.
    return false;
  }

  public supportsProps(): boolean {
    return false;
  }

  public supportsSynch(): boolean {
    return true;
  }

  /**
   * Fixes up error messages so they mention the mounted file location relative
   * to the MFS root, not to the particular FS's root.
   * Mutates the input error, and returns it.
   */
  private standardizeError(err: api_error.ApiError, path, realPath): api_error.ApiError {
    var index: number;
    if (-1 !== (index = err.message.indexOf(path))) {
      err.message = err.message.substr(0, index) + realPath + err.message.substr(index + path.length);
    }
    return err;
  }

  // The following methods involve multiple file systems, and thus have custom
  // logic.
  // Note that we go through the Node API to use its robust default argument
  // processing.

  public rename(oldPath: string, newPath: string, cb: (e?: api_error.ApiError) => void): void {
    // Scenario 1: old and new are on same FS.
    var fs1_rv = this._get_fs(oldPath);
    var fs2_rv = this._get_fs(newPath);
    if (fs1_rv.fs === fs2_rv.fs) {
      var _this = this;
      return fs1_rv.fs.rename(fs1_rv.path, fs2_rv.path, function(e?: api_error.ApiError) {
        if (e) _this.standardizeError(_this.standardizeError(e, fs1_rv.path, oldPath), fs2_rv.path, newPath);
        cb(e);
      });
    }

    // Scenario 2: Different file systems.
    // Read old file, write new file, delete old file.
    return fs.readFile(oldPath, function(err: api_error.ApiError, data?: any) {
      if (err) {
        return cb(err);
      }
      fs.writeFile(newPath, data, function(err) {
        if (err) {
          return cb(err);
        }
        fs.unlink(oldPath, cb);
      });
    });
  }

  public renameSync(oldPath: string, newPath: string): void {
    // Scenario 1: old and new are on same FS.
    var fs1_rv = this._get_fs(oldPath);
    var fs2_rv = this._get_fs(newPath);
    if (fs1_rv.fs === fs2_rv.fs) {
      try {
        return fs1_rv.fs.renameSync(fs1_rv.path, fs2_rv.path);
      } catch(e) {
        this.standardizeError(this.standardizeError(e, fs1_rv.path, oldPath), fs2_rv.path, newPath);
        throw e;
      }
    }
    // Scenario 2: Different file systems.
    var data = fs.readFileSync(oldPath);
    fs.writeFileSync(newPath, data);
    return fs.unlinkSync(oldPath);
  }
}

/**
 * Tricky: Define all of the functions that merely forward arguments to the
 * relevant file system, or return/throw an error.
 * Take advantage of the fact that the *first* argument is always the path, and
 * the *last* is the callback function (if async).
 */
function defineFcn(name: string, isSync: boolean, numArgs: number): (...args: any[]) => any {
  if (isSync) {
    return function(...args: any[]) {
      var path = args[0];
      var rv = this._get_fs(path);
      args[0] = rv.path;
      try {
        return rv.fs[name].apply(rv.fs, args);
      } catch (e) {
        this.standardizeError(e, rv.path, path);
        throw e;
      }
    };
  } else {
    return function(...args: any[]) {
      var path = args[0];
      var rv = this._get_fs(path);
      args[0] = rv.path;
      if (typeof args[args.length-1] === 'function') {
        var cb = args[args.length - 1];
        var _this = this;
        args[args.length - 1] = function(...args: any[]) {
          if (args.length > 0 && args[0] instanceof api_error.ApiError) {
            _this.standardizeError(args[0], rv.path, path);
          }
          cb.apply(null, args);
        }
      }
      return rv.fs[name].apply(rv.fs, args);
    };
  }
}

var fsCmdMap = [
   // 1 arg functions
   ['readdir', 'exists', 'unlink', 'rmdir', 'readlink'],
   // 2 arg functions
   ['stat', 'mkdir', 'realpath', 'truncate'],
   // 3 arg functions
   ['open', 'readFile', 'chmod', 'utimes'],
   // 4 arg functions
   ['chown'],
   // 5 arg functions
   ['writeFile', 'appendFile']];

for (var i = 0; i < fsCmdMap.length; i++) {
  var cmds = fsCmdMap[i];
  for (var j = 0; j < cmds.length; j++) {
    var fnName = cmds[j];
    MountableFileSystem.prototype[fnName] = defineFcn(fnName, false, i + 1);
    MountableFileSystem.prototype[fnName + 'Sync'] = defineFcn(fnName + 'Sync', true, i + 1);
  }
}

browserfs.registerFileSystem('MountableFileSystem', MountableFileSystem);

