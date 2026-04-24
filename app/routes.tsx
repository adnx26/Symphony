import { createBrowserRouter, Navigate } from "react-router";
import { Root } from "./components/Root";
import { BoardView } from "./components/BoardView";
import { TicketsView } from "./components/TicketsView";
import { BacklogView } from "./components/BacklogView";
import { SprintView } from "./components/SprintView";
import { SessionLog } from "./components/SessionLog";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, element: <Navigate to="/tickets" replace /> },
      { path: "board", Component: BoardView },
      { path: "tickets", Component: TicketsView },
      { path: "backlog", Component: BacklogView },
      { path: "sprint", Component: SprintView },
      { path: "session", Component: SessionLog },
    ],
  },
]);
