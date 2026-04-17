import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { BoardView } from "./components/BoardView";
import { TicketsView } from "./components/TicketsView";
import { BacklogView } from "./components/BacklogView";
import { SprintView } from "./components/SprintView";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: BoardView },
      { path: "tickets", Component: TicketsView },
      { path: "backlog", Component: BacklogView },
      { path: "sprint", Component: SprintView },
    ],
  },
]);
