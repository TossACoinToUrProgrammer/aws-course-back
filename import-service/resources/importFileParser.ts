import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { Readable } from "stream"
import * as csv from "csv-parser"
import { S3Event, S3Handler } from "aws-lambda"

const s3Client = new S3Client({ region: "us-east-1" })

export const handler: S3Handler = async (event: S3Event) => {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "))

    // Get the object
    const objectResult = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }))

    if (!objectResult.Body) {
      console.log("No body in the object")
      return
    }

    // Convert body into a stream
    const readable = new Readable()
    readable._read = (): void => {} // _read is required but does nothing in this scenario
    readable.push(objectResult.Body)
    readable.push(null)

    const stream = readable.pipe(csv())

    stream.on("data", (data) => {
      console.log(data)
    })

    stream.on("error", (err) => {
      console.error("Error reading the S3 object through stream: ", err)
    })
  }
}
