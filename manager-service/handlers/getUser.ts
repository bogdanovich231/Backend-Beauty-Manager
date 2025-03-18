import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import headers from "./utils/headers";
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { authUser } from "./utils/auth";

const client = new DynamoDBClient({ region: "eu-west-1" });

export async function getUser(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const userData = authUser(event);
    if (!userData) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ message: "Unauthorized" }),
      };
    }

    const userId = event.pathParameters?.id;
    if (!userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "User ID is required" }),
      };
    }

    const params = {
      TableName: process.env.USERS_TABLE!,
      Key: { id: { S: userId } },
    };

    const result = await client.send(new GetItemCommand(params));

    if (!result.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: "User not found" }),
      };
    }

    const user = unmarshall(result.Item);
    delete user.password;

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
        error: (error as Error).message,
      }),
    };
  }
}
