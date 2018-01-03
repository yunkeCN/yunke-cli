const fs = require('fs');
const path = require('path');
const {promisify} = require('util');
const assign = require('./assign');

// Promisify native method
const mkdir = promisify(fs.mkdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const access = promisify(fs.access);
const statInfo = promisify(fs.stat);
const readDir = promisify(fs.readdir);

let remove;

/**
 * `fs.stat`
 * methods:
 * stats.isFile()
 * stats.isDirectory()
 * stats.isBlockDevice()
 * stats.isCharacterDevice()
 * stats.isSymbolicLink() (only valid with fs.lstat())
 * stats.isFIFO()
 * stats.isSocket()
 * @param {string} _path
 * @returns
 */
function stat(_path) {
  return statInfo(_path).then(data => data, err => err);
}

/**
 * `fs.mkdir` recursively.
 * @param {string|array} dirs
 * @param {number} [i=1]
 * @returns
 */
function mkdirp(_path, i = 1) {
  if (!_path) {
    throw new Error('Please provide a path.');
  }

  let dirs;
  if (typeof _path === 'string') {
    dirs = path.dirname(_path).split(path.sep);
  } else if (Array.isArray(_path)) {
    dirs = _path;
  } else {
    throw new TypeError('Path should be string or array.');
  }

  if (i > dirs.length) {
    return true;
  }
  const dir = dirs.slice(0, i).join(path.sep);
  return mkdir(dir).catch(err => err).then(() => mkdirp(dirs, i + 1));
}

/**
 * `fs.access`
 * @param {string} _path
 * @returns
 */
function exist(_path) {
  return access(_path).then(() => true, () => false);
}

/**
 * `fs.accessSync`
 * @param {string} _path
 * @returns
 */
function existSync(_path) {
  try {
    fs.accessSync(_path, fs.R_OK | fs.W_OK);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * `fs.readFile`
 * @param {string} _path
 * @param {object} options
 * @returns
 */
function read(_path, ...options) {
  const readOptions = assign(
    {
      encoding: 'utf8',
      flag: 'r'
    },
    options
  );

  return readFile(_path, readOptions);
}

/**
 * `fs.writeFile`
 * @param {string} _path
 * @param {string} content
 * @param {object} options
 * @returns
 */
function write(_path, content, ...options) {
  const writeOptions = assign(
    {
      encoding: 'utf8',
      flag: 'w',
      mode: 0o666
    },
    options
  );
  return mkdirp(path.dirname(_path).split(path.sep)).then(() =>
    writeFile(_path, content, writeOptions));
}

function removeDir(dir) {
  return new Promise((resolve, reject) => {
    fs.access(dir, (err) => {
      if (err) {
        return reject(err);
      }

      fs.readdir(dir, (error, files) => {
        if (error) {
          return reject(error);
        }
        Promise.all(files.map(file => remove(path.join(dir, file))))
          .then(() => {
            fs.rmdir(dir, (e) => {
              if (e) {
                return reject(e);
              }
              resolve();
            });
          })
          .catch(reject);
      });
    });
  });
}

/**
 * Remove a file or directory
 * @param {string} filePath path to remove
 * @returns
 */
remove = filePath => new Promise((resolve, reject) => {
  fs.lstat(filePath, (err, stats) => {
    if (err) {
      return reject(err);
    }
    if (stats && stats.isDirectory()) {
      resolve(removeDir(filePath));
    } else {
      fs.unlink(filePath, (e) => {
        if (e) {
          return reject(e);
        }
        resolve();
      });
    }
  });
});

function privateList(dir, ignore) {
  const valid = item => !ignore.includes(item);
  return readDir(dir).then(
    ret => (ignore && ignore.length ? ret.filter(valid) : ret),
    err => err
  );
}

async function privateCopy({
  source, target, quiet, logger, srcRoot, dstRoot
} = {}) {
  const dir = path.dirname(target);
  if (!await exist(dir)) {
    await mkdirp(target);
  }
  return new Promise((resolve, reject) => {
    const rd = fs.createReadStream(source);
    rd.on('error', reject);
    const wr = fs.createWriteStream(target);
    wr.on('error', reject);
    wr.on('finish', () => {
      if (!quiet) {
        logger(`Copy \`${path.relative(srcRoot, source)}\` => \`${path.relative(
          dstRoot,
          target
        )}\``);
      }
      resolve();
    });
    rd.pipe(wr);
  });
}

/**
 * List directory
 * @param {string} dir
 * @param {array} ignore
 * @returns
 */
function list(dir, ignore = [], depth) {
  if (depth === 1) {
    return privateList(dir, ignore);
  }
  return stat(dir).then((stats) => {
    if (stats && stats.isDirectory()) {
      return privateList(dir, ignore)
        .then(file =>
          Promise.all(file.map(item => list(path.resolve(dir, item), ignore))))
        .then(subtree => [].concat(...subtree));
    }

    return [dir];
  });
}


/**
 * File or directory copy
 * @param {string} from File or directory
 * @param {string} to File or directory
 * @param {boolean} quiet show log
 * @returns
 */
async function copy({
  from, to, maxFileNum = 500, ignore = [], quiet = false, log
} = {}) {
  const logger = log ? log.debug : console.log;
  if (!await exist(from)) {
    throw new Error(`\`${from}\` not exist.`);
  }

  if (!quiet) {
    logger(`Copy from \`${from}\` to \`${to}\` `);
  }

  const stats = await stat(from);

  if (stats.isFile()) {
    let target;
    if (!path.extname(to) || path.extname(to) === '.') {
      target = path.join(to, path.basename(from));
    } else {
      target = to;
    }
    return privateCopy({
      source: from,
      srcRoot: from,
      dstRoot: to,
      target,
      quiet,
      logger
    });
  }

  const lists = await list(from, ignore);
  const splitArr = [];
  const promises = [];

  for (let i = 0, len = lists.length; i < len; i += maxFileNum) {
    splitArr.push(lists.slice(i, i + maxFileNum));
  }

  for (let i = 0, len = splitArr.length; i < len; i += 1) {
    if (!quiet) {
      logger(`splitArr[${i}].length:`, splitArr[i].length);
    }
    promises.push(splitArr[i].map(async (item) => {
      try {
        const target = path.relative(from, item);
        await privateCopy({
          source: item,
          srcRoot: from,
          dstRoot: to,
          target: path.join(to, target),
          quiet,
          logger
        });
      } catch (err) {
        throw err;
      }
    }));
  }
  await Promise.all(promises);
  Promise.resolve();
}

async function move(from, to, logger, ignore = [], quiet = true) {
  await copy({
    from, to, ignore, log: logger, quiet
  });
  await remove(from);
}

/**
 * Directory is empty
 *
 * @param {string} dir Path to check
 * @returns
 */
function isEmptyDir(dir) {
  return readDir(dir).then(files => !files.length).catch(() => true);
}

// User home directory
const homeDir =
  process.platform === 'win32' ? process.env.USERPROFILE : process.env.HOME;

module.exports = {
  stat,
  mkdirp,
  exist,
  existSync,
  read,
  write,
  copy,
  remove,
  list,
  isEmptyDir,
  homeDir,
  move
};
