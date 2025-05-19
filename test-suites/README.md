# Aave V3 Test Framework

## 1. Install dependencies

```bash=
cd test-suites
pnpm i
```

## 2. Create test Account

```bash
cd crest
make init-test-profiles
```

## 3. Init Test Data

```bash=
cd test-suites
pnpm deploy:init-data
```

```bash=
cd test-suites
pnpm deploy:core-operations
```

## 4. Test

```bash
cd test-suites
pnpm test:logic
```
