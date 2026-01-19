// modal.js
// 이 파일은 "모달 열기/닫기/포커스 트랩/ESC 닫기"만 담당.
// app.js에서는 이 모달 유틸만 불러서 사용하면 UI 로직이 깔끔해져.
//
// 사용 예)
// import { createModalController } from "./modal.js";
// const calcModal = createModalController({ modalEl, backdropEl, closeBtnEl });
// calcModal.open(); calcModal.close();

export function createModalController({
  modalEl,
  backdropEl,
  closeBtnEl,
  onOpen,
  onClose,
} = {}) {
  if (!modalEl) throw new Error("modalEl is required");

  const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(",");

  let isOpen = false;
  let lastActiveEl = null;

  const getFocusable = () =>
    Array.from(modalEl.querySelectorAll(focusableSelector)).filter((el) => {
      const style = window.getComputedStyle(el);
      return style.display !== "none" && style.visibility !== "hidden";
    });

  const openBackdrop = () => {
    if (backdropEl) backdropEl.hidden = false;
  };

  const closeBackdropIfNeeded = () => {
    if (!backdropEl) return;
    // 여러 모달이 동시에 있을 수 있으니, 열린 모달이 남아있으면 백드롭 유지
    const anyVisibleModal = document.querySelector('.modal:not([hidden])');
    if (!anyVisibleModal) backdropEl.hidden = true;
  };

  const trapFocus = (e) => {
    if (!isOpen) return;
    if (e.key !== "Tab") return;

    const focusables = getFocusable();
    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
      return;
    }
    if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const handleEsc = (e) => {
    if (!isOpen) return;
    if (e.key === "Escape") close();
  };

  const open = () => {
    if (isOpen) return;
    isOpen = true;

    lastActiveEl = document.activeElement;

    openBackdrop();
    modalEl.hidden = false;
    document.body.style.overflow = "hidden";

    // 접근성: 포커스 이동
    const focusables = getFocusable();
    (focusables[0] || modalEl).focus?.();

    document.addEventListener("keydown", trapFocus, true);
    document.addEventListener("keydown", handleEsc, true);

    if (typeof onOpen === "function") onOpen();
  };

  const close = () => {
    if (!isOpen) return;
    isOpen = false;

    modalEl.hidden = true;
    document.body.style.overflow = "";

    document.removeEventListener("keydown", trapFocus, true);
    document.removeEventListener("keydown", handleEsc, true);

    closeBackdropIfNeeded();

    // 접근성: 원래 포커스로 복귀
    if (lastActiveEl && typeof lastActiveEl.focus === "function") {
      lastActiveEl.focus();
    }

    if (typeof onClose === "function") onClose();
  };

  // close button
  if (closeBtnEl) closeBtnEl.addEventListener("click", close);

  // backdrop click closes the modal
  if (backdropEl) {
    backdropEl.addEventListener("click", () => {
      // 백드롭 클릭은 "현재 열려있는 모달들"을 모두 닫는 용도로 쓰는 게 일반적이지만
      // 여기서는 "이 모달만" 닫는다.
      close();
    });
  }

  return { open, close, get isOpen() { return isOpen; } };
}
