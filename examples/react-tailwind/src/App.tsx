import { useEffect, useState, type ButtonHTMLAttributes } from "react";

type Theme = "system" | "dark" | "light";

/**
 * A button written the way shadcn/ui writes its components: only shadcn
 * variable names (bg-primary, border-input, ring-ring, …). @metapatrol/style's
 * shadcn.css maps those names onto the metapatrol tokens, so components added
 * with `npx shadcn add …` look the same without edits.
 */
function Button({
  variant = "default",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "outline" | "destructive" | "ghost" }) {
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    ghost: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
  };
  return (
    <button
      className={`inline-flex h-9 items-center rounded-md px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

const environments = [
  { name: "prod-eu", version: "0.14.2", status: "success", label: "healthy" },
  { name: "prod-us", version: "0.14.2", status: "warning", label: "degraded" },
  { name: "staging", version: "0.15.0-rc.1", status: "error", label: "failed" },
  { name: "dev", version: "0.15.0-dev", status: undefined, label: "idle" },
] as const;

export function App() {
  // system: no data-theme attribute, the tokens follow prefers-color-scheme
  const [theme, setTheme] = useState<Theme>("system");
  const [selected, setSelected] = useState("prod-us");

  useEffect(() => {
    if (theme === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const next: Record<Theme, Theme> = { system: "dark", dark: "light", light: "system" };

  return (
    <>
      <header className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
        <span className="mp-namespace flex items-center gap-3">
          <img className="size-7 light:hidden" src="brand/mark/metapatrol-mark-small-dark.svg" alt="" />
          <img className="hidden size-7 light:block" src="brand/mark/metapatrol-mark-small-light.svg" alt="" />
          <span>
            <span className="mp-namespace-org">metapatrol / </span>
            <span className="mp-namespace-project">react-tailwind</span>
          </span>
        </span>
        <button
          className="rounded-md border border-line-strong px-3 py-1.5 font-mono text-xs text-fg-muted hover:bg-surface-2"
          onClick={() => setTheme(next[theme])}
        >
          theme: {theme}
        </button>
      </header>

      <main className="mx-auto grid max-w-4xl gap-4 p-6">
        <section className="mp-panel">
          <p className="mp-label">
            <span className="mp-label-index">01</span>shadcn-style components
          </p>
          <p className="mb-4 text-fg-muted">
            These buttons use only shadcn variable names; <code>shadcn.css</code> maps them to the tokens.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button>Promote</Button>
            <Button variant="outline">Compare</Button>
            <Button variant="destructive">Roll back</Button>
            <Button variant="ghost">Cancel</Button>
          </div>
        </section>

        <section className="mp-panel">
          <p className="mp-label">
            <span className="mp-label-index">02</span>environments
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="px-2 py-2">name</th>
                <th className="px-2 py-2">version</th>
                <th className="px-2 py-2">state</th>
              </tr>
            </thead>
            <tbody>
              {environments.map((env) => (
                <tr
                  key={env.name}
                  className={`cursor-pointer hover:bg-surface-2 ${selected === env.name ? "bg-signal-wash" : ""}`}
                  onClick={() => setSelected(env.name)}
                >
                  <td className="px-2 py-2">{env.name}</td>
                  <td className="px-2 py-2">
                    <code>{env.version}</code>
                  </td>
                  <td className="px-2 py-2">
                    <span className="mp-status" data-status={env.status}>
                      {env.label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <pre>
          <span className="text-signal-fg">$</span> npm install @metapatrol/style{"\n"}
          <span className="text-success">✓</span> src/styles.css: @import "@metapatrol/style/tailwind.css";
        </pre>
      </main>
    </>
  );
}
