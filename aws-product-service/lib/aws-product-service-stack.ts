import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as product_service from './product-serivce'
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class AwsProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    new product_service.ProductService(this, 'Products');
    // example resource
    // const queue = new sqs.Queue(this, 'AwsProductServiceQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
