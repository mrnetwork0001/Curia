"""
Generate ed25519 PEM keys for all 5 Curia agents.
Cross-platform — works on Windows, macOS, and Linux.
"""

import os
import sys

def generate_keys():
    """Generate ed25519 private keys using Python cryptography."""
    try:
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
        from cryptography.hazmat.primitives import serialization
    except ImportError:
        # Fallback: use openssl command
        print("Python 'cryptography' package not installed. Using openssl fallback...")
        generate_keys_openssl()
        return

    keys_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "keys")
    os.makedirs(keys_dir, exist_ok=True)

    roles = ["judge", "prosecutor", "defender", "juror1", "juror2"]

    for role in roles:
        key_path = os.path.join(keys_dir, f"{role}.pem")
        if os.path.exists(key_path):
            print(f"  [skip] {key_path} already exists")
            continue

        private_key = Ed25519PrivateKey.generate()
        pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )

        with open(key_path, "wb") as f:
            f.write(pem)

        print(f"  [created] {key_path}")

    print(f"\nAll keys generated in {keys_dir}/")


def generate_keys_openssl():
    """Fallback: generate keys using openssl CLI."""
    import subprocess

    keys_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "keys")
    os.makedirs(keys_dir, exist_ok=True)

    roles = ["judge", "prosecutor", "defender", "juror1", "juror2"]

    for role in roles:
        key_path = os.path.join(keys_dir, f"{role}.pem")
        if os.path.exists(key_path):
            print(f"  [skip] {key_path} already exists")
            continue

        try:
            subprocess.run(
                ["openssl", "genpkey", "-algorithm", "ed25519", "-out", key_path],
                check=True,
                capture_output=True,
            )
            print(f"  [created] {key_path}")
        except FileNotFoundError:
            print("ERROR: 'openssl' not found. Install OpenSSL or 'pip install cryptography'")
            sys.exit(1)
        except subprocess.CalledProcessError as e:
            print(f"ERROR generating {role} key: {e.stderr.decode()}")
            sys.exit(1)


if __name__ == "__main__":
    print("Generating Curia agent keys...")
    generate_keys()
