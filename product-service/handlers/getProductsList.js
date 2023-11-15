const mockData = require("../mock-data.json")
const getHeaders = require("../utils/getHeaders")

const getProductsList = async () => {
  return {
    statusCode: 200,
    headers: getHeaders(),
    body: JSON.stringify(mockData, null, 2),
  }
}

module.exports = getProductsList
