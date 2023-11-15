"use strict"
const getProductsById = require("./handlers/getProductsById")
const getProductsList = require("./handlers/getProductsList")

const hello = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        productName: "Book 21",
        price: 123,
      },
      null,
      2
    ),
  }
}

module.exports = { hello, getProductsList, getProductsById }
