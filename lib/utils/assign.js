/**
 * Deep assign
 *
 * @param {object} target
 * @returns
 */
function assign(target) {
  const sources = [].slice.call(arguments, 1);
  sources.forEach((source) => {
    const keys = Object.keys(source);
    for (let i = 0; i < keys.length; i += 1) {
      const p = keys[i];
      if (typeof source[p] === 'object') {
        if (target === null || target === undefined) {
          target = {};
        } else if (
          target[p] === null ||
                    target[p] === undefined ||
                    typeof target[p] === 'boolean'
        ) {
          if (source[p] === null) {
            target[p] = source[p];
            continue;
          } else {
            target[p] = Array.isArray(source[p]) ? [] : {};
          }
        }

        assign(target[p], source[p]);
      } else if (
        target === null ||
                target === undefined ||
                typeof target === 'boolean'
      ) {
        if (source[p] === undefined) {
          target = source;
        } else {
          target = {};
          target[p] = source[p];
        }
        continue;
      } else {
        target[p] = source[p];
      }
    }
  });
  return target;
}

module.exports = assign;
