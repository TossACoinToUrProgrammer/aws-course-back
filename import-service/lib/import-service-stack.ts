import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs"
import * as apigateway from "aws-cdk-lib/aws-apigateway"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as s3 from "aws-cdk-lib/aws-s3"
import * as s3n from "aws-cdk-lib/aws-s3-notifications"
import * as iam from "aws-cdk-lib/aws-iam"
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs"

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

    const importFileParser = new NodejsFunction(this, "importFileParser", {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: "resources/importFileParser.ts",
      handler: "handler",
    })

    importFileParser.role?.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
    )
    importFileParser.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['sqs:SendMessage'],
        resources: ["arn:aws:sqs:us-east-1:745945733339:catalogItemsQueue"], // Make sure to provide correct ARN for your SQS queue
      }),
    );

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

    existingBucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.LambdaDestination(importFileParser))
  }
}
