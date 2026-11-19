"use client";

export default function PrintButton() {
  return (
    <button onClick={() => window.print()} className="btn-primary fixed top-4 right-4 print:hidden">
      🖨 Print poster
    </button>
  );
}
