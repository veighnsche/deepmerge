function isMergeableObject(value) {
  const nonNullObject = value && typeof value === 'object'
  const excludedPrototypes = ['[object RegExp]', '[object Date]']
  const prototype = Object.prototype.toString.call(value)

  return nonNullObject && !excludedPrototypes.includes(prototype)
}

function emptyTarget(val) {
  return Array.isArray(val) ? [] : {}
}

function cloneIfNecessary(value, options) {
  return (options?.clone && isMergeableObject(value))
    ? deepmerge(emptyTarget(value), value, options)
    : value
}

function defaultArrayMerge(target, source, options) {
  const destination = [...target]
  source.forEach((item, idx) => {
    if (typeof destination[idx] === 'undefined') {
      destination[idx] = cloneIfNecessary(item, options)
    }
    else if (isMergeableObject(item)) {
      destination[idx] = deepmerge(target[idx], item, options)
    }
    else if (target.indexOf(item) === -1) {
      destination.push(cloneIfNecessary(item, options))
    }
  })
  return destination
}

function mergeObject(target, source, options) {
  const destination = {}

  if (isMergeableObject(target)) {
    Object.keys(target).forEach(key => {
      destination[key] = cloneIfNecessary(target[key], options)
    })
  }

  Object.keys(source).forEach(function (key) {
    if (!isMergeableObject(source[key]) || !target[key]) {
      destination[key] = cloneIfNecessary(source[key], options)
    }
    else {
      destination[key] = deepmerge(target[key], source[key], options)
    }
  })
  return destination
}

export function deepmerge(target, source, options = {
  arrayMerge: defaultArrayMerge,
  clone: false
}) {
  const isSourceArray = Array.isArray(source)
  const isTargetArray = Array.isArray(target)

  if (isSourceArray && isTargetArray) {
    return options.arrayMerge(target, source, options)
  }
  else if (isSourceArray) {
    return cloneIfNecessary(source, options)
  }
  else {
    return mergeObject(target, source, options)
  }
}

deepmerge.series = function deepmergeAll(array, options) {
  if (!Array.isArray(array) || array.length < 2) {
    throw new Error('first argument should be an array with at least two elements')
  }

  // we are sure there are at least 2 values, so it is safe to have no initial value
  return array.reduce((prev, next) => deepmerge(prev, next, options))
}
