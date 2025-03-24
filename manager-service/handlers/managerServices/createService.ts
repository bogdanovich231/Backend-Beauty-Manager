import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import headers from "../utils/headers";
import { randomUUID } from "crypto";
import {
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";


export const createServices = async (
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

    if (!title || !description || !image || !categories) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Invalid services data" }),
      };
    }

    const serviceId = randomUUID();
    const servicesId = randomUUID();

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: "Service successful added",
        service: {
          id: serviceId,
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
