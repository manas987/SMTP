import { BrowserRouter, Link, Route, Routes } from "react-router";
import "./index.css";

import { NoticeProvider, SessionProvider } from "./lib/store";
import { Shell } from "./Shell";
import { ApiKeyPage } from "./pages/ApiKey";
import { SignIn, SignUp } from "./pages/Auth";
import { Compose } from "./pages/Compose";
import { DomainDetail, Domains } from "./pages/Domains";
import { ListDetail, Lists } from "./pages/Lists";
import { Overview } from "./pages/Overview";
import { Senders } from "./pages/Senders";
import { PageHead } from "./ui";

function NotFound() {
  return (
    <div className="flex flex-col gap-4">
      <PageHead title="Page not found" description="That address isn't part of the dashboard." />
      <Link to="/" className="w-fit text-13 font-medium text-accent underline">
        Back to the overview
      </Link>
    </div>
  );
}

export function App() {
  return (
    <NoticeProvider>
      <SessionProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />

            <Route element={<Shell />}>
              <Route index element={<Overview />} />
              <Route path="domains" element={<Domains />} />
              <Route path="domains/:id" element={<DomainDetail />} />
              <Route path="senders" element={<Senders />} />
              <Route path="lists" element={<Lists />} />
              <Route path="lists/:id" element={<ListDetail />} />
              <Route path="compose" element={<Compose />} />
              <Route path="api-key" element={<ApiKeyPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SessionProvider>
    </NoticeProvider>
  );
}

export default App;
