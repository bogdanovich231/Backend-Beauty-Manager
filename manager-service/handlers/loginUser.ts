import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import headers from "./utils/headers";
import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import bcrypt from "bcryptjs";

const client = new DynamoDBClient({ region: "eu-west-1" });

export async function loginUser(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    console.log("Received event:", JSON.stringify(event, null, 2));

    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Missing request body" }),
      };
    }

    const { email, password } = JSON.parse(event.body);

    if (!email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Invalid user data" }),
      };
    }

    const params = {
      TableName: process.env.USERS_TABLE!,
      IndexName: "EmailIndex",
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email": { S: email },
      },
    };

    console.log(
      "Sending GetItemCommand with params:",
      JSON.stringify(params, null, 2)
    );

    const command = new QueryCommand(params);
    const result = await client.send(command);

    console.log(
      "Received result from DynamoDB:",
      JSON.stringify(result, null, 2)
    );

    if (!result.Items || result.Items.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: "User not found" }),
      };
    }

    const user = unmarshall(result.Items[0]);
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: "Invalid password" }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(user),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: "Internal Server Error",
        error: error,
      }),
    };
  }
}
