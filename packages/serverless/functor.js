"use strict";

const AWS = require("aws-sdk");

const lambda = new AWS.Lambda();

module.exports.handler = async event => {
  console.log("Running function", event);

  const body = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;
  const data = JSON.parse(body);
  console.log("Executing", data.run, "with Params", data.params);

  const params = {
    FunctionName: data.run,
    InvocationType: "RequestResponse",
    LogType: "Tail",
    Payload: JSON.stringify(data.params)
  };
  const result = await lambda.invoke(params).promise();
  console.log("Functor result", result);

  let callResponse = JSON.parse(result.Payload);
  console.log("Functor call Response is", callResponse);

  // transform to json string
  if (typeof callResponse === "object") {
    callResponse = JSON.stringify(callResponse);
  }

  const output = {
    statusCode: 200,
    body: callResponse
  };

  console.log("Functor will output", output);

  return output;
};
