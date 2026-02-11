# @pipelineos/db

Database schema and migration tooling for the Node API.

## Install dependencies

```bash
cd packages_temp/db
npm install
```

## Environment

Migrations read `DATABASE_URL` from the root `.env` file (`/workspace/.env`) via:

```js
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
```

Example:

```env
DATABASE_URL=postgresql://plansite:plansite@localhost:5432/plansite
```

## Migration commands

```bash
# Apply all pending migrations
npm run migrate:latest

# Roll back the most recently applied migration
npm run migrate:rollback

# Show applied + pending migrations
npm run migrate:status

# Create a new up/down migration pair
npm run migrate:create -- add_new_table
```

## Migration format

Only files matching the ordered pattern below are executed:

- `NNN_name.up.sql`
- `NNN_name.down.sql`

Example:

- `001_core_schema.up.sql`
- `001_core_schema.down.sql`

Legacy `.sql` files that do not follow this pattern are ignored by the runner.
