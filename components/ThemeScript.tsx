export default function ThemeScript() {
  const script = `
    (function() {
      try {
        var storedTheme = localStorage.getItem("foodapka-theme");
        var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        var theme = storedTheme === "dark" || storedTheme === "light"
          ? storedTheme
          : (prefersDark ? "dark" : "light");
        document.documentElement.setAttribute("data-theme", theme);
      } catch (error) {
        document.documentElement.setAttribute("data-theme", "light");
      }
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
