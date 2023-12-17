import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs"
import * as lambda from "aws-cdk-lib/aws-lambda"
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs"
import * as iam from "aws-cdk-lib/aws-iam"
import * as logs from "aws-cdk-lib/aws-logs"
import "dotenv/config"

const githubProfile = "TossACoinToUrProgrammer"
const pass = process.env[githubProfile]

export class AuthorizationServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const basicAuthorizer = new NodejsFunction(this, "BasicAuthorizer", {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: "resources/basicAuthorizer.ts",
      handler: "handler",
      logRetention: logs.RetentionDays.ONE_WEEK,
      environment: {
        GH_LOGIN: githubProfile,
        PASSWORD: pass!,
      },
    })

    basicAuthorizer.role?.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
    )
  }
}
