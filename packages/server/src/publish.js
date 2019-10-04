module.exports = (event, context) => {
  console.log("Received event", event, context);
  return {
    statusCode: 200,
    body: "received"
  };
};
