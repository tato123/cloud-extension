exports.handler = async event => {
  return "hello-" + Math.floor(Math.random() * 10000);
};
