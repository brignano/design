Status: proposed · Tracking issue: #68

# App shell: one layout for life, homelab and driftwood

## Why

The three tool apps each need a frame: a header, a sidebar of places to go,
the content, and sometimes a detail panel beside it. None of them has one to
share, so each would build its own, with its own widths, breakpoints and phone
behaviour. #68 ships that frame as `templates/app-shell.css`. Before building
it, four choices need Anthony's call. Each has a recommendation, and accepting
this proposal accepts all four unless he says otherwise.

## What a consumer writes

```html
<div class="app-shell" data-sidebar="expanded">
  <header class="site-header">…product mark, menu button, account…</header>
  <nav class="app-sidebar" aria-label="Main">
    <p class="app-sidebar-title">Library</p>
    <ul>
      <li><a href="/photos" aria-current="page"><svg class="icon" aria-hidden="true">…</svg><span>Photos</span></a></li>
      <li><a href="/albums"><svg class="icon" aria-hidden="true">…</svg><span>Albums</span></a></li>
    </ul>
  </nav>
  <main class="app-main">…</main>
  <aside class="app-detail" aria-label="Details">…</aside>   <!-- optional -->
</div>
```

```
 1440px, expanded                         1440px, collapsed (rail)
┌──────────────────────────────────────┐ ┌──────────────────────────────────────┐
│ header                               │ │ header                               │
├────────┬────────────────────┬────────┤ ├──┬───────────────────────────┬───────┤
│ Library│                    │ detail │ │▣ │                           │detail │
│ ▣ Photo│      main          │ panel  │ │▣ │         main              │ panel │
│ ▣ Album│                    │        │ │▣ │                           │       │
└────────┴────────────────────┴────────┘ └──┴───────────────────────────┴───────┘

 375px                                    375px, menu open
┌──────────────────┐                     ┌──────────────────┐
│ ☰  header        │                     │ ☰  ┌───────────┐ │
├──────────────────┤                     │    │ Library   │ │
│                  │                     │    │ ▣ Photos  │ │
│      main        │                     │    │ ▣ Albums  │ │
│                  │                     │    └───────────┘ │
└──────────────────┘                     └──────────────────┘
```

Already decided in #68 and kept here: CSS grid; the collapse state is a
`data-sidebar="expanded|collapsed"` attribute the consumer's script sets (no
state class); the header is the existing `.site-header`; nav items show the
current page with `aria-current="page"`.

## The four decisions

| # | Question | Recommendation | Rejected, and why |
|---|---|---|---|
| A1 | Sidebar widths | **15rem expanded, 3.5rem collapsed**, as tokens on `.app-shell` (`--app-sidebar`, `--app-rail`) a product can override. 15rem fits a two-word label at the tool tier with an icon; 3.5rem fits a 44px target plus its padding. | A width per product: three numbers to keep in step for no gain. A resizable sidebar: a drag handle, keyboard resizing and a saved width, for a feature none of the three apps has asked for. |
| A2 | What "collapsed" means on a wide screen | **An icon rail**: the icons stay, the labels go, and each link keeps its name for assistive tech (the label is visually hidden, not removed) and shows it in a tooltip. Every nav item then needs an icon from `icons/`. | Fully hidden: the person loses their place and needs the header button to get anywhere, which is the phone pattern on a screen that has room. A rail costs one rule: every item has an icon. |
| A3 | The detail panel between phone and desktop (48–75rem) | **It becomes a sheet** (`.dialog.sheet`, already in `components.css`) opened by whatever selects the item; at 75rem and up it's a third column. The main content keeps its width when it needs it most. | A narrow third column: main gets squeezed below a readable width at 64rem. Pushing the panel under main: the detail scrolls out of sight of the list it belongs to. |
| A4 | The sidebar on a phone (below 48rem) | **A sheet from the inline start**, a `<dialog>` opened from a menu button in the header with `command="show-modal"`. It is modal, so the page behind goes inert, Esc closes it, and focus returns to the button. The same nav markup is used; the shell CSS moves it, so there is one list of links. | The header's existing no-script phone menu (a drop-down list): fine for five marketing links, cramped for sectioned app nav with icons. A bottom tab bar: only fits four or five destinations and a second nav for the rest. |

All breakpoints are container queries on `.app-shell`, so the shell behaves the
same inside a preview panel or an embedded view as it does full screen.

## What else ships with it

- `.app-sidebar` sections (`.app-sidebar-title` plus a list), `aria-current`
  styling from `--i-surface`/`--i-ink`, and a collapse button the consumer wires
  to `data-sidebar`.
- `.app-main` scrolls inside the shell so the header and sidebar stay put; the
  page itself doesn't scroll.
- `previews/app-shell.html` with realistic tool content (a homelab-style list
  of hosts with a detail panel) in both themes, at 375 and 1440 px.
- Docs: the ARIA contract (nav landmark name, the collapse button's
  `aria-expanded` and `aria-controls`, the phone sheet), and the script a
  consumer writes for collapse and for remembering it.

## Out of scope

The settings page (#69, done), sign-in (Cloudflare Access owns it), and
per-app navigation content.

## Next step

On acceptance: mark this proposal accepted, then build `templates/app-shell.css`
and its preview in one PR against #68. The `package.json` export
`./templates/*` already covers the new file.
