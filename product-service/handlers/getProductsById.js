const mockData = require("../mock-data.json")
const getHeaders = require("../utils/getHeaders")

const getProductsById = async (event) => {
  const { productId } = event.pathParameters
  const product = mockData.find((el) => el.id === productId)

  if (!product) {
    return {
      statusCode: 404,
      headers: getHeaders({ "Content-Type": "text/plain" }),
      body: `Product not found`,
    }
  }

  return {
    statusCode: 200,
    headers: getHeaders(),
    body: JSON.stringify(product, null, 2),
  }
}

module.exports = getProductsById
