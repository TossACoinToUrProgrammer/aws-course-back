import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb"
import { APIGatewayProxyHandler } from "aws-lambda"

import shallowFormatData from "./utils/shallowFormatData"
import createResponse from "./utils/createResponse"

const dynamoDBClient = new DynamoDBClient({ region: "us-east-1" })
const productsTableName = process.env.PRODUCTS_TABLE
const stocksTableName = process.env.STOCKS_TABLE

export const main: APIGatewayProxyHandler = async function (event, context) {
  try {
    console.log(event)
    const id = event.pathParameters?.id
    if (!id) {
      throw new Error("id was not provided")
    }

    const productsCommand = new GetItemCommand({
      TableName: productsTableName,
      Key: { id: { S: id } },
    })
    const stockCommand = new GetItemCommand({
      TableName: stocksTableName,
      Key: { product_id: { S: id } },
    })
    const product = await dynamoDBClient.send(productsCommand)
    const stock = await dynamoDBClient.send(stockCommand)

    if (!product.Item) {
      return createResponse(400, "Product not found")
    }

    const formattedProduct = shallowFormatData(product.Item)
    const formattedStock = shallowFormatData(stock.Item)

    const body = {
      ...formattedProduct,
      count: formattedStock?.count || 0,
    }

    return createResponse(200, body)
  } catch (error: any) {
    const body = error.stack || JSON.stringify(error, null, 2)
    return createResponse(500, body)
  }
}
