import { useState } from "react";
import "./App.css";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

function App() {
	const [count, setCount] = useState(0);

	return (
		<>
			<h1 className="text-3xl font-bold underline text-red-600">
				Tailwind works!
			</h1>

			<Card className="max-w-sm">
				<CardHeader>
					<CardTitle>Project Overview</CardTitle>
					<CardDescription>
						Track progress and recent activity for your Vite app.
					</CardDescription>
				</CardHeader>
				<CardContent>
					Your design system is ready. Start building your next
					component.
					<br />
					<Button>Click me</Button>
				</CardContent>
			</Card>
		</>
	);
}

export default App;
