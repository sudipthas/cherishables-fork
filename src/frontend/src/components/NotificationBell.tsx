import {
  useMarkNotificationsRead,
  useNotificationCounts,
} from "@/hooks/useAdmin";
import { Bell, MessageCircle, ShoppingCart, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface NotificationBellProps {
  onNavigateToOrders: () => void;
  onNavigateToCommunications: () => void;
}

export function NotificationBell({
  onNavigateToOrders,
  onNavigateToCommunications,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { data: counts } = useNotificationCounts();
  const markRead = useMarkNotificationsRead();

  const total = counts?.total ?? 0;
  const unreadOrders = counts?.unreadOrders ?? 0;
  const unreadMessages = counts?.unreadMessages ?? 0;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleMarkAllRead() {
    markRead.mutate({
      orderIds: [],
      messageTimestamp: BigInt(Date.now()),
    });
  }

  function handleOrdersClick() {
    setOpen(false);
    onNavigateToOrders();
  }

  function handleMessagesClick() {
    setOpen(false);
    onNavigateToCommunications();
  }

  return (
    <div className="relative">
      <button
        type="button"
        ref={buttonRef}
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 rounded-full hover:bg-primary/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Notifications"
        data-ocid="admin.notification_bell"
      >
        <Bell className="h-5 w-5 text-primary" />
        {total > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {total > 9 ? "9+" : total}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 mt-2 w-72 rounded-xl border border-border bg-card shadow-lg z-50"
          data-ocid="admin.notification_panel"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">
              Notifications
            </h3>
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-xs text-primary hover:text-primary/80 transition-colors"
              data-ocid="admin.mark_all_read_button"
            >
              Mark all read
            </button>
          </div>

          <div className="py-2">
            <button
              type="button"
              onClick={handleOrdersClick}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
              data-ocid="admin.notification_orders_link"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <ShoppingCart className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  New Orders
                </p>
                <p className="text-xs text-muted-foreground">
                  {unreadOrders > 0
                    ? `${unreadOrders} unread order${unreadOrders === 1 ? "" : "s"}`
                    : "No new orders"}
                </p>
              </div>
              {unreadOrders > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {unreadOrders}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={handleMessagesClick}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
              data-ocid="admin.notification_messages_link"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10">
                <MessageCircle className="h-4 w-4 text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  New Messages
                </p>
                <p className="text-xs text-muted-foreground">
                  {unreadMessages > 0
                    ? `${unreadMessages} unread message${unreadMessages === 1 ? "" : "s"}`
                    : "No new messages"}
                </p>
              </div>
              {unreadMessages > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {unreadMessages}
                </span>
              )}
            </button>
          </div>

          {total === 0 && (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-muted-foreground">
                No new notifications
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
