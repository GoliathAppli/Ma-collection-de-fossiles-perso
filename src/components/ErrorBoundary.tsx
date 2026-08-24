import React, { Component, ErrorInfo, ReactNode } from "react";
import { RefreshCw, RotateCcw, AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    try {
      sessionStorage.clear();
    } catch (e) {
      console.warn("Could not clear session storage:", e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-slate-100 font-sans">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-md w-full text-center space-y-5 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-lg font-serif text-white font-bold">
                Un problème temporaire est survenu
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                L'application a rencontré une interruption. Vos données sauvegardées restent conservées en sécurité.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400 text-left overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-2 bg-yellow-700 hover:bg-yellow-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Recharger la page</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 px-4 rounded-xl text-xs transition-all border border-slate-700"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Réinitialiser la session</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
