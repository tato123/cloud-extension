import React, { useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import { echo, pipeline, listFunctions } from "./cloud/echo";

const useListFunctions = () => {
  const [functions, setFunctions] = useState();

  useEffect(() => {
    listFunctions().then(setFunctions);
  });

  return functions;
};

function App() {
  const [resp, setResp] = useState();

  const runSingle = evt => {
    echo()
      .then(val => {
        console.log("Value is ", val);
        setResp(val);
      })
      .catch(err => {
        console.error("There is an error", err);
      });
  };

  const runPipeline = evt => {
    pipeline()
      .then(val => {
        console.log("Value is ", val);
        setResp(val);
      })
      .catch(err => {
        console.error("There is an error", err);
      });
  };

  return (
    <div className="App">
      <h1>Application Tester</h1>
      <button type="submit" onClick={runSingle}>
        Single Executable
      </button>
      <button type="submit" onClick={runPipeline}>
        Multiple Executable
      </button>

      <div>
        <label>Response is {resp}</label>
      </div>
    </div>
  );
}

export default App;
