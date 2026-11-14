# Madar Admin

The admin interface lives in this folder and is published with the Madar frontend at:

- `/admin/` — administration dashboard
- `/admin/themes.html` — theme and palette management

## Architecture

- UI assets and page scripts are served from this frontend repository.
- Authentication and authorization are validated by the backend API. The frontend role check is only a navigation guard, not a security boundary.
- Theme data is read and updated through the backend API; the active theme is shared with the public frontend.
- Keep API secrets on the backend. Do not add private keys or privileged credentials to these files.

The previous `A-` repository is retained as a migration backup until the new deployment is verified. One legacy illustration remains loaded from that repository temporarily; the admin header image is now stored locally under `assets/`.
