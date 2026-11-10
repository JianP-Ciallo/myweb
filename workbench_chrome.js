// Shared dismissal for transient tool menus; form disclosures stay open.
(() => {
  const menus = () => document.querySelectorAll("details[data-workbench-menu][open]");
  document.addEventListener("click", event => {
    menus().forEach(menu => { if (!menu.contains(event.target)) menu.open = false; });
  });
  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    menus().forEach(menu => {
      if (menu.contains(document.activeElement)) menu.querySelector("summary")?.focus();
      menu.open = false;
    });
  });
})();
