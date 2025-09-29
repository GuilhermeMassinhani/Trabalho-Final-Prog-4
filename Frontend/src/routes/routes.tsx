import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Login from "../pages/login/Login";
import DocumentDescription from "../pages/documentDescription/DocumentDescription";


const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "document", element: <DocumentDescription /> },
    ],
  },
  {
    path: "/login",
    element: <Login />,
  },
]);

export default router;
