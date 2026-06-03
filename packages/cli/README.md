# @harnessagent/pigeon

Command-line client for Pigeon Pages.

## Install

```bash
npm install -g @harnessagent/pigeon
```

## Usage

```bash
pigeon auth login --token rnd_live_your_token_here
pigeon upload ./page.md --name "My Page" --public
pigeon u ./page.html --private
pigeon list
pigeon download page_id_here --output ./page.md
pigeon download page_id_here --rendered --output ./page.html
pigeon delete page_id_here
pigeon upload help
pigeon auth logout
```

Run `pigeon help` or `pigeon <command> help` for examples.

## Environment

- `PIGEON_API_TOKEN`: use an API token without saving it.
- `PIGEON_API_URL`: override the Pigeon base URL.
