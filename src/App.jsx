import { useState } from "react";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import Workspace from "./workspace/Workspace";

/*
  Top-level view switcher: landing → login/signup → workspace.
  A simple state machine is enough for now; a router can replace it once
  deep links or a backend session are needed.
*/
const VIEWS = {
  landing: LandingPage,
  login: LoginPage,
  signup: SignupPage,
  workspace: Workspace,
};

export default function App() {
  const [view, setView] = useState("landing");
  const View = VIEWS[view] ?? LandingPage;
  return <View go={setView} />;
}
