export { equalArrays, equalObjects };

function isObject(value: unknown): value is Record<string, unknown> {
  return Object.getPrototypeOf(value) === Object.prototype;
}

function equalObjects(
  object1: Record<string, unknown>,
  object2: Record<string, unknown>
): boolean {
  const properties1 = Object.getOwnPropertyNames(object1);
  const properties2 = Object.getOwnPropertyNames(object2);

  if (!equalArrays(properties1, properties2)) {
    return false;
  }

  for (let index = 0; index < properties1.length; index++) {
    const name = properties1[index];

    const value1 = object1[name];
    const value2 = object2[name];

    if (
      Array.isArray(value1) &&
      Array.isArray(value2) &&
      !equalArrays(value1, value2)
    ) {
      return false;
    } else if (
      isObject(value1) &&
      isObject(value2) &&
      !equalObjects(value1, value2)
    ) {
      return false;
    } else if (value1 !== value2) {
      return false;
    }
  }

  return true;
}

function equalArrays(array1: unknown[], array2: unknown[]): boolean {
  if (array1.length !== array2.length) {
    return false;
  }

  for (let index = 0; index < array1.length; index++) {
    const value1 = array1[index];
    const value2 = array2[index];

    if (
      Array.isArray(value1) &&
      Array.isArray(value2) &&
      !equalArrays(value1, value2)
    ) {
      return false;
    } else if (
      isObject(value1) &&
      isObject(value2) &&
      !equalObjects(value1, value2)
    ) {
      return false;
    } else if (value1 !== value2) {
      return false;
    }
  }

  return true;
}
