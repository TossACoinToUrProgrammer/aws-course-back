import { DynamoDBClient, PutItemCommand, AttributeValue } from "@aws-sdk/client-dynamodb"
import { APIGatewayProxyHandler } from "aws-lambda"
import createResponse from "./utils/createResponse"

const dynamoDBClient = new DynamoDBClient({ region: "us-east-1" })
const productsTableName = process.env.PRODUCTS_TABLE
const stocksTableName = process.env.STOCKS_TABLE

export const main: APIGatewayProxyHandler = async function (event, context) {
  try {
    if (!event.body) {
      return createResponse(400, "no input data was provided")
    }

    const reqBody = JSON.parse(event.body)

    if (
      !(reqBody && reqBody.title && typeof reqBody.title === "string") ||
      (reqBody.description && typeof reqBody.description !== "string") ||
      (reqBody.price && typeof reqBody.price !== "number")
    ) {
      return createResponse(400, "invalid input data")
    }

    const item: { [key: string]: AttributeValue } = {
      id: { S: `${Date.now()}-product` },
      title: { S: reqBody.title },
    }

    if (reqBody.description) item.description = { S: reqBody.description }
    if (reqBody.price) item.price = { N: reqBody.price }

    const createCommand = new PutItemCommand({
      TableName: productsTableName,
      Item: item,
    })

    await dynamoDBClient.send(createCommand)
    return createResponse(200, "Product created")
  } catch (error: any) {
    const body = error.stack || JSON.stringify(error, null, 2)
    return createResponse(500, body)
  }
}
