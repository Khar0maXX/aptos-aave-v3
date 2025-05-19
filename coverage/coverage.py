import os;
from pathlib import Path

# packages
packages = ["aave-acl", "aave-config", "aave-math", "aave-oracle", "aave-pool"]
COVERAGES_PATH: str = "coverage"
RAW_APTOS_COVERAGE_FILE_EXTENSION: str = "csv"
MOVE_FILE_EXTENSION: str = "move"

def debug_find_move_files(root_dir, package, filename):
    found_files = []

    for dirpath, _, filenames in os.walk(root_dir):
        if filename in filenames:
            full_path = os.path.join(dirpath, filename)
            found_files.append(full_path)

    if not found_files:
        print(f"No files found named '{filename}'")
        return None

    # First, filter only files inside `/package/`
    module_files = [file for file in found_files if f"/{package}/" in file or f"\\{package}\\" in file]

    if module_files:
        # print(f"Filtering to only files inside '/{package}/':")
        for file in module_files:
            print(file)
    else:
        print(f"No matches found inside '/{package}/', considering all files.")

    # If module-specific files exist, apply selection logic to them
    target_files = module_files if module_files else found_files

    # Prioritize 'sources' over 'build'
    for file in target_files:
        if "sources" in file:
            print(f"Selected file (sources priority): {file}")
            return file

    print(f"Selected file (fallback): {target_files[0]}")
    return target_files[0]

def parse_csv_file(package: str) -> list[str]:
    print(f"\n**** Package {package} ****")
    package_coverage_csv = package + "." + RAW_APTOS_COVERAGE_FILE_EXTENSION
    package_coverage_path = os.path.join(os.curdir, COVERAGES_PATH, package_coverage_csv)

    if not os.path.exists(package_coverage_path):
        raise ValueError("Cannot find the coverage package %s under %s" % (package_coverage_csv, package_coverage_path))
    else:
        print(f"--- Found coverage csv file for package {package} at: {package_coverage_path}")

    modules_data: dict[str, dict] = {}

    # read package and extract all modules data
    with open(package_coverage_path, "r") as f:
        lines = f.readlines()
        print(f"--- Found %d lines in {package} coverage csv file" % len(lines))
        for index in range(1, len(lines) - 3):
            row = [part.strip() for part in lines[index].split(",")]
            #print(row)
            assert len(row) == 4
            move_module_name = row[0].split("::")[-1]
            move_function_name = row[1]
            covered = int(row[2])
            uncovered = int(row[3])
            if move_module_name not in modules_data:
                modules_data[move_module_name] = {'functions': [], 'total_covered': 0, 'total_uncovered': 0 }

            modules_data[move_module_name]["functions"].append((move_function_name, covered, uncovered))
            modules_data[move_module_name]["total_covered"] += covered
            modules_data[move_module_name]["total_uncovered"] += uncovered

    # now, for each module inside the package create an lcov output file
    lcov_output: list[str] = []
    for module, data in modules_data.items():
        print(f"--- Working on module {module} ...")
        # print(data)
        move_module_name = module + "." + MOVE_FILE_EXTENSION
        file_found = debug_find_move_files(os.path.curdir, package, move_module_name)
        move_module_name_abs_path = str(file_found) if file_found else move_module_name
        lcov_output.append(f"SF:{move_module_name_abs_path}")
        for i, (function, covered, uncovered) in enumerate(data['functions'], start=1):
            lcov_output.append(f"DA:{i},{covered}")  # Simulate coverage per line

        # Extract unique line numbers from DA entries instead of using total_covered + total_uncovered
        unique_lines = set()

        for function, covered, uncovered in data['functions']:
            if covered > 0 or uncovered > 0:
                unique_lines.add(function)  # Track unique executable lines

        total_lines = len(unique_lines)  # Correct LF calculation
        # Count the number of unique lines with coverage
        covered_lines = set()

        for function, covered, _ in data['functions']:
            if covered > 0:
                covered_lines.add(function)  # Track unique covered lines

        hit_lines = len(covered_lines)  # Correct LH calculation
        lcov_output.append(f"LF:{total_lines}")
        lcov_output.append(f"LH:{hit_lines}")
        lcov_output.append("end_of_record\n")
        # print("XXXX", lcov_output)
    return lcov_output

def main():
    print("Starting to prepare the lcov files ...")
    aggregated_csv_data: list[str] = []
    try:
        for (index, package) in enumerate(iterable=packages, start=0):
            aggregated_csv_data.extend(parse_csv_file(packages[index]))
    except Exception as e:
        print(f"Failed to parse the lcov file for package '{package}': {e}")
        exit(-1)


    # todo write the coverage file using the lcov_output
    lcov_output_file = os.path.join(os.curdir, "coverage.lcov")
    with open(lcov_output_file, 'w') as outfile:
        outfile.write("\n".join(aggregated_csv_data))

    print(f"Coverage preparation completed! LCOV file written to: {lcov_output_file}")

if __name__ == "__main__":
    main()
