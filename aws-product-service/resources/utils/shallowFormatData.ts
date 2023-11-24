function shallowFormatData(data: any) {
  // Loop through the object and replace the Type key with the value.
  for (const key in data) {
    const innerRawObject = data[key]
    const innerKeys = Object.keys(innerRawObject)
    innerKeys.forEach((innerKey) => {
      const innerFormattedObject = innerRawObject[innerKey]
      if (typeof innerFormattedObject == "object") {
        data[key] = shallowFormatData(innerFormattedObject) // Recursively call formatData if there are nested objects
      } else {
        // Null items come back with a type of "NULL" and value of true. we want to set the value to null if the type is "NULL"
        data[key] = innerKey == "NULL" ? null : innerFormattedObject
      }
    })
  }
  return data
}

export default shallowFormatData