import { initReserveOraclePrice } from "./initOraclePrice";
import { configReserves } from "./configReserves";
import { initReserves } from "./initReserves";
import { createTokens } from "./createTokens";
import { createRoles } from "./createRoles";
import { initDefaultInterestRates } from "./initInterestRate";
import { initEModes } from "./initEModes";
import chalk from "chalk";

(async () => {
  // step1. create roles
  console.log(chalk.yellow("---------------------------------------------"));
  console.log(chalk.cyan("creating roles..."));
  await createRoles();
  console.log(chalk.green("created roles successfully!"));

  // step2. create tokens
  console.log(chalk.yellow("---------------------------------------------"));
  console.log(chalk.cyan("creating tokens..."));
  await createTokens();
  console.log(chalk.green("created tokens successfully!"));

  // step3. init emodes
  console.log(chalk.yellow("---------------------------------------------"));
  console.log(chalk.cyan("initializing emodes..."));
  await initEModes();
  console.log(chalk.green("initialized emodes successfully!"));

  // step4. init reserves and interest rate strategies
  console.log(chalk.yellow("---------------------------------------------"));
  console.log(chalk.cyan("initializing reserves..."));
  await initReserves();
  console.log(chalk.green("initialized reserves successfully!"));

  // step5. config reserves
  console.log(chalk.yellow("---------------------------------------------"));
  console.log(chalk.cyan("configuring reserves..."));
  await configReserves();
  console.log(chalk.green("configured reserves successfully!"));

  // step6. init interest rate strategies
  console.log(chalk.yellow("---------------------------------------------"));
  console.log(chalk.cyan("initializing default interest rate strategies..."));
  await initDefaultInterestRates();
  console.log(chalk.green("initialized interest rate strategies successfully!"));

  // step7. config oracle price
  console.log(chalk.yellow("---------------------------------------------"));
  console.log(chalk.cyan("configuring oracle prices..."));
  await initReserveOraclePrice();
  console.log(chalk.green("configured oracle prices successfully!"));
})();
