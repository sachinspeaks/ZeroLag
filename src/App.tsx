import { createBrowserRouter, RouterProvider } from "react-router-dom";
import MainVideoPage from "./videoComponents/MainvideoPage";
import Dashboard from "./siteComponents/DashBoard";
import Home from "./siteComponents/Home";
import ProMainVideoPage from "./videoComponents/proMainVideoPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/join-video",
    element: <MainVideoPage />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/join-video-pro",
    element: <ProMainVideoPage />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
