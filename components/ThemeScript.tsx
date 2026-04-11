export default function ThemeScript() {
  const script = `
    (function() {
      try {
        var saved = window.localStorage.getItem('foodappka-theme');
        var theme = saved === 'dark' ? 'dark' : 'light';
        document.documentElement.dataset.theme = theme;
        document.documentElement.style.colorScheme = theme;
      } catch (error) {
        document.documentElement.dataset.theme = 'light';
        document.documentElement.style.colorScheme = 'light';
      }
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
