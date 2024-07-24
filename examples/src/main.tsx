/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactDOM } from "../which-react";
import './index.css'

const jsx: any = (
  <div className="box border">
    <h1 className="border">omg</h1>
    <h2>React</h2>
  </div>
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(jsx);

// div.root is root fiber, type is Fiber, tag = HostRoot(3)
// other div for example the div in jsx, type is also Fiber, tag = HostComponent(5)