import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";

const ConfirmContext = createContext(null);

// A promise-based confirm dialog rendered as a centered modal.
// Usage:  const confirm = useConfirm();
//         if (await confirm({ title, message, name, confirmText })) { ... }
export function ConfirmProvider({ children }) {
  const [opts, setOpts] = useState(null);
  const resolver = useRef(null);

  const confirm = useCallback((options = {}) => {
    setOpts({
      title: options.title || "Are you sure?",
      message: options.message || "",
      name: options.name || "",
      confirmText: options.confirmText || "Delete",
      danger: options.danger !== false,
    });
    return new Promise((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = useCallback((result) => {
    setOpts(null);
    resolver.current?.(result);
    resolver.current = null;
  }, []);

  // Esc to cancel, Enter to confirm
  useEffect(() => {
    if (!opts) return;
    function onKey(e) {
      if (e.key === "Escape") close(false);
      if (e.key === "Enter") close(true);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [opts, close]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {opts && (
        <div className="confirm-overlay" onClick={() => close(false)}>
          <div
            className="confirm-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="confirm-title">{opts.title}</h3>
            {opts.message && <p className="confirm-message">{opts.message}</p>}
            {opts.name && <p className="confirm-name">"{opts.name}"</p>}
            <div className="confirm-actions">
              <button className="btn btn-ghost" onClick={() => close(false)}>
                Cancel
              </button>
              <button
                className={opts.danger ? "btn btn-danger" : "btn btn-primary"}
                onClick={() => close(true)}
                autoFocus
              >
                {opts.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}
