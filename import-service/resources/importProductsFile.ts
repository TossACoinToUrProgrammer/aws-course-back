import { APIGatewayProxyHandler } from "aws-lambda"
import { S3Client } from "@aws-sdk/client-s3"
import { createPresignedPost } from "@aws-sdk/s3-presigned-post"
import createResponse from "./utils/createResponse"

const s3 = new S3Client({ region: "us-east-1" })
const bucketName = process.env.BUCKET

export const main: APIGatewayProxyHandler = async function (event, context) {
  try {
    if (!event.queryStringParameters) {
      return createResponse(400, "no queryString provided")
    }
    const { name } = event.queryStringParameters

    // Generate a pre-signed URL for uploading an object
    const presignedPost = await createPresignedPost(s3, {
      Bucket: bucketName!,
      Key: `uploaded/${name}`,
      Fields: {
        "Content-Type": "text/csv", // Adjust the content type based on your file type
      },
      Expires: 60, // URL expires in 60 seconds
    })

    return createResponse(200, { uploadUrl: presignedPost.url, fields: presignedPost.fields })
  } catch (error: any) {
    const body = error.stack || JSON.stringify(error, null, 2)
    return createResponse(500, body)
  }
}
