/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactDOM, Component } from "../which-react";
import './index.css'

const fragment: any = (
  <>
    <h3>h3</h3>
    <h4>h4</h4>
  </>
);


class ClassComponent extends (Component as any) {
  constructor(props: any, context: any) {
    super(props, context);
  }

  render() {
    return (
      <div>
        <h3>ClassComponent</h3>
      </div>
    );
  }
}

const jsx: any = (
  <div className="box border">
    <h1 className="border">H1 in native dom node</h1>
    <h2>React</h2>
    Pure Text
    {fragment}
    <ClassComponent />
  </div>
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(jsx);

// ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render("Hello World");

// div.root is root fiber, type is Fiber, tag = HostRoot(3)
// other div for example the div in jsx, type is also Fiber, tag = HostComponent(5)