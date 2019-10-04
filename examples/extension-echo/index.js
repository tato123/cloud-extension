exports.handler = event => {
  return {
    statusCode: 200,
    body: {
      data: params[0] + Math.floor(Math.random() * 10000)
    }
  };
};
