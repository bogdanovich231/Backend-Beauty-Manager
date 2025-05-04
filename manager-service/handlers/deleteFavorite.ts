import { DynamoDBClient, DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import headers from "./utils/headers";

const client = new DynamoDBClient({ region: "eu-west-1" });

export const deleteFavorite = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const favoriteId = event.pathParameters?.id_service;

    if (!favoriteId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "favoriteId is required" }),
      };
    }

    const deleteCommand = new DeleteItemCommand({
      TableName: process.env.FAVORITES_TABLE!,
      Key: {
        favoriteId: { S: favoriteId },
      },
    });

    await client.send(deleteCommand);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "Favorite deleted successfully" }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
