import { memo } from "../which-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default memo(function SomeList({ text }: any) {
  console.log("render SomeList");
  return <div>
    <div>SomeList</div>
    <p>{text}</p>
  </div>
});