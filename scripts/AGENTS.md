# Awin feed processing

- Awin feed credentials stay in service-role-only tables; authenticated RPCs verify user_roles before privileged access and return only masked URLs. Both workflow and partial tests share the Web-stream reader, while workflow batches retain global numbering and source-qualified product IDs to preserve retry safety across feeds.
- The shared feed reader uses manual redirects, follows at most three HTTPS destinations validated by the exact feed-host allowlist, and retains one timeout across the chain; redirect errors never expose Location credentials.