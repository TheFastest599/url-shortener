import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "sonner";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
	<QueryClientProvider client={queryClient}>
		<App />
		<Toaster position="bottom-right" richColors />
	</QueryClientProvider>,
);
