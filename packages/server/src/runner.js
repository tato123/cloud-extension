module.exports = event => {
  console.log("******");
  const data = JSON.parse(event.body);

  const { run, params } = data;

  console.log("Executing", run, "with Params", params);

  if (run.indexOf("echo") !== -1) {
    return {
      statusCode: 200,
      body: {
        data: params[0] + Math.floor(Math.random() * 10000)
      }
    };
  } else if (run.indexOf("fancy") !== -1) {
    console.log("----------------------------------------------");
    console.log("FANCY LOGS");
    console.log("----------------------------------------------");
    return {
      statusCode: 200,
      body: {
        data: params[0]
      }
    };
  }
};
