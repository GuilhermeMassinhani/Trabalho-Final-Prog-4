import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import './styles/index.css';

import App from './App';
import Login from './pages/login/Login';
import DocumentDescription from './pages/documentDescription/DocumentDescription';
import { PendingAnalyze } from './pages/pendingAnalyze/PendingAnalyze';
import { RelationShip } from './pages/relationShip/RelationShip';
import { ComponentAnalyzerDropZone } from './pages/UploadComponentsPage/ComponentAnalyzerDropZone';
import { FileProvider } from './contexts/FilesContext';

const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  {
    path: "/",
    element: (
      <FileProvider>
        <App />
      </FileProvider>
    ),
    children: [
      { path: "/", element: <ComponentAnalyzerDropZone /> },
      { path: "relationship", element: <RelationShip /> },
      { path: "pendingAnalyze", element: <PendingAnalyze /> },
      { path: "documentDescription", element: <DocumentDescription /> },
      { path: "*", element: <div>404 - Página não encontrada</div> } // fallback
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
