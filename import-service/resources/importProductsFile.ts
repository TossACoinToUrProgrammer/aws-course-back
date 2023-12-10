import { APIGatewayProxyHandler } from "aws-lambda"
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import createResponse from "./utils/createResponse"

const s3 = new S3Client({ region: "us-east-1" })
const bucketName = process.env.BUCKET

export const main: APIGatewayProxyHandler = async function (event: any, context) {
  const pathProducts = event.queryStringParameters.name;
  console.log(`Input file: ${pathProducts}.`);

  if (!pathProducts.endsWith('.csv')) {
    console.log(`Error with .csv extension for "${pathProducts}" file.`)
    return createResponse(400, JSON.stringify(`The file format is invalid.`, null, 2));
  }
  const KEY = `uploaded/${pathProducts}`;

  const params = {
    Bucket: bucketName,
    Key: KEY,
    ContentType: 'text/csv',
  };

  const command = new PutObjectCommand(params);

  try {
    await s3.send(command)

    const url = await getSignedUrl(s3, command);

    console.log('Successfully uploaded to: ' + bucketName + '/' + KEY)

    return createResponse(200, url);
  } catch (error: any) {
    console.error(error);

    return createResponse(500, error.message || JSON.stringify('RS School Server error.', null, 2));
  }
}
