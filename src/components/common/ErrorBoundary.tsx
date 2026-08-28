import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message?: string;
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
    const sentry = (
      window as unknown as {
        Sentry?: { captureException?: (err: unknown) => void };
      }
    ).Sentry;
    sentry?.captureException?.(error);
  }

  private handleReload = () => {
    this.setState({ hasError: false, message: undefined });
    window.location.assign('/');
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-primary-bg px-6">
        <div className="max-w-md rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.28em] text-gold">Error</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">
            {this.props.fallbackTitle ?? '予期しないエラーが発生しました'}
          </h1>
          <p className="mt-3 text-sm text-muted">
            {this.state.message || 'ページの再読み込みをお試しください。'}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button type="button" onClick={this.handleReload}>
              ホームへ戻る
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => window.location.reload()}
            >
              再読み込み
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
