# ansarulhaq.com.np

The source code for [ansarulhaq.com.np](https://ansarulhaq.com.np), my personal portfolio and creative web playground.

The site is currently a work in progress. Its main experience is an interactive, physics-inspired hero in which hanging words respond to mouse and touch movement.

## Built with

- [React 19](https://react.dev/) and [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) for development and builds
- [GSAP](https://gsap.com/) for animation
- SVG for the interactive hanging-word artwork
- [Tailwind CSS](https://tailwindcss.com/) and custom CSS for styling
- [Geist](https://vercel.com/font) and Geist Mono for typography

## Getting started

### Prerequisites

- Node.js 20.19 or newer
- npm

### Installation

```bash
git clone https://github.com/AnsarulHaq786/ansarulhaq.com.np.git
cd ansarulhaq.com.np
npm install
npm run dev
```

Vite will print the local development URL in the terminal, usually `http://localhost:5173`.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Type-check and create a production build |
| `npm run lint` | Run ESLint across the project |
| `npm run preview` | Preview the production build locally |

## Project structure

```text
src/
├── components/
│   ├── sections/       # Page-level sections
│   └── ui/             # Reusable interface components
├── pages/              # Page compositions
├── utils/              # Shared utilities
├── App.tsx
└── main.tsx
```

## Deployment

The project is configured for deployment on [Vercel](https://vercel.com/). The included rewrite rule sends application routes to `index.html`, allowing client-side routing to work when additional pages are introduced.

To create a production build locally, run:

```bash
npm run build
```

The generated files will be placed in `dist/`.

## Contributing

This is a personal portfolio, so it is not actively seeking feature contributions. Constructive feedback and bug reports are welcome through GitHub Issues.

## License

No license has been added yet. The source is publicly viewable, but that does not grant permission to copy, modify, or redistribute it.

## Author

Created by [Ansarul Haq](https://ansarulhaq.com.np).
