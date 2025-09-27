import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import './styles/index.css'
import App from './App.tsx'
import { PendingAnalyze } from './pages/pendingAnalyze/PendingAnalyze.tsx';
import { RelationShip } from './pages/relationShip/RelationShip.tsx';
import { DocumentDescription } from './pages/documentDescription/DocumentDescription.tsx';
import { Testes } from './testes.tsx';
import LoginComponent from './pages/login/login.tsx';

const router = createBrowserRouter([

  {
    path: "/",
    element: <App/>,
    children: [
      {
        path: "/",
        element: <Testes/>
      },
      {
        path: "/relationship",
        element: <RelationShip/>
      },
      {
        path: "/pendingAnalyze",
        element: <PendingAnalyze/>
      },
      {
        path: "/documentDescription",
        element: <DocumentDescription/>
      },
      {
        path: "/login",
        element: <LoginComponent/>
      }
    ],
      }
]);

createRoot(document.getElementById('root')!).render(

  <StrictMode>
      <RouterProvider router={router} />
  </StrictMode>

);

