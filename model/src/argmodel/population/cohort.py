import numpy as np


def step_population(
    n_t: np.ndarray,
    survival: np.ndarray,
    fertility: np.ndarray,
    migration: np.ndarray
) -> np.ndarray:
    """
    Steps the cohort population model forward by one year.

    Args:
        n_t: Population by age group at time t. Shape (A,).
        survival: Survival rate from age a to a+1. Shape (A,).
        fertility: Births per person of age a. Shape (A,).
        migration: Net migration (absolute numbers) added to age a. Shape (A,).

    Returns:
        n_next: Population by age group at time t+1. Shape (A,).
    """
    a_len = len(n_t)
    n_next = np.zeros(a_len, dtype=float)

    # Age 0: births from all ages
    n_next[0] = np.sum(n_t * fertility) + migration[0]

    # Age 1 to A-2: previous age survivors + migration
    n_next[1:a_len - 1] = n_t[0:a_len - 2] * survival[0:a_len - 2] + migration[1:a_len - 1]

    # Age A-1 (open interval): previous age survivors + own survivors + migration
    n_next[a_len - 1] = (
        n_t[a_len - 2] * survival[a_len - 2]
        + n_t[a_len - 1] * survival[a_len - 1]
        + migration[a_len - 1]
    )

    return n_next


def project_population(
    n_t0: np.ndarray,
    survival: np.ndarray,
    fertility: np.ndarray,
    migration: np.ndarray
) -> np.ndarray:
    """
    Projects the population forward for T years.

    Args:
        n_t0: Initial population. Shape (A,).
        survival: Survival rate. Shape (T, A).
        fertility: Fertility rate. Shape (T, A).
        migration: Net migration. Shape (T, A).

    Returns:
        n_all: Population trajectory. Shape (T+1, A).
    """
    t_years = survival.shape[0]
    a_len = n_t0.shape[0]
    
    n_all = np.zeros((t_years + 1, a_len), dtype=float)
    n_all[0] = n_t0
    
    for t in range(t_years):
        n_all[t + 1] = step_population(
            n_all[t],
            survival[t],
            fertility[t],
            migration[t]
        )
        
    return n_all
