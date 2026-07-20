import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";

const ActionsPortalMenu = ({ anchorRect, items, onClose, rtl = false }) => {
  const menuRef = useRef(null);
  const position = useMemo(() => {
    if (!anchorRect) return { top: 0, left: 0 };
    const menuWidth = 224;
    const menuHeight = Math.max((items?.length || 1) * 40 + 8, 48);
    const spaceBelow = window.innerHeight - anchorRect.bottom;
    const top = spaceBelow < menuHeight + 12
      ? Math.max(12, anchorRect.top - menuHeight - 8)
      : anchorRect.bottom + 8;
    const preferredLeft = rtl ? anchorRect.left : anchorRect.right - menuWidth;
    const left = Math.min(Math.max(12, preferredLeft), window.innerWidth - menuWidth - 12);
    return { top, left, width: menuWidth };
  }, [anchorRect, items, rtl]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) onClose?.();
    };
    const handleKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKey);
    window.addEventListener("resize", onClose);
    window.addEventListener("scroll", onClose, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
      window.removeEventListener("resize", onClose);
      window.removeEventListener("scroll", onClose, true);
    };
  }, [onClose]);

  if (!anchorRect) return null;

  return createPortal(
    <div
      ref={menuRef}
      style={{ top: position.top, left: position.left, width: position.width }}
      className="fixed z-[1000] rounded-xl border border-[#4E4631]/10 bg-white p-1 shadow-2xl"
      dir={rtl ? "rtl" : "ltr"}
    >
      {items.map((item) => <button
        key={item.label}
        type="button"
        disabled={item.disabled}
        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors disabled:opacity-50 ${rtl ? "flex-row-reverse text-right" : "text-left"} ${item.danger ? "text-[#D4183D] hover:bg-[#D4183D]/10" : "text-[#2E3A24] hover:bg-[#ECEEE2]"}`}
        onClick={() => {
          onClose?.();
          item.action?.();
        }}
      >
        {item.icon && <item.icon className="h-4 w-4 flex-shrink-0" />}
        <span className="min-w-0 flex-1">{item.label}</span>
      </button>)}
    </div>,
    document.body
  );
};

export {
  ActionsPortalMenu
};
