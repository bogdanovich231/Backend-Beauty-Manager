import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import headers from "./utils/headers";


const client = new DynamoDBClient({ region: "eu-west-1" });

export const updateSalon = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const salonId = event.pathParameters?.id;

    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Missing request body" }),
      };
    }
    if (!salonId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Missing parameter" }),
      };
    }
    const { title, description, image, categories } = JSON.parse(
      event.body
    );

    const updateCommand = new UpdateItemCommand({
      TableName: process.env.SALON_TABLE!,
      Key: {
        salonId: { S: salonId }, 
      },
      UpdateExpression:
        "SET title = :title, description = :description, image = :image, categories = :categories",
        ExpressionAttributeValues:{
          ":title": { S: title },
          ":description": { S: description },
          ":image": { S: image },
          ":categories": { S: JSON.stringify(categories)},
        },
      ConditionExpression: "attribute_exists(salonId)",
      ReturnValues: "ALL_NEW", // This is correct as a string, but ensure the rest of the command structure is valid.
    });

    const updateResult = await client.send(updateCommand);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Salon updated successfully",
        updatedSalon: updateResult.Attributes,
      }),
    };
  } catch (error: any) {
    if (error.name === "ConditionalCheckFailedException") {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: "Salon not found" }),
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};

export default updateSalon;
