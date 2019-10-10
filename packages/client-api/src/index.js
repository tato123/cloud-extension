export const getConfig = () => {};

export const cloudPipeline = (...fns) => {
  console.log("Executing pipeline", fns.length);
  const invokablePipeline = async (...fnParams) => {
    let lastParam = fnParams;
    for (let fn of fns) {
      if (fn.type === "cloudFunction") {
        const retVal = await fn(...lastParam);
        lastParam = [retVal];
      } else if (fn.type === "cloudPipeline") {
        const retval = await fn(...lastParam);
        lastParam = [retval];
      } else if (typeof fn === "function") {
        const retVal = await fn(...lastParam);
        lastParam = [retVal];
      } else {
        console.error("not sure what to do, skipping");
      }
    }

    return lastParam[0];
  };

  invokablePipeline.type = "cloudPipeline";

  return invokablePipeline;
};

const _getFunctionRef = async fnName => {
  return async fnParams => {
    const resp = await fetch(
      "https://401zrzt07e.execute-api.us-east-1.amazonaws.com/dev/functor",
      {
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST",
        body: JSON.stringify({
          run: fnName,
          params: fnParams
        })
      }
    );

    const retVal = await resp.json();
    return retVal.data;
  };
};

export const cloudFunction = functionName => {
  const MainExecutable = async (...fnParams) => {
    // do a couple things
    // first get our function ref
    const callableRef = await _getFunctionRef(functionName);

    return callableRef(fnParams);
  };

  MainExecutable.type = "cloudFunction";

  return MainExecutable;
};

export default class Cloud {
  constructor(options) {
    this.options = options;
  }

  static initialize(options) {
    return new Cloud(options);
  }
}
