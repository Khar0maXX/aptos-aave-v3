# Aave V3 Test Framework

## 1. Install dependencies

```bash=
cd aave-test-suite
pnpm i
```

## 2. Create test Account

```bash
cd crest
make init-test-profiles
```

## 3. Init Test Data

```bash=
cd aave-test-suite
pnpm deploy:init-data
```

```bash=
cd aave-test-suite
pnpm deploy:core-operations
```

## 4. Test

```bash
cd aave-test-suite
pnpm test:all
```
