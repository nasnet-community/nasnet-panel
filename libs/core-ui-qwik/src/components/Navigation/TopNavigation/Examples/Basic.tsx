import { component$ } from "@builder.io/qwik";
import { TopNavigation } from "..";
import type { TopNavigationItem } from "..";

export default component$(() => {
  const items: TopNavigationItem[] = [
    { href: "#", label: "Home", isActive: true },
    { href: "#", label: "Products" },
    { href: "#", label: "Services" },
    { href: "#", label: "About" },
    { href: "#", label: "Contact" },
  ];

  return (
    <div class="p-4">
      <TopNavigation items={items} />
    </div>
  );
});
