'use client';
import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';

export default function Modal({ open, onClose, title, children, footer }) {
  const overlayRef = useRef(null);
  const modalRef = useRef(null);
  const previousFocus = useRef(null);

  // Lock body scroll + save/restore focus
  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement;
    document.body.style.overflow = 'hidden';
    // Focus the modal container
    setTimeout(() => modalRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = '';
      previousFocus.current?.focus();
    };
  }, [open]);

  // Close on Escape
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose();
      // Trap focus
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onClose]
  );

  if (!open) return null;

  return createPortal(
    <div
      className={styles.overlay}
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.modal} ref={modalRef} tabIndex={-1} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
