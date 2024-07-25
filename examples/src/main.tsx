/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactDOM } from "../which-react";
import './index.css'

const jsx: any = (
  <div className="box border">
    <h1 className="border">H1 in native dom node</h1>
    <h2>React</h2>
    Pure Text
  </div>
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(jsx);

// ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render("Hello World");

// div.root is root fiber, type is Fiber, tag = HostRoot(3)
// other div for example the div in jsx, type is also Fiber, tag = HostComponent(5)