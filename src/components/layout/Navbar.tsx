"use client";

import LabelSwitcher from "./LabelSwitcher";

export default function Navbar() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold text-gray-900">
          Big Push <span className="text-blue-600">Matcher</span>
        </h1>
        <LabelSwitcher />
      </div>
    </header>
  );
}
