/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactDOM, Component, useReducer, useState, useMemo, useRef, useEffect, useLayoutEffect, useContext, createContext } from "../which-react";
import './index.css'

const fragment: any = (
  <>
    <h3>h3</h3>
    <h4>h4</h4>
  </>
);

const CountContext = createContext(100);
const ThemeContext = createContext('red');
function FunctionComponent() {
  const [count1, setCount] = useReducer((x) => x + 1, 0);
  const [count2, setCount2] = useState(0);
  const contextValue = useContext(CountContext);
  // layout effect
  useLayoutEffect(() => {
    console.log("useLayoutEffect"); //sy-log
  }, [count1]);
  // passive effect
  useEffect(() => {
    console.log("useEffect"); //sy-log
  }, [count2]);
  return (
    <div className="border">
      <h1>函数组件</h1>
      <div>{contextValue}</div>
      <button onClick={() => setCount()}>{count1}</button>
      <button onClick={() => setCount2(count2 + 1)}>{count2}</button>
      <ThemeContext.Provider value="green">
        <CountContext.Provider value={count1}>
          <CountContext.Provider value={count1 + 1}>
            <Child />
          </CountContext.Provider>
          <Child />
        </CountContext.Provider>
      </ThemeContext.Provider>
    </div>
  );
}

function Child() {
  const count = useContext(CountContext);
  const theme = useContext(ThemeContext);
  return (
    <div className={"border " + theme}>
      <h2>Child</h2>
      <p>with useContext</p>
      <p>{count}</p>
    </div>
  )
}

const FunctionComponent_ModifyLastEle = () => {
  const [count1, setCount1] = useReducer((x: number) => x + 1, 1);
  const [count2, setCount2] = useState(1);
  const ref = useRef(0);
  function handleClick() {
    ref.current = ref.current + 1;
    alert("You clicked " + ref.current + " times!");
  }
  const expensive = useMemo(() => {
    console.log("compute");
    let sum = 0;
    for (let i = 0; i < count1; i++) {
      sum += i;
    }
    return sum;
    // count
  }, [count1]);

  useLayoutEffect(() => {
    console.log("useLayoutEffect");
  }, [count1])

  useEffect(() => {
    console.log("useEffect");
  }, [count2])

  const arr = count2 % 2 === 0 ? [0, 1, 2, 3, 4] : [0, 1, 2, 4]
  const _cls = count1 % 2 === 0 ? "red green_bg" : "green red_bg";
  return <div className="border">
    <h3 className={_cls}>FunctionComponent_ModifyLastEle</h3>
    <p>{expensive}</p>
    <button
      onClick={() => {
        setCount1();
      }}
    >
      {count1}
    </button>
    <button onClick={() => {
      console.log('%c [ onClick ]-17', 'font-size:13px; background:pink; color:#bf2c9f;',)
      setCount2(count2 + 1);
    }}>
      {count2}
    </button>
    <button onClick={handleClick}>click</button>
    <ul>
      {arr.map(ele => <li key={ele}>{ele}</li>)}
    </ul>
    {count1 % 2 === 0 ? <h1>null</h1> : null}
    {count1 % 2 === 0 ? <h1>undefined</h1> : undefined}
    {count1 % 2 === 0 && <h1>boolean</h1>}
  </div>
}


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
    <FunctionComponent />
    <ClassComponent />
  </div>
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  (<FunctionComponent />) as any
);

// ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render("Hello World");

// div.root is root fiber, type is Fiber, tag = HostRoot(3)
// other div for example the div in jsx, type is also Fiber, tag = HostComponent(5)