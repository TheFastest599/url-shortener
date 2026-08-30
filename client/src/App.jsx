import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "@/routes";
import { useAuthStore } from "@/store/authStore";

function App() {
	const initAuth = useAuthStore((state) => state.initAuth);

	useEffect(() => {
		initAuth();
	}, [initAuth]);

	return (
		<BrowserRouter>
			<AppRoutes />
		</BrowserRouter>
	);
}

export default App;
