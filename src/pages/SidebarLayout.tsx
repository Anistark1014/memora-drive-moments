import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from "../components/ui/sidebar";
import { Home, Folder, Plus } from "lucide-react";
import { Link, Outlet } from "react-router-dom";

const SidebarLayout = () => (
  <SidebarProvider>
    <div className="flex min-h-screen">
      <Sidebar>
        <SidebarContent>
          <div className="p-4 font-bold text-xl">Memora Moments</div>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link to="/dashboard">
                <SidebarMenuButton>
                  <Home className="mr-2" /> Dashboard
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link to="/albums">
                <SidebarMenuButton>
                  <Folder className="mr-2" /> Albums
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link to="/albums/create">
                <SidebarMenuButton>
                  <Plus className="mr-2" /> Create Album
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </div>
  </SidebarProvider>
);

export default SidebarLayout;
