# Awin feed processing

- Awin feed credentials stay in service-role-only tables; authenticated RPCs verify user_roles before privileged access and return only masked URLs. Both workflow and partial tests share the Web-stream reader, while workflow batches retain global numbering and source-qualified product IDs to preserve retry safety across feeds.