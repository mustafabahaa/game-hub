import { Component, type ErrorInfo, type ReactNode } from 'react';
import { SystemStatusPage } from '@/components/SystemStatusPage';

interface Props { children: ReactNode }
interface State { hasError: boolean }

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled GameHub rendering error', error, info.componentStack);
  }

  render() {
    return this.state.hasError
      ? <SystemStatusPage status="error" onRetry={() => window.location.reload()} />
      : this.props.children;
  }
}
