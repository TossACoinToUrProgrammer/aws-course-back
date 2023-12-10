import { Readable } from "stream"
import { S3Event } from "aws-lambda"
import { CopyObjectCommand, DeleteObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { SQS } from "aws-sdk"
import csv = require("csv-parser")

import createResponse from "./utils/createResponse"

const client = new S3Client({ region: "us-east-1" })
const sqs = new SQS()

export const handler = async (event: S3Event) => {
  console.log(event)

  const KEY = event.Records[0].s3.object.key
  const BUCKET = event.Records[0].s3.bucket.name

  const params = {
    Bucket: BUCKET,
    Key: KEY,
  }

  const command = new GetObjectCommand(params)

  try {
    const item = await client.send(command)

    await new Promise(() => {
      const body = item.Body

      if (body instanceof Readable) {
        body
          .pipe(csv())
          .on("data", async (data: any) => {
            const params = {
              MessageBody: JSON.stringify(data),
              QueueUrl: "https://sqs.us-east-1.amazonaws.com/745945733339/catalogItemsQueue",
            }
            console.log(`Record: ${JSON.stringify(data)}`)
            await sqs.sendMessage(params).promise()
          })
          .on("end", async () => {
            console.log("CSV file is parsed.")

            try {
              await client.send(
                new CopyObjectCommand({
                  Bucket: BUCKET,
                  CopySource: BUCKET + "/" + KEY,
                  Key: KEY.replace("uploaded", "parsed"),
                })
              )

              console.log(`CopyObjectCommand.`)

              await client.send(
                new DeleteObjectCommand({
                  Bucket: BUCKET,
                  Key: KEY,
                })
              )

              console.log(`DeleteObjectCommand.`)
            } catch (error) {
              console.log(error)
            }
          })
          .on("error", (error: any) => console.log(`Error: ${error}`))
      } else {
        console.log("File error.")
      }
    })

    return createResponse(200, JSON.stringify("Successfully parsed.", null, 2))
  } catch (error: any) {
    console.log(error)

    return createResponse(500, error.message || JSON.stringify("Server error.", null, 2))
  }
}
