"use strict";

const AWS = require("aws-sdk");
const { toFnName } = require("./utils/fnName");
const lambda = new AWS.Lambda();

const invokeLambdaFunction = async data => {
  try {
    const params = {
      FunctionName: toFnName(data.run),
      InvocationType: "RequestResponse",
      LogType: "None",
      Payload: JSON.stringify(data.params)
    };
    const result = await lambda.invoke(params).promise();
    console.log("Functor result", result);

    return JSON.parse(result.Payload);
  } catch (err) {
    console.error("Error", err);
    return null;
  }
};

module.exports.handler = async event => {
  console.log("Running function", event);

  const body = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;
  const data = JSON.parse(body);
  console.log("Executing", data.run, "with Params", data.params);

  const callResponse = await invokeLambdaFunction(data);

  console.log("Functor call Response is", callResponse);

  const output = {
    statusCode: 200,
    body: JSON.stringify({
      data: callResponse
    }),
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true
    }
  };

  console.log("Functor will output", output);

  return output;
};
