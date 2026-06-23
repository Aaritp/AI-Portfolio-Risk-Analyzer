Backup scripts for local `.env` and encrypted backups

Files:
- `backup_env.sh` — Unix shell script: copies `.env` to `scripts/backups/.env.YYYYMMDD_HHMMSS` and restricts file permissions.
- `backup_env.ps1` — PowerShell: Windows equivalent, sets ACL to current user where possible.
- `backup_env_gpg.sh` — Unix shell script: creates a GPG-encrypted backup `.env.YYYYMMDD_HHMMSS.gpg`. Use `--recipient <KEY_ID>` to encrypt to a public key, or `--symmetric` to prompt for a passphrase.
- `backup_env_gpg.ps1` — PowerShell equivalent.

Usage examples

Unix (symmetric):

    ./scripts/backup_env_gpg.sh --symmetric

Unix (recipient key):

    ./scripts/backup_env_gpg.sh --recipient 0xABCDEF12345

PowerShell (symmetric):

    .\scripts\backup_env_gpg.ps1 -Symmetric

PowerShell (recipient):

    .\scripts\backup_env_gpg.ps1 -Recipient 'you@example.com'

Automating backups with GitHub Actions (example)

Note: GitHub runners do NOT have your local `.env` file. This example is useful if you store a copy of `.env` in a protected location (not recommended) or run the workflow on a self-hosted runner that has access to the file. Use secrets to store GPG keys or passphrases.

Example workflow (manual dispatch):

```yaml
name: Backup .env (encrypt)

on:
  workflow_dispatch: {}

jobs:
  encrypt-backup:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout (if repo contains .env backup path)
        uses: actions/checkout@v4

      # If you want to use a GPG key stored in Secrets, import it here:
      - name: Import GPG key
        if: secrets.GPG_PRIVATE_KEY != ''
        run: |
          echo "$GPG_PRIVATE_KEY" > private.key
          gpg --batch --import private.key
        env:
          GPG_PRIVATE_KEY: ${{ secrets.GPG_PRIVATE_KEY }}

      - name: Encrypt .env (self-hosted runner or checked-in .env)
        run: |
          ts=$(date +"%Y%m%d_%H%M%S")
          gpg --yes --output scripts/backups/.env.$ts.gpg --symmetric .env

      - name: Upload encrypted backup as artifact
        uses: actions/upload-artifact@v4
        with:
          name: env-backup-${{ github.run_id }}
          path: scripts/backups/.env.*.gpg
```

Security notes

- Never commit your real `.env` file to the repository. Keep `.env` in `.gitignore`.
- Use GPG public-key encryption for backups you plan to store remotely.
- Keep your GPG private key and passphrases in a secure vault (GitHub Secrets, OS keyring, or an external secret manager).

If you want, I can add the workflow file to `.github/workflows/` (disabled by default) or create a self-hosted runner instruction. Which would you prefer?