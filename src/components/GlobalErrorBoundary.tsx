import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center text-center">
                    <h1 className="text-2xl font-bold text-red-500 mb-4">Algo deu errado :(</h1>
                    <p className="mb-4 text-gray-300">
                        Ocorreu um erro inesperado na aplicação.
                    </p>
                    <div className="bg-gray-900 p-4 rounded-lg text-left overflow-auto w-full max-w-lg mb-6 border border-gray-800">
                        <p className="text-red-400 font-mono text-sm break-all">
                            {this.state.error?.toString()}
                        </p>
                        {this.state.errorInfo && (
                            <pre className="text-gray-500 text-xs mt-2 overflow-auto">
                                {this.state.errorInfo.componentStack}
                            </pre>
                        )}
                    </div>
                    <Button
                        onClick={() => window.location.reload()}
                        variant="secondary"
                    >
                        Recarregar Página
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
