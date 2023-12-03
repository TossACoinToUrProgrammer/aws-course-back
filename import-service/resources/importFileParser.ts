import { APIGatewayProxyHandler } from "aws-lambda"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { Readable, Transform } from "stream"
import * as csvParser from "csv-parser"

const s3 = new S3Client()

export const main: APIGatewayProxyHandler = async (event) => {
  try {
    console.log("111111111", event)
    return {
      statusCode: 200,
      body: JSON.stringify({}),
    }
  } catch (error) {
    console.error("Error:", error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    }
  }
}
