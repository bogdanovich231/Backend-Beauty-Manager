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

    const salonsTable = dynamodb.Table.fromTableName(
      this,
      "SalonsTable",
      "Salons"
    );

    const servicesTable = dynamodb.Table.fromTableName(
      this,
      "ServicesTable",
      "Services"
    );

    const lambdaRole = new iam.Role(this, "LambdaRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    lambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:GetItem",
          "dynamodb:PutItem",
        ],
        resources: [
          usersTable.tableArn,
          salonsTable.tableArn,
          servicesTable.tableArn,
          `arn:aws:dynamodb:eu-west-1:${cdk.Aws.ACCOUNT_ID}:table/Salons`,
          `arn:aws:dynamodb:eu-west-1:${cdk.Aws.ACCOUNT_ID}:table/Services`,
          `arn:aws:dynamodb:eu-west-1:${cdk.Aws.ACCOUNT_ID}:table/Users`,
          `arn:aws:dynamodb:eu-west-1:${cdk.Aws.ACCOUNT_ID}:table/Users/index/EmailIndex`,
        ],
      })
    );

    usersTable.grantReadWriteData(lambdaRole);
    salonsTable.grantReadWriteData(lambdaRole);
    servicesTable.grantReadWriteData(lambdaRole);

    const createUserLambda = new lambda.Function(this, "CreateUserLambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "createUser.createUser",
      code: lambda.Code.fromAsset("dist/handlers"),
      environment: {
        USERS_TABLE: usersTable.tableName,
        JWT_SECRET: process.env.JWT_TOKEN || "YOUR-TOKEN",
      },
      role: lambdaRole,
    });

    const loginUserLambda = new lambda.Function(this, "LoginUserLambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "loginUser.loginUser",
      code: lambda.Code.fromAsset("dist/handlers"),
      environment: {
        USERS_TABLE: usersTable.tableName,
        JWT_SECRET: process.env.JWT_TOKEN || "YOUR-TOKEN",
      },
      role: lambdaRole,
    });

    const updateUserLambda = new lambda.Function(this, "UpdateUserLambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "updateUser.updateUser",
      code: lambda.Code.fromAsset("dist/handlers"),
      environment: {
        USERS_TABLE: usersTable.tableName,
      },
      role: lambdaRole,
    });

    const getUserLambda = new lambda.Function(this, "GetUserLambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "getUser.getUser",
      code: lambda.Code.fromAsset("dist/handlers"),
      environment: {
        USERS_TABLE: usersTable.tableName,
        JWT_SECRET: process.env.JWT_TOKEN || "YOUR-TOKEN",
      },
      role: lambdaRole,
    });

    const createSalonLambda = new lambda.Function(this, "CreateSalonLambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "createSalon.createSalon",
      code: lambda.Code.fromAsset("dist/handlers"),
      environment: {
        SALON_TABLE: salonsTable.tableName,
      },
      role: lambdaRole,
    });

    const getSalonsListLambda = new lambda.Function(
      this,
      "GetSalonsListLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "getSalonsList.getSalonsList",
        code: lambda.Code.fromAsset("dist/handlers"),
        environment: {
          SALON_TABLE: salonsTable.tableName,
        },
        role: lambdaRole,
      }
    );

    const getSalonByIdLambda = new lambda.Function(this, "GetSalonByIdLambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "getSalonById.getSalonById",
      code: lambda.Code.fromAsset("dist/handlers"),
      environment: {
        SALON_TABLE: salonsTable.tableName,
      },
      role: lambdaRole,
    });

    const createServiceLambda = new lambda.Function(
      this,
      "CreateServiceLambda",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "createServices.createServices",
        code: lambda.Code.fromAsset("dist/handlers"),
        environment: {
          SERVICES_TABLE: servicesTable.tableName,
        },
        role: lambdaRole,
      }
    );

    const api = new apigateway.RestApi(this, "ManagerServiceApi", {
      restApiName: "Manager Service",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
      },
    });

    const usersResource = api.root.addResource("users");
    const loginResource = usersResource.addResource("login");
    const userResource = usersResource.addResource("{id}");
    const salonsResource = api.root.addResource("salons");
    const salonResource = salonsResource.addResource("{id}");
    const serviceResource = salonResource.addResource("services");

    salonsResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createSalonLambda)
    );

    serviceResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createServiceLambda)
    );

    salonsResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getSalonsListLambda)
    );

    salonResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getSalonByIdLambda)
    );

    usersResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(createUserLambda)
    );

    loginResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(loginUserLambda)
    );

    userResource.addMethod(
      "PUT",
      new apigateway.LambdaIntegration(updateUserLambda)
    );

    userResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getUserLambda)
    );
    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.url!,
    });
  }
}
