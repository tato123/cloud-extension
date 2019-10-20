const API =
  "https://401zrzt07e.execute-api.us-east-1.amazonaws.com/dev/functor";

export const getConfig = () => {};

const toPipelineDefinition = fns => {
  // from left to right build a pipeline
  const pipeline = {
    pipeline: fns.map((fn, index) => {
      //
      if (fn.type === "cloudFunction") {
        // generate a state id
        const stateId = Math.floor(Math.random() * 10000);
        return {
          run: fn.fnName,
          state: stateId
        };
      } else if (fn.type === "cloudPipeline") {
        return fn.definition;
      } else if (typeof fn === "function") {
        const refId = Math.floor(Math.random() * 10000);
        fn.refId = refId;
        return {
          run: "local",
          refId: refId
        };
      }
    })
  };

  return pipeline;
};

export const cloudPipeline = (...fns) => {
  const pipelineDefinition = toPipelineDefinition(fns);

  const invokablePipeline = async (...fnParams) => {
    pipelineDefinition["params"] = fnParams;
    console.log(
      "Calling pipeline api with the following definition",
      pipelineDefinition
    );
  };
  invokablePipeline.definition = pipelineDefinition;
  invokablePipeline.type = "cloudPipeline";

  console.log("pipeline definition", pipelineDefinition);
  return invokablePipeline;
};

const _getFunctionRef = async fnName => {
  return async fnParams => {
    const resp = await fetch(API, {
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST",
      body: JSON.stringify({
        run: fnName,
        params: fnParams
      })
    });

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
  MainExecutable.fnName = functionName;
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
