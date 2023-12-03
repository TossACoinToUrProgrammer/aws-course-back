import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs"
import * as apigateway from "aws-cdk-lib/aws-apigateway"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as s3 from "aws-cdk-lib/aws-s3"
import * as events from "aws-cdk-lib/aws-events"
import * as targets from "aws-cdk-lib/aws-events-targets"

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const bucketName = "uploaded-aws-course"

    const importProductsFile = new lambda.Function(this, "importProductsFile", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset("resources"),
      handler: "importProductsFile.main",
      environment: {
        BUCKET: bucketName,
      },
    })

    const importFileParser = new lambda.Function(this, "importFileParser", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset("resources"),
      handler: "importFileParser.main",
      environment: {
        BUCKET: bucketName,
      },
    })

    const existingBucket = s3.Bucket.fromBucketName(this, "UploadedBucket", bucketName)
    existingBucket.grantReadWrite(importProductsFile)
    existingBucket.grantReadWrite(importFileParser)

    const api = new apigateway.RestApi(this, "imports-api", {
      restApiName: "Import Service",
      description: "This service serves imports.",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ["*"],
      },
    })

    const lambdaIntegration = new apigateway.LambdaIntegration(importProductsFile, {
      requestParameters: {
        "integration.request.querystring.name": "method.request.querystring.name",
      },
    })

    // Create an API Gateway resource and method
    const resource = api.root.addResource("import")
    resource.addMethod("GET", lambdaIntegration, {
      requestParameters: {
        "method.request.querystring.name": true,
      },
    })

    // Define the event rule
    const s3EventRule = new events.Rule(this, "S3EventRule", {
      eventPattern: {
        source: ["aws.s3"],
        detailType: ["AWS API Call via CloudTrail"],
        detail: {
          eventSource: ["s3.amazonaws.com"],
          eventName: ["PutObject"],
          requestParameters: {
            bucketName: [existingBucket.bucketName],
            key: [{ prefix: "uploaded/" }],
          },
        },
      },
    })

    // Add Lambda function as a target to the S3 event rule
    s3EventRule.addTarget(new targets.LambdaFunction(importFileParser))
  }
}
