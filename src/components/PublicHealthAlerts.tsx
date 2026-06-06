import { Megaphone, Sun, Syringe, CloudRain, LucideIcon } from "lucide-react";
import { SidebarGroup, SidebarGroupLabel } from "@/components/ui/sidebar";
import { publicHealthAlerts } from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";

const iconMap: Record<string, LucideIcon> = {
  Sun,
  Syringe,
  CloudRain,
};

export function PublicHealthAlerts() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="flex items-center gap-2">
        <Megaphone />
        Public Health Alerts
      </SidebarGroupLabel>
      <Card className="bg-transparent border-sidebar-border">
        <CardContent className="p-2">
            <ul className="space-y-2">
                {publicHealthAlerts.map(alert => {
                    const IconComponent = iconMap[alert.icon];
                    return (
                        <li key={alert.id} className="flex items-start gap-3">
                            {IconComponent && <IconComponent className="w-5 h-5 mt-0.5 text-accent shrink-0" />}
                            <div>
                                <h4 className="text-sm font-semibold">{alert.title}</h4>
                                <p className="text-xs text-sidebar-foreground/80">{alert.message}</p>
                            </div>
                        </li>
                    )
                })}
            </ul>
        </CardContent>
      </Card>
    </SidebarGroup>
  );
}
