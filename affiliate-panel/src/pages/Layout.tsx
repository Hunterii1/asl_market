import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Wallet, CreditCard, LogOut, Menu, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { clearAffiliateSession, getAffiliateUser } from "@/lib/affiliateApi";

const navItems = [
  { title: "داشبورد", icon: LayoutDashboard, href: "/dashboard" },
  { title: "کاربران", icon: Users, href: "/users" },
  { title: "پرداخت‌ها", icon: CreditCard, href: "/payments" },
  { title: "درخواست برداشت", icon: Wallet, href: "/withdrawals" },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const user = getAffiliateUser();

  const handleLogout = () => {
    if (window.confirm("آیا از خروج اطمینان دارید؟")) {
      clearAffiliateSession();
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside
        className={cn(
          "fixed top-0 right-0 h-screen w-64 bg-card border-l border-border z-50 transition-transform md:translate-x-0 flex flex-col",
          sidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">ASLL Market</h1>
              <p className="text-xs text-muted-foreground">پنل افیلیت</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(false)}>
            ×
          </Button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <NavLink
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                      isActive ? "bg-primary/15 text-primary font-medium" : "text-muted-foreground hover:bg-muted"
                    )
                  }
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span>{item.title}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-border p-3 space-y-2">
          {user && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-muted/50">
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary text-sm font-medium">{user.name?.charAt(0) || "ا"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
              </div>
            </div>
          )}
          <Button variant="ghost" className="w-full justify-start text-destructive hover:bg-destructive/10" onClick={handleLogout}>
            <LogOut className="w-5 h-5 ml-2" />
            خروج
          </Button>
        </div>
      </aside>
      <div className="md:mr-64">
        <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/95 flex items-center px-4">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <span className="text-sm text-muted-foreground">پنل افیلیت ASLL Market</span>
        </header>
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
