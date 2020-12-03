interface Options {
  clone: boolean;
  arrayMerge: (target: any[], source: any[], options: Options) => any[]
}

export function deepmerge<T extends Record<any, any> | any[] = Record<any, any> | any[]>(target: T, source: T, options: Options = {
  arrayMerge: defaultArrayMerge,
  clone: false
}): T {
  const isSourceArray = Array.isArray(source)
  const isTargetArray = Array.isArray(target)

  if (isSourceArray && isTargetArray) {
    return options.arrayMerge(target as any[], source as any[], options) as T
  }
  else if (isSourceArray) {
    return cloneIfNecessary(source, options)
  }
  else {
    return mergeObject(target, source, options)
  }
}

function isMergeableObject<T extends Record<any, any> = Record<any, any>>(value: T): boolean {
  const nonNullObject = value && typeof value === 'object'
  const excludedPrototypes = ['[object RegExp]', '[object Date]']
  const prototype = Object.prototype.toString.call(value)

  return nonNullObject && !excludedPrototypes.includes(prototype)
}

function emptyTarget(val: [] | {} | any): any[] | Record<any, any> {
  return Array.isArray(val) ? [] : {}
}

function cloneIfNecessary<T extends Record<any, any> = Record<any, any>>(value: T, options: Options) {
  return (options?.clone && isMergeableObject(value))
    ? deepmerge(emptyTarget(value), value, options)
    : value
}

function defaultArrayMerge(target: any[], source: any[], options: Options) {
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

function mergeObject<T extends Record<any, any> = Record<any, any>>(target: T, source: T, options: Options) {
  const destination: Record<any, any> = {}

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

deepmerge.series = function deepmergeAll<T extends Record<any, any> | any[] = Record<any, any> | any[]>(array: T[], options: Options) {
  if (!Array.isArray(array) || array.length < 2) {
    throw new Error('first argument should be an array with at least two elements')
  }

  // we are sure there are at least 2 values, so it is safe to have no initial value
  return array.reduce((prev, next) => deepmerge(prev, next, options))
}
