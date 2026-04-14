import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { BoardView } from "./components/BoardView";
import { TicketsView } from "./components/TicketsView";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: BoardView },
      { path: "tickets", Component: TicketsView },
    ],
  },
]);
