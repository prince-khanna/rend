# Pigeon

Pigeon hosts uploaded HTML and Markdown files as shareable pages.

Use it to turn a local document into a permanent URL.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## API Uploads

Create an API token from **Settings → API tokens**, then upload HTML or Markdown with:

```bash
curl -X POST https://render.harnessagent.dev/api/v1/pages \
  -H "Authorization: Bearer rnd_live_your_token_here" \
  -F "file=@./page.md" \
  -F "name=Optional page name" \
  -F "is_public=true"
```

API uploads are private by default unless `is_public=true` is included. The response includes the page ID plus `page_url` and `render_url`.

Delete a page owned by the token user with:

```bash
curl -X DELETE https://render.harnessagent.dev/api/v1/pages/page_id_here \
  -H "Authorization: Bearer rnd_live_your_token_here"
```

Download the original Page source owned by the token user with:

```bash
curl -L https://render.harnessagent.dev/api/v1/pages/page_id_here/download \
  -H "Authorization: Bearer rnd_live_your_token_here" \
  -o page-source
```

Use `?variant=rendered` to download rendered HTML for Markdown Pages.

## CLI

The `pigeon` CLI wraps the agent-facing API endpoints.

```bash
npm link
pigeon auth login --token rnd_live_your_token_here
pigeon upload ./page.md --name "My Page" --public
pigeon u ./page.html --private
pigeon download page_id_here --output ./page.md
pigeon download page_id_here --rendered --output ./page.html
pigeon delete page_id_here
pigeon upload help
pigeon auth logout
```

`pigeon auth login` stores the API token in `~/.pigeon/config.json`. You can also use
`PIGEON_API_TOKEN` and `PIGEON_API_URL` for one-off or CI usage.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
