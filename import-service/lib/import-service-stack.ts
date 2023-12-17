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
        actions: ["sqs:SendMessage"],
        resources: ["arn:aws:sqs:us-east-1:745945733339:catalogItemsQueue"],
      })
    )

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

    api.addGatewayResponse("GatewayResponse4XX", {
      type: cdk.aws_apigateway.ResponseType.DEFAULT_4XX,
      responseHeaders: {
        "Access-Control-Allow-Origin": "'*'",
        "Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
        "Access-Control-Allow-Methods": "'OPTIONS,GET,PUT'",
      },
    })

    const lambdaIntegration = new apigateway.LambdaIntegration(importProductsFile, {
      requestParameters: {
        "integration.request.querystring.name": "method.request.querystring.name",
      },
    })

    // Create an API Gateway resource and method
    const resource = api.root.addResource("import")

    const basicAuthorizer = lambda.Function.fromFunctionArn(
      this,
      "BasicAuthorizerFunction",
      "arn:aws:lambda:us-east-1:745945733339:function:AuthorizationServiceStack-BasicAuthorizer2B49C1FC-kDTD7WaUcn3O"
    )

    // Create IAM role for API Gateway
    const apiGWRole = new iam.Role(this, "apigwLambdaRole", {
      assumedBy: new iam.ServicePrincipal("apigateway.amazonaws.com"),
      description: "Role for API Gateway to call Lambda function",
    })

    // Create a policy to allow API Gateway to invoke the Lambda function
    const callLambdaPolicy = new iam.PolicyStatement({
      resources: [basicAuthorizer.functionArn],
      actions: ["lambda:InvokeFunction"],
    })

    apiGWRole.addToPolicy(callLambdaPolicy)

    const authorizer = new apigateway.TokenAuthorizer(this, "Authorizer", {
      handler: basicAuthorizer,
      assumeRole: apiGWRole,
    })

    resource.addMethod("GET", lambdaIntegration, {
      methodResponses: [
        {
          statusCode: "200",
          responseParameters: {
            "method.response.header.Content-Type": true,
            "method.response.header.Access-Control-Allow-Origin": true,
          },
        },
      ],
      requestParameters: {
        "method.request.querystring.name": true,
      },
      authorizer,
      authorizationType: apigateway.AuthorizationType.CUSTOM,
    })

    existingBucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.LambdaDestination(importFileParser))
  }
}
