// components/ImageCardWithSpeedDial.jsx
"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, RotateCw, Save, MessageCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function ImageCardWithSpeedDial({
  src,
  alt = "",
  onShare = () => {},
  onRotate = () => {},
  onSave = () => {},
  onMessage = () => {},
}) {
  const [open, setOpen] = useState(false);
  const pressTimer = useRef(null);

  const startPress = () => {
    clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => setOpen(true), 300); // long-press
  };
  const endPress = () => clearTimeout(pressTimer.current);

  return (
    <div
      className="relative bg-muted rounded-2xl overflow-hidden"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onTouchStart={startPress}
      onTouchEnd={endPress}
      onTouchCancel={endPress}
    >
      {/* Imagen */}
      <img
        src={src}
        alt={alt}
        className="block w-full h-80 object-cover select-none"
        draggable={false}
      />

      {/* Botón FAB para abrir/cerrar en mobile */}
      <div className="md:hidden right-3 bottom-3 z-20 absolute">
        <Button
          size="icon"
          variant="secondary"
          className="shadow rounded-full"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Cerrar acciones" : "Abrir acciones"}
        >
          {open ? <X className="w-5 h-5" /> : <Save className="w-5 h-5" />}
        </Button>
      </div>

      {/* Menú radial */}
      <AnimatePresence>
        {open && (
          <motion.ul
            key="dial"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="right-5 bottom-5 z-10 absolute pointer-events-none"
          >
            {[
              {
                icon: <Save className="w-5 h-5" />,
                label: "Guardar",
                onClick: onSave,
                dx: 0,
                dy: -90,
              },
              {
                icon: <Share2 className="w-5 h-5" />,
                label: "Compartir",
                onClick: onShare,
                dx: -78,
                dy: -45,
              },
              {
                icon: <RotateCw className="w-5 h-5" />,
                label: "Girar",
                onClick: onRotate,
                dx: -90,
                dy: 0,
              },
              {
                icon: <MessageCircle className="w-5 h-5" />,
                label: "Mensaje",
                onClick: onMessage,
                dx: -78,
                dy: 45,
              },
            ].map((a, i) => (
              <motion.li
                key={a.label}
                initial={{ x: 0, y: 0, scale: 0 }}
                animate={{ x: a.dx, y: a.dy, scale: 1 }}
                exit={{ x: 0, y: 0, scale: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 24,
                  delay: i * 0.03,
                }}
                className="absolute"
              >
                <Button
                  size="icon"
                  variant="secondary"
                  className="shadow-lg rounded-full pointer-events-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    a.onClick();
                  }}
                  aria-label={a.label}
                >
                  {a.icon}
                </Button>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Uso:
<ImageCardWithSpeedDial
  src="/panes.jpg"
  onSave={() => console.log("guardar")}
  onShare={() => console.log("compartir")}
  onRotate={() => console.log("girar")}
  onMessage={() => console.log("whatsapp")}
/>
*/
