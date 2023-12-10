import { SQSEvent } from "aws-lambda"
import { DynamoDBClient, PutItemCommand, AttributeValue } from "@aws-sdk/client-dynamodb"
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns"

const snsClient = new SNSClient({ region: "us-east-1" })
const dynamoDBClient = new DynamoDBClient({ region: "us-east-1" })
const productsTableName = process.env.PRODUCTS_TABLE

export const main = async (event: SQSEvent) => {
  try {
    for (const record of event.Records) {
      const body = JSON.parse(record.body)

      console.log("Message Body: ", body)

      if (
        !(body && body.title && typeof body.title === "string") ||
        (body.description && typeof body.description !== "string") ||
        (body.price && typeof body.price !== "number" && typeof body.price !== "string")
      ) {
        throw new Error("Invalid data")
      }

      const item: { [key: string]: AttributeValue } = {
        id: { S: body.id || `${Date.now()}-product` },
        title: { S: body.title },
      }

      if (body.description) item.description = { S: body.description }
      if (body.price) item.price = { N: String(body.price) }

      const createCommand = new PutItemCommand({
        TableName: productsTableName,
        Item: item,
      })

      await dynamoDBClient.send(createCommand)

      await snsClient.send(
        new PublishCommand({
          Message: "Product Created",
          TopicArn: "arn:aws:sns:us-east-1:745945733339:createProductTopic",
        })
      )
      console.log(`Product created`)
    }
  } catch (error) {
    console.log("Server error.", error)
  }
}
