#!/usr/bin/env python3
"""
Configuration Validation Script for Tabble-v3
Validates .env files against .env.example and checks configuration consistency
"""

import os
import sys
from pathlib import Path
from typing import Dict, List, Set, Tuple
import argparse


class ConfigValidator:
    """Validates configuration files and environment variables"""

    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.env_example = project_root / ".env.example"
        self.env_file = project_root / ".env"
        self.frontend_env = project_root / "frontend" / ".env"
        self.frontend_env_example = project_root / "frontend" / ".env.example"

    def load_env_file(self, file_path: Path) -> Dict[str, str]:
        """Load environment variables from file"""
        if not file_path.exists():
            return {}

        env_vars = {}
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                for line_num, line in enumerate(f, 1):
                    line = line.strip()
                    if not line or line.startswith("#"):
                        continue

                    if "=" not in line:
                        print(
                            f"⚠️  Warning: Invalid line {line_num} in {file_path}: {line}"
                        )
                        continue

                    key, value = line.split("=", 1)
                    env_vars[key.strip()] = value.strip()
        except Exception as e:
            print(f"❌ Error reading {file_path}: {e}")
            return {}

        return env_vars

    def parse_env_example(self, file_path: Path) -> Dict[str, Dict]:
        """Parse .env.example file and extract variable information"""
        if not file_path.exists():
            return {}

        variables = {}
        current_section = "General"

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                for line_num, line in enumerate(f, 1):
                    line = line.strip()

                    if not line:
                        continue

                    if line.startswith(
                        "# ============================================================================="
                    ):
                        # Section header
                        continue
                    elif line.startswith("# "):
                        # Comment or section title
                        if "=" not in line:
                            current_section = line[2:].strip()
                        continue
                    elif "=" in line:
                        key, value = line.split("=", 1)
                        key = key.strip()
                        value = value.strip()

                        variables[key] = {
                            "default_value": value,
                            "section": current_section,
                            "line_number": line_num,
                            "required": not value.startswith("#") and value != "",
                        }

        except Exception as e:
            print(f"❌ Error parsing {file_path}: {e}")
            return {}

        return variables

    def validate_env_file(
        self, env_file: Path, example_vars: Dict[str, Dict]
    ) -> List[str]:
        """Validate .env file against .env.example"""
        errors = []
        warnings = []

        if not env_file.exists():
            errors.append(f"❌ {env_file.name} does not exist")
            return errors

        env_vars = self.load_env_file(env_file)

        # Check for missing required variables
        for key, info in example_vars.items():
            if info["required"]:
                if key not in env_vars:
                    errors.append(f"❌ Missing required variable: {key}")
                elif env_vars[key] == info["default_value"]:
                    if "change_in_production" in info["default_value"].lower():
                        errors.append(f"❌ {key} still has placeholder value")
                    else:
                        warnings.append(f"⚠️  {key} has default value")

        # Check for extra variables not in example
        example_keys = set(example_vars.keys())
        env_keys = set(env_vars.keys())
        extra_keys = env_keys - example_keys

        if extra_keys:
            warnings.extend(
                [f"⚠️  Extra variable not in .env.example: {key}" for key in extra_keys]
            )

        return errors + warnings

    def validate_backend_config(self) -> List[str]:
        """Validate backend configuration"""
        errors = []

        # Check if backend config module can be imported
        try:
            sys.path.insert(0, str(self.project_root))
            from app.config import settings, validate_configuration

            # Try to validate configuration
            validate_configuration()
            print("✅ Backend configuration validation passed")

        except ImportError as e:
            errors.append(f"❌ Cannot import backend config: {e}")
        except ValueError as e:
            errors.append(f"❌ Backend configuration validation failed: {e}")
        except Exception as e:
            errors.append(f"❌ Backend configuration error: {e}")

        return errors

    def validate_frontend_config(self) -> List[str]:
        """Validate frontend configuration"""
        errors = []

        # Check if frontend config can be imported
        frontend_config_path = (
            self.project_root / "frontend" / "src" / "config" / "index.js"
        )

        if not frontend_config_path.exists():
            errors.append("❌ Frontend config file does not exist")
            return errors

        # For frontend, we'll do a basic syntax check
        try:
            with open(frontend_config_path, "r") as f:
                content = f.read()

            # Basic checks
            if "process.env" not in content:
                errors.append("❌ Frontend config does not use environment variables")

            if "validateConfig" not in content:
                errors.append("❌ Frontend config missing validation function")

            print("✅ Frontend configuration file structure is valid")

        except Exception as e:
            errors.append(f"❌ Error reading frontend config: {e}")

        return errors

    def generate_env_from_example(self, example_file: Path, output_file: Path):
        """Generate .env file from .env.example"""
        if not example_file.exists():
            print(f"❌ {example_file} does not exist")
            return

        try:
            with open(example_file, "r") as f:
                content = f.read()

            with open(output_file, "w") as f:
                f.write(content)

            print(f"✅ Generated {output_file} from {example_file}")

        except Exception as e:
            print(f"❌ Error generating {output_file}: {e}")

    def run_validation(self, generate_missing: bool = False) -> bool:
        """Run complete configuration validation"""
        print("🔍 Validating Tabble-v3 Configuration...\n")

        all_errors = []
        all_warnings = []

        # Load example configurations
        root_example_vars = self.parse_env_example(self.env_example)

        if not root_example_vars:
            print("❌ Cannot load .env.example")
            return False

        print(f"📋 Found {len(root_example_vars)} variables in .env.example")

        # Validate root .env file
        print("\n📁 Validating root .env file...")
        root_issues = self.validate_env_file(self.env_file, root_example_vars)

        for issue in root_issues:
            if issue.startswith("❌"):
                all_errors.append(issue)
            else:
                all_warnings.append(issue)

        # Validate backend configuration
        print("\n🔧 Validating backend configuration...")
        backend_errors = self.validate_backend_config()
        all_errors.extend(backend_errors)

        # Validate frontend configuration
        print("\n⚛️  Validating frontend configuration...")
        frontend_errors = self.validate_frontend_config()
        all_errors.extend(frontend_errors)

        # Generate missing files if requested
        if generate_missing:
            if not self.env_file.exists():
                print("\n📝 Generating root .env file...")
                self.generate_env_from_example(self.env_example, self.env_file)

            if not self.frontend_env.exists():
                print("\n📝 Generating frontend .env file...")
                self.generate_env_from_example(self.env_example, self.frontend_env)

        # Print results
        print("\n" + "=" * 60)
        print("📊 VALIDATION RESULTS")
        print("=" * 60)

        if not all_errors and not all_warnings:
            print("✅ All configuration validation passed!")
            return True

        if all_errors:
            print(f"❌ Found {len(all_errors)} errors:")
            for error in all_errors:
                print(f"   {error}")

        if all_warnings:
            print(f"⚠️  Found {len(all_warnings)} warnings:")
            for warning in all_warnings:
                print(f"   {warning}")

        print("\n💡 Tips:")
        print("   - Run with --generate to create missing .env files")
        print("   - Check .env.example for documentation on each variable")
        print("   - Ensure all required variables are set in production")

        return len(all_errors) == 0


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Validate Tabble-v3 configuration")
    parser.add_argument(
        "--generate",
        action="store_true",
        help="Generate missing .env files from .env.example",
    )
    parser.add_argument(
        "--project-root",
        type=Path,
        default=Path(__file__).parent.parent,
        help="Project root directory",
    )

    args = parser.parse_args()

    validator = ConfigValidator(args.project_root)
    success = validator.run_validation(generate_missing=args.generate)

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
