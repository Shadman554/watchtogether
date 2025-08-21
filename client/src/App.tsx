import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Component, ErrorInfo, ReactNode } from "react";
import Landing from "@/pages/landing";
import Room from "@/pages/room";
import NotFound from "@/pages/not-found";

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    // Don't refresh the page - just log the error
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold text-white mb-4">Something went wrong</h2>
            <p className="text-gray-300 mb-6">Don't worry, your watch session is safe.</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/room/:roomCode">
        {(params) => <Room roomCode={params.roomCode} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <div className="min-h-screen">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ErrorBoundary>
            <Toaster />
            <Router />
          </ErrorBoundary>
        </TooltipProvider>
      </QueryClientProvider>
    </div>
  );
}

export default App;
