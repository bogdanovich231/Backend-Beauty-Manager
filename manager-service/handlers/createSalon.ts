import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import headers from "./utils/headers";
import { randomUUID } from "crypto";
import {
  DynamoDBClient,
  TransactWriteItemsCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({ region: "eu-west-1" });

export const createSalon = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Missing request body" }),
      };
    }
    const { userId, title, description, image, categories } = JSON.parse(
      event.body
    );

    if (!title || !description || !userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Invalid salon data" }),
      };
    }

    const salonId = randomUUID();

    const transactItems = [
      {
        Put: {
          TableName: process.env.SALON_TABLE!,
          Item: marshall({
            salonId: salonId,
            userId,
            title,
            description,
            image: image || "",
            categories: categories || [],
            createdAt: new Date().toISOString(),
          }),
        },
      },
    ];

    const transactionCommand = new TransactWriteItemsCommand({
      TransactItems: transactItems,
    });

    await client.send(transactionCommand);

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: "Service successfully added",
        salon: {
          salonId: salonId,
          title,
          userId,
          description,
          image: image,
          categories: categories,
        },
      }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: "Internal Server Error",
        error: e,
      }),
    };
  }
};
