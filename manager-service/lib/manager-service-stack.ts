import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";

export class ManagerServiceStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const usersTable = dynamodb.Table.fromTableName(
      this,
      "UsersTable",
      "Users"
    );

    const lambdaRole = new iam.Role(this, "LambdaRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    lambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );

    usersTable.grantReadWriteData(lambdaRole);

    const createUserLambda = new lambda.Function(this, "CreateUserLambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "createUser.createUser",
      code: lambda.Code.fromAsset("dist/handlers"),
      environment: {
        USERS_TABLE: usersTable.tableName,
      },
      role: lambdaRole,
    });

    const loginUserLambda = new lambda.Function(this, "LoginUserLambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "loginUser.loginUser",
      code: lambda.Code.fromAsset("dist/handlers"),
      environment: {
        USERS_TABLE: usersTable.tableName,
      },
      role: lambdaRole,
    });

    const api = new apigateway.RestApi(this, "ManagerServiceApi", {
      restApiName: "Manager Service",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
      },
    });

    const usersResource = api.root.addResource("users");

    usersResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createUserLambda)
    );

    const loginResource = usersResource.addResource("login");

    loginResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(loginUserLambda)
    );

    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.url!,
    });
  }
}
