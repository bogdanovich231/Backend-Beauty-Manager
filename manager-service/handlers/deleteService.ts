import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import headers from "./utils/headers";
import { DeleteItemCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({ region: "eu-west-1" });

export const deleteService = async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {  
    try {  
      const serviceId = event.pathParameters?.serviceId;
      
      if (!serviceId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: "Missing parameter" }),
        };
      }

      const deleteCommand = new DeleteItemCommand({
        TableName: process.env.SERVICES_TABLE!,
        Key: marshall({
          serviceId: serviceId,
        }),
      });
  
      await client.send(deleteCommand);
  
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: "Service successfully deleted",
          serviceId: serviceId,
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