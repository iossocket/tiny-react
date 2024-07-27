interface ComponentInterface {
  (props: any, context: any): void;
}


export function Component(props: any, context: any) {
  this.props = props;
  this.context = context;
}

Component.prototype.isReactComponent = {};
