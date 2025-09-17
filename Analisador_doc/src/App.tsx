import { Sidebar } from "./components/sidebar/Sidebar";
import { Header } from "./components/Header";
import { Outlet } from "react-router";
import { NavAnalyzer } from "./components/Menu/MenuBarAnalyzer";
import { FileProvider } from "./contexts/FilesContext";

function App() {

  return (
    <>
    <FileProvider>
      <div className="min-h-screen grid grid-cols-app">
        <Sidebar/>
        <main className="px-4 pb-12 pt-8 grid grid-rows-home">
          <div className="gap-2 flex flex-col">
            <Header/>
            <NavAnalyzer/>
          </div>
          <Outlet/>
        </main>
      </div>
    </FileProvider>
    </>
  )
}

export default App;
