import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('Storefront render error', error, info); }
  render() {
    if (this.state.error) return <main className="fatal-error"><p>DPK MOBILE</p><h1>Something didn’t load correctly.</h1><small>{this.state.error.message}</small><button className="button button--dark" onClick={() => window.location.reload()}>Reload storefront</button></main>;
    return this.props.children;
  }
}
