# Aave-test-kit

Aave-test-kit is a kit for spinning and starting a fully functional local environment with a readily deployed aave protocol.

## 1. Install dependencies

```bash
pnpm i
```

## 2. Generate a .env file using the cli with randomly generated profiles

```bash
pnpm run generate
```

The latter command will generate a .env file with some randomly generated accounts and put that into the root of the project directory. If need be, you can always modify the .env file and adjust the private keys in there.

## 2. Start the test environment

```bash
pnpm run start
```

## 3. Stop the test environment

```bash
pnpm run stop
```

## 4. In case you want to intiliaze the tets environment with assets, reservers etc. you can run the following commands to do that

```bash
cd ../test-suites && pnpm i && pnpm run deploy:init-data && pnpm run deploy:core-operations
```
