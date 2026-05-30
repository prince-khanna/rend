# @harnessagent/rend

Command-line client for Rend Pages.

## Install

```bash
npm install -g @harnessagent/rend
```

## Usage

```bash
rend auth login --token rnd_live_your_token_here
rend upload ./page.md --name "My Page" --public
rend u ./page.html --private
rend download page_id_here --output ./page.md
rend download page_id_here --rendered --output ./page.html
rend delete page_id_here
rend upload help
rend auth logout
```

Run `rend help` or `rend <command> help` for examples.

## Environment

- `REND_API_TOKEN`: use an API token without saving it.
- `REND_API_URL`: override the Rend base URL.
