import { useEffect } from "react";
import { socket } from "./socket";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import MainVideoPage from "./videoComponents/MainvideoPage";
import axios from "axios";

const tokenLoader = async ({ request }: any) => {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const resp = await axios.post("https://localhost:3001/api/validate-link", {
    token,
  });
  return resp.data;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <h1 className="bg-primary"> Hello Home Page!!!</h1>,
  },
  {
    path: "/join-video",
    element: <MainVideoPage />,
    loader: tokenLoader,
  },
]);

function App() {
  useEffect(() => {
    socket.connect();
  }, []);
  return <RouterProvider router={router} />;
}

export default App;
