import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb"
import { APIGatewayProxyHandler } from "aws-lambda"

import shallowFormatData from "./utils/shallowFormatData"
import createResponse from "./utils/createResponse"

const dynamoDBClient = new DynamoDBClient({ region: "us-east-1" })
const productsTableName = process.env.PRODUCTS_TABLE
const stocksTableName = process.env.STOCKS_TABLE

export const main: APIGatewayProxyHandler = async function (event, context) {
  try {
    const productsCommand = new ScanCommand({ TableName: productsTableName })
    const stocksCommand = new ScanCommand({ TableName: stocksTableName })
    const products = await dynamoDBClient.send(productsCommand)
    const stocks = await dynamoDBClient.send(stocksCommand)

    const mappedProducts = products.Items!.map((item) => {
      const product = shallowFormatData(item)
      const stock = stocks.Items!.find((el) => shallowFormatData(el).product_id === product.id)
      return {
        ...product,
        count: stock?.count || 0,
      }
    })
    
    return createResponse(200, JSON.stringify(mappedProducts))
  } catch (error: any) {
    const body = error.stack || JSON.stringify(error, null, 2)
    return createResponse(500, body)
  }
}
