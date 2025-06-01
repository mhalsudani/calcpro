import { Switch, Route } from "wouter";
import CalcPro from "./pages/CalcPro";
import "./App.css";

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Switch>
        <Route path="/" component={CalcPro} />
        <Route>
          <div className="flex items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold text-gray-800">Page Not Found</h1>
          </div>
        </Route>
      </Switch>
    </div>
  );
}

export default App;
