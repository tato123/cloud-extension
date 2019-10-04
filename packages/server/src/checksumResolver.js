module.exports = event => {
  // console.log("Event", event);
  const { apiKey, id } = event.pathParameters;
  return {
    statusCode: 200,
    body: `${apiKey}-${id}`
  };
};
