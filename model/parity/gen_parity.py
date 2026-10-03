import json
from pathlib import Path

import numpy as np
from argmodel.population.cohort import project_population

PARITY_DIR = Path(__file__).parent


def generate_population_parity():
    # Deterministic seed for reproducibility
    rng = np.random.default_rng(42)
    
    A = 101  # Age 0 to 100+
    T = 5    # 5 years projection
    
    n_t0 = rng.uniform(5000, 100000, size=A).round()
    
    # Survival: ranges from 0.8 to 0.99
    survival = rng.uniform(0.8, 0.99, size=(T, A))
    # Oldest age open interval might have lower survival
    survival[:, -1] = rng.uniform(0.5, 0.7, size=T)
    
    # Fertility: only active between ages 15 and 50
    fertility = np.zeros((T, A))
    fertility[:, 15:51] = rng.uniform(0.01, 0.1, size=(T, 36))
    
    # Migration: can be positive or negative
    migration = rng.uniform(-1000, 1000, size=(T, A)).round()
    
    # Project
    res = project_population(n_t0, survival, fertility, migration)
    
    payload = {
        "n_t0": n_t0.tolist(),
        "survival": survival.tolist(),
        "fertility": fertility.tolist(),
        "migration": migration.tolist(),
        "expected": res.tolist()
    }
    
    output_path = PARITY_DIR / "population_parity.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)


if __name__ == "__main__":
    generate_population_parity()
