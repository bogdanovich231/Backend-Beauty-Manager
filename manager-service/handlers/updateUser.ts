import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import headers from "./utils/headers";
import {
  DynamoDBClient,
  UpdateItemCommand,
  ReturnValue,
} from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({ region: "eu-west-1" });

export async function updateUser(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    console.log("Received event:", JSON.stringify(event, null, 2));

    if (!event.body || !event.pathParameters?.id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Missing request body or user ID" }),
      };
    }

    const { id } = event.pathParameters;
    const { name, email, password, image, is_admin } = JSON.parse(event.body);

    const updates = { name, email, password, image, is_admin };
    const updateExpression = [];
    const expressionAttributeValues: { [key: string]: any } = {};
    const expressionAttributeNames: { [key: string]: string } = {};

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        updateExpression.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = {
          [typeof value === "boolean" ? "BOOL" : "S"]: value,
        };
      }
    }

    if (updateExpression.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "No fields to update" }),
      };
    }

    const params = {
      TableName: process.env.USERS_TABLE!,
      Key: { id: { S: id } },
      UpdateExpression: "SET " + updateExpression.join(", "),
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: ReturnValue.ALL_NEW,
    };

    console.log(
      "Sending UpdateItemCommand with params:",
      JSON.stringify(params, null, 2)
    );

    const result = await client.send(new UpdateItemCommand(params));
    const updatedUser = unmarshall(result.Attributes!);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(updatedUser),
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
