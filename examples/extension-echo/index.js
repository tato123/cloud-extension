exports.handler = async event => {
  return {
    data: "hello-" + Math.floor(Math.random() * 10000)
  };
};
