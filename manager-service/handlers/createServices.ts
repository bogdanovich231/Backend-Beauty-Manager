import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import headers from "./utils/headers";
import { randomUUID } from "crypto";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({ region: "eu-west-1" });

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
    const { salonId, title, price } = JSON.parse(event.body);
    const priceNumber = parseFloat(price);
    if (!title || !salonId || isNaN(priceNumber)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Invalid service data" }),
      };
    }

    const serviceId = randomUUID();

    const putCommand = new PutItemCommand({
      TableName: process.env.SERVICES_TABLE!,
      Item: marshall({
        serviceId: serviceId,
        salonId,
        title,
        price: priceNumber,
      }),
    });

    await client.send(putCommand);

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: "Service successfully added",
        service: {
          serviceId: serviceId,
          salonId,
          title,
          price: priceNumber,
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
